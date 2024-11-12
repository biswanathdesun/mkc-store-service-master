import { Module } from '@nestjs/common';
import { HealthCareDefaulterController } from './health-care-defaulter.controller';
import { HealthCareDefaulterService } from './health-care-defaulter.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HealthcareUser,
  HealthcareUserSchema,
} from 'src/schema/health-care-user.schema';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { FollowUp, FollowUpSchema } from 'src/schema/followup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: HealthcareUser.name, schema: HealthcareUserSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
    ]),
  ],
  controllers: [HealthCareDefaulterController],
  providers: [HealthCareDefaulterService],
})
export class HealthCareDefaulterModule {}
