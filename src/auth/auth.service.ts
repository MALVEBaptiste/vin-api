import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Player } from './entities/player.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.playerRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà pris');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    const player = this.playerRepo.create({
      username: dto.username,
      pinHash,
    });
    const saved = await this.playerRepo.save(player);

    return {
      id: saved.id,
      username: saved.username,
      accessToken: this.generateToken(saved),
    };
  }

  async login(dto: LoginDto) {
    const player = await this.playerRepo.findOne({
      where: { username: dto.username },
    });
    if (!player) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const pinValid = await bcrypt.compare(dto.pin, player.pinHash);
    if (!pinValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return {
      id: player.id,
      username: player.username,
      isAdmin: player.isAdmin,
      accessToken: this.generateToken(player),
    };
  }

  async findById(id: string): Promise<Player | null> {
    return this.playerRepo.findOne({ where: { id } });
  }

  private generateToken(player: Player): string {
    return this.jwtService.sign({
      sub: player.id,
      username: player.username,
      isAdmin: player.isAdmin,
    });
  }
}
