import { Module } from '@nestjs/common';
import { DefaulterReportController } from './defaulter-report.controller';
import { DefaulterReportService } from './defaulter-report.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import { CommonService } from 'src/utills/commonService';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
    ]),
  ],
  controllers: [DefaulterReportController],
  providers: [DefaulterReportService, CommonService],
})
export class DefaulterReportModule {}
