import { ApiProperty } from '@nestjs/swagger';

export class JoinGameDto {
  // Le code est passé en paramètre d'URL, pas de body requis
  @ApiProperty({ description: 'Aucun champ requis', required: false })
  placeholder?: string;
}
