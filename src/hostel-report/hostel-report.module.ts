import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HostelReportController } from './hostel-report.controller';
import { HostelReportService } from './hostel-report.service';
import {
  UserHostelValidity,
  UserHostelValiditySchema,
} from 'src/schema/user.hostel.validity.schema';
import { CommonService } from 'src/utills/commonService';
import { Hostel, HostelSchema } from 'src/schema/hostel.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hostel.name, schema: HostelSchema },
      { name: UserHostelValidity.name, schema: UserHostelValiditySchema },
    ]),
  ],
  controllers: [HostelReportController],
  providers: [HostelReportService, CommonService],
})
export class HostelReportModule {}
