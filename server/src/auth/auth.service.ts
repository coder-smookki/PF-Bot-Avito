import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registerFromTelegram(
    telegramId: string,
    username?: string,
    firstName?: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<{ user: User; accessToken: string }> {
    const existing = await this.usersService.findByTelegramId(telegramId);
    if (existing) {
      throw new ConflictException('User with this Telegram ID already exists');
    }

    const user = await this.usersService.create({
      telegramId,
      username,
      firstName,
      role,
    });

    const accessToken = this.generateToken(user);
    return { user, accessToken };
  }

  async registerFromWeb(
    email: string,
    password: string,
    username?: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<{ user: User; accessToken: string }> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      passwordHash,
      username,
      role,
    });

    const accessToken = this.generateToken(user);
    return { user, accessToken };
  }

  async loginTelegram(telegramId: string): Promise<{ user: User; accessToken: string }> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    const accessToken = this.generateToken(user);
    return { user, accessToken };
  }

  async loginWeb(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user);
    return { user, accessToken };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
