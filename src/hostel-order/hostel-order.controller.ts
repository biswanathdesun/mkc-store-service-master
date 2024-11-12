import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Req,
  Param,
  Res,
} from '@nestjs/common';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { HostelOrderService } from './hostel-order.service';
import {
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
} from 'src/swagger.decorators';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { HostelOrderListDto } from './dto/hosetl-order-list.dto';
import { HostelOrderDetailsDto } from './dto/hostel-order-history.dto';
import { BillingHistoryDto } from './dto/billing-history.dto';

@ApiBearerAuth()
@ApiTags('Hostel Order')
@Controller('hostel-order')
export class HostelOrderController {
  constructor(private hostelOrderService: HostelOrderService) {}

  @Get()
  @ApiQueriesForPayment()
  @ApiQueriesForGetAll()
  async getHostelOrderListForAdmin(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.hostelOrderService.getHostelOrderListForAdmin(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get('receipt/:id')
  async generateHostelReceiptA(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const pdfBuffer = await this.hostelOrderService.generateHostelReceiptA(id);

    //NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=hostelA.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Get('receipt-b/:id')
  async generateHostelReceiptB(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const pdfBuffer = await this.hostelOrderService.generateHostelReceiptB(id);

    //NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=hostelB.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Post('student') //TODO - use in web and mobile for get all order list
  @ApiBody({ type: HostelOrderListDto })
  async retrieveStudentHostelOrders(
    @Body() payload: HostelOrderListDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.hostelOrderService.retrieveStudentHostelOrders(
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

  @Post('history')
  @ApiBody({ type: HostelOrderDetailsDto })
  async hostelOrderDetails(
    @Body() payload: HostelOrderDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelOrderService.hostelOrderDetails(payload);

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Post('billing-history')
  @ApiBody({ type: BillingHistoryDto })
  async userBillingHistory(
    @Body() payload: BillingHistoryDto,
  ): Promise<ResponseBody> {
    const { data, count } = await this.hostelOrderService.userBillingHistory(
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return result;
  }
}
