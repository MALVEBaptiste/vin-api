import { IsString, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoundPhase } from '../entities/answer.entity';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'ID de la bouteille', example: 'uuid-bottle-1' })
  @IsUUID('4', { message: 'L\'ID de la bouteille doit être un UUID valide' })
  bottleId!: string;

  @ApiProperty({ description: 'Phase de la manche', enum: RoundPhase })
  @IsEnum(RoundPhase, { message: 'La phase doit être COLOR, GRAPE, YEAR ou MATCHING' })
  roundPhase!: RoundPhase;

  @ApiProperty({ description: 'Valeur de la réponse', example: 'rouge' })
  @IsString({ message: 'La valeur doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La valeur ne peut pas être vide' })
  value!: string;
}
