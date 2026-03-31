import { ApiProperty } from '@nestjs/swagger';

export class StartRoundDto {
  @ApiProperty({ description: 'Aucun champ requis — le round est démarré par l\'hôte', required: false })
  placeholder?: string;
}
