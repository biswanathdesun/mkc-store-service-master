import { Body, Controller, Get, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HealthCareDefaulterService } from './health-care-defaulter.service';
import { ApiQueriesForGetAll, ApiQueriesForType } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { ResponseBody } from 'src/utills/responseBody';
import { Request } from 'express';
import { FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import { HealthcareExtendDateDto } from './dto/healthcare-extend-payment-date.dto';

@ApiBearerAuth()
@ApiTags('Healthcare Defaulter')
@Controller('health-care-defaulter')
export class HealthCareDefaulterController {
  constructor(private healthCareDefaulterService: HealthCareDefaulterService) {}

  @Get('prebook')
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async healthcarePrebookDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.healthCareDefaulterService.healthcarePrebookDefaulters(
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

  @Get('admitted')
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async healthcareAdmittedDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.healthCareDefaulterService.healthcareAdmittedDefaulters(
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

  @Get('closed')
  @ApiQueriesForGetAll()
  async getClosedDefaulters(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.healthCareDefaulterService.healthcareClosedDefaulters(
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

  @Patch('extend-date')
  async healthcareExtendPaymentDate(
    @Body() payload: HealthcareExtendDateDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.healthCareDefaulterService.healthcareExtendPaymentDate(
      payload,
      req.body._valid.id,
    );

    const response: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return response;
  }
}
