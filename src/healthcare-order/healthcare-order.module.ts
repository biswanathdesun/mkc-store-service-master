import { Module } from '@nestjs/common';
import { HealthcareOrderController } from './healthcare-order.controller';
import { HealthcareOrderService } from './healthcare-order.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HospitalOrder,
  HospitalOrderSchema,
} from 'src/schema/hospital-order-schema';
import {
  HealthcareUser,
  HealthcareUserSchema,
} from 'src/schema/health-care-user.schema';
import { CommonService } from 'src/utills/commonService';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import {
  HealthCareTestDatabase,
  HealthCareTestDatabaseSchema,
} from 'src/schema/healthcare-test-database.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: SettingSchema },
      { name: HospitalOrder.name, schema: HospitalOrderSchema },
      { name: HealthcareUser.name, schema: HealthcareUserSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
      {
        name: HealthCareTestDatabase.name,
        schema: HealthCareTestDatabaseSchema,
      },
    ]),
  ],
  controllers: [HealthcareOrderController],
  providers: [HealthcareOrderService, CommonService],
})
export class HealthcareOrderModule {}
