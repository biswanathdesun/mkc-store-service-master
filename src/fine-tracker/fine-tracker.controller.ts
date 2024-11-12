import { Controller, Post, Body, Req } from '@nestjs/common';
import { FineTrackerService } from './fine-tracker.service';
import { ResponseBody } from 'src/utills/responseBody';
import {
  FOUND_DATA,
  ORDER_CREATED,
  PAYMENT_SUCCESS,
} from 'src/utills/messages';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { FineHistoryDto } from './dto/fine-history.dto';
import { CreateFineOrderDto } from './dto/create-fine-order.dto';
import { VerifyFinePaymentDto } from './dto/verify-fine-payment.dto';

@ApiBearerAuth()
@ApiTags('Fine Tracker')
@Controller('fine-tracker')
export class FineTrackerController {
  constructor(private fineTrackerService: FineTrackerService) {}

  @Post('history')
  @ApiBody({ type: FineHistoryDto })
  async fineHistory(
    @Body() payload: FineHistoryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.fineTrackerService.fineHistory(
      payload,
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

  @Post('create-order')
  @ApiBody({ type: CreateFineOrderDto })
  async createOrderForFine(
    @Body() payload: CreateFineOrderDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.fineTrackerService.createOrderForFine(
      payload,
      req.body._valid.id,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: ORDER_CREATED,
      data,
    };

    return result;
  }

  @Post('verify-payment')
  @ApiBody({ type: VerifyFinePaymentDto })
  async verifyPaymentForFine(
    @Body() payload: VerifyFinePaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.fineTrackerService.verifyPaymentForFine(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: PAYMENT_SUCCESS,
    };
    return result;
  }
}
