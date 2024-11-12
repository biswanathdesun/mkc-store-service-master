import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsDateString } from 'class-validator';
import { INVALID_EVENT_MODE_TYPE, INVALID_TYPE } from 'src/utills/messages';
import {
  CarrerAmbitionType,
  EducationBoardType,
  EventModeTypes,
  Gender,
  StudentTypeForEventApply,
  StudingClassType,
} from 'src/utills/enum';

class State {
  @Prop({ required: true, type: Number })
  stateId: number;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  iso2: string;
}

class City {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  cityId: number;
}

@Schema({ timestamps: true })
export class EventApplied extends Document {
  @Prop({ default: null, required: false })
  @IsEnum(EventModeTypes, { message: INVALID_EVENT_MODE_TYPE })
  mode: EventModeTypes;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Event' })
  eventId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'Exam',
  })
  examId: Types.ObjectId;

  @Prop({ default: null, required: false })
  name: string;

  @Prop({ default: null, required: false })
  mobile: string;

  @Prop({ default: null, required: false })
  email: string;

  @Prop({ default: null, required: false })
  parentName: string;

  @Prop({ default: null, required: false, type: Date })
  @IsDateString()
  dob: Date;

  @Prop({ default: null, required: false })
  @IsEnum(Gender, { message: INVALID_TYPE })
  gender: Gender;

  @Prop({ default: null, required: false })
  @IsEnum(StudingClassType, { message: INVALID_TYPE })
  studyingClass: StudingClassType;

  @Prop({ default: null, required: false })
  @IsEnum(EducationBoardType, { message: INVALID_TYPE })
  educationBoard: EducationBoardType;

  @Prop({ default: null, required: false })
  @IsEnum(CarrerAmbitionType, { message: INVALID_TYPE })
  careerAmbition: CarrerAmbitionType;

  @Prop({ default: null, required: false })
  address: string;

  @Prop({ default: null, required: false })
  city: City;

  @Prop({ default: null, required: false })
  state: State;

  @Prop({ default: null, required: false })
  pincode: string;

  @Prop({ default: null, required: false })
  examState: State;

  @Prop({ default: null, required: false })
  examCity: City;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Center' })
  centerId: Types.ObjectId;

  @Prop({ default: false, required: true })
  isMkcUser: boolean;

  @Prop({ default: null, required: false })
  @IsEnum(StudentTypeForEventApply, { message: INVALID_TYPE })
  studentType: StudentTypeForEventApply;

  @Prop({ required: false })
  mkcStudent: boolean;

  @Prop({ default: null })
  eventName: string;

  @Prop({ default: false })
  isMovedUser: boolean;

  @Prop({ default: false })
  isEventAttempted: boolean;

  @Prop({ default: null, type: Number })
  rollNumber: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const EventAppliedSchema = SchemaFactory.createForClass(EventApplied);
