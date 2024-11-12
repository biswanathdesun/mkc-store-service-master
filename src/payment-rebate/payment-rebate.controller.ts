import { ParsedQs } from 'qs';
import { Request } from 'express';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PaymentRebateService } from './payment-rebate.service';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { PaymentRebateDto } from './dto/payment-rebate.dto';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';

@ApiBearerAuth()
@ApiTags('Payment Rebate')
@Controller('payment-rebate')
export class PaymentRebateController {
  constructor(private paymnetRebateService: PaymentRebateService) {}

  @Get('paymentDetails/:id')
  async paymentDetails(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const { data } = await this.paymnetRebateService.paymentDetails(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('payment-discount')
  @ApiBody({ type: PaymentRebateDto })
  async applyDiscount(
    @Body() payload: PaymentRebateDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.paymnetRebateService.applyDiscount(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: msg,
    };
    return result;
  }

  @Get('rebate-details')
  @ApiQueriesForGetAll()
  async getAllRebateDetails(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.paymnetRebateService.getAllRebateDetails(
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
}
