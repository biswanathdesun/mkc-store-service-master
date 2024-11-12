import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  Body,
  Patch,
  Post,
} from '@nestjs/common';
import { ParsedQs } from 'qs';
import { FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import { ResponseBody } from 'src/utills/responseBody';
import { DefaultersService } from './defaulters.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ExtendPaymentDateDto } from './dto/extend-payment-date.dto';
import { Request } from 'express';
import {
  ApiQueriesForGetAll,
  ApiQueriesForType,
  ApiQueriesUser,
} from 'src/swagger.decorators';
import { AddRemarkDto } from './dto/add-remark.dto';
import { DroppedRemarkDto } from './dto/drop-remark.dto';

@ApiBearerAuth()
@ApiTags('Defaulters')
@Controller('defaulters')
export class DefaultersController {
  constructor(private defaultersService: DefaultersService) {}

  @Get('prebook-defaulters')
  @ApiQueriesUser()
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async getPrebookDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.defaultersService.getPrebookDefaulters(
      query,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return response;
  }

  @Get('admitted-defaulters')
  @ApiQueriesUser()
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async getAdmittedDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.defaultersService.getAdmittedDefaulters(
      query,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
      count,
    };

    return response;
  }

  @Get('closed-defaulters')
  @ApiQueriesForGetAll()
  async getClosedDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.defaultersService.getClosedDefaulters(
      query,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
      count,
    };

    return response;
  }

  @Get('dropped-students')
  @ApiQueriesForGetAll()
  async getDroppedStudents(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.defaultersService.getDroppedStudents(
      query,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
      count,
    };

    return response;
  }

  @Patch('add-extended-date/:id')
  async addExtendedDate(
    @Param('id') id: string,
    @Body() payload: ExtendPaymentDateDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.defaultersService.extendPaymentDate(
      id,
      payload,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
      data,
    };

    return response;
  }

  @Post('addRemark')
  async addRemark(
    @Body() payload: AddRemarkDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.defaultersService.addRemark(
      payload,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
      data,
    };

    return response;
  }

  @Patch('drop-student/:id')
  @ApiBody({ type: DroppedRemarkDto })
  async dropStudent(
    @Param('id') id: string,
    @Body() payload: DroppedRemarkDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.defaultersService.dropStudent(
      id,
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const response: ResponseBody = {
      statusCode: 200,
      message,
    };

    return response;
  }

  @Post('timeline-update')
  async timelineUpdate(): Promise<ResponseBody> {
    await this.defaultersService.timelineUpdate();

    //NOTE - push final data
    const response: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return response;
  }
}
