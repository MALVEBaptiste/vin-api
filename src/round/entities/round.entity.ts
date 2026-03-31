import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Game } from '../../game/entities/game.entity';
import { Bottle } from './bottle.entity';

export enum RoundStatus {
  PENDING = 'PENDING',
  COLOR = 'COLOR',
  GRAPE = 'GRAPE',
  MATCHING = 'MATCHING',
  SCORING = 'SCORING',
  DONE = 'DONE',
}

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  gameId!: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'gameId' })
  game!: Game;

  @Column()
  roundNumber!: number;

  @Column({ type: 'enum', enum: RoundStatus, default: RoundStatus.PENDING })
  status!: RoundStatus;

  @OneToMany(() => Bottle, (bottle) => bottle.round, { cascade: true, eager: true })
  bottles!: Bottle[];
}
