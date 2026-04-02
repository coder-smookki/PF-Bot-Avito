import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, TelegramAuthDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerFromWeb(
      dto.email,
      dto.password,
      dto.username,
      dto.role,
    );
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWeb(dto.email, dto.password);
  }

  @Post('telegram')
  async telegram(@Body() dto: TelegramAuthDto) {
    const existing = await this.authService.loginTelegram(dto.telegramId).catch(() => null);

    if (existing) {
      return existing;
    }

    return this.authService.registerFromTelegram(
      dto.telegramId,
      dto.username,
      dto.firstName,
      dto.role ?? undefined,
    );
  }
}
