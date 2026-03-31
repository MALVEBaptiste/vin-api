import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Round, RoundStatus } from './entities/round.entity';
import { Bottle } from './entities/bottle.entity';
import { Answer, RoundPhase } from './entities/answer.entity';
import { GameService } from '../game/game.service';
import { Game, GameStatus } from '../game/entities/game.entity';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ValidateRoundDto } from './dto/validate-round.dto';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);

  constructor(
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
    @InjectRepository(Bottle)
    private readonly bottleRepo: Repository<Bottle>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
    private readonly gameService: GameService,
    private readonly dataSource: DataSource,
  ) {}

  async startRound(gameCode: string, playerId: string): Promise<Round> {
    this.logger.log(`Starting round for game ${gameCode} by player ${playerId}`);
    const game = await this.gameService.findByCode(gameCode);

    if (game.hostId !== playerId) {
      this.logger.warn(`Player ${playerId} tried to start round without being host`);
      throw new ForbiddenException('Seul l\'hôte peut démarrer une manche');
    }

    if (game.status === GameStatus.FINISHED) {
      throw new BadRequestException('Cette partie est terminée');
    }

    // Activate game on first round
    if (game.status === GameStatus.WAITING) {
      await this.gameService.setActive(gameCode);
      this.logger.log(`Game ${gameCode} activated`);
    }

    // Check last round is done
    const lastRound = await this.roundRepo.findOne({
      where: { gameId: game.id },
      order: { roundNumber: 'DESC' },
    });

    if (lastRound && lastRound.status !== RoundStatus.DONE) {
      throw new BadRequestException('La manche précédente n\'est pas terminée');
    }

    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
    this.logger.log(`Creating round #${roundNumber} for game ${gameCode}`);

    const round = this.roundRepo.create({
      gameId: game.id,
      roundNumber,
      status: RoundStatus.COLOR,
    });
    const savedRound = await this.roundRepo.save(round);

    // Create 3 bottles
    const bottles: Bottle[] = [];
    for (let i = 1; i <= 3; i++) {
      const bottle = this.bottleRepo.create({
        roundId: savedRound.id,
        position: i,
      });
      bottles.push(await this.bottleRepo.save(bottle));
    }

    savedRound.bottles = bottles;
    this.logger.log(`Round #${roundNumber} created with 3 bottles`);
    return savedRound;
  }

  async submitAnswer(
    roundId: string,
    playerId: string,
    dto: SubmitAnswerDto,
  ): Promise<Answer> {
    this.logger.log(`Player ${playerId} submitting answer for ${dto.roundPhase} phase`);
    const round = await this.findRoundById(roundId);

    // Check phase matches
    this.assertPhaseMatch(round.status, dto.roundPhase);

    // Check bottle belongs to this round
    const bottle = round.bottles.find((b) => b.id === dto.bottleId);
    if (!bottle) {
      throw new BadRequestException('Cette bouteille n\'appartient pas à cette manche');
    }

    // Check player is in the game
    const game = await this.gameService.findByCode(
      (await this.roundRepo.findOne({
        where: { id: roundId },
        relations: ['game'],
      }))!.game.code,
    );
    const isInGame = game.players.some((p) => p.id === playerId);
    if (!isInGame) {
      throw new ForbiddenException('Vous ne participez pas à cette partie');
    }

    // Upsert: update if exists, create if not
    const existing = await this.answerRepo.findOne({
      where: {
        playerId,
        bottleId: dto.bottleId,
        roundPhase: dto.roundPhase,
      },
    });

    if (existing) {
      // Update existing answer
      this.logger.log(`Updating answer for player ${playerId} - bottle ${dto.bottleId}`);
      existing.value = dto.value;
      return this.answerRepo.save(existing);
    }

    // Create new answer
    const answer = this.answerRepo.create({
      playerId,
      bottleId: dto.bottleId,
      roundPhase: dto.roundPhase,
      value: dto.value,
    });

    return this.answerRepo.save(answer);
  }

  async advancePhase(roundId: string, playerId: string, force: boolean = false): Promise<Round> {
    this.logger.log(`Attempting to advance phase for round ${roundId}${force ? ' (FORCED)' : ''}`);
    const round = await this.findRoundById(roundId);
    const game = await this.getGameForRound(round);

    if (game.hostId !== playerId) {
      this.logger.warn(`Player ${playerId} tried to advance phase without being host`);
      throw new ForbiddenException('Seul l\'hôte peut avancer la phase');
    }

    // Check if all players answered current phase (unless forcing)
    if (!force && ![RoundStatus.SCORING, RoundStatus.DONE].includes(round.status)) {
      const playerIds = game.players.map((p) => p.id);
      const answersPerPlayer = await this.answerRepo
        .createQueryBuilder('answer')
        .select('answer.playerId', 'playerId')
        .where('answer.bottleId IN (SELECT id FROM bottle WHERE roundId = :roundId)', { roundId })
        .andWhere('answer.roundPhase = :phase', { phase: round.status })
        .groupBy('answer.playerId')
        .getRawMany();

      const respondedPlayerIds = new Set(answersPerPlayer.map((r) => r.playerId));
      const missingPlayers = playerIds.filter((id) => !respondedPlayerIds.has(id));

      if (missingPlayers.length > 0) {
        this.logger.warn(`Cannot advance phase: missing responses from ${missingPlayers.length} players`);
        throw new BadRequestException(
          `Les joueurs suivants n'ont pas répondu : ${missingPlayers.join(', ')}`,
        );
      }
    }

    const nextStatus = this.getNextPhase(round.status);
    if (!nextStatus) {
      throw new BadRequestException('La manche est déjà terminée');
    }

    this.logger.log(`Phase advanced from ${round.status} to ${nextStatus}`);
    round.status = nextStatus;
    return this.roundRepo.save(round);
  }

  async validateRound(
    roundId: string,
    playerId: string,
    dto: ValidateRoundDto,
  ): Promise<{ scores: Record<string, { points: number; bonus: boolean }> }> {
    const round = await this.findRoundById(roundId);
    const game = await this.getGameForRound(round);

    if (game.hostId !== playerId) {
      throw new ForbiddenException('Seul l\'hôte peut valider la manche');
    }

    if (dto.bottles.length !== 3) {
      throw new BadRequestException('Vous devez fournir exactement 3 bouteilles');
    }

    // Use a transaction for atomic scoring
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update round status to SCORING
      round.status = RoundStatus.SCORING;
      await queryRunner.manager.save(round);

      // Update bottles with true values
      for (const bottleDto of dto.bottles) {
        const bottle = round.bottles.find((b) => b.position === bottleDto.position);
        if (!bottle) {
          throw new BadRequestException(
            `Bouteille en position ${bottleDto.position} introuvable`,
          );
        }
        bottle.trueColor = bottleDto.trueColor;
        bottle.trueGrape = bottleDto.trueGrape;
        bottle.trueGlassPosition = bottleDto.trueGlassPosition;
        await queryRunner.manager.save(bottle);
      }

      // Score all answers
      const answers = await queryRunner.manager.find(Answer, {
        where: { bottleId: undefined }, // We'll find by bottle IDs
      });

      const bottleIds = round.bottles.map((b) => b.id);
      const allAnswers = await queryRunner.manager
        .createQueryBuilder(Answer, 'answer')
        .where('answer.bottleId IN (:...bottleIds)', { bottleIds })
        .getMany();

      // Build bottle map for quick lookup
      const bottleMap = new Map(round.bottles.map((b) => [b.id, b]));

      // Calculate scores per player
      const playerScores: Record<string, { points: number; totalCorrect: number; totalAnswers: number }> = {};

      for (const answer of allAnswers) {
        const bottle = bottleMap.get(answer.bottleId);
        if (!bottle) continue;

        let isCorrect = false;

        switch (answer.roundPhase) {
          case RoundPhase.COLOR:
            isCorrect = answer.value.toLowerCase() === bottle.trueColor?.toLowerCase();
            break;
          case RoundPhase.GRAPE:
            // Normalize grapes: split by comma, trim, sort, and compare case-insensitively
            const normalize = (str: string | null | undefined) => {
              if (!str) return '';
              return str
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .sort()
                .join(',');
            };
            isCorrect = normalize(answer.value) === normalize(bottle.trueGrape);
            break;
          case RoundPhase.MATCHING:
            // For matching, value is the glass position the player assigned to this bottle
            // Compare with the true glass position
            isCorrect = String(answer.value) === String(bottle.trueGlassPosition);
            break;
        }

        answer.isCorrect = isCorrect;
        answer.points = isCorrect ? 1 : 0;
        await queryRunner.manager.save(answer);

        if (!playerScores[answer.playerId]) {
          playerScores[answer.playerId] = { points: 0, totalCorrect: 0, totalAnswers: 0 };
        }
        playerScores[answer.playerId].totalAnswers++;
        if (isCorrect) {
          playerScores[answer.playerId].points += 1;
          playerScores[answer.playerId].totalCorrect++;
        }
      }

      // Apply bonus: +3 if ALL answers correct (9 total: 3 bottles × 3 phases)
      const result: Record<string, { points: number; bonus: boolean }> = {};
      for (const [playerId, score] of Object.entries(playerScores)) {
        const perfectRound = score.totalCorrect === score.totalAnswers && score.totalAnswers === 9;
        const bonus = perfectRound ? 3 : 0;

        if (perfectRound) {
          // Update all answers for this player to add bonus indicator
          // Bonus is added as extra points on the last answer
          const playerAnswers = allAnswers.filter((a) => a.playerId === playerId);
          if (playerAnswers.length > 0) {
            const lastAnswer = playerAnswers[playerAnswers.length - 1];
            lastAnswer.points += bonus;
            await queryRunner.manager.save(lastAnswer);
          }
        }

        result[playerId] = {
          points: score.points + bonus,
          bonus: perfectRound,
        };
      }

      // Mark round as done
      round.status = RoundStatus.DONE;
      await queryRunner.manager.save(round);

      await queryRunner.commitTransaction();

      return { scores: result };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getRoundScores(
    roundId: string,
  ): Promise<{ playerId: string; username: string; points: number }[]> {
    const round = await this.findRoundById(roundId);
    const bottleIds = round.bottles.map((b) => b.id);

    if (bottleIds.length === 0) {
      return [];
    }

    const results = await this.answerRepo
      .createQueryBuilder('answer')
      .select('answer.playerId', 'playerId')
      .addSelect('player.username', 'username')
      .addSelect('SUM(answer.points)', 'points')
      .innerJoin('answer.player', 'player')
      .where('answer.bottleId IN (:...bottleIds)', { bottleIds })
      .groupBy('answer.playerId')
      .addGroupBy('player.username')
      .orderBy('points', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      playerId: r.playerId,
      username: r.username,
      points: parseInt(r.points, 10) || 0,
    }));
  }

  async getLeaderboard(
    gameCode: string,
  ): Promise<{ playerId: string; username: string; totalPoints: number }[]> {
    const game = await this.gameService.findByCode(gameCode);

    const rounds = await this.roundRepo.find({
      where: { gameId: game.id },
      relations: ['bottles'],
    });

    const allBottleIds = rounds.flatMap((r) => r.bottles.map((b) => b.id));

    if (allBottleIds.length === 0) {
      return game.players.map((p) => ({
        playerId: p.id,
        username: p.username,
        totalPoints: 0,
      }));
    }

    const results = await this.answerRepo
      .createQueryBuilder('answer')
      .select('answer.playerId', 'playerId')
      .addSelect('player.username', 'username')
      .addSelect('SUM(answer.points)', 'totalPoints')
      .innerJoin('answer.player', 'player')
      .where('answer.bottleId IN (:...allBottleIds)', { allBottleIds })
      .groupBy('answer.playerId')
      .addGroupBy('player.username')
      .orderBy('"totalPoints"', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      playerId: r.playerId,
      username: r.username,
      totalPoints: parseInt(r.totalPoints, 10) || 0,
    }));
  }

  async getPlayerAnswers(roundId: string, playerId: string) {
    const round = await this.findRoundById(roundId);

    // Get all answers for this player in this round
    const answers = await this.answerRepo.find({
      where: { bottleId: undefined }, // We'll filter by bottle IDs
    });

    const bottleIds = round.bottles.map((b) => b.id);
    const playerAnswers = await this.answerRepo
      .createQueryBuilder('answer')
      .where('answer.bottleId IN (:...bottleIds)', { bottleIds })
      .andWhere('answer.playerId = :playerId', { playerId })
      .getMany();

    // Build bottle map for quick lookup
    const bottleMap = new Map(round.bottles.map((b) => [b.id, b]));

    // Format response grouped by bottle
    const result = round.bottles
      .sort((a, b) => a.position - b.position)
      .map((bottle) => {
        const bottleAnswers = playerAnswers.filter((a) => a.bottleId === bottle.id);

        return bottleAnswers.map((answer) => {
          let trueValue = '';
          switch (answer.roundPhase) {
            case RoundPhase.COLOR:
              trueValue = bottle.trueColor || '?';
              break;
            case RoundPhase.GRAPE:
              trueValue = bottle.trueGrape || '?';
              break;
            case RoundPhase.MATCHING:
              trueValue = String(bottle.trueGlassPosition) || '?';
              break;
          }

          return {
            bottlePosition: bottle.position,
            roundPhase: answer.roundPhase,
            playerValue: answer.value,
            trueValue,
            isCorrect: answer.isCorrect || false,
            points: answer.points || 0,
          };
        });
      })
      .flat();

    // Calculate total points
    const totalPoints = result.reduce((sum, answer) => sum + answer.points, 0);

    return { playerAnswers: result, totalPoints };
  }

  async findRoundById(roundId: string): Promise<Round> {
    const round = await this.roundRepo.findOne({
      where: { id: roundId },
      relations: ['bottles'],
    });
    if (!round) {
      throw new NotFoundException('Manche introuvable');
    }
    return round;
  }

  async getCurrentRound(gameCode: string): Promise<Round | null> {
    const game = await this.gameService.findByCode(gameCode);
    const round = await this.roundRepo.findOne({
      where: { gameId: game.id },
      order: { roundNumber: 'DESC' },
      relations: ['bottles'],
    });
    return round ?? null;
  }

  private async getGameForRound(round: Round): Promise<Game> {
    const roundWithGame = await this.roundRepo.findOne({
      where: { id: round.id },
      relations: ['game', 'game.players', 'game.host'],
    });
    if (!roundWithGame) {
      throw new NotFoundException('Manche introuvable');
    }
    return roundWithGame.game;
  }

  private assertPhaseMatch(roundStatus: RoundStatus, phase: RoundPhase): void {
    const phaseMap: Record<string, RoundStatus> = {
      [RoundPhase.COLOR]: RoundStatus.COLOR,
      [RoundPhase.GRAPE]: RoundStatus.GRAPE,
      [RoundPhase.MATCHING]: RoundStatus.MATCHING,
    };

    if (roundStatus !== phaseMap[phase]) {
      throw new BadRequestException(
        `La manche n'est pas dans la bonne phase. Phase actuelle : ${roundStatus}, phase soumise : ${phase}`,
      );
    }
  }

  private getNextPhase(current: RoundStatus): RoundStatus | null {
    const order: RoundStatus[] = [
      RoundStatus.COLOR,
      RoundStatus.GRAPE,
      RoundStatus.MATCHING,
      RoundStatus.SCORING,
    ];
    const idx = order.indexOf(current);
    if (idx === -1 || idx === order.length - 1) return null;
    return order[idx + 1];
  }
}
