import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  streamId: string;

  @IsNotEmpty()
  @IsString()
  userType: string;

  @IsNotEmpty()
  @IsString()
  staffId: string;
}
