import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReceiptNumberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly startDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly endDate: Date;
}
