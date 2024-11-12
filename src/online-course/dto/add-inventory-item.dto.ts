import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AddCourseItems {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly itemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;
}

export class AddItemInCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly courseId: string;

  @ApiProperty({ type: [AddCourseItems] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  readonly items: AddCourseItems[];
}
