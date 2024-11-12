import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { INVALID_EVENT_MODE_TYPE, INVALID_TYPE } from 'src/utills/messages';
import {
  EventModeTypes,
  EventTypes,
  EventValidForTypes,
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
class CityDetails {
  @Prop({ type: City })
  city: City;

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Center' }],
  })
  centerId: Types.ObjectId[];
}

@Schema({ timestamps: true })
class StateCity {
  @Prop({ type: State })
  state: State;

  @Prop([{ required: true, type: CityDetails }])
  cityDetails: CityDetails[];
}
@Schema({ timestamps: true })
class View {
  @Prop({ default: true })
  @IsBoolean()
  examName: boolean;

  @Prop({ default: true })
  @IsBoolean()
  name: boolean;

  @Prop({ default: true })
  @IsBoolean()
  parentName: boolean;

  @Prop({ default: true })
  @IsBoolean()
  dob: boolean;

  @Prop({ default: true })
  @IsBoolean()
  gender: boolean;

  @Prop({ default: true })
  @IsBoolean()
  studyingClass: boolean;

  @Prop({ default: true })
  @IsBoolean()
  phone: boolean;

  @Prop({ default: true })
  @IsBoolean()
  email: boolean;

  @Prop({ default: true })
  @IsBoolean()
  educationBoard: boolean;

  @Prop({ default: true })
  @IsBoolean()
  careerAmbition: boolean;

  @Prop({ default: true })
  @IsBoolean()
  address: boolean;

  @Prop({ default: true })
  @IsBoolean()
  city: boolean;

  @Prop({ default: true })
  @IsBoolean()
  state: boolean;

  @Prop({ default: true })
  @IsBoolean()
  pincode: boolean;

  @Prop({ default: true })
  @IsBoolean()
  examMode: boolean;

  @Prop({ default: true })
  @IsBoolean()
  examCity: boolean;

  @Prop({ default: true })
  @IsBoolean()
  examState: boolean;

  @Prop({ default: true })
  @IsBoolean()
  center: boolean;

  @Prop({ default: true })
  @IsBoolean()
  mkcStudent: boolean;
}

@Schema({ timestamps: true })
class SubjectBasedOnExam {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Subject' })
  subjectId: Types.ObjectId;

  @Prop({ required: true, type: String })
  time: string;
}

@Schema({ timestamps: true })
class SubjectDetails {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Exam' })
  examIdforSubject: Types.ObjectId;

  @Prop([{ required: true, type: SubjectBasedOnExam }])
  subjectDetails: SubjectBasedOnExam[];
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({
    default: null,
    required: false,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Exam' }],
  })
  examId: Types.ObjectId[];

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Category' }],
  })
  categoryId: Types.ObjectId[];

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  courseId: Types.ObjectId[];

  @Prop({ required: true, type: String })
  eventName: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  shortDescription: string;

  @Prop({ required: true, type: String, default: null })
  image: string;

  @Prop({ required: true, type: Date })
  @IsDateString()
  date: Date;

  @Prop({ required: true, type: String })
  slugUrl: string;

  @Prop({ default: false })
  isApplied: boolean;

  @Prop({ required: true, default: null })
  @IsEnum(EventTypes, { message: INVALID_TYPE })
  eventType: EventTypes;

  @Prop({ required: true, default: null })
  @IsEnum(EventModeTypes, { message: INVALID_EVENT_MODE_TYPE })
  mode: EventModeTypes[];

  @Prop({ required: true, default: null })
  @IsEnum(EventValidForTypes, { message: INVALID_TYPE })
  validFor: EventValidForTypes;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Price',
  })
  priceId: Types.ObjectId;

  @Prop([{ required: false, type: StateCity }])
  stateCity: StateCity[];

  @Prop({ type: Date, required: true })
  @IsDateString()
  applyDate: Date;

  @Prop([{ required: false, type: SubjectDetails }])
  subjects: SubjectDetails[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null })
  view: View;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
