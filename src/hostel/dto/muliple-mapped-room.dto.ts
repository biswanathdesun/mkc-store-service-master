import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class GetMulipleMappedRoomNumberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ type: [Number], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(BedTypes, { each: true, message: INVALID_BED_TYPE })
  readonly bedType: BedTypes[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;
}
