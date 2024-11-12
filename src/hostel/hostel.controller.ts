import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { DELETE_DATA, FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import { HostelService } from './hostel.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { RoomMappingDto } from './dto/room-mapping.dto';
import { GetMappedRoomForHostelDto } from './dto/get-room-details.dto';
import { GetMappedRoomNumberDto } from './dto/get-room-number.dto';
import { GetVacantRoomDto } from './dto/vacant.room.dto';
import { GetPaymentDetailsDto } from './dto/get-payment-details.dto';
import { BedTypesByFloorNumberDto } from './dto/bedtype-by-floor';
import { GetMulipleMappedRoomNumberDto } from './dto/muliple-mapped-room.dto';

@ApiBearerAuth()
@ApiTags('Hostel')
@Controller('hostel')
export class HostelController {
  constructor(private hostelService: HostelService) {}

  @Get()
  @ApiQueriesForGetAll()
  async getAllHostels(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.hostelService.getAllHostels(query);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  //SECTION - to get all hostels for web and mobile
  @Get('student')
  @ApiQueriesForGetAll()
  async getAllHostelsForWebMobile(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } = await this.hostelService.getAllHostelsForWebMobile(
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

  @Get('bedTypes/:id')
  async bedTypesByHostelId(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.hostelService.bedTypesByHostelId(id);
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get('student/:id')
  async hostelByIdForWebMobile(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.hostelService.hostelByIdForWebMobile(id);
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Get(':id')
  async hostelById(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.hostelService.hostelById(id);

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('create')
  @ApiBody({ type: CreateHostelDto })
  async createHostel(
    @Body() payload: CreateHostelDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.hostelService.createHostel(
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

  @Patch('update/:id')
  @ApiBody({ type: UpdateHostelDto })
  async updateHostel(
    @Param('id') id: string,
    @Body() payload: UpdateHostelDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.hostelService.updateHostel(id, payload, req.body._valid.id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Delete('delete/:id')
  async deleteHostel(@Param('id') id: string): Promise<ResponseBody> {
    await this.hostelService.deleteHostel(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };
    return result;
  }

  @Post('room-mapping')
  @ApiBody({ type: RoomMappingDto })
  async updateRoomMappingDetails(
    @Body() payload: RoomMappingDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.hostelService.updateRoomMappingDetails(
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

  @Post('fetch-mapped-room')
  @ApiBody({ type: GetMappedRoomForHostelDto })
  async fetchMapppedRoomDetails(
    @Body() payload: GetMappedRoomForHostelDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.fetchMapppedRoomDetails(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('room-list-bedType')
  @ApiBody({ type: GetMappedRoomNumberDto })
  async getRoomsByBedType(
    @Body() payload: GetMappedRoomNumberDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.getRoomsByBedType(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('vacant-room-details')
  @ApiBody({ type: GetVacantRoomDto })
  async getVacantRoomsByBedType(
    @Body() payload: GetVacantRoomDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.getVacantRoomsByBedType(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('hostel-for-payment')
  @ApiBody({ type: GetPaymentDetailsDto })
  async getHostelForPayment(
    @Body() payload: GetPaymentDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.getHostelForPayment(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('bedType-for-payment')
  @ApiBody({ type: GetPaymentDetailsDto })
  async fetchHostelBedTypeForPayment(
    @Body() payload: GetPaymentDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.fetchHostelBedTypeForPayment(
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

  @Post('room-for-payment')
  @ApiBody({ type: GetPaymentDetailsDto })
  async fetchRoomDetailsForPayment(
    @Body() payload: GetPaymentDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.fetchRoomDetailsForPayment(
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

  @Post('payment-details')
  @ApiBody({ type: GetPaymentDetailsDto })
  async getPaymentDetails(
    @Body() payload: GetPaymentDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.getPaymentDetails(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('update-floor')
  async updateFloorNumber(): Promise<ResponseBody> {
    await this.hostelService.updateFloorNumber();
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Post('bed-types-per-floor')
  @ApiBody({ type: BedTypesByFloorNumberDto })
  async bedTypesByHostelIdAndfloorNumber(
    @Body() payload: BedTypesByFloorNumberDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.bedTypesByHostelIdAndfloorNumber(
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

  @Post('multi-bedType-room-list')
  @ApiBody({ type: GetMulipleMappedRoomNumberDto })
  async getRoomsByMulipleBedType(
    @Body() payload: GetMulipleMappedRoomNumberDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelService.getRoomsByMulipleBedType(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }
}
