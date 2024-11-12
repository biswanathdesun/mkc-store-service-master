import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BedTypes, ChangeHostelType } from 'src/utills/enum';
import { INVALID_BED_TYPE, INVALID_TYPE } from 'src/utills/messages';

export class ChangeHostelInfoDto {
  @ApiProperty({ enum: ChangeHostelType })
  @IsEnum(ChangeHostelType, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly type: ChangeHostelType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  readonly joiningDate: Date;

  @ApiProperty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  @IsOptional()
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly roomNumber: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;
}
