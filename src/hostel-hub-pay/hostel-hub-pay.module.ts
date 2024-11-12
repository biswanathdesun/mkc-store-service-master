import { Module } from '@nestjs/common';
import { HostelHubPayController } from './hostel-hub-pay.controller';
import { HostelHubPayService } from './hostel-hub-pay.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HostelOrder, HostelOrderSchema } from 'src/schema/hostel-order.schema';
import {
  HostelRentalPay,
  HostelRentalPaySchema,
} from 'src/schema/hostel-rental-pay.schema';
import { Hostel, HostelSchema } from 'src/schema/hostel.schema';
import {
  HostelEnquiry,
  HostelEnquirySchema,
} from 'src/schema/hostel-enquiry.schema';
import {
  UserHostelValidity,
  UserHostelValiditySchema,
} from 'src/schema/user.hostel.validity.schema';
import { HostelCart, HostelCartSchema } from 'src/schema/hostel-cart.schema';
import {
  HostelPaymentSummary,
  HostelPaymentSummarySchema,
} from 'src/schema/hostel.payment.summary';
import { Token, TokenSchema } from 'src/schema/token.schema';
import { Timeline, TimelineSchema } from 'src/schema/timeline.schema';
import {
  HostelChangeHistory,
  HostelChangeHistorySchema,
} from 'src/schema/hostel-change-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hostel.name, schema: HostelSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: Token.name, schema: TokenSchema },
      { name: HostelChangeHistory.name, schema: HostelChangeHistorySchema },
      { name: HostelCart.name, schema: HostelCartSchema },
      { name: HostelEnquiry.name, schema: HostelEnquirySchema },
      { name: HostelPaymentSummary.name, schema: HostelPaymentSummarySchema },
      { name: UserHostelValidity.name, schema: UserHostelValiditySchema },
      { name: HostelOrder.name, schema: HostelOrderSchema },
      { name: HostelRentalPay.name, schema: HostelRentalPaySchema },
    ]),
  ],
  controllers: [HostelHubPayController],
  providers: [HostelHubPayService],
})
export class HostelHubPayModule {}
