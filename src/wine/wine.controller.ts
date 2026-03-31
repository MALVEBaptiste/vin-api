import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WineService } from './wine.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Wines')
@ApiBearerAuth()
@Controller('wines')
export class WineController {
  private readonly logger = new Logger(WineController.name);

  constructor(private readonly wineService: WineService) {}

  @Get('colors')
  @Public()
  @ApiOperation({ summary: 'Liste des couleurs de vin possibles' })
  getColors() {
    this.logger.log('Fetching wine colors');
    return this.wineService.getColors();
  }

  @Get('grapes')
  @ApiOperation({ summary: 'Liste des cépages filtrés par couleur' })
  @ApiQuery({ name: 'color', required: false, description: 'Couleur pour filtrer les cépages' })
  async getGrapes(@Query('color') color?: string) {
    if (color) {
      this.logger.log(`Fetching grapes for color: ${color}`);
      return this.wineService.getGrapesByColor(color);
    }
    this.logger.log('Fetching all grapes');
    return this.wineService.getAllGrapes();
  }
}
