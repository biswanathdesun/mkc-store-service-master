import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { OnlineCourseService } from './online-course.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateOnlineCourseDto } from './dto/create-online-course.dto';
import { Request, Response } from 'express';
import { ResponseBody } from 'src/utills/responseBody';
import {
  CREATE_DATA,
  DELETE_DATA,
  FOUND_DATA,
  UPDATE_DATA,
} from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { UpdateOnlineCourseDto } from './dto/update-online-course.dto';
import {
  ApiQueriesForExistingPaymnet,
  ApiQueriesForGetAll,
  ApiQueriesProducts,
} from 'src/swagger.decorators';
import { OnlineCourseByUserId } from './dto/course-by-userId.dto';
import { AddSeoTagDto } from './dto/add-seo-tags.dto';
import { GetSeoTagDto } from './dto/get-tags.dto';
import { PreeBookUserCourseDetailsDto } from './dto/pree-book-user-course.dto';
import { GetCourseBatchDto } from './dto/get-batch-by-course.dto';
import { AddItemInCourseDto } from './dto/add-inventory-item.dto';
import { GetCourseItemReportDto } from './dto/course-item-report.dto';

@ApiBearerAuth()
@ApiTags('Online Course')
@Controller('online-course')
export class OnlineCourseController {
  constructor(private onlineCourseService: OnlineCourseService) {}

  @Post('create')
  @ApiBody({ type: CreateOnlineCourseDto })
  async createOnlineCourses(
    @Body() payload: CreateOnlineCourseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.onlineCourseService.createOnlineCourses(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Post('purchase-by-user') //TODO - get pr book user purchase course details
  @ApiBody({ type: PreeBookUserCourseDetailsDto })
  async getPurchaseCourseDetails(
    @Body() payload: PreeBookUserCourseDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.getPurchaseCourseDetails(
      payload,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('tag-details')
  @ApiBody({ type: GetSeoTagDto })
  async getTagDetails(@Body() payload: GetSeoTagDto): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.getTagDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('addSeoTags')
  @ApiBody({ type: AddSeoTagDto })
  async addSeoTags(
    @Body() payload: AddSeoTagDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.onlineCourseService.addSeoTags(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Post('courseByStudentId')
  @ApiBody({ type: OnlineCourseByUserId })
  async courseByStudentId(
    @Body() payload: OnlineCourseByUserId,
  ): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.courseByStudentId(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
      data,
    };
    return result;
  }

  @Post('batch')
  @ApiBody({ type: GetCourseBatchDto })
  async courseBatchDetailsById(
    @Body() payload: GetCourseBatchDto,
  ): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.courseBatchDetailsById(
      payload,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
      data,
    };
    return result;
  }

  @Get()
  @ApiQueriesProducts()
  @ApiQueriesForGetAll()
  async getAllOnlineCourses(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.onlineCourseService.getAllOnlineCourses(
      query,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get('changableCourse')
  @ApiQueriesProducts()
  async getChangableCourses(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.getChangableCourses(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('updateProductDetails')
  async updateProductDetails(@Res() res: Response): Promise<void> {
    res.status(200).json({ statusCode: 200, message: UPDATE_DATA });

    try {
      await this.onlineCourseService.updateProductDetails();
    } catch (error) {
      return error.message;
    }
  }

  @Get('courseForOfflinePayment')
  @ApiQueriesForExistingPaymnet()
  async courseForOfflinePayment(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.courseForOfflinePayment(
      query,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Get(':id')
  async getOnlineCourseById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const online_course_details =
      await this.onlineCourseService.getOnlineCourseById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: online_course_details,
    };
    return result;
  }

  @Patch('update/:id')
  async updateOnlineCourse(
    @Param('id') id: string,
    @Body() payload: UpdateOnlineCourseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.onlineCourseService.updateOnlineCourse(
      id,
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Delete('delete/:id')
  async deleteOnlineCourse(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.onlineCourseService.deleteOnlineCourse(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('update-items')
  @ApiBody({ type: AddItemInCourseDto })
  async updateInventoryItems(
    @Body() payload: AddItemInCourseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.onlineCourseService.updateInventoryItems(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Post('fetch-items')
  @ApiBody({ type: GetSeoTagDto })
  async fetchCourseInventoryItems(
    @Body() payload: GetSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.onlineCourseService.fetchCourseInventoryItems(
      payload,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('item-stock-report')
  @ApiBody({ type: GetCourseItemReportDto })
  async fetchCourseInventoryItemsStockreport(
    @Body() payload: GetCourseItemReportDto,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.onlineCourseService.fetchCourseInventoryItemsStockreport(
        payload,
      );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }
}
