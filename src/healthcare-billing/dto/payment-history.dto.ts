import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentHistoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly page: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly limit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;
}
