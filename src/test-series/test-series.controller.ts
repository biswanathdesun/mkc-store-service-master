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
import { TestSeriesService } from './test-series.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ResponseBody } from 'src/utills/responseBody';
import {
  CREATE_DATA,
  DELETE_DATA,
  FOUND_DATA,
  UPDATE_DATA,
} from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { CreateTestSeriesDto } from './dto/create-test-series.dto';
import { UpdateTestSeriesDto } from './dto/update-test-series.dto';
import { AssignTestMasterDto } from './dto/assign-test-master.dto';
import { AddTestSeriesSeoTagDto } from './dto/add-test-seo-tags.dto';
import { GetTestSeoTagDto } from './dto/get-test-tags.dto';

@ApiBearerAuth()
@ApiTags('Test Series')
@Controller('test-series')
export class TestSeriesController {
  constructor(private testSeriesService: TestSeriesService) {}

  @Post('create')
  @ApiBody({ type: CreateTestSeriesDto })
  async createTestSeries(
    @Body() payload: CreateTestSeriesDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testSeriesService.createTestSeries(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Get()
  @ApiQueriesForGetAll()
  async getAllTestSeries(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.testSeriesService.getAllTestSeries(
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

  @Get('assignedTest/:id')
  async assignedTestById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const data = await this.testSeriesService.assignedTestById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get(':id')
  async getTestSeriesById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const test_series_details = await this.testSeriesService.getTestSeriesById(
      id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: test_series_details,
    };
    return result;
  }

  @Patch('update/:id')
  async updateTestSeries(
    @Param('id') id: string,
    @Body() payload: UpdateTestSeriesDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testSeriesService.updateTestSeries(
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
  async deleteTestSeries(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.testSeriesService.deleteTestSeries(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('mapTestMaster')
  @ApiBody({ type: AssignTestMasterDto })
  async mapTestMasterInTestSeries(
    @Body() payload: AssignTestMasterDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testSeriesService.mapTestMasterInTestSeries(
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

  @Post('addSeoTags')
  @ApiBody({ type: AddTestSeriesSeoTagDto })
  async setTestSeriesSeoTags(
    @Body() payload: AddTestSeriesSeoTagDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testSeriesService.setTestSeriesSeoTags(
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

  @Post('tag-details')
  @ApiBody({ type: GetTestSeoTagDto })
  async getTestTagDetails(
    @Body() payload: GetTestSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testSeriesService.getTestTagDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }
}
