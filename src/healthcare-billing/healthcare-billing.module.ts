import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { HealthcareBillingController } from './healthcare-billing.controller';
import { HealthcareBillingService } from './healthcare-billing.service';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import {
  HospitalOrder,
  HospitalOrderSchema,
} from 'src/schema/hospital-order-schema';
import {
  PaymentSummary,
  PaymentSummarySchema,
} from 'src/schema/payment.summary.schema';
import { CarePackage, CarePackageSchema } from 'src/schema/care-package.schema';
import {
  HealthcareUser,
  HealthcareUserSchema,
} from 'src/schema/health-care-user.schema';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';
import {
  CoinsTransaction,
  CoinsTransactionSchema,
} from 'src/schema/coins.transaction.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import {
  CouponTransaction,
  CouponTransactionSchema,
} from 'src/schema/coupon.transaction.schema';
import { Coupon, CouponSchema } from 'src/schema/coupon.schema';
import { FollowUp, FollowUpSchema } from 'src/schema/followup.schema';
import {
  HealthCareTestDatabase,
  HealthCareTestDatabaseSchema,
} from 'src/schema/healthcare-test-database.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      {
        name: HealthCareTestDatabase.name,
        schema: HealthCareTestDatabaseSchema,
      },
      { name: Coupon.name, schema: CouponSchema },
      { name: PaymentSummary.name, schema: PaymentSummarySchema },
      { name: HospitalOrder.name, schema: HospitalOrderSchema },
      { name: CarePackage.name, schema: CarePackageSchema },
      { name: HealthcareUser.name, schema: HealthcareUserSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
      { name: CoinsTransaction.name, schema: CoinsTransactionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
      { name: CouponTransaction.name, schema: CouponTransactionSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
    ]),
  ],
  controllers: [HealthcareBillingController],
  providers: [HealthcareBillingService],
})
export class HealthcareBillingModule {}
