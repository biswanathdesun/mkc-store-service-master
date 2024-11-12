import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from 'src/schema/comment.schema';
import { CommonService } from 'src/utills/commonService';
import { User, UserSchema } from 'src/schema/user.schema';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { LiveClass, LiveClassSchema } from 'src/schema/liveClass.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: LiveClass.name, schema: LiveClassSchema },
    ]),
  ],
  controllers: [CommentController],
  providers: [CommentService, CommonService],
})
export class CommentModule {}
