import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBookSeoTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bookId: string;
}
