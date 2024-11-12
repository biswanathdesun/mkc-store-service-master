import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsString,
} from 'class-validator';
import { Role } from './role.schema';
import { CounsellorType, Gender } from 'src/utills/enum';
import { Category } from './category.schema';
import { Subject } from './subject.schema';
import { Course } from './course.schema';
import { INVALID_GENDER, INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class AssignStaff {
  @Prop()
  staffId: string;

  @Prop({ default: null })
  @IsOptional()
  createdBy: string;

  @Prop({ default: null })
  @IsOptional()
  updatedBy: string;
}

@Schema({ timestamps: true })
export class Staff extends Document {
  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @IsString()
  uniqueId: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @Prop({ unique: true })
  @IsString()
  alternateNumber: string;

  @Prop()
  @IsString()
  password: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Role' })
  @IsNotEmpty()
  roleId: Role['_id'];

  @Prop()
  @IsOptional()
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;

  @Prop({ default: null })
  @IsOptional()
  image: string;

  @Prop({ default: null })
  @IsOptional()
  experience: string;

  @Prop({ default: null })
  @IsOptional()
  qualification: string;

  @Prop({ default: false })
  topEducater: boolean;

  @Prop({ default: false })
  topDoctor: boolean;

  @Prop({ default: false })
  isAssignedStaff: boolean;

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Category' }],
  })
  @IsNotEmpty()
  categoryId: Category['_id'][];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  @IsNotEmpty()
  courseId: Course['_id'][];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Subject' }],
  })
  @IsNotEmpty()
  subjectId: Subject['_id'][];

  @Prop([{ default: null, type: AssignStaff }])
  @IsOptional()
  assignStaff: AssignStaff[];

  @Prop({ default: null })
  @IsNotEmpty()
  @IsEnum(CounsellorType, { message: INVALID_TYPE })
  counsellorType: CounsellorType[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null })
  createdBy: string;

  @Prop({ default: null })
  updatedBy: string;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
StaffSchema.index({ email: 1 }, { unique: true });
StaffSchema.index({ phone: 1 }, { unique: true });
StaffSchema.index({ alternateNumber: 1 }, { unique: true });
