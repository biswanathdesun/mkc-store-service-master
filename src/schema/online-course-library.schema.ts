import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { OnlineCourse } from './online-course.schema';
import { Subject } from './subject.schema';
import { Chapter } from './chapter.schema';
import { Topic } from './topic.schema';
import {
  ConverterStatus,
  CourseLibraryType,
  LibraryDataTypes,
  ModeTypes,
  VideoType,
} from 'src/utills/enum';
import {
  INVALID_CONVERTER_STATUS,
  INVALID_TYPE,
  VIDEO_TYPE_ERROR,
} from 'src/utills/messages';
import { TestMaster } from './test-master.schema';

@Schema({ timestamps: true })
class PdfUrlItem {
  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Language' })
  languageId: Types.ObjectId;

  @Prop()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Prop()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @Prop()
  url: string;
}

@Schema({ timestamps: true })
class VideoUrlItem {
  @Prop()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Prop()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @Prop()
  @IsString()
  @IsNotEmpty()
  @IsEnum(VideoType, { message: VIDEO_TYPE_ERROR })
  videoType: VideoType;

  @Prop()
  url: string;

  @Prop({ default: ConverterStatus.ONGOING })
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_CONVERTER_STATUS })
  status360p: string;

  @Prop({ default: ConverterStatus.ONGOING })
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_CONVERTER_STATUS })
  status720p: string;

  @Prop({ default: ConverterStatus.ONGOING })
  @IsString()
  @IsEnum(ConverterStatus, { message: INVALID_CONVERTER_STATUS })
  status1080p: string;
}

@Schema({ timestamps: true })
export class CourseLibrary extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsEnum(ModeTypes, { message: INVALID_TYPE })
  courseType: ModeTypes;

  @Prop()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'OnlineCourse' }] })
  @IsNotEmpty()
  @IsString()
  onlineCourseId: OnlineCourse['_id'][];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  @IsString()
  subjectId: Subject['_id'];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chapter' })
  @IsNotEmpty()
  @IsString()
  chapterId: Chapter['_id'];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Topic' }] })
  @IsNotEmpty()
  topicId: Topic['_id'][];

  @Prop({ required: true })
  @IsNotEmpty()
  @IsEnum(CourseLibraryType, { message: INVALID_TYPE })
  type: CourseLibraryType;

  @Prop({ default: LibraryDataTypes.COURSE_DATA, required: true })
  @IsNotEmpty()
  @IsEnum(LibraryDataTypes, { message: INVALID_TYPE })
  libraryDataType: LibraryDataTypes;

  @Prop([{ default: null, type: PdfUrlItem }])
  pdfUrl: PdfUrlItem[];

  @Prop([{ default: null, type: VideoUrlItem }])
  videoUrl: VideoUrlItem[];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'TestMaster' }],
  })
  @IsOptional()
  testMasterId: TestMaster['_id'][];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const CourseLibrarySchema = SchemaFactory.createForClass(CourseLibrary);
