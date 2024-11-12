import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddRemarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly paymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly remark: string;
}
