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
import { ResponseBody } from 'src/utills/responseBody';
import { CREATE_DATA, FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ParsedQs } from 'qs';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Request } from 'express';
@ApiBearerAuth()
@ApiTags('Warehouse')
@Controller('warehouse')
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get()
  @ApiQueriesForGetAll()
  async getAllWarehouse(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.warehouseService.getAllWarehouse(query);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  //SECTION - get warehouse by id
  @Get(':id')
  async getWarehouseById(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.warehouseService.getWarehouseById(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('create')
  @ApiBody({ type: CreateWarehouseDto })
  async createWarehouse(
    @Body() payload: CreateWarehouseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.warehouseService.createWarehouse(payload, req.body._valid.id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Patch('update/:id')
  @ApiBody({ type: UpdateWarehouseDto })
  async updateWarehouse(
    @Param('id') id: string,
    @Body() payload: UpdateWarehouseDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.warehouseService.updateWarehouse(
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
  //SECTION - delete warehouse by id
  @Delete('delete/:id')
  async deleteWarehouse(@Param('id') id: string): Promise<ResponseBody> {
    const message = await this.warehouseService.deleteWarehouse(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }
}
