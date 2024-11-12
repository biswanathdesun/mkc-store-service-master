import { Module } from '@nestjs/common';
import { ProductDetailsController } from './product-details.controller';
import { ProductDetailsService } from './product-details.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { Language, LanguageSchema } from 'src/schema/language.schema';
import { Price, PriceSchema } from 'src/schema/price.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { Book, BookSchema } from 'src/schema/book.schema';
import { CommonService } from 'src/utills/commonService';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import { TestSeries, TestSeriesSchema } from 'src/schema/test-series.schema';
import {
  FavouriteProduct,
  FavouriteProductSchema,
} from 'src/schema/favourite-product.schema';
import { Coupon, CouponSchema } from 'src/schema/coupon.schema';
import {
  CouponTransaction,
  CouponTransactionSchema,
} from 'src/schema/coupon.transaction.schema';
import {
  PaymentSummary,
  PaymentSummarySchema,
} from 'src/schema/payment.summary.schema';
import { SaveProduct, SaveProductSchema } from 'src/schema/save-product.schema';
import { FreeContent, FreeContentSchema } from 'src/schema/freecontent.schema';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { CarePackage, CarePackageSchema } from 'src/schema/care-package.schema';
import {
  HealthcareUser,
  HealthcareUserSchema,
} from 'src/schema/health-care-user.schema';
import { TestResult, TestResultSchema } from 'src/schema/test.result.schema';
import { EncryptionService } from 'src/utills/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: Price.name, schema: PriceSchema },
      { name: User.name, schema: UserSchema },
      { name: Language.name, schema: LanguageSchema },
      { name: Book.name, schema: BookSchema },
      { name: Cart.name, schema: CartSchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: FavouriteProduct.name, schema: FavouriteProductSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponTransaction.name, schema: CouponTransactionSchema },
      { name: PaymentSummary.name, schema: PaymentSummarySchema },
      { name: SaveProduct.name, schema: SaveProductSchema },
      { name: FreeContent.name, schema: FreeContentSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CarePackage.name, schema: CarePackageSchema },
      { name: HealthcareUser.name, schema: HealthcareUserSchema },
      { name: TestResult.name, schema: TestResultSchema },
    ]),
  ],
  controllers: [ProductDetailsController],
  providers: [ProductDetailsService, CommonService, EncryptionService],
})
export class ProductDetailsModule {}
