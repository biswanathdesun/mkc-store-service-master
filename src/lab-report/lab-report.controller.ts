import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { LabReportService } from './lab-report.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ResponseBody } from 'src/utills/responseBody';
import { GetLabReportDto } from './dto/get-lab-report.dto';
import { FOUND_DATA, LAB_REPORT_ADDED } from 'src/utills/messages';
import { Request } from 'express';
import { ModifyLabReportDto } from './dto/submit-lab-report.dto';

@ApiBearerAuth()
@ApiTags('Lab Report')
@Controller('lab-report')
export class LabReportController {
  constructor(private labReportService: LabReportService) {}

  @Get('print-report/:id')
  async printLabReport(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const pdfBuffer = await this.labReportService.printLabReport(id);

    //NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=labReport.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Post('report')
  @ApiBody({ type: GetLabReportDto })
  async getLabReportOfUser(
    @Body() payload: GetLabReportDto,
  ): Promise<ResponseBody> {
    const { data } = await this.labReportService.getLabReportOfUser(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };

    return result;
  }

  @Post('submit')
  @ApiBody({ type: ModifyLabReportDto })
  async submitLabReport(
    @Body() payload: ModifyLabReportDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.labReportService.submitLabReport(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: LAB_REPORT_ADDED,
      data,
    };

    return result;
  }
}
