import { IsString, Length, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Nom d\'utilisateur', example: 'jean' })
  @IsString({ message: 'Le nom d\'utilisateur doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom d\'utilisateur doit contenir au moins 2 caractères' })
  @MaxLength(30, { message: 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères' })
  username!: string;

  @ApiProperty({ description: 'PIN à 4 chiffres', example: '1234' })
  @IsString({ message: 'Le PIN doit être une chaîne de caractères' })
  @Length(4, 4, { message: 'Le PIN doit contenir exactement 4 chiffres' })
  @Matches(/^\d{4}$/, { message: 'Le PIN doit contenir exactement 4 chiffres' })
  pin!: string;
}
