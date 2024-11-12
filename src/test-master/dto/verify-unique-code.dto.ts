import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyUniqueCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly testId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly uniqueCode: number;
}
