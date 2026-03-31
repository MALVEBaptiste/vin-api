import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { Bottle } from './entities/bottle.entity';
import { Answer } from './entities/answer.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round, Bottle, Answer]),
    GameModule,
  ],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
