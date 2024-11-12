import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import * as fs from 'fs';
import { Controller, Post, Body, Req, Res, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { HostelHubPayService } from './hostel-hub-pay.service';
import { ResponseBody } from 'src/utills/responseBody';
import { HostelManualBookingDto } from './dto/hostel-book-admin.dto';
import { SecurityRefundOrDepositeDto } from './dto/security-refund.dto';
import { FOUND_DATA, ORDER_CREATED } from 'src/utills/messages';
import { GetSecurityAmount } from './dto/get-security-amount.sto';
import { VerifyHostelPaymentDto } from './dto/verify-hostel-payment.dto';
import { ChangeHostelInfoDto } from './dto/change-hostel.dto';
import { HostelExistingManualBookingDto } from './dto/manual-existing-booking.dto';
import {
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
  ApiQueriesForRangeDateFilter,
} from 'src/swagger.decorators';

@ApiBearerAuth()
@ApiTags('Hostel Hub Pay')
@Controller('hostel-hub-pay')
export class HostelHubPayController {
  constructor(private hostelHubPayService: HostelHubPayService) {}

  @Get('list')
  @ApiQueriesForPayment()
  @ApiQueriesForGetAll()
  async getAllHostelPayment(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.hostelHubPayService.getAllHostelPayment(
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

  @Get('finance-report')
  @ApiQueriesForRangeDateFilter()
  async exportPaymentDetails(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<any> {
    const { data } = await this.hostelHubPayService.exportPaymentDetails(query);
    // Send the Excel file as a response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=finance_report.xlsx',
    );

    // Pipe the file stream to the response
    const fileStream = fs.createReadStream(data);
    fileStream.pipe(res);

    // Delete the temporary file after it has been sent
    fileStream.on('close', () => {
      fs.unlinkSync(data);
    });
  }

  @Post('admin') //TODO - use in admin panel for manual hostel booking
  @ApiBody({ type: HostelManualBookingDto })
  async hostelBookingfromAdmin(
    @Body() payload: HostelManualBookingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { message } = await this.hostelHubPayService.hostelBookingfromAdmin(
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

  @Post('get-security-amount')
  @ApiBody({ type: GetSecurityAmount })
  async getSecurityAmountForUser(
    @Body() payload: GetSecurityAmount,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelHubPayService.getSecurityAmountForUser(
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

  @Post('security-refund')
  @ApiBody({ type: SecurityRefundOrDepositeDto })
  async securityRefundForUser(
    @Body() payload: SecurityRefundOrDepositeDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.hostelHubPayService.securityRefundForUser(
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

  @Post('checkout')
  async hostelTransaction(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.hostelHubPayService.hostelTransaction(
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

  @Post('confirm-transaction')
  @ApiBody({ type: VerifyHostelPaymentDto })
  async transactionValidation(
    @Body() payload: VerifyHostelPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.hostelHubPayService.transactionValidation(
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

  @Post('return-url')
  async getHostelReturnUrl(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const orderId = req.body.order_id;
    const returnUrl = await this.hostelHubPayService.getHostelReturnUrl(
      orderId,
    );
    res.redirect(returnUrl);
  }

  @Post('modify-hostel')
  @ApiBody({ type: ChangeHostelInfoDto })
  async modifyHostelInfo(
    @Body() payload: ChangeHostelInfoDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.hostelHubPayService.modifyHostelInfo(
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

  @Post('admin-existing') //TODO - use in admin panel for manual hostel existing booking
  @ApiBody({ type: HostelExistingManualBookingDto })
  async hostelExistingBookingfromAdmin(
    @Body() payload: HostelExistingManualBookingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { message } =
      await this.hostelHubPayService.hostelExistingBookingfromAdmin(
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
}
