import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { INVALID_TYPE } from 'src/utills/messages';
import { ModeTypes } from 'src/utills/enum';

export class ModifyPurchaseCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly orderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly modifiedCourseId: string;

  @ApiProperty()
  @IsEnum(ModeTypes, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly courseType: ModeTypes;
}
