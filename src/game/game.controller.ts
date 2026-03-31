import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameService } from './game.service';
import { CurrentPlayer } from '../auth/decorators/current-player.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Games')
@ApiBearerAuth()
@Controller('games')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly gameService: GameService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle partie' })
  create(@CurrentPlayer() player: { id: string }) {
    this.logger.log(`Creating game for player ${player.id}`);
    const result = this.gameService.create(player.id);
    this.logger.log(`Game created`);
    return result;
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Rejoindre une partie existante' })
  join(
    @Param('code') code: string,
    @CurrentPlayer() player: { id: string },
  ) {
    this.logger.log(`Player ${player.id} joining game ${code}`);
    const result = this.gameService.join(code, player.id);
    this.logger.log(`Player ${player.id} joined game ${code}`);
    return result;
  }

  @Get('player/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Historique des parties du joueur' })
  getPlayerHistory(@CurrentPlayer() player: { id: string }) {
    this.logger.log(`Fetching game history for player ${player.id}`);
    return this.gameService.findGamesByPlayer(player.id);
  }

  @Get(':code/result')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Résultat final d\'une partie' })
  getGameResult(
    @Param('code') code: string,
    @CurrentPlayer() player: { id: string },
  ) {
    this.logger.log(`Fetching result for game ${code}`);
    return this.gameService.getGameResult(code, player.id);
  }

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'État complet de la partie' })
  findByCode(@Param('code') code: string) {
    this.logger.log(`Fetching game state for ${code}`);
    return this.gameService.findByCode(code);
  }

  @Delete(':code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Terminer une partie (hôte ou admin)' })
  finish(
    @Param('code') code: string,
    @CurrentPlayer() player: { id: string; isAdmin: boolean },
  ) {
    this.logger.log(`Finishing game ${code}`);
    const result = this.gameService.finish(code, player.id, player.isAdmin);
    this.logger.log(`Game ${code} finished`);
    return result;
  }
}
