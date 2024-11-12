import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TestSubmitType } from 'src/utills/enum';

export class AdminReportDto {
  @ApiProperty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly page: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly limit: number;

  @ApiProperty({ enum: TestSubmitType })
  @IsEnum(TestSubmitType)
  @IsOptional()
  readonly mode: TestSubmitType;
}
