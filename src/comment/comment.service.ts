import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Comment } from 'src/schema/comment.schema';
import { CreateCommentDto } from './dto/createcomment.dto';
import { INVALID_ID } from 'src/utills/messages';
import { CommonService } from 'src/utills/commonService';
import { User } from 'src/schema/user.schema';
import { Staff } from 'src/schema/staff.schema';
import { LiveClass } from 'src/schema/liveClass.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentSchema: Model<Comment>,
    private readonly commonService: CommonService,
    @InjectModel(User.name) private readonly userSchema: Model<User>,
    @InjectModel(Staff.name) private readonly staffSchema: Model<Staff>,
    @InjectModel(LiveClass.name) private readonly liveSchema: Model<LiveClass>,
  ) {}

  //SECTION: Adding a comment to the database.
  async createComment(payload: CreateCommentDto): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { comment, userId, streamId, userType, staffId } = payload;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(streamId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const data = await this.commentSchema.create({
      comment,
      userId,
      streamId,
      userType,
    });

    return data;
  }

  //SECTION: Function to find all the comments.
  async findAll(streamId: string): Promise<any> {
    if (mongoose.isValidObjectId(streamId)) {
      const data = await this.commentSchema.find({
        streamId: streamId,
      });

      await Promise.all(
        data?.map(async (item: any) => {
          const user = await this.userSchema.findById(item.userId);

          if (!user) {
            item.userId = await this.staffSchema.findById(item.userId);
          } else {
            item.userId = user;
          }
          if (item?.userId?.image != null) {
            // Getting signed url of a s3 object
            item.userId.image = await this.commonService.getSignedUrl(
              item?.userId?.image,
            );
          }
        }),
      );
      return data;
    }
  }

  //SECTION: Finding details of a single user
  async findUser(id: string): Promise<any> {
    if (mongoose.isValidObjectId(id)) {
      let data = await this.userSchema.findById(id);

      if (!data) {
        data = await this.staffSchema.findById(id);
      }

      if (data?.image != null) {
        // Getting signed url of a s3 object
        data.image = await this.commonService.getSignedUrl(data?.image);
      }

      return data;
    }
  }

  // NOTE: Update total viewers count in live class
  async updateViewerCount(streamId: string, count: number): Promise<any> {
    if (mongoose.isValidObjectId(streamId)) {
      const liveClass = await this.liveSchema.findByIdAndUpdate(
        streamId,
        { $inc: { viewerCount: count } },
        { returnDocument: 'after' },
      );
      // if (liveClass) {
      //   liveClass.totalViewers += count;
      const viewers = liveClass.totalViewers;
      if (viewers >= 0) {
        // await liveClass.save();
        return viewers;
      } else {
        return 0;
      }
      // }
    }
  }
}
