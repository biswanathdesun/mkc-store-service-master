import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CoursePaymentHistoryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly orderId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly courseId: string;
}
