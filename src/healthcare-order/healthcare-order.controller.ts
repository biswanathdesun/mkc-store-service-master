import { ParsedQs } from 'qs';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { HealthcareOrderService } from './healthcare-order.service';
import {
  ApiQueriesForGetAll,
  ApiQueriesForPayment,
} from 'src/swagger.decorators';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { UserOrderHistoryDto } from './dto/user-order-history.dto';
import { OrderDetailsDto } from './dto/order-history.dto';
import { Request } from 'express';
@ApiBearerAuth()
@ApiTags('Health Care order')
@Controller('healthcare-order')
export class HealthcareOrderController {
  constructor(private healthcareOrderService: HealthcareOrderService) {}

  @Get()
  @ApiQueriesForGetAll()
  @ApiQueriesForPayment()
  async allhealthCareOrders(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } =
      await this.healthcareOrderService.allhealthCareOrders(query);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Post('student') //TODO - use in web and mobile for get all order
  @ApiBody({ type: UserOrderHistoryDto })
  async usersAllOrderhistory(
    @Body() payload: UserOrderHistoryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.healthcareOrderService.usersAllOrderhistory(
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
  @ApiBody({ type: OrderDetailsDto })
  async hospitalOrderDetails(
    @Body() payload: OrderDetailsDto,
  ): Promise<ResponseBody> {
    const data = await this.healthcareOrderService.hospitalOrderDetails(
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Get('receipt/:id')
  async generateHospitalRecipt(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const pdfBuffer = await this.healthcareOrderService.generateHospitalRecipt(
      id,
    );

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=hospitalRecipt.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Get('order-receipt/:id')
  async generateHospitalOrderRecipt(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const { pdfBuffer, orderId } =
      await this.healthcareOrderService.generateHospitalOrderRecipt(id);

    // NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=${orderId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }
}
