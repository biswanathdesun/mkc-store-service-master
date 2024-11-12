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
import { FOUND_DATA, UPDATE_DATA } from 'src/utills/messages';
import {
  ApiQueriesForGetAll,
  ApiQueriesHealthcareService,
} from 'src/swagger.decorators';
import { ParsedQs } from 'qs';
import { Request } from 'express';
import { CarePackageService } from './care-package.service';
import { CreateCarePackageDto } from './dto/create-care-package.dto';
import { UpdateCarePackageDto } from './dto/update.care-package.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { CheckCarePackageDto } from './dto/check-package-name.dto';
import { AddPackageSeoTagDto } from './dto/care-package-seo-tags.dto';
import { GetPackagesSeoTagDto } from './dto/get-package-tags.dto';
import { GetPackageBasedOnUserDto } from './dto/get-package-for-payment.dto';

@ApiBearerAuth()
@ApiTags('Health Care Package')
@Controller('care-package')
export class CarePackageController {
  constructor(private readonly carePackageService: CarePackageService) {}

  //SECTION - to get all hospital service packages in admin
  @Get()
  @ApiQueriesHealthcareService()
  @ApiQueriesForGetAll()
  async getAllCarePackages(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.carePackageService.getAllCarePackages(
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

  //SECTION - to get all enquiry list
  @Get('enquiry')
  @ApiQueriesForGetAll()
  async getAllEnquires(@Query() query: ParsedQs): Promise<ResponseBody> {
    const { data, count } = await this.carePackageService.getAllEnquires(query);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };
    return result;
  }

  // SECTION - to get hospital package by service Id
  @Get('/student/:id')
  async packageByServiceIdForStudent(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const data = await this.carePackageService.packageByServiceIdForStudent(
      id,
      req.body._valid?.id,
    );
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  // SECTION - to get hospital package by service Id for admin
  @Get('admin/:id')
  async packageByServiceIdForAdmin(
    @Param('id') id: string,
  ): Promise<ResponseBody> {
    const data = await this.carePackageService.packageByServiceIdForAdmin(id);

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  // SECTION - to get hospital services by id
  @Get('/:id')
  async carePackageById(@Param('id') id: string): Promise<ResponseBody> {
    const data = await this.carePackageService.carePackageById(id);
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  //SECTION - create a new hostel service package
  @Post('create')
  @ApiBody({ type: CreateCarePackageDto })
  async createCarePackage(
    @Body() payload: CreateCarePackageDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.carePackageService.createCarePackage(
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

  //SECTION - update hospital service package by id
  @Patch('update/:id')
  @ApiBody({ type: UpdateCarePackageDto })
  async updateCarePackage(
    @Param('id') id: string,
    @Body() payload: UpdateCarePackageDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.carePackageService.updateCarePackage(
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
  //SECTION - update enquiry status by enquiry id
  @Patch('updateEnquiryStatus/:id')
  @ApiBody({ type: UpdateEnquiryStatusDto })
  async updateEnquiryStatus(
    @Param('id') id: string,
    @Body() payload: UpdateEnquiryStatusDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const message = await this.carePackageService.updateEnquiryStatus(
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

  //SECTION - delete hostel by id
  @Delete('delete/:id')
  async deleteCarePackage(@Param('id') id: string): Promise<ResponseBody> {
    const message = await this.carePackageService.deleteCarePackage(id);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }

  @Post('checkPackageName')
  @ApiBody({ type: CheckCarePackageDto })
  async checkPackageName(
    @Body() payload: CheckCarePackageDto,
  ): Promise<ResponseBody> {
    const message = await this.carePackageService.checkPackageName(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message,
    };
    return result;
  }

  @Post('add-tags')
  @ApiBody({ type: AddPackageSeoTagDto })
  async configureSeoTags(
    @Body() payload: AddPackageSeoTagDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    await this.carePackageService.configureSeoTags(payload, req.body._valid.id);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: UPDATE_DATA,
    };
    return result;
  }

  @Post('seo-tags')
  @ApiBody({ type: GetPackagesSeoTagDto })
  async getSeoTagDetails(
    @Body() payload: GetPackagesSeoTagDto,
  ): Promise<ResponseBody> {
    const { data } = await this.carePackageService.getSeoTagDetails(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('payment')
  @ApiBody({ type: GetPackageBasedOnUserDto })
  async packageForPayment(
    @Body() payload: GetPackageBasedOnUserDto,
  ): Promise<ResponseBody> {
    const { data } = await this.carePackageService.packageForPayment(payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }
}
