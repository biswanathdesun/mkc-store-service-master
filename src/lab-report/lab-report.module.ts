import { Module } from '@nestjs/common';
import { LabReportController } from './lab-report.controller';
import { LabReportService } from './lab-report.service';
import { MongooseModule } from '@nestjs/mongoose';

import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';
import {
  HealthcareUnits,
  HealthcareUnitsSchema,
} from 'src/schema/health-care-units.schema';
import {
  PathologyCategory,
  PathologyCategorySchema,
} from 'src/schema/pathology-category.schema';
import { LabReport, LabReportSchema } from 'src/schema/lab.report.schema';
import { CommonService } from 'src/utills/commonService';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LabReport.name, schema: LabReportSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: HealthcareUnits.name, schema: HealthcareUnitsSchema },
      { name: PathologyCategory.name, schema: PathologyCategorySchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
    ]),
  ],
  controllers: [LabReportController],
  providers: [LabReportService, CommonService],
})
export class LabReportModule {}
