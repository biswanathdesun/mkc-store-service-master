import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class GetSecurityAmount {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  @IsNotEmpty()
  readonly bedType: BedTypes;
}
