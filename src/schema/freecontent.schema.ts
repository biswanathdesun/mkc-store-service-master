import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { Category } from './category.schema';
import { Course } from './course.schema';
import { Chapter } from './chapter.schema';
import { Subject } from './subject.schema';
import { Staff } from './staff.schema';
import { Topic } from './topic.schema';
import { ConverterStatus, FreeContentType, VideoType } from 'src/utills/enum';
import {
  FREE_CONTENT_TYPE,
  INVALID_MODE_TYPE,
  VIDEO_TYPE_ERROR,
} from 'src/utills/messages';

@Schema({ timestamps: true })
class VideoUrlItem {
  @Prop()
  title: string;

  @Prop()
  url: string;
}

@Schema({ timestamps: true })
class PdfUrlItem {
  @Prop()
  title: string;

  @Prop()
  url: string;
}

@Schema({ timestamps: true })
export class FreeContent extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  @IsNotEmpty()
  @IsString()
  categoryId: Category['_id'];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] })
  @IsNotEmpty()
  courseIds: Course['_id'][];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  @IsString()
  subjectId: Subject['_id'];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Chapter' })
  @IsNotEmpty()
  @IsString()
  chapterId: Chapter['_id'];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Topic' }] })
  @IsNotEmpty()
  topicIds: Topic['_id'][];

  @Prop({ required: true })
  @IsNotEmpty()
  thumbnail: string;

  @Prop()
  @IsNotEmpty()
  @IsEnum(FreeContentType, { message: FREE_CONTENT_TYPE })
  attachmentType: FreeContentType;

  @Prop()
  @IsString()
  @IsNotEmpty()
  @IsEnum(VideoType, { message: VIDEO_TYPE_ERROR })
  videoType: VideoType;

  @Prop({ default: null, type: PdfUrlItem })
  pdfUrl: PdfUrlItem;

  @Prop({ default: null, type: VideoUrlItem })
  videoUrl: VideoUrlItem;

  @Prop({ default: true })
  status: boolean;

  @Prop()
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_MODE_TYPE })
  status360p: string;

  @Prop()
  @IsString()
  @IsNotEmpty()
  slugUrl: string;

  @Prop()
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_MODE_TYPE })
  status720p: string;

  @Prop()
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_MODE_TYPE })
  status1080p: string;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}

export const FreeContentSchema = SchemaFactory.createForClass(FreeContent);
