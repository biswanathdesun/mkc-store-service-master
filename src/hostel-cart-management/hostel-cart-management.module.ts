import { Module } from '@nestjs/common';
import { HostelCartManagementController } from './hostel-cart-management.controller';
import { HostelCartManagementService } from './hostel-cart-management.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Hostel, HostelSchema } from 'src/schema/hostel.schema';
import { HostelCart, HostelCartSchema } from 'src/schema/hostel-cart.schema';
import {
  HostelEnquiry,
  HostelEnquirySchema,
} from 'src/schema/hostel-enquiry.schema';
import {
  HostelPaymentSummary,
  HostelPaymentSummarySchema,
} from 'src/schema/hostel.payment.summary';
import { CommonService } from 'src/utills/commonService';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hostel.name, schema: HostelSchema },
      { name: HostelCart.name, schema: HostelCartSchema },
      { name: HostelPaymentSummary.name, schema: HostelPaymentSummarySchema },
      { name: HostelEnquiry.name, schema: HostelEnquirySchema },
    ]),
  ],
  controllers: [HostelCartManagementController],
  providers: [HostelCartManagementService, CommonService],
})
export class HostelCartManagementModule {}
