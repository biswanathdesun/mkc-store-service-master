import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document, Types, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  role: string;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const RolesSchema = SchemaFactory.createForClass(Role);
