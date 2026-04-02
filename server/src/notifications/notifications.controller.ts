import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AdminGuard } from '../admin/admin.guard';
import { BroadcastTarget } from './broadcast.entity';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

class CreateBroadcastDto {
  @IsEnum(BroadcastTarget)
  target: BroadcastTarget;

  @IsString()
  @IsNotEmpty()
  message: string;
}

@Controller('api/admin')
@UseGuards(AdminGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  broadcast(@Body() dto: CreateBroadcastDto) {
    return this.notificationsService.broadcast(dto.target, dto.message);
  }

  @Get('broadcasts')
  getBroadcasts() {
    return this.notificationsService.getBroadcasts();
  }
}
