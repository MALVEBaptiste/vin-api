import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grape } from './entities/grape.entity';
import { WineService } from './wine.service';
import { WineController } from './wine.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grape])],
  controllers: [WineController],
  providers: [WineService],
  exports: [WineService],
})
export class WineModule {}
