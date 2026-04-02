import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TransactionType, TransactionStatus } from './transaction.entity';

@Controller('api/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  getBalance(@CurrentUser('id') userId: number) {
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser('id') userId: number,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactions(userId, {
      type,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('withdraw')
  withdraw(@CurrentUser('id') userId: number, @Body() dto: WithdrawDto) {
    return this.walletService.createWithdrawalRequest(userId, dto.amount);
  }
}
