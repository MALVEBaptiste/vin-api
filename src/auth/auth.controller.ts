import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Créer un compte joueur' })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`Register attempt: ${dto.username}`);
    const result = await this.authService.register(dto);
    this.logger.log(`Register success: ${dto.username}`);
    return result;
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Se connecter avec username + PIN' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.username}`);
    const result = await this.authService.login(dto);
    this.logger.log(`Login success: ${dto.username}`);
    return result;
  }
}
