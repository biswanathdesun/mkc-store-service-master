import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetLabReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly paymentId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly reportId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  readonly isLabReportAdded: boolean;
}
