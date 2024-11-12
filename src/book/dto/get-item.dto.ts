import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBookItemByLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bookId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly languageId: string;
}
