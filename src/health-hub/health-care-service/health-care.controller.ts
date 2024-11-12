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
import { HealthCareService } from './health-care.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import { CreateHealthCareDto } from './dto/create-health-care.dto';
import { UpdateHealthCareDto } from './dto/update-health-care.dto';
import { GetServiceBasedOnUserDto } from './dto/get-service-for-payment.dto';

@ApiBearerAuth()
@ApiTags('Health Care Service')
@Controller('health-care')
export class HealthCareController {
  constructor(private healthCareService: HealthCareService) {}

  //SECTION - to get all health care in admin
  @Get()
  @ApiQueriesForGetAll()
  async getAllHealthCares(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.healthCareService.getAllHealthCares(
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

  //SECTION - to get all health care for web and mobile
  @Get('student')
  async getAllHealthCaresStudent(): Promise<ResponseBody> {
    const { data } = await this.healthCareService.getAllHealthCaresStudent();
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  // SECTION - to get health care by id
  @Get(':id')
  async healthCareById(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.healthCareService.healthCareById(id);
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  //SECTION - create a new hospital service
  @Post('create')
  @ApiBody({ type: CreateHealthCareDto })
  async createHealthCare(
    @Body() payload: CreateHealthCareDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.healthCareService.createHealthCare(
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

  //SECTION - update hospital service by id
  @Patch('update/:id')
  @ApiBody({ type: UpdateHealthCareDto })
  async updateHealthCare(
    @Param('id') id: string,
    @Body() payload: UpdateHealthCareDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.healthCareService.updateHealthCare(
      id,
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

  //SECTION - delete hostel by id
  @Delete('delete/:id')
  async deleteHealthCare(@Param('id') id: string): Promise<ResponseBody> {
    const message = await this.healthCareService.deleteHealthCare(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }

  //SECTION - get all health care service in admin payment
  @Post('payment')
  @ApiBody({ type: GetServiceBasedOnUserDto })
  async serviceForPayment(
    @Body() payload: GetServiceBasedOnUserDto,
  ): Promise<ResponseBody> {
    const { data } = await this.healthCareService.serviceForPayment(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }
}
