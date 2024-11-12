import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCourseItemReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly limit: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly warehouseId: string;
}
