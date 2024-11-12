import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { DropStudentTypes } from 'src/utills/enum';

export class DroppedRemarkDto {
  @ApiProperty({ enum: DropStudentTypes })
  @IsNotEmpty()
  @IsEnum(DropStudentTypes)
  readonly type: DropStudentTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly remark: string;
}
