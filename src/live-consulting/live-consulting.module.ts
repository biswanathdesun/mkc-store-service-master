import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveConsultingController } from './live-consulting.controller';
import { LiveConsultingService } from './live-consulting.service';
import {
  LiveConsulting,
  LiveConsultingSchema,
} from 'src/schema/live-consulting.schema';
import { CommonService } from 'src/utills/commonService';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveConsulting.name, schema: LiveConsultingSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
    ]),
  ],
  controllers: [LiveConsultingController],
  providers: [LiveConsultingService, CommonService],
})
export class LiveConsultingModule {}
