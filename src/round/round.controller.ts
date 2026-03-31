import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    Patch,
    Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoundService } from './round.service';
import { CurrentPlayer } from '../auth/decorators/current-player.decorator';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ValidateRoundDto } from './dto/validate-round.dto';
import { AdvancePhaseDto } from './dto/advance-phase.dto';

@ApiTags('Rounds')
@ApiBearerAuth()
@Controller()
export class RoundController {
  private readonly logger = new Logger(RoundController.name);

  constructor(private readonly roundService: RoundService) {}

  @Post('rounds/:gameCode/start')
  @ApiOperation({ summary: 'Démarrer une nouvelle manche (hôte uniquement)' })
  startRound(
    @Param('gameCode') gameCode: string,
    @CurrentPlayer() player: { id: string },
  ) {
    this.logger.log(`Starting round for game ${gameCode}`);
    const result = this.roundService.startRound(gameCode, player.id);
    this.logger.log(`Round started for game ${gameCode}`);
    return result;
  }

  @Get('rounds/:gameCode/current')
  @ApiOperation({ summary: 'Récupérer la manche en cours d\'une partie' })
  getCurrentRound(@Param('gameCode') gameCode: string) {
    this.logger.log(`Fetching current round for game ${gameCode}`);
    return this.roundService.getCurrentRound(gameCode);
  }

  @Post('rounds/:roundId/answer')
  @ApiOperation({ summary: 'Soumettre une réponse pour une bouteille' })
  submitAnswer(
    @Param('roundId') roundId: string,
    @CurrentPlayer() player: { id: string },
    @Body() dto: SubmitAnswerDto,
  ) {
    this.logger.log(`Player ${player.id} submitting answer for round ${roundId} - bottle ${dto.bottleId}`);
    const result = this.roundService.submitAnswer(roundId, player.id, dto);
    this.logger.log(`Answer submitted for round ${roundId}`);
    return result;
  }

  @Patch('rounds/:roundId/phase')
  @ApiOperation({ summary: 'Avancer à la phase suivante (hôte uniquement)' })
  advancePhase(
    @Param('roundId') roundId: string,
    @CurrentPlayer() player: { id: string },
    @Body() dto?: AdvancePhaseDto,
  ) {
    const force = dto?.force ?? false;
    this.logger.log(`Advancing phase for round ${roundId}${force ? ' (FORCED)' : ''}`);
    const result = this.roundService.advancePhase(roundId, player.id, force);
    this.logger.log(`Phase advanced for round ${roundId}`);
    return result;
  }

  @Post('rounds/:roundId/validate')
  @ApiOperation({ summary: 'Valider la manche avec les vraies réponses (hôte uniquement)' })
  validateRound(
    @Param('roundId') roundId: string,
    @CurrentPlayer() player: { id: string },
    @Body() dto: ValidateRoundDto,
  ) {
    this.logger.log(`Validating round ${roundId}`);
    const result = this.roundService.validateRound(roundId, player.id, dto);
    this.logger.log(`Round ${roundId} validated`);
    return result;
  }

  @Get('rounds/:roundId/scores')
  @ApiOperation({ summary: 'Scores de la manche par joueur' })
  getRoundScores(@Param('roundId') roundId: string) {
    this.logger.log(`Fetching scores for round ${roundId}`);
    return this.roundService.getRoundScores(roundId);
  }

  @Get('rounds/:roundId/player/:playerId/answers')
  @ApiOperation({ summary: 'Réponses détaillées d\'un joueur pour une manche' })
  getPlayerAnswers(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ) {
    this.logger.log(`Fetching answers for player ${playerId} in round ${roundId}`);
    return this.roundService.getPlayerAnswers(roundId, playerId);
  }

  @Get('games/:code/leaderboard')
  @ApiOperation({ summary: 'Classement général de la partie' })
  getLeaderboard(@Param('code') code: string) {
    this.logger.log(`Fetching leaderboard for game ${code}`);
    return this.roundService.getLeaderboard(code);
  }
}
