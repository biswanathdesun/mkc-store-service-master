import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

class RoomsDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly roomNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly floorNumber: number;

  @ApiProperty({ enum: BedTypes })
  @IsNotEmpty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

  purchasedBed: BedTypes;
}

export class RoomMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ type: [RoomsDetails] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  roomDetails: RoomsDetails[];
}
