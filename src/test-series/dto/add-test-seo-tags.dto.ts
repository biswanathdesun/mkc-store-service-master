import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTestSeriesSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaDescription: string;
}
