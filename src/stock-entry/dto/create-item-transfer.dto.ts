import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateItemTransferDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly stockId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly transferTo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;
}
