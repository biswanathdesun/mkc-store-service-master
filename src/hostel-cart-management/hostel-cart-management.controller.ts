import { Body, Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { HostelCartManagementService } from './hostel-cart-management.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { Request } from 'express';
import { AddToHostelCartDto } from './dto/add-hostel-cart.dto';
import { DELETE_DATA, FOUND_DATA } from 'src/utills/messages';
import { CheckInHostelCartDto } from './dto/check-in-cart.dto';

@ApiBearerAuth()
@ApiTags('Hostel cart management')
@Controller('hostel-cart-management')
export class HostelCartManagementController {
  constructor(
    private readonly hostelCartManagementService: HostelCartManagementService,
  ) {}

  @Post('add')
  @ApiBody({ type: AddToHostelCartDto })
  async addToHostelCart(
    @Body() payload: AddToHostelCartDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const msg = await this.hostelCartManagementService.addToHostelCart(
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

  @Post('details')
  async getHostelCartDetails(@Req() req: Request): Promise<ResponseBody> {
    const { data } =
      await this.hostelCartManagementService.getHostelCartDetails(
        req.body._valid.id,
      );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('count')
  async getHostelCartCount(@Req() req: Request): Promise<ResponseBody> {
    const count = await this.hostelCartManagementService.getHostelCartCount(
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: count,
    };
    return result;
  }

  @Post('summary')
  async userPaymentSummary(@Req() req: Request): Promise<ResponseBody> {
    const { data } = await this.hostelCartManagementService.userPaymentSummary(
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Delete('delete/:id')
  async deleteHostelCartProducts(
    @Param('id')
    id: string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.hostelCartManagementService.deleteHostelCartProducts(
      id,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('check-in-cart')
  @ApiBody({ type: CheckInHostelCartDto })
  async checkInHostelCart(
    @Body() payload: CheckInHostelCartDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const status = await this.hostelCartManagementService.checkInHostelCart(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      status,
    };
    return result;
  }
}
