import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  @Exclude()
  pinHash!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
