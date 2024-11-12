import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import {
  UserDeliveryAddress,
  UserDeliveryAddressSchema,
} from 'src/schema/userDeliveryAddress.schema';
import {
  PaymentSummary,
  PaymentSummarySchema,
} from 'src/schema/payment.summary.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { Event, EventSchema } from 'src/schema/event.schema';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';
import { Coupon, CouponSchema } from 'src/schema/coupon.schema';
import {
  CouponTransaction,
  CouponTransactionSchema,
} from 'src/schema/coupon.transaction.schema';
import {
  CoinsTransaction,
  CoinsTransactionSchema,
} from 'src/schema/coins.transaction.schema';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import { CommonService } from 'src/utills/commonService';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import { Batch, BatchSchema } from 'src/schema/batch.schema';
import {
  StudentAdmissionDetails,
  StudentAdmissionDetailsSchema,
} from 'src/schema/student-admission-date.schema';

import {
  PreviousCourseHistory,
  PreviousCourseHistorySchema,
} from 'src/schema/previous-course-history.schema';
import { Timeline, TimelineSchema } from 'src/schema/timeline.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';
import { MasterBatch, MasterBatchSchema } from 'src/schema/master-batch.schema';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { Role, RolesSchema } from 'src/schema/role.schema';
import {
  StudentAttendance,
  StudentAttendanceSchema,
} from 'src/schema/student-attendance.schema';
import { SmsService } from 'src/utills/smsService';
import { FineTracker, FineTrackerSchema } from 'src/schema/fine.tracker.schema';
import {
  Communication,
  CommunicationSchema,
} from 'src/schema/communication.schema';
import { FollowUp, FollowUpSchema } from 'src/schema/followup.schema';
import {
  AttendanceReport,
  AttendanceReportSchema,
} from 'src/schema/live-attendance-report.schema';
import { Book, BookSchema } from 'src/schema/book.schema';
import {
  InventoryItemTransaction,
  InventoryItemTransactionSchema,
} from 'src/schema/inventory-item-transaction.schema';
import { Warehouse, WarehouseSchema } from 'src/schema/warehouse.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: AttendanceReport.name, schema: AttendanceReportSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Communication.name, schema: CommunicationSchema },
      { name: FineTracker.name, schema: FineTrackerSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentSummary.name, schema: PaymentSummarySchema },
      { name: UserDeliveryAddress.name, schema: UserDeliveryAddressSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: Event.name, schema: EventSchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponTransaction.name, schema: CouponTransactionSchema },
      { name: CoinsTransaction.name, schema: CoinsTransactionSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: PreviousCourseHistory.name, schema: PreviousCourseHistorySchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: Token.name, schema: TokenSchema },
      { name: MasterBatch.name, schema: MasterBatchSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Role.name, schema: RolesSchema },
      { name: StudentAttendance.name, schema: StudentAttendanceSchema },
      {
        name: StudentAdmissionDetails.name,
        schema: StudentAdmissionDetailsSchema,
      },
      {
        name: Book.name,
        schema: BookSchema,
      },
      {
        name: InventoryItemTransaction.name,
        schema: InventoryItemTransactionSchema,
      },
      {
        name: Warehouse.name,
        schema: WarehouseSchema,
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, CommonService, SmsService],
})
export class PaymentModule {}
