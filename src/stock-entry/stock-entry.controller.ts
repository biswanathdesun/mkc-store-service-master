import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { StockEntryService } from './stock-entry.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { Request } from 'express';
import { CreateItemTransferDto } from './dto/create-item-transfer.dto';
@ApiBearerAuth()
@ApiTags('Stock Entry')
@Controller('stock-entry')
export class StockEntryController {
  constructor(private readonly stockEntryService: StockEntryService) {}

  //SECTION - to get all stock entries
  @Get()
  @ApiQueriesForGetAll()
  async getAllStockEntries(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.stockEntryService.getAllStockEntries(
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
  //SECTION - to get all stock item transfers
  @Get('item-transfer')
  @ApiQueriesForGetAll()
  async getAllItemTransfers(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.stockEntryService.getAllItemTransfers(
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

  //SECTION - create a new stock entry
  @Post('create')
  @ApiBody({ type: CreateStockEntryDto })
  async createStockentry(
    @Body() payload: CreateStockEntryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.stockEntryService.createStockentry(
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

  //SECTION - create a new stock entry
  @Post('item-transfer/create')
  @ApiBody({ type: CreateItemTransferDto })
  async createItemTransfer(
    @Body() payload: CreateItemTransferDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.stockEntryService.createItemTransfer(
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
