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

class ActualBookPdf {
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

class LanguageData {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly languageId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  thumbnail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sampleDownload: string;

  @ApiProperty()
  @IsOptional()
  actualbook: ActualBookPdf;

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

class BookTypeData {
  @ApiProperty({ enum: BookType })
  @IsNotEmpty()
  @IsEnum(BookType)
  readonly bookType: BookType;

  @ApiProperty()
  @IsNotEmpty()
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

export class CreateBookDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  readonly courseIds: string[];

  @ApiProperty()
  @IsString()
  readonly bookName: string;

  @ApiProperty()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty({ enum: BindingType })
  @IsEnum(BindingType, { message: INVALID_BINDING_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly bindingType: BindingType;

  @ApiProperty()
  @IsString()
  readonly bookWeight: string;

  @ApiProperty()
  @IsString()
  readonly shortDescription: string;

  @ApiProperty()
  @IsString()
  readonly longDescription: string;

  @ApiProperty()
  readonly InStock: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly totalPage: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly publication: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly author: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly skuCode: number;

  @ApiProperty({ type: [LanguageData] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  languageDetails: LanguageData[];

  @ApiProperty({ type: [BookTypeData] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  bookTypeDetails: BookTypeData[];

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
