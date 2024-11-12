import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtendPaymentDateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  extendedPaymentDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
