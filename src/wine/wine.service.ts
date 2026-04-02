import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grape } from './entities/grape.entity';

export const WINE_COLORS = ['rouge', 'rosé', 'blanc', 'jaune', 'orange'] as const;
export type WineColor = (typeof WINE_COLORS)[number];

@Injectable()
export class WineService {
  constructor(
    @InjectRepository(Grape)
    private readonly grapeRepo: Repository<Grape>,
  ) {}

  getColors(): string[] {
    return [...WINE_COLORS];
  }

  async getGrapesByColor(color: string): Promise<Grape[]> {
    const grapes = await this.grapeRepo.find();
    return grapes.filter((g) => g.color === color);
  }

  async getAllGrapes(): Promise<Grape[]> {
    return this.grapeRepo.find({ order: { name: 'ASC' } });
  }
}
