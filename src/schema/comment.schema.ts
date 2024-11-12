import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserType } from 'aws-sdk/clients/workdocs';
import { IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ default: null })
  @IsString()
  comment: string;

  @Prop({ type: Types.ObjectId, default: null, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  staffId: Types.ObjectId;

  @Prop({ type: String })
  userType: UserType;

  @Prop({ type: Types.ObjectId, default: null, ref: 'LiveClass' })
  streamId: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
