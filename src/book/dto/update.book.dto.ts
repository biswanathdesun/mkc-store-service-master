import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { INVALID_BINDING_TYPE } from 'src/utills/messages';
import { BindingType, BookType } from 'src/utills/enum';
import { ApiProperty } from '@nestjs/swagger';

class UpdateActualBookPdf {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  url: string;

  constructor(title: string, url: string) {
    this.title = title;
    this.url = url;
  }
}

class UpdateLanguageData {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly languageId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  thumbnail: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sampleDownload: string;

  @ApiProperty()
  @IsOptional()
  actualbook: UpdateActualBookPdf;

  constructor(
    languageId: string,
    thumbnail: string,
    sampleDownload: string,
    actualbook?: any,
  ) {
    this.languageId = languageId;
    this.thumbnail = thumbnail;
    this.sampleDownload = sampleDownload;
    this.actualbook = actualbook;
  }
}

class UpdateBookTypeData {
  @ApiProperty({ enum: BookType })
  @IsOptional()
  @IsEnum(BookType)
  readonly bookType: BookType;

  @ApiProperty()
  @IsOptional()
  readonly priceId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly shippingCharge: number;

  constructor(bookType: BookType, priceId: string, shippingCharge: number) {
    this.bookType = bookType;
    this.priceId = priceId;
    this.shippingCharge = shippingCharge;
  }
}

export class UpdateBookDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly courseIds: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly bookName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsEnum(BindingType, { message: INVALID_BINDING_TYPE })
  @IsString()
  @IsOptional()
  readonly bindingType: BindingType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly bookWeight: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly shortDescription: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly longDescription: string;

  @ApiProperty()
  @IsOptional()
  readonly InStock: boolean;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly totalPage: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly publication: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly author: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly skuCode: number;

  @ApiProperty({ type: [UpdateLanguageData] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  languageDetails: UpdateLanguageData[];

  @ApiProperty({ type: [UpdateBookTypeData] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  bookTypeDetails: UpdateBookTypeData[];

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  readonly topSeller: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly coins: number;
}
