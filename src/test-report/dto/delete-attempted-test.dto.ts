import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly testId: string;
}
