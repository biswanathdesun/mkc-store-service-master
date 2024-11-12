import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  Patch,
  Body,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { ResponseBody } from 'src/utills/responseBody';
import { ParsedQs } from 'qs';
import {
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
  ApiQueriesForRangeDateFilter,
  ApiQueriesForType,
} from 'src/swagger.decorators';
import { FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import { Request } from 'express';
import { UpdateShippingStatus } from './dto/update-shipping-status.dto';
import { AddTrackingDto } from './dto/add-tracking.dto';

@ApiBearerAuth()
@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  @ApiQueriesForGetAll()
  @ApiQueriesForPayment()
  @ApiQueriesForType()
  async getAllOrder(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.orderService.getAllOrder(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get('history')
  async getUserOrder(@Req() req: Request): Promise<ResponseBody> {
    const order_details = await this.orderService.getUserOrder(
      req.body._valid.id,
      req.body._valid.userType,
      req.body._valid.studentId,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: order_details,
    };
    return result;
  }

  @Get('update-receipt-no') //TODO - only use for manual upadation from backend
  @ApiQueriesForRangeDateFilter()
  async updateReceiptNumber(@Query() query: ParsedQs): Promise<ResponseBody> {
    await this.orderService.updateReceiptNumber(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Get(':id')
  async getOrderById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const order_details = await this.orderService.getOrderById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: order_details,
    };
    return result;
  }

  @Get('tracking/:id')
  async getTrackingById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const { data } = await this.orderService.getTrackingById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('generateInvoice/:id')
  async generateInvoice(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const { pdfBuffer, invoiceNumber } =
      await this.orderService.generateInvoice(id);

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=${invoiceNumber}.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Get('generatePackagingList/:id')
  async generatePackagingList(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const { pdfBuffer, orderId } =
      await this.orderService.generatePackagingList(id);

    // NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=${orderId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Patch('updateShippingStatus/:id')
  @ApiBody({ type: UpdateShippingStatus })
  async updateShippingStatus(
    @Param('id') id: string,
    @Body() payload: UpdateShippingStatus,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.orderService.updateShippingStatus(
      id,
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

  @Post('tracking')
  @ApiBody({ type: AddTrackingDto })
  async addTrackingDetails(
    @Body() payload: AddTrackingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.orderService.addTrackingDetails(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: message,
    };
    return result;
  }

  @Get('order/book')
  @ApiQueriesForGetAll()
  @ApiQueriesForPayment()
  @ApiQueriesForType()
  async getAllOrderBook(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.orderService.getAllOrderBook(query);

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
