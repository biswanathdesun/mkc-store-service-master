import { Controller, Post, Req, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { ResponseBody } from 'src/utills/responseBody';
import { FOUND_DATA } from 'src/utills/messages';
import { Request } from 'express';
import { GetLibraryDto } from './dto/get-course.dto';
import { GetLiveClassForCalenderDto } from './dto/get-live-class-calender.dto';
import { GetCourseSubjectsDto } from './dto/get-course-subjects.dto';
import { GetSubjectChapterDto } from './dto/get-subjects-chapter.dto';
import { GetEbookLibraryDto } from './dto/get-ebbok-pdf.dto';

@ApiBearerAuth()
@ApiTags('Student Library')
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post('online-course')
  async onlineCourseDetails(@Req() req: Request): Promise<ResponseBody> {
    const { response } = await this.libraryService.onlineCourseDetails(
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('online-course/:id') //NOTE - only for video
  async onlineCourseDetailsById(
    @Param('id') id: string,
    @Body() payload: GetLibraryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.onlineCourseDetailsById(
      id,
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('online-course-notes/:id') //NOTE - only for notes
  async onlineCourseNotesById(
    @Param('id') id: string,
    @Body() payload: GetLibraryDto,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.onlineCourseNotesById(
      id,
      payload,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }
  @Post('online-course-test/:id')
  async onlineCourseTestById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.onlineCourseTestById(
      id,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('contentById/:id')
  async onlineCourseContentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.onlineCourseContentById(
      id,
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('offline-course')
  async offlineCourseDetails(@Req() req: Request): Promise<ResponseBody> {
    const { response } = await this.libraryService.offlineCourseDetails(
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('book')
  async bookDetails(@Req() req: Request): Promise<ResponseBody> {
    const { response } = await this.libraryService.bookDetails(
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('book/:id')
  async bookDetailsById(
    @Param('id') id: string,
    @Body() payload: GetEbookLibraryDto,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.bookDetailsById(id, payload);
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('test-series')
  async testSeriesDetails(@Req() req: Request): Promise<ResponseBody> {
    const { response } = await this.libraryService.testSeriesDetails(
      req.body._valid.id,
      req.body._valid?.userType,
      req.body._valid?.studentId,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('test-series/:id')
  async testSeriesDetailsById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.testSeriesDetailsById(
      id,
      req.body._valid.id,
    );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }

  @Post('get-calender-live-class-data')
  async getCalenderLiveClassData(
    @Req() req: Request,
    @Body() payload: GetLiveClassForCalenderDto,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.getLiveClassForCalender(
      req.body._valid.id,
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };

    return result;
  }
  @Post('subjectDetails')
  async subjectDetailsByUserCourseId(
    @Body() payload: GetCourseSubjectsDto,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.subjectDetailsByUserCourseId(
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };

    return result;
  }
  @Post('chapterDetails')
  async chapterDetailsBySubjectId(
    @Body() payload: GetSubjectChapterDto,
  ): Promise<ResponseBody> {
    const { response } = await this.libraryService.chapterDetailsBySubjectId(
      payload,
    );

    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };

    return result;
  }

  @Post('all-purchase-test')
  async allTestBasedOnProductPurchase(
    @Req() req: Request,
  ): Promise<ResponseBody> {
    const { response } =
      await this.libraryService.allTestBasedOnProductPurchase(
        req.body._valid.id,
        req.body._valid?.userType,
        req.body._valid?.studentId,
      );
    //NOTE - push final data
    const result: ResponseBody = {
      statusCode: 200,
      message: FOUND_DATA,
      data: response,
    };
    return result;
  }
}
