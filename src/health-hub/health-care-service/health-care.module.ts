import { Module } from '@nestjs/common';
import { HealthCareController } from './health-care.controller';
import { HealthCareService } from './health-care.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CareService, CareServiceSchema } from 'src/schema/care-service.schema';
import { CommonService } from 'src/utills/commonService';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { CarePackage, CarePackageSchema } from 'src/schema/care-package.schema';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CareService.name, schema: CareServiceSchema },
      { name: Order.name, schema: OrderSchema },
      { name: CarePackage.name, schema: CarePackageSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
    ]),
  ],
  controllers: [HealthCareController],
  providers: [HealthCareService, CommonService],
})
export class HealthCareModule {}
