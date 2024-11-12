import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OmrResultDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;
}
