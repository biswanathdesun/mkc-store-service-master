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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CourseLibraryService } from './course-library.service';
import { CreateCourseLibraryDto } from './dto/create-online-library.dto';
import { ResponseBody } from 'src/utills/responseBody';
import { Request } from 'express';
import { CREATE_DATA, FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import {
  ApiQueriesForCourseLibrary,
  ApiQueriesForGetAll,
} from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { UpdateCourseLibraryDto } from './dto/update-online-library.dto';
import { UpdateConvertStatusDto } from './dto/update-convert-status.dto';
import { RetryConversionDto } from './dto/retry-conversion.dto';

@ApiBearerAuth()
@ApiTags('Online Course library')
@Controller('course-library')
export class CourseLibraryController {
  constructor(private courseLibraryService: CourseLibraryService) {}

  @Post('create')
  @ApiBody({ type: CreateCourseLibraryDto })
  async createLibrary(
    @Body() payload: CreateCourseLibraryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.courseLibraryService.createLibrary(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Post('retry-converter/:id/:rowId')
  @ApiBody({ type: RetryConversionDto })
  async retryConverter(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() payload: RetryConversionDto,
  ): Promise<ResponseBody> {
    await this.courseLibraryService.retryConversion(id, rowId, payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Get()
  @ApiQueriesForGetAll()
  @ApiQueriesForCourseLibrary()
  async getAllCourseLibraries(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } =
      await this.courseLibraryService.getAllCourseLibraries(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get(':id')
  async getCourseLibraryById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const data = await this.courseLibraryService.getCourseLibraryById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Patch('update/:id')
  async updateCourseLibrary(
    @Param('id') id: string,
    @Body() payload: UpdateCourseLibraryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.courseLibraryService.updateCourseLibrary(
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

  @Patch('update-converted-status')
  async updateConvertedStatus(
    @Body() payload: UpdateConvertStatusDto,
  ): Promise<ResponseBody> {
    await this.courseLibraryService.updateConvertedStatus(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Delete('delete/:id')
  async deleteCourseLibrary(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const message = await this.courseLibraryService.deleteCourseLibrary(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };

    return result;
  }
}
