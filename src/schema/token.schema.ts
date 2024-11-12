import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsDate, IsEmail, IsEnum, IsString } from 'class-validator';
import { UserType } from 'src/utills/enum';
import { INVALID_USER_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ default: null, required: false })
  @IsEmail()
  email: string;

  @Prop({ default: null, required: false, type: String })
  phone: string;

  @Prop({ default: null, required: false, type: String })
  userId: string;

  @Prop({ default: null, required: false, type: String })
  studentId: string;

  @Prop({ default: null, required: false })
  @IsEnum(UserType, { message: INVALID_USER_TYPE })
  userType: UserType;

  @Prop({ required: true })
  @IsString()
  token: string;

  @Prop({ default: null, type: Date })
  @IsDate()
  expiryTime: Date;

  @Prop({ default: true })
  status: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
