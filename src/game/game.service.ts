import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Game, GameStatus } from './entities/game.entity';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  async create(playerId: string): Promise<Game> {
    const code = this.generateCode();
    const game = this.gameRepo.create({
      code,
      status: GameStatus.WAITING,
      hostId: playerId,
      players: [{ id: playerId } as any],
    });
    return this.gameRepo.save(game);
  }

  async join(code: string, playerId: string): Promise<Game> {
    const game = await this.findByCode(code);

    if (game.status === GameStatus.FINISHED) {
      throw new BadRequestException('Cette partie est terminée');
    }

    const alreadyJoined = game.players.some((p) => p.id === playerId);
    if (alreadyJoined) {
      throw new BadRequestException('Vous avez déjà rejoint cette partie');
    }

    game.players.push({ id: playerId } as any);
    return this.gameRepo.save(game);
  }

  async findByCode(code: string): Promise<Game> {
    const game = await this.gameRepo.findOne({
      where: { code },
      relations: ['players', 'host'],
    });
    if (!game) {
      throw new NotFoundException('Partie introuvable');
    }
    return game;
  }

  async finish(code: string, playerId: string, isAdmin: boolean): Promise<Game> {
    this.logger.log(`Finishing game ${code} by player ${playerId} (admin: ${isAdmin})`);
    const game = await this.findByCode(code);

    if (game.hostId !== playerId && !isAdmin) {
      this.logger.warn(`Player ${playerId} tried to finish game without permission`);
      throw new ForbiddenException('Seul l\'hôte ou un administrateur peut terminer une partie');
    }

    if (game.status === GameStatus.FINISHED) {
      this.logger.warn(`Game ${code} is already finished`);
      throw new BadRequestException('Cette partie est déjà terminée');
    }

    game.status = GameStatus.FINISHED;
    game.finishedAt = new Date();
    const result = await this.gameRepo.save(game);
    this.logger.log(`Game ${code} finished successfully`);
    return result;
  }

  async setActive(code: string): Promise<void> {
    this.logger.log(`Setting game ${code} to ACTIVE`);
    const game = await this.findByCode(code);
    if (game.status === GameStatus.WAITING) {
      game.status = GameStatus.ACTIVE;
      await this.gameRepo.save(game);
      this.logger.log(`Game ${code} activated`);
    }
  }

  async findGamesByPlayer(playerId: string): Promise<Game[]> {
    this.logger.log(`Fetching games for player ${playerId}`);
    const games = await this.gameRepo.find({
      where: [
        { hostId: playerId },
      ],
      relations: ['players', 'host'],
      order: { createdAt: 'DESC' },
    });

    // Also get games where player is a participant
    const participantGames : Game[] = await this.gameRepo.createQueryBuilder('game')
      .innerJoin('game.players', 'player', 'player.id = :playerId', { playerId })
      .leftJoinAndSelect('game.players', 'players')
      .leftJoinAndSelect('game.host', 'host')
      .orderBy('game.createdAt', 'DESC')
      .getMany();

    const gameIds = new Set([...games.map(g => g.id), ...participantGames.map(g => g.id)]);
    
    const allGames = await this.gameRepo.find({
      where: { id: In([...gameIds]) },
      relations: ['players', 'host'],
      order: { createdAt: 'DESC' },
    });

    return [...games, ...allGames].filter((game, index, arr) => 
      arr.findIndex(g => g.id === game.id) === index
    );
  }

  async getGameResult(gameCode: string, playerId: string): Promise<any> {
    this.logger.log(`Fetching game result for ${gameCode} for player ${playerId}`);
    const game = await this.findByCode(gameCode);
    this.logger.log(`Game ${gameCode} found, fetching results ${game.id}`);
    // Get leaderboard data using CTE for proper ranking
    const result = await this.gameRepo.query(
      `WITH player_scores AS (
         SELECT p.id as "playerId", 
                p.username, 
                COALESCE(SUM(a.points), 0) as "totalPoints"
         FROM players p
         INNER JOIN game_players gp ON p.id = gp."playersId"
         LEFT JOIN rounds r ON r."gameId" = gp."gamesId"
		 LEFT JOIN bottles ON bottles."roundId" = r.id
         LEFT JOIN answers a ON a."bottleId" = bottles.id AND a."playerId" = p.id
         WHERE gp."gamesId" = $1
         GROUP BY p.id, p.username
       )
       SELECT "playerId", 
              username, 
              "totalPoints",
              ROW_NUMBER() OVER (ORDER BY "totalPoints" DESC) as rank
       FROM player_scores
       ORDER BY "totalPoints" DESC`,
      [game.id],
    );
    this.logger.log(`Game result for ${gameCode} fetched successfully`);
    return result;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    return code;
  }
}
