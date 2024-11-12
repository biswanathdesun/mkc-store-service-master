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
import { ParsedQs } from 'qs';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ResponseBody } from 'src/utills/responseBody';
import {
  CREATE_DATA,
  DELETE_DATA,
  FOUND_DATA,
  SUBMIT_TEST_SUCCESSFULLY,
  UNIQUE_CODE_VERIFIED,
  UPDATE_DATA,
} from 'src/utills/messages';
import {
  ApiQueriesForDate,
  ApiQueriesForGetAll,
  ApiQueriesTestStatus,
} from 'src/swagger.decorators';
import { CreateTestMasterDto } from './dto/create-test-master.dto';
import { TestMasterService } from './test-master.service';
import { UpdateTestMasterDto } from './dto/update-test-master.dto';
import { AssignQuestionDto } from './dto/assign-question.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { WrapUpTestDto } from './dto/wrap-up-test.dto';
import { ByOnlineCourseDto } from './dto/get-by-onlineCourse.dto';
import { GetTestMarksAndTimeDto } from './dto/get-marks-time.dto';
import { VerifyUniqueCodeDto } from './dto/verify-unique-code.dto';
import { GetQuestionDto } from './dto/get-question.dto';

@ApiBearerAuth()
@ApiTags('Test Master')
@Controller('test-master')
export class TestMasterController {
  constructor(private testMasterService: TestMasterService) {}

  @Post('create')
  @ApiBody({ type: CreateTestMasterDto })
  async createTestMaster(
    @Body() payload: CreateTestMasterDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testMasterService.createTestMaster(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Get()
  @ApiQueriesTestStatus()
  @ApiQueriesForDate()
  @ApiQueriesForGetAll()
  async getAllTestMaster(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.testMasterService.getAllTestMaster(
      query,
      req.body._valid.id,
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

  @Get('freeTest')
  @ApiQueriesForGetAll()
  async freeTestDetails(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.testMasterService.freeTestDetails(
      query,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('testQuestions/:id')
  async getTestQuestions(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const data = await this.testMasterService.getTestQuestions(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('testSeries/:id')
  async testMasterBySeriesById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const data = await this.testMasterService.testMasterBySeriesById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get(':id')
  async getTestMasterById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const test_master_details = await this.testMasterService.getTestMasterById(
      id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: test_master_details,
    };
    return result;
  }

  @Patch('update/:id')
  async updateTestMaster(
    @Param('id') id: string,
    @Body() payload: UpdateTestMasterDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testMasterService.updateTestMaster(
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
  async deleteTestMaster(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.testMasterService.deleteTestMaster(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('mapQuestions')
  @ApiBody({ type: AssignQuestionDto })
  async mapQuestionInTest(
    @Body() payload: AssignQuestionDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testMasterService.mapQuestionInTest(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Post('get-mapQuestions')
  @ApiBody({ type: UpdateStatusDto })
  async getMapedQuestionInTest(
    @Body() payload: UpdateStatusDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testMasterService.getMapedQuestionInTest(
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

  @Post('updateStatus')
  @ApiBody({ type: UpdateStatusDto })
  async updateStatus(
    @Body() payload: UpdateStatusDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.testMasterService.updateStatus(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }

  @Post('wrapUpTest')
  @ApiBody({ type: WrapUpTestDto })
  async wrapUpTest(
    @Body() payload: WrapUpTestDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.testMasterService.wrapUpTest(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: SUBMIT_TEST_SUCCESSFULLY,
    };
    return result;
  }

  @Post('byOnlineCourse')
  async getByOnlineCourse(
    @Body() payload: ByOnlineCourseDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testMasterService.getByOnlineCourse(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('marks-and-time')
  @ApiBody({ type: GetTestMarksAndTimeDto })
  async getTestMarksAndTime(
    @Body() payload: GetTestMarksAndTimeDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testMasterService.getTestMarksAndTime(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('verify-unique-code')
  @ApiBody({ type: VerifyUniqueCodeDto })
  async verifyUniqueCode(
    @Body() payload: VerifyUniqueCodeDto,
  ): Promise<ResponseBody> {
    await this.testMasterService.verifyUniqueCode(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UNIQUE_CODE_VERIFIED,
    };
    return result;
  }

  @Post('preview-questions')
  @ApiBody({ type: GetQuestionDto })
  async previewQuestiondetails(
    @Body() payload: GetQuestionDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testMasterService.previewQuestiondetails(
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

  @Post('languages')
  @ApiBody({ type: GetTestMarksAndTimeDto })
  async getTestlanguages(
    @Body() payload: GetTestMarksAndTimeDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testMasterService.getTestlanguages(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }
}
