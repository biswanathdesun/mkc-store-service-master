import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class HostelOrderListDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly page: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly limit: number;
}
