import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetTestMarksAndTimeDto {
  @ApiProperty()
  @IsString()
  readonly testId: string;
}
