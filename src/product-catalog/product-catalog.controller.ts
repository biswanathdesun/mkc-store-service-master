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
import { ProductCatalogService } from './product-catalog.service';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { ApiQueriesForGetAll } from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { CreateProductCatalogDto } from './dto/create-product-catalog.dto';
import { Request } from 'express';
import { UpdateProductCatalogDto } from './dto/update-product-catalog.dto';
@ApiBearerAuth()
@ApiTags('Products Catalog')
@Controller('product-catalog')
export class ProductCatalogController {
  constructor(private readonly productCatalogService: ProductCatalogService) {}

  @Get()
  @ApiQueriesForGetAll()
  async getAllProductsCatalog(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } =
      await this.productCatalogService.getAllProductsCatalog(query);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  //SECTION - get product by id
  @Get(':id')
  async getProductCatalogById(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.productCatalogService.getProductCatalogById(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  //SECTION - create a new products
  @Post('create')
  @ApiBody({ type: CreateProductCatalogDto })
  async createProductCatalog(
    @Body() payload: CreateProductCatalogDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.productCatalogService.createProductCatalog(
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

  //SECTION - update warehouse by id
  @Patch('update/:id')
  @ApiBody({ type: UpdateProductCatalogDto })
  async updateProductCatalog(
    @Param('id') id: string,
    @Body() payload: UpdateProductCatalogDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.productCatalogService.updateProductCatalog(
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
  //SECTION - delete warehouse by id
  @Delete('delete/:id')
  async deleteProductCatalog(@Param('id') id: string): Promise<ResponseBody> {
    const message = await this.productCatalogService.deleteProductCatalog(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }
}
