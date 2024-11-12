import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ManualOrderReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly fromDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly toDate: Date;
}
