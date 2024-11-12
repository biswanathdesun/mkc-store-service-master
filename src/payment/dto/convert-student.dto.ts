import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConvertStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly studentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly courseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly batchId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly orderId: string;
}
