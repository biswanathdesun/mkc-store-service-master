import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BedTypes } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class CreateOrderDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  addressId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  hostelId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @ApiProperty()
  @IsOptional()
  @IsString()
  packageId: string;
}
