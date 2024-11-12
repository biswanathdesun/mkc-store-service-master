import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminAnswerDetailsDto {
  @ApiProperty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly attemptCount: number;
}
