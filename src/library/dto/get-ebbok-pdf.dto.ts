import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetEbookLibraryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly languageId: string;
}
