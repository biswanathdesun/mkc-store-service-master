import {
  Controller,
  Post,
  Req,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Res,
} from '@nestjs/common';
import * as fs from 'fs';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { Request } from 'express';
import { ResponseBody } from 'src/utills/responseBody';
import {
  FOUND_DATA,
  MISCELLANEOUS_PAYMENT_SUCCESS,
  ORDER_CREATED,
  PAYMENT_CREATED,
  PAYMENT_SUCCESS,
  PURCHASE_COURSE_UPDATED,
  RECEIPT_GENERATED,
  UPDATE_DATA,
} from 'src/utills/messages';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import {
  ApiQueriesForRangeDateFilter,
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
  ApiQueriesForReceipt,
} from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { OfflinePaymentDto } from './dto/create-payment.dto';
import { CoursePaymentHistoryDto } from './dto/offline-payment-history.dto';
import { OfflineCourseOrderDto } from './dto/create-offline-course-order.dto';
import { MiscellaneousPaymentDto } from './dto/miscellaneous-payment.dto';
import { GetStudentOfflineCourseDto } from './dto/student-offline-course.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CreateCourseChangeDto } from './dto/create-course-change.dto';
import { ConvertStudentDto } from './dto/convert-student.dto';
import { PreBookStudentCourseChangeDto } from './dto/pre-book-course-change.dto';
import { UpdateReceiptNumberDto } from './dto/updateReceiptNumber.dto';
import { UpdatePaymentDetailsDto } from './dto/update-payment.dto';
import { SalesPaymentDto } from './dto/sales-order.dto';
import { ManualOrderReportDto } from './dto/manual-order-report.dto';

