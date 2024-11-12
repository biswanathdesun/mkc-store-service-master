import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { Subject } from './subject.schema';

@Schema({
  timestamps: true,
})
export class Topic extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  subjectId: Subject['_id'];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Chapter' })
  @IsNotEmpty()
  chapterId: Subject['_id'];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
