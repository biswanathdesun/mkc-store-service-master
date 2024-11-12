import { Module } from '@nestjs/common';
import { DefaultersController } from './defaulters.controller';
import { DefaultersService } from './defaulters.service';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import { FollowUp, FollowUpSchema } from 'src/schema/followup.schema';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { Timeline, TimelineSchema } from 'src/schema/timeline.schema';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import {
  StudentAdmissionDetails,
  StudentAdmissionDetailsSchema,
} from 'src/schema/student-admission-date.schema';
import { SmsService } from 'src/utills/smsService';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import {
  Communication,
  CommunicationSchema,
} from 'src/schema/communication.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Communication.name, schema: CommunicationSchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: User.name, schema: UserSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
      {
        name: StudentAdmissionDetails.name,
        schema: StudentAdmissionDetailsSchema,
      },
    ]),
  ],
  controllers: [DefaultersController],
  providers: [DefaultersService, SmsService],
})
export class DefaultersModule {}
