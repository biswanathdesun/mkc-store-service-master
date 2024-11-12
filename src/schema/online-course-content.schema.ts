import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CourseContentType } from 'src/utills/enum';
import { INVALID_COURSE_CONTENT } from 'src/utills/messages';

@Schema({ timestamps: true })
export class CourseContent extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @Prop({ required: true })
  @IsOptional()
  @IsEnum(CourseContentType, { message: INVALID_COURSE_CONTENT })
  type: CourseContentType;

  @Prop({ default: null })
  @IsString()
  @IsOptional()
  pdfUrl: string;

  @Prop({ default: null })
  @IsString()
  @IsOptional()
  videoUrl: string;

  @Prop({ default: true })
  status: boolean;
}

export const CourseContentSchema = SchemaFactory.createForClass(CourseContent);
