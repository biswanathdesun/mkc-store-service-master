import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ScoreBoard extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mode: string;

  @Prop({ required: true })
  plus: string;

  @Prop({ required: true })
  minus: string;

  @Prop({ required: true })
  bonus: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const ScoreBoardSchema = SchemaFactory.createForClass(ScoreBoard);
