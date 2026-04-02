import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsNumber()
  taskId: number;

  @IsString()
  @IsOptional()
  proofImageUrl?: string;

  @IsString()
  @IsOptional()
  answerText?: string;
}
