import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FineHistoryDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly page: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly limit: number;
}
