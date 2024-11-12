import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly languageId: string;
}
