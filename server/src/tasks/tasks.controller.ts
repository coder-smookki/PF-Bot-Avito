import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskStatus } from './task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  async create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get()
  async findAll(@Query() filters: TaskFilterDto) {
    return this.tasksService.findAll(filters);
  }

  @Get('my')
  @Roles(UserRole.CUSTOMER)
  async findMy(@CurrentUser() user: User) {
    return this.tasksService.findByCustomer(user.id);
  }

  @Get('available')
  @Roles(UserRole.EXECUTOR)
  async getAvailable(@CurrentUser() user: User) {
    return this.tasksService.getAvailableForExecutor(user.id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.CUSTOMER)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TaskStatus,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.updateStatus(id, status, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.CUSTOMER)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.tasksService.remove(id, user.id);
    return { ok: true };
  }
}
