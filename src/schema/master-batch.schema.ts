import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty } from 'class-validator';
import { Batch } from './batch.schema';

@Schema({ timestamps: true })
export class MasterBatch extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Batch' }],
  })
  @IsNotEmpty()
  batchIds: Batch['_id'][];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const MasterBatchSchema = SchemaFactory.createForClass(MasterBatch);
