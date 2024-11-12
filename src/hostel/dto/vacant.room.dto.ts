import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber } from 'class-validator';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class GetVacantRoomDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ enum: BedTypes })
  @IsNotEmpty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly roomNumber: number;
}
