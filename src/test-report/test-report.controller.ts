import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  Res,
  UseInterceptors,
  Get,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TestReportService } from './test-report.service';
import { ResponseBody } from 'src/utills/responseBody';
import {
  DELETE_DATA,
  FOUND_DATA,
  OMR_REPORT_FILE_UPLOAD,
} from 'src/utills/messages';
import { Request, Response } from 'express';
import { AttemptCountDto } from './dto/attempt-count.dto';
import { TestResultDto } from './dto/test-result.dto';
import { AdminAnswerDetailsDto } from './dto/answer-key-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkUploadDto } from './dto/bulk-upload.dto';
import { OmrResultDto } from './dto/omr-result.dto';
import { AdminReportDto } from './dto/admin-list-report.dto';
import { DeleteReportDto } from './dto/delete-attempted-test.dto';

@ApiBearerAuth()
@ApiTags('Test Report')
@Controller('test-report')
export class TestReportController {
  constructor(private testReportService: TestReportService) {}

  @Get('download-report/:id')
  async generateSubjectReport(
    @Param('id')
    id: string,
    @Res() res,
  ): Promise<any> {
    const pdfBuffer = await this.testReportService.generateSubjectReport(id);

    //NOTE - send the buffer data to user to download
    res.setHeader('Content-Disposition', `attachment;filename=testReport.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  }

  @Post('attemptCount')
  @ApiBody({ type: AttemptCountDto })
  async getAttemptCount(
    @Body() payload: AttemptCountDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.getAttemptCount(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('answerkeys')
  @ApiBody({ type: TestResultDto })
  async getAnswerDetails(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { all, correct, inCorrect, unAttempted, data } =
      await this.testReportService.getAnswerKeyDetails(
        payload,
        req.body._valid.id,
      );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      all,
      correct,
      inCorrect,
      unAttempted,
      data,
    };
    return result;
  }

  @Post('efficiency')
  @ApiBody({ type: TestResultDto })
  async getStudentEfficiency(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.getStudentEfficiency(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('questionAnalysis')
  @ApiBody({ type: TestResultDto })
  async questionAnalysis(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.questionAnalysis(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('achievedPercentage')
  @ApiBody({ type: TestResultDto })
  async achievedPercentage(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.achievedPercentage(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('scoreSummary')
  @ApiBody({ type: TestResultDto })
  async getScoreSummary(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.getScoreSummary(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('timePerformanceMetrics')
  @ApiBody({ type: TestResultDto })
  async timePerformanceMetrics(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.timePerformanceMetrics(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('attemptedStudent') //TODO - only for admin panel
  @ApiBody({ type: AdminReportDto })
  async getAttemptedStudent(
    @Body() payload: AdminReportDto,
  ): Promise<ResponseBody> {
    const { data, count } = await this.testReportService.getAttemptedStudent(
      payload,
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

  @Post('reportBySubject')
  @ApiBody({ type: TestResultDto })
  async getReportBySubject(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.getReportBySubject(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('answerKeysForAdmin')
  @ApiBody({ type: AdminAnswerDetailsDto })
  async answerkeysForAdmin(
    @Body() payload: AdminAnswerDetailsDto,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.answerkeysForAdmin(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('upload-omr-result')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BulkUploadDto })
  async uploadOmrResult(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: BulkUploadDto,
    @Res() res: Response,
  ): Promise<any> {
    res.status(200).send({ statusCode: 200, message: OMR_REPORT_FILE_UPLOAD });

    await this.testReportService.uploadOmrResult(file, payload);
  }

  @Post('omr-result')
  @ApiBody({ type: OmrResultDto })
  async getOmrTestResult(@Body() payload: OmrResultDto): Promise<ResponseBody> {
    const { data } = await this.testReportService.getOmrTestResult(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('summary')
  @ApiBody({ type: TestResultDto })
  async testOverviewReport(
    @Body() payload: TestResultDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { data } = await this.testReportService.testOverviewReport(
      payload,
      req.body._valid.id,
    );

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data,
    };
    return result;
  }

  @Post('delete-attempted-test') //TODO - only use for the BE team
  @ApiBody({ type: DeleteReportDto })
  async deleteAttemptedTest(
    @Body() payload: DeleteReportDto,
  ): Promise<ResponseBody> {
    await this.testReportService.deleteAttemptedTest(payload);

    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: DELETE_DATA,
    };
    return result;
  }
}
