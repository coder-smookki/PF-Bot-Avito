import { Controller, Get, Put, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { SetCommissionDto } from './dto/set-commission.dto';
import { WalletService } from '../wallet/wallet.service';
import { UserRole } from '../users/user.entity';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly walletService: WalletService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('finance')
  getFinanceStats() {
    return this.adminService.getFinanceStats();
  }

  @Get('commission')
  getCommission() {
    return this.adminService.getCommission();
  }

  @Put('commission')
  setCommission(@Body() dto: SetCommissionDto) {
    return this.adminService.setCommission(dto.amount);
  }

  @Get('users')
  getUsers(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getUsers({
      role,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Patch('users/:id/ban')
  async banUser(@Param('id', ParseIntPipe) id: number, @Body('banned') banned: boolean) {
    if (banned) {
      return this.adminService.banUser(id);
    }
    return this.adminService.unbanUser(id);
  }

  @Get('withdrawals')
  getPendingWithdrawals() {
    return this.adminService.getPendingWithdrawals();
  }

  @Patch('withdrawals/:id')
  processWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Body('approved') approved: boolean,
  ) {
    return this.walletService.processWithdrawal(id, approved);
  }
}
