import { IsNumber, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
