import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class CreateHostelEnquiryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly query: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly appointmentDate: Date;
}
