import { Body, Controller, Param } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/createcomment.dto';
import { ResponseBody } from 'src/utills/responseBody';
import { CREATE_DATA, FOUND_DATA } from 'src/utills/messages';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  async create(@Body() payload: CreateCommentDto): Promise<ResponseBody> {
    const data = await this.commentService.createComment(payload);

    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
      data: data,
    };

    return result;
  }

  async getAll(@Param('streamId') streamId: string): Promise<ResponseBody> {
    const data = await this.commentService.findAll(streamId);

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: data,
    };

    return result;
  }
}
