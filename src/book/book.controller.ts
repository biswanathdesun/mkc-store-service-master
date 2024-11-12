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
import { BookService } from './book.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import {
  CREATE_DATA,
  DELETE_DATA,
  FOUND_DATA,
  UPDATE_DATA,
} from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { CreateBookDto } from './dto/create.book.dto';
import { UpdateBookDto } from './dto/update.book.dto';
import {
  ApiQueriesBookInStock,
  ApiQueriesForGetAll,
} from 'src/swagger.decorators';
import { Request } from 'express';
import { GetBookSeoTagDto } from './dto/get-book-tags.dto';
import { AddBookSeoTagDto } from './dto/add-book-seo-tags.dto';
import { AddItemInBooksgDto } from './dto/add-item.dto';
import { GetBookItemByLanguageDto } from './dto/get-item.dto';

@ApiBearerAuth()
@ApiTags('Book')
@Controller('book')
export class BookController {
  constructor(private bookService: BookService) {}

  @Post('create')
  @ApiBody({ type: CreateBookDto })
  async createBook(
    @Body() payload: CreateBookDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.bookService.createBook(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: CREATE_DATA,
    };
    return result;
  }

  @Get()
  @ApiQueriesBookInStock()
  @ApiQueriesForGetAll()
  async getAllBooks(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.bookService.getAllBooks(query);

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
  async getBookById(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    const book_details = await this.bookService.getBookById(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: book_details,
    };
    return result;
  }

  @Patch('update/:id')
  async updateBook(
    @Param('id') id: string,
    @Body() payload: UpdateBookDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.bookService.updateBook(id, payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };

    return result;
  }

  @Delete('delete/:id')
  async deleteBook(
    @Param('id')
    id: string,
  ): Promise<ResponseBody> {
    await this.bookService.deleteBook(id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };

    return result;
  }

  @Post('seo-tags')
  @ApiBody({ type: GetBookSeoTagDto })
  async getSeoTagsDetails(
    @Body() payload: GetBookSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.bookService.getSeoTagsDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('add-tags')
  @ApiBody({ type: AddBookSeoTagDto })
  async manageSeoTags(
    @Body() payload: AddBookSeoTagDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.bookService.manageSeoTags(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Post('languages')
  @ApiBody({ type: GetBookSeoTagDto })
  async getBookLanguageDetails(
    @Body() payload: GetBookSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.bookService.getBookLanguageDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Patch('add-items')
  @ApiBody({ type: AddItemInBooksgDto })
  async addInventoryItems(
    @Body() payload: AddItemInBooksgDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.bookService.addInventoryItems(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Patch('fetch-items')
  @ApiBody({ type: GetBookSeoTagDto })
  async fetchInventoryItems(
    @Body() payload: GetBookSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.bookService.fetchInventoryItems(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('for-sale')
  async getAllBookForSale(): Promise<ResponseBody> {
    const { data } = await this.bookService.getAllBookForSale();
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('language-items')
  @ApiBody({ type: GetBookItemByLanguageDto })
  async bookItemsByLanguageId(
    @Body() payload: GetBookItemByLanguageDto,
  ): Promise<ResponseBody> {
    const { data } = await this.bookService.bookItemsByLanguageId(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('update-items')
  async upadteInventoryItems(): Promise<ResponseBody> {
    await this.bookService.updateInventoryItems();

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }
}
