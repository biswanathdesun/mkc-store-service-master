import { IsNotEmpty, IsString, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AddItems {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly itemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly languageId: string;
}

export class AddItemInBooksgDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bookId: string;

  @ApiProperty({ type: [AddItems] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  readonly items: AddItems[];
}
