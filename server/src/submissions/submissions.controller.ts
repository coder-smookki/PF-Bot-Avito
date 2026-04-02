import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';

@Controller('api/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(UserRole.EXECUTOR)
  async create(@CurrentUser() user: User, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.EXECUTOR)
  async findMy(@CurrentUser() user: User) {
    return this.submissionsService.findByExecutor(user.id);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.submissionsService.findByTask(taskId);
  }

  @Patch(':id/review')
  @Roles(UserRole.CUSTOMER)
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body('approved') approved: boolean,
    @CurrentUser() user: User,
  ) {
    return this.submissionsService.review(id, user.id, approved);
  }
}
