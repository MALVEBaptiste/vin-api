import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Player } from '../../auth/entities/player.entity';
import { Bottle } from './bottle.entity';

export enum RoundPhase {
  COLOR = 'COLOR',
  GRAPE = 'GRAPE',
  YEAR = 'YEAR',
  MATCHING = 'MATCHING',
}

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  playerId!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'playerId' })
  player!: Player;

  @Column()
  bottleId!: string;

  @ManyToOne(() => Bottle)
  @JoinColumn({ name: 'bottleId' })
  bottle!: Bottle;

  @Column({ type: 'enum', enum: RoundPhase })
  roundPhase!: RoundPhase;

  @Column()
  value!: string;

  @Column({ type: 'boolean', nullable: true })
  isCorrect!: boolean | null;

  @Column({ type: 'float', default: 0 })
  points!: number;
}
