import { Module } from '@nestjs/common';
import { FineTrackerController } from './fine-tracker.controller';
import { FineTrackerService } from './fine-tracker.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { FineTracker, FineTrackerSchema } from 'src/schema/fine.tracker.schema';
import { Batch, BatchSchema } from 'src/schema/batch.schema';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import {
  StudentAttendance,
  StudentAttendanceSchema,
} from 'src/schema/student-attendance.schema';
import {
  AttendanceReport,
  AttendanceReportSchema,
} from 'src/schema/live-attendance-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AttendanceReport.name, schema: AttendanceReportSchema },
      { name: FineTracker.name, schema: FineTrackerSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: StudentAttendance.name, schema: StudentAttendanceSchema },
    ]),
  ],
  controllers: [FineTrackerController],
  providers: [FineTrackerService],
})
export class FineTrackerModule {}
