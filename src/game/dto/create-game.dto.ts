import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  // Pas de champs requis — le jeu est créé par le joueur authentifié
  @ApiProperty({ description: 'Aucun champ requis', required: false })
  placeholder?: string;
}
