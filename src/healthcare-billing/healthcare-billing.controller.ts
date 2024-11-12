import { Body, Controller, Post, Req, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { HealthcareBillingService } from './healthcare-billing.service';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA, ORDER_CREATED } from 'src/utills/messages';
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import * as fs from 'fs';
import { HospitalWalkInPaymentDto } from './dto/hospital-walkin-payment.dto';
import { VerifyHospitalPaymentDto } from './dto/verify-payment.dto';
import { PaymentHistoryDto } from './dto/payment-history.dto';
import {
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
  ApiQueriesForRangeDateFilter,
} from 'src/swagger.decorators';

@ApiBearerAuth()
@ApiTags('Healthcare Billing')
@Controller('healthcare-billing')
export class HealthcareBillingController {
  constructor(private healthcareBillingService: HealthcareBillingService) {}

  @Get('list')
  @ApiQueriesForPayment()
  @ApiQueriesForGetAll()
  async getAllPaymentDetails(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } =
      await this.healthcareBillingService.getAllPaymentDetails(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get('export')
  @ApiQueriesForRangeDateFilter()
  async exportPaymentList(@Query() query: ParsedQs, @Res() res): Promise<any> {
    const { data } = await this.healthcareBillingService.exportPaymentList(
      query,
    );
    // Send the Excel file as a response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=healthcare_finance_report.xlsx',
    );

    // Pipe the file stream to the response
    const fileStream = fs.createReadStream(data);
    fileStream.pipe(res);

    // Delete the temporary file after it has been sent
    fileStream.on('close', () => {
      fs.unlinkSync(data);
    });
  }

  @Post('placeOrder')
  async hospitalTransaction(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.healthcareBillingService.hospitalTransaction(
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

  @Post('verify-transaction')
  @ApiBody({ type: VerifyHospitalPaymentDto })
  async verifyHealthcareTransaction(
    @Body() payload: VerifyHospitalPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message =
      await this.healthcareBillingService.verifyHealthcareTransaction(
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

  @Post('manual-payment') //TODO - use in admin panel for manual hospital booking
  @ApiBody({ type: HospitalWalkInPaymentDto })
  async hospitalBooking(
    @Body() payload: HospitalWalkInPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { message } = await this.healthcareBillingService.hospitalBooking(
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

  @Post('history') //TODO - use in admin panel for payment history
  @ApiBody({ type: PaymentHistoryDto })
  async hospitalPaymenthistory(
    @Body() payload: PaymentHistoryDto,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.healthcareBillingService.hospitalPaymenthistory(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return result;
  }

  @Post('return-url')
  async getReturnUrl(@Req() req: Request, @Res() res: Response): Promise<void> {
    const orderId = req.body.order_id;
    const returnUrl = await this.healthcareBillingService.getReturnUrl(orderId);
    res.redirect(returnUrl);
  }
}
