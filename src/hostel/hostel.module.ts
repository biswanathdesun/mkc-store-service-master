import { Module } from '@nestjs/common';
import { HostelController } from './hostel.controller';
import { HostelService } from './hostel.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Hostel, HostelSchema } from 'src/schema/hostel.schema';
import { CommonService } from 'src/utills/commonService';
import {
  HostelEnquiry,
  HostelEnquirySchema,
} from 'src/schema/hostel-enquiry.schema';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import { HostelOrder, HostelOrderSchema } from 'src/schema/hostel-order.schema';
import {
  HostelRentalPay,
  HostelRentalPaySchema,
} from 'src/schema/hostel-rental-pay.schema';
import {
  UserHostelValidity,
  UserHostelValiditySchema,
} from 'src/schema/user.hostel.validity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hostel.name, schema: HostelSchema },
      { name: HostelRentalPay.name, schema: HostelRentalPaySchema },
      { name: HostelOrder.name, schema: HostelOrderSchema },
      { name: HostelEnquiry.name, schema: HostelEnquirySchema },
      { name: Setting.name, schema: SettingSchema },
      { name: UserHostelValidity.name, schema: UserHostelValiditySchema },
    ]),
  ],
  controllers: [HostelController],
  providers: [HostelService, CommonService],
})
export class HostelModule {}
