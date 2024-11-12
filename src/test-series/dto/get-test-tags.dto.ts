import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTestSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;
}
