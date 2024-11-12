import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SavedProductTypes } from 'src/utills/enum';

export class AddSaveDto {
  @ApiProperty({ enum: SavedProductTypes })
  @IsNotEmpty()
  @IsString()
  @IsEnum(SavedProductTypes)
  readonly productType: SavedProductTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly productId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly courseLibraryId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  readonly status: boolean;
}
