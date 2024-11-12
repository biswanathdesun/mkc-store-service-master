import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HostelDefaulterController } from './hostel-defaulter.controller';
import { HostelDefaulterService } from './hostel-defaulter.service';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import {
  HostelEnquiry,
  HostelEnquirySchema,
} from 'src/schema/hostel-enquiry.schema';
import {
  HostelRentalPay,
  HostelRentalPaySchema,
} from 'src/schema/hostel-rental-pay.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: HostelEnquiry.name, schema: HostelEnquirySchema },
      { name: HostelRentalPay.name, schema: HostelRentalPaySchema },
    ]),
  ],
  controllers: [HostelDefaulterController],
  providers: [HostelDefaulterService],
})
export class HostelDefaulterModule {}
