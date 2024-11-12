import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { INVALID_MODE_TYPE } from 'src/utills/messages';
import { ModeTypes } from 'src/utills/enum';

export class OnlineCourseByUserId {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  type: ModeTypes;
}
