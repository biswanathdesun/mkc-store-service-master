import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AdmissionStatus } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class StudentAdmissionDetails extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  @IsNotEmpty()
  @IsString()
  studentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  @IsNotEmpty()
  @IsString()
  onlineCourseId: Types.ObjectId;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({ required: true, default: AdmissionStatus.PENDING })
  @IsEnum(AdmissionStatus, { message: INVALID_TYPE })
  admissionStatus: AdmissionStatus;

  @Prop({ default: false })
  isDroppedStatus: boolean;

  @Prop({ default: null })
  droppedDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const StudentAdmissionDetailsSchema = SchemaFactory.createForClass(
  StudentAdmissionDetails,
);
