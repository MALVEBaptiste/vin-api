import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Round } from './round.entity';

@Entity('bottles')
export class Bottle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  roundId!: string;

  @ManyToOne(() => Round, (round) => round.bottles)
  @JoinColumn({ name: 'roundId' })
  round!: Round;

  @Column()
  position!: number; // 1, 2, or 3

  @Column({ type: 'varchar', nullable: true })
  trueColor!: string | null;

  @Column({ type: 'varchar', nullable: true })
  trueGrape!: string | null;

  @Column({ type: 'int', nullable: true })
  trueGlassPosition!: number | null; // 1, 2, or 3
}
