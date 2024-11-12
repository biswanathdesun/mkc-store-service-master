import { ParsedQs } from 'qs';
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { HostelReportService } from './hostel-report.service';
import { RoomReportDto } from './dto/room-report.dto';
import {
  ApiQueriesHostelId,
  ApiQueriesHostelRoomReport,
} from 'src/swagger.decorators';
import { VacantReportDto } from './dto/vacant-reporyt.dto';

@ApiBearerAuth()
@ApiTags('Hostel Report')
@Controller('hostel-report')
export class HostelReportController {
  constructor(private hostelReportService: HostelReportService) {}

  @Post('room')
  @ApiBody({ type: RoomReportDto })
  async hostelRoomReportDetails(
    @Body() payload: RoomReportDto,
  ): Promise<ResponseBody> {
    const { data, count } =
      await this.hostelReportService.hostelRoomReportDetails(payload);

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      count,
      data,
    };

    return result;
  }

  @Get('room-pdf')
  @ApiQueriesHostelRoomReport()
  async hostelRoomReportPdf(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<ResponseBody> {
    const pdfBuffer = await this.hostelReportService.hostelRoomReportPdf(query);

    //NOTE - send the buffer data to user to download
    res.setHeader(
      'Content-Disposition',
      `attachment;filename=hostelRoomReport.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Post('vacant')
  @ApiBody({ type: VacantReportDto })
  async roomVacantReportDetails(
    @Body() payload: VacantReportDto,
  ): Promise<ResponseBody> {
    const { data } = await this.hostelReportService.roomVacantReportDetails(
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Get('vacant-pdf')
  @ApiQueriesHostelId()
  async roomVacantReportDetailsPdf(
    @Query() query: ParsedQs,
    @Res() res,
  ): Promise<ResponseBody> {
    const pdfBuffer = await this.hostelReportService.roomVacantReportDetailsPdf(
      query,
    );

    //NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=room_vacant.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }
}
