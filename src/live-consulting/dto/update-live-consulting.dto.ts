import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LiveClassType } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

export class UpdateLiveConsultingDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly doctorId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly patientId: string;

  @ApiProperty()
  @IsOptional()
  readonly paymentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly orderId: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  readonly startTime: Date;

  @ApiProperty({ enum: LiveClassType })
  @IsOptional()
  @IsEnum(LiveClassType, { message: INVALID_TYPE })
  readonly liveConsultingType: LiveClassType;

  @ApiProperty()
  @IsOptional()
  readonly duration: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly meetingNumber: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly password: string;

  @ApiProperty()
  @IsOptional()
  readonly status: boolean;
}
