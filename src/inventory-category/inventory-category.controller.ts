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
import { InventoryCategoryService } from './inventory-category.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';

@ApiBearerAuth()
@ApiTags('Inventory Category')
@Controller('inventory-category')
export class InventoryCategoryController {
  constructor(private inventoryCategoryService: InventoryCategoryService) {}

  @Get()
  @ApiQueriesForGetAll()
  async getAllInventoryCategory(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.inventoryCategoryService.getAllInventoryCategory(query);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  @Get(':id')
  async inventoryCategoryById(@Param('id') id: string): Promise<ResponseBody> {
    const { data } = await this.inventoryCategoryService.inventoryCategoryById(
      id,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('create')
  @ApiBody({ type: CreateInventoryCategoryDto })
  async createInventoryCategory(
    @Body() payload: CreateInventoryCategoryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.inventoryCategoryService.createInventoryCategory(
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
  @ApiBody({ type: UpdateInventoryCategoryDto })
  async updateInventoryCategory(
    @Param('id') id: string,
    @Body() payload: UpdateInventoryCategoryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.inventoryCategoryService.updateInventoryCategory(
      id,
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

  //SECTION - delete inventory category by id
  @Delete('delete/:id')
  async deleteInvent(@Param('id') id: string): Promise<ResponseBody> {
    const message = await this.inventoryCategoryService.deleteInventoryCategory(
      id,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }
}
