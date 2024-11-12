import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class RoomReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly limit: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ type: [Number], isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BedTypes, { each: true, message: INVALID_BED_TYPE })
  readonly bedType: BedTypes[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly roomNumber: number;
}
