import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ModeTypes } from 'src/utills/enum';

export class CreateCourseChangeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly studentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly paymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly previousCourseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly currentCourseId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly previousbatchId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly currentbatchId: string;

  @ApiProperty()
  @IsEnum(ModeTypes)
  @IsNotEmpty()
  readonly type: ModeTypes;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly isPayment: boolean;
}
