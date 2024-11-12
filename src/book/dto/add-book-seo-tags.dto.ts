import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddBookSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bookId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly metaDescription: string;
}
