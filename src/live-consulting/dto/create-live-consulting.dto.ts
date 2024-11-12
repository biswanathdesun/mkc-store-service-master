import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { LiveClassType } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

export class CreateLiveConsultingDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly doctorId: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly patientId: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly paymentId: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly orderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly startTime: Date;

  @ApiProperty({ enum: LiveClassType })
  @IsNotEmpty()
  @IsEnum(LiveClassType, { message: INVALID_TYPE })
  readonly liveConsultingType: LiveClassType;

  @ApiProperty()
  @IsNotEmpty()
  readonly duration: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly meetingNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
