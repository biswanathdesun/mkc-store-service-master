import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HostelPaymentType, BedTypes } from 'src/utills/enum';

export class AddToHostelCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ enum: HostelPaymentType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(HostelPaymentType)
  readonly type: HostelPaymentType;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly roomNumber: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;

  @ApiProperty({ enum: BedTypes })
  @IsNotEmpty()
  @IsEnum(BedTypes)
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly couponId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly count: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly joiningDate: Date;
}
