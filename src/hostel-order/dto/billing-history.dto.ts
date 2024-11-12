import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BillingHistoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly limit: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;
}
