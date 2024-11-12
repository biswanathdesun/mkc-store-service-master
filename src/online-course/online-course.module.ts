import { Module } from '@nestjs/common';
import { OnlineCourseController } from './online-course.controller';
import { OnlineCourseService } from './online-course.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { Language, LanguageSchema } from 'src/schema/language.schema';
import { Category, CategorySchema } from 'src/schema/category.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { Price, PriceSchema } from 'src/schema/price.schema';
import { CommonService } from 'src/utills/commonService';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import {
  SolutionArticle,
  SolutionArticleSchema,
} from 'src/schema/solution-article.schema';
import { Batch, BatchSchema } from 'src/schema/batch.schema';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import { LiveClass, LiveClassSchema } from 'src/schema/liveClass.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import {
  InventoryItemTransaction,
  InventoryItemTransactionSchema,
} from 'src/schema/inventory-item-transaction.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Language.name, schema: LanguageSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Course.name, schema: CourseSchema },
      { name: Price.name, schema: PriceSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: SolutionArticle.name, schema: SolutionArticleSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: LiveClass.name, schema: LiveClassSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
      { name: User.name, schema: UserSchema },
      {
        name: InventoryItemTransaction.name,
        schema: InventoryItemTransactionSchema,
      },
    ]),
  ],
  controllers: [OnlineCourseController],
  providers: [OnlineCourseService, CommonService],
})
export class OnlineCourseModule {}
