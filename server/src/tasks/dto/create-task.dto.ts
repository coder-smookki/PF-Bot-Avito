import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { VerificationType } from '../task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @Min(1)
  pricePerExecution: number;

  @IsNumber()
  @Min(1)
  totalBudget: number;

  @IsEnum(VerificationType)
  @IsOptional()
  verificationType?: VerificationType;

  @IsString()
  @IsOptional()
  controlQuestion?: string;

  @IsString()
  @IsOptional()
  controlAnswer?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxExecutions?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
