import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Player } from '../../auth/entities/player.entity';

@Entity('game_players')
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  gameId!: string;

  @Column()
  playerId!: string;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'gameId' })
  game!: Game;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'playerId' })
  player!: Player;
}