@ApiBearerAuth()
@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  @ApiQueriesForPayment()
  @ApiQueriesForGetAll()
  async getAllPayment(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.paymentService.getAllPayment(query);

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
  @ApiBody({ type: CreateOrderDto })
  async createOrder(
    @Body() payload: CreateOrderDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.paymentService.createOrder(
      payload,
      req.body._valid.id,
    );

    //NOTE: Initialize the message to "ORDER_CREATED" by default
    let message = ORDER_CREATED;

    //NOTE : Check if data is 0, then update the message
    if (data === 0) {
      message = PAYMENT_SUCCESS;
    }
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };

    //NOTE: Include data if it's not 0
    if (data !== 0) {
      result.data = data;
    }

    return result;
  }

  @Post('verify-payment')
  @ApiBody({ type: VerifyPaymentDto })
  async verifyPayment(
    @Body() payload: VerifyPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.paymentService.verifyPayment(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: msg === PAYMENT_SUCCESS ? 200 : 400,
      message: msg,
    };
    return result;
  }

  @Post('offline-payment')
  @ApiBody({ type: OfflinePaymentDto })
  async offlinePayment(
    @Body() payload: OfflinePaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.paymentService.offlinePayment(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: PAYMENT_CREATED,
    };

    return result;
  }

  @Post('receipt-payment')
  @ApiQueriesForReceipt()
  async generateRecipt(@Query() query: ParsedQs): Promise<ResponseBody> {
    const data = await this.paymentService.generateRecipt(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: RECEIPT_GENERATED,
      data: data,
    };

    return result;
  }

  @Get('user-payment-history')
  @ApiQueriesForGetAll()
  async userPaymentList(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.paymentService.userPaymentList(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return result;
  }

  @Get('download-payment')
  @ApiQueriesForRangeDateFilter()
  async downloadPaymentDetails(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<any> {
    const { data } = await this.paymentService.downloadPaymentDetails(query);
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

  @Post('user-miscellaneous-payment')
  async getMiscellaneousPayment(
    @Body() payload: GetStudentOfflineCourseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } = await this.paymentService.getMiscellaneousPayment(
      payload,
      req.body._valid.id,
      req.body._valid.userType,
      req.body._valid.studentId,
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

  @Post('offline-payment-history')
  async offlinePaymentHistory(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.paymentService.offlinePaymentHistory(
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Post('offline-payment-details')
  @ApiBody({ type: CoursePaymentHistoryDto })
  async offlinePaymentDetails(
    @Body() payload: CoursePaymentHistoryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.paymentService.offlinePaymentDetails(
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Post('offline-course-order')
  @ApiBody({ type: OfflineCourseOrderDto })
  async offlineCourseOrder(
    @Body() payload: OfflineCourseOrderDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.paymentService.offlineCourseOrder(
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE: Initialize the message to "ORDER_CREATED" by default
    let message = ORDER_CREATED;

    //NOTE : Check if data is 0, then update the message
    if (data === 0) {
      message = PAYMENT_SUCCESS;
    }
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };

    //NOTE: Include data if it's not 0
    if (data !== 0) {
      result.data = data;
    }

    return result;
  }

  @Post('offline-verify-payment')
  @ApiBody({ type: VerifyPaymentDto })
  async offlineVerifyPayment(
    @Body() payload: VerifyPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.paymentService.offlineVerifyPayment(
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: msg === PAYMENT_SUCCESS ? 200 : 400,
      message: msg,
    };
    return result;
  }

  @Post('miscellaneous-payment')
  @ApiBody({ type: MiscellaneousPaymentDto })
  async miscellaneousPayment(
    @Body() payload: MiscellaneousPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.paymentService.miscellaneousPayment(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: MISCELLANEOUS_PAYMENT_SUCCESS,
    };
    return result;
  }

  @Post('course-change')
  @ApiBody({ type: CreateCourseChangeDto })
  async studentCourseChange(
    @Body() payload: CreateCourseChangeDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.paymentService.studentCourseChange(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: data,
    };
    return result;
  }

  @Patch('updateStatus/:id')
  @ApiBody({ type: UpdatePaymentStatusDto })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() payload: UpdatePaymentStatusDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.paymentService.updatePaymentStatus(
      id,
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

  @Post('users-with-installments')
  async getUsersHaveInstallment(): Promise<ResponseBody> {
    const { data } = await this.paymentService.getUsersHaveInstallment();

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Get('courses/:id')
  async getPurchasedCourseByUser(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const data = await this.paymentService.getPurchasedCourseByUser(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('studentConvertor')
  @ApiBody({ type: ConvertStudentDto })
  async studentConvertor(
    @Body() payload: ConvertStudentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const response = await this.paymentService.studentConvertor(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: response,
    };

    return result;
  }

  @Post('confirmCourseChange')
  @ApiBody({ type: PreBookStudentCourseChangeDto })
  async preBookCourseChange(
    @Body() payload: PreBookStudentCourseChangeDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.paymentService.preBookCourseChange(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: PURCHASE_COURSE_UPDATED,
    };

    return result;
  }

  @Post('update-receipt-number')
  @ApiBody({ type: UpdateReceiptNumberDto })
  async updateReceiptNumber(
    @Body() payload: UpdateReceiptNumberDto,
  ): Promise<ResponseBody> {
    const data = await this.paymentService.updateReceiptNumber(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Patch('update-payment')
  @ApiBody({ type: UpdatePaymentDetailsDto })
  async updatePaymentDetails(
    @Body() payload: UpdatePaymentDetailsDto,
  ): Promise<ResponseBody> {
    await this.paymentService.updatePaymentDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Post('sales-payment')
  @ApiBody({ type: SalesPaymentDto })
  async salesPayment(
    @Body() payload: SalesPaymentDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.paymentService.salesPayment(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: PAYMENT_SUCCESS,
    };

    return result;
  }

  @Get('manual-order-report-export')
  @ApiQueriesForRangeDateFilter()
  async generateManualOrderReportPdf(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<ResponseBody> {
    const pdfBuffer = await this.paymentService.generateManualOrderReportPdf(
      query,
    );

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=manualReport.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Post('manual-order-records')
  async generateManualOrderReport(
    @Body() payload: ManualOrderReportDto,
  ): Promise<ResponseBody> {
    const { data } = await this.paymentService.generateManualOrderReport(
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
}
