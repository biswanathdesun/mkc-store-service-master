import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ParsedQs } from 'qs';
import { ResponseBody } from 'src/utills/responseBody';
import { Request } from 'express';
import { HostelDefaulterService } from './hostel-defaulter.service';
import { ApiQueriesForGetAll, ApiQueriesForType } from 'src/swagger.decorators';
import { FOUND_DATA } from 'src/utills/messages';

@ApiBearerAuth()
@ApiTags('Hostel Defaulter')
@Controller('hostel-defaulter')
export class HostelDefaulterController {
  constructor(private hostelDefaulterService: HostelDefaulterService) {}

  @Get('list')
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async hostelDefaulterList(
    @Query() query: ParsedQs,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.hostelDefaulterService.hostelDefaulterList(
        query,
        req.body._valid.id,
      );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return response;
  }
}
