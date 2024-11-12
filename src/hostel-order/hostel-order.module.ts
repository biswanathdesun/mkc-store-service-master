import { Module } from '@nestjs/common';
import { HostelOrderController } from './hostel-order.controller';
import { HostelOrderService } from './hostel-order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import { HostelOrder, HostelOrderSchema } from 'src/schema/hostel-order.schema';
import {
  HostelEnquiry,
  HostelEnquirySchema,
} from 'src/schema/hostel-enquiry.schema';
import {
  HostelRentalPay,
  HostelRentalPaySchema,
} from 'src/schema/hostel-rental-pay.schema';
import { CommonService } from 'src/utills/commonService';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';
import {
  UserHostelValidity,
  UserHostelValiditySchema,
} from 'src/schema/user.hostel.validity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: SettingSchema },
      { name: UserHostelValidity.name, schema: UserHostelValiditySchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
      { name: HostelOrder.name, schema: HostelOrderSchema },
      { name: HostelEnquiry.name, schema: HostelEnquirySchema },
      { name: HostelRentalPay.name, schema: HostelRentalPaySchema },
    ]),
  ],
  controllers: [HostelOrderController],
  providers: [HostelOrderService, CommonService],
})
export class HostelOrderModule {}
