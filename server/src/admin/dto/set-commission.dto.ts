import { IsNumber, Min, Max } from 'class-validator';

export class SetCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  amount: number;
}
