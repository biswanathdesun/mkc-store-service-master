import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { LiveConsultingService } from './live-consulting.service';
import { CreateLiveConsultingDto } from './dto/create-live-consulting.dto';
import { ResponseBody } from 'src/utills/responseBody';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import {
  CREATE_DATA,
  DELETE_DATA,
  FOUND_DATA,
  UPDATE_DATA,
} from 'src/utills/messages';
import {
  ApiQueriesDoctor,
  ApiQueriesForGetAll,
  ApiQueriesForRangeDateFilter,
} from 'src/swagger.decorators';
import { UpdateLiveConsultingDto } from './dto/update-live-consulting.dto';
import { UpdateLiveConsultingStatusDto } from './dto/update-live-status.dto';

@ApiBearerAuth()
@ApiTags('Live consulting')
@Controller('live-consulting')
export class LiveConsultingController {
  constructor(private liveConsultingService: LiveConsultingService) {}

  @Post('create')
  @ApiBody({ type: CreateLiveConsultingDto })
  async createLiveConsulting(
    @Body() payload: CreateLiveConsultingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.liveConsultingService.createLiveConsulting(
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

  @Get()
  @ApiQueriesDoctor()
  @ApiQueriesForRangeDateFilter()
  @ApiQueriesForGetAll()
  async getAllLiveConsultation(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.liveConsultingService.getAllLiveConsultation(query);

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
  async getLiveConsultanceById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const liveClass = await this.liveConsultingService.getLiveConsultanceById(
      id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: liveClass,
    };
    return result;
  }

  @Patch('update/:id')
  @ApiBody({ type: UpdateLiveConsultingDto })
  async updateLiveConsultation(
    @Param('id') id: string,
    @Body() payload: UpdateLiveConsultingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.liveConsultingService.updateLiveConsultation(
      id,
      payload,
      req?.body?._valid?.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Delete('delete/:id')
  async deleteLiveConsultation(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.liveConsultingService.deleteLiveConsultation(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('patient')
  async getPatientList(): Promise<ResponseBody> {
    const { data } = await this.liveConsultingService.getPatientList();

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('student') //TODO: for web and mobile
  async liveConsultationOfPatient(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.liveConsultingService.liveConsultationOfPatient(
      req?.body?._valid?.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Patch('update-status')
  @ApiBody({ type: UpdateLiveConsultingStatusDto })
  async updateLiveClassStatus(
    @Body() payload: UpdateLiveConsultingStatusDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.liveConsultingService.updateLiveConsultingStatus(
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
}
