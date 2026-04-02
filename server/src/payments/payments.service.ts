import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../wallet/transaction.entity';
import { User } from '../users/user.entity';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private readonly terminalKey = process.env.TBANK_TERMINAL_KEY || '';
  private readonly password = process.env.TBANK_PASSWORD || '';
  private readonly apiUrl = process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2';
  private readonly serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  generateToken(params: Record<string, string | number>): string {
    const data: Record<string, string | number> = {
      ...params,
      Password: this.password,
    };

    const sortedKeys = Object.keys(data).sort();
    const concatenated = sortedKeys.map((key) => data[key]).join('');

    return crypto.createHash('sha256').update(concatenated).digest('hex');
  }

  async createPayment(userId: number, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const transaction = this.transactionRepo.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      description: 'Deposit via T-Bank',
    });
    const saved = await this.transactionRepo.save(transaction);

    const amountInKopecks = Math.round(amount * 100);
    const orderId = `order_${saved.id}_${Date.now()}`;

    const params: Record<string, string | number> = {
      TerminalKey: this.terminalKey,
      Amount: amountInKopecks,
      OrderId: orderId,
      Description: `Deposit ${amount} RUB`,
    };

    const token = this.generateToken(params);

    try {
      const response = await axios.post(`${this.apiUrl}/Init`, {
        ...params,
        Token: token,
        NotificationURL: `${this.serverUrl}/api/payments/webhook`,
      });

      if (!response.data.Success) {
        saved.status = TransactionStatus.FAILED;
        saved.description = `Payment init failed: ${response.data.Message || 'Unknown error'}`;
        await this.transactionRepo.save(saved);
        throw new BadRequestException(response.data.Message || 'Payment initialization failed');
      }

      saved.tbankPaymentId = String(response.data.PaymentId);
      await this.transactionRepo.save(saved);

      return {
        paymentUrl: response.data.PaymentURL,
        paymentId: response.data.PaymentId,
        transactionId: saved.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('T-Bank Init error', error?.message);
      saved.status = TransactionStatus.FAILED;
      await this.transactionRepo.save(saved);
      throw new BadRequestException('Payment service unavailable');
    }
  }

  async handleWebhook(body: {
    TerminalKey: string;
    OrderId: string;
    Success: boolean;
    Status: string;
    PaymentId: number | string;
    Amount: number;
    Token: string;
  }) {
    const { Token, ...rest } = body;

    const checkParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === 'boolean') {
        checkParams[key] = value ? 'true' : 'false';
      } else {
        checkParams[key] = value;
      }
    }

    const expectedToken = this.generateToken(checkParams);
    if (expectedToken !== Token) {
      this.logger.warn('Webhook token mismatch');
      throw new BadRequestException('Invalid token');
    }

    const paymentId = String(body.PaymentId);
    const transaction = await this.transactionRepo.findOne({ where: { tbankPaymentId: paymentId } });

    if (!transaction) {
      this.logger.warn(`Transaction not found for PaymentId: ${paymentId}`);
      return { status: 'OK' };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return { status: 'OK' };
    }

    if (body.Status === 'CONFIRMED' && body.Success) {
      transaction.status = TransactionStatus.COMPLETED;
      await this.transactionRepo.save(transaction);

      const user = await this.userRepo.findOne({ where: { id: transaction.userId } });
      if (user) {
        user.balance = Number(user.balance) + Number(transaction.amount);
        await this.userRepo.save(user);
      }
    } else if (['REJECTED', 'REVERSED', 'REFUNDED'].includes(body.Status)) {
      transaction.status = TransactionStatus.FAILED;
      transaction.description = `Payment ${body.Status.toLowerCase()}`;
      await this.transactionRepo.save(transaction);
    }

    return { status: 'OK' };
  }

  async getPaymentStatus(paymentId: string) {
    const params: Record<string, string | number> = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };

    const token = this.generateToken(params);

    const response = await axios.post(`${this.apiUrl}/GetState`, {
      ...params,
      Token: token,
    });

    return response.data;
  }
}
