import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HealthcareExtendDateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly paymentId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  readonly date: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly message: string;
}
