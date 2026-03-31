import { IsArray, ValidateNested, IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BottleValidationDto {
  @ApiProperty({ description: 'Position de la bouteille (1, 2 ou 3)', example: 1 })
  @IsInt({ message: 'La position doit être un entier' })
  @Min(1, { message: 'La position doit être entre 1 et 3' })
  @Max(3, { message: 'La position doit être entre 1 et 3' })
  position!: number;

  @ApiProperty({ description: 'Vraie couleur du vin', example: 'rouge' })
  @IsString({ message: 'La couleur doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La couleur ne peut pas être vide' })
  trueColor!: string;

  @ApiProperty({ description: 'Vrai cépage', example: 'Merlot' })
  @IsString({ message: 'Le cépage doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le cépage ne peut pas être vide' })
  trueGrape!: string;

  @ApiProperty({ description: 'Numéro du verre réel (1, 2 ou 3)', example: 1 })
  @IsInt({ message: 'Le numéro de verre doit être un entier' })
  @Min(1, { message: 'Le numéro de verre doit être entre 1 et 3' })
  @Max(3, { message: 'Le numéro de verre doit être entre 1 et 3' })
  trueGlassPosition!: number;
}

export class ValidateRoundDto {
  @ApiProperty({
    description: 'Tableau de 3 bouteilles avec les vraies réponses',
    type: [BottleValidationDto],
  })
  @IsArray({ message: 'Le corps doit contenir un tableau de bouteilles' })
  @ValidateNested({ each: true })
  @Type(() => BottleValidationDto)
  bottles!: BottleValidationDto[];
}
