import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('grapes')
export class Grape {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  color!: 'rouge' | 'blanc';

  @Column('simple-array', { nullable: true })
  synonyms?: string[];

  @Column('simple-array')
  regions!: string[];

  @Column('simple-array')
  aromas!: string[];
}
