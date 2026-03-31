import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable, JoinColumn
} from 'typeorm';
import { Player } from '../../auth/entities/player.entity';

export enum GameStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 6 })
  code!: string;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.WAITING })
  status!: GameStatus;

  @Column()
  hostId!: string;

  @ManyToOne(() => Player, { eager: true })
  @JoinColumn({ name: 'hostId' })
  host!: Player;

  @ManyToMany(() => Player, { eager: true })
  @JoinTable({ name: 'game_players' })
  players!: Player[];

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt!: Date | null;
}
