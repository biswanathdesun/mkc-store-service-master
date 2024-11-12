import { Controller, Get, Query, Res } from '@nestjs/common';
import { ParsedQs } from 'qs';
import {
  ApiQueriesForDate,
  ApiQueriesForGetAll,
  ApiQueriesForRangeDateFilter,
  ApiQueriesForType,
  ApiQueriesStaff,
} from 'src/swagger.decorators';
import { ResponseBody } from 'src/utills/responseBody';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaulterReportService } from './defaulter-report.service';
import { FOUND_DATA } from 'src/utills/messages';

@ApiBearerAuth()
@ApiTags('Defaulters Report')
@Controller('defaulter-report')
export class DefaulterReportController {
  constructor(private defaulterReportService: DefaulterReportService) {}

  @Get('prebookAndAdmitted')
  @ApiQueriesForType()
  @ApiQueriesForDate()
  @ApiQueriesForGetAll()
  async getPrebookAndAdmittedDefaultersReport(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.defaulterReportService.getPrebookAndAdmittedDefaultersReport(
        query,
      );

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return response;
  }

  @Get('closeAndDropped')
  @ApiQueriesForRangeDateFilter()
  @ApiQueriesForType()
  @ApiQueriesForGetAll()
  async getCloseAndDroppedReport(
    @Query() query: ParsedQs,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.defaulterReportService.getCloseAndDroppedReport(query);

    const response: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return response;
  }

  @Get('prebookAndAdmittedPdf')
  @ApiQueriesForType()
  @ApiQueriesForDate()
  async getPrebookAndAdmittedDefaultersPdf(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<ResponseBody> {
    const pdfBuffer =
      await this.defaulterReportService.getPrebookAndAdmittedDefaultersPdf(
        query,
      );

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=defaulterReport.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Get('closeAndDroppedPdf')
  @ApiQueriesStaff()
  @ApiQueriesForRangeDateFilter()
  @ApiQueriesForType()
  async getCloseAndDroppedReportPdf(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<ResponseBody> {
    const pdfBuffer =
      await this.defaulterReportService.getCloseAndDroppedReportPdf(query);

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=defaulterReport.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }
}
