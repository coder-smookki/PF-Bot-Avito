import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createPayment(@CurrentUser('id') userId: number, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(userId, dto.amount);
  }

  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
