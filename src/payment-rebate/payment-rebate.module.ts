import { Module } from '@nestjs/common';
import { PaymentRebateService } from './payment-rebate.service';
import { PaymentRebateController } from './payment-rebate.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import {
  PaymentRebate,
  PaymentRebateSchema,
} from 'src/schema/payment-rebate.schema';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: PaymentRebate.name, schema: PaymentRebateSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
    ]),
  ],
  providers: [PaymentRebateService],
  controllers: [PaymentRebateController],
})
export class PaymentRebateModule {}
