import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { LiveClassStatus } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

export class UpdateLiveConsultingStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly liveConsultingId: string;

  @ApiProperty({ enum: LiveClassStatus })
  @IsNotEmpty()
  @IsEnum(LiveClassStatus, { message: INVALID_TYPE })
  readonly status: LiveClassStatus;
}
