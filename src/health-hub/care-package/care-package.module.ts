import { Module } from '@nestjs/common';
import { CarePackageController } from './care-package.controller';
import { CarePackageService } from './care-package.service';
import { CarePackage, CarePackageSchema } from 'src/schema/care-package.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CareService, CareServiceSchema } from 'src/schema/care-service.schema';
import {
  CarePackageEnquiry,
  CarePackageEnquirySchema,
} from 'src/schema/care-package-enquiry.schema';
import { CommonService } from 'src/utills/commonService';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import {
  HospitalOrder,
  HospitalOrderSchema,
} from 'src/schema/hospital-order-schema';
import {
  HealthCareTestPackage,
  HealthCareTestPackageSchema,
} from 'src/schema/healthcare-test-package.schema';
import {
  HealthCareFinance,
  HealthCareFinanceSchema,
} from 'src/schema/healthcare-finance.schema';
import {
  FavouriteProduct,
  FavouriteProductSchema,
} from 'src/schema/favourite-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CareService.name, schema: CareServiceSchema },
      { name: CarePackage.name, schema: CarePackageSchema },
      { name: CarePackageEnquiry.name, schema: CarePackageEnquirySchema },
      { name: HospitalOrder.name, schema: HospitalOrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: FavouriteProduct.name, schema: FavouriteProductSchema },
      { name: HealthCareTestPackage.name, schema: HealthCareTestPackageSchema },
      { name: HealthCareFinance.name, schema: HealthCareFinanceSchema },
    ]),
  ],
  controllers: [CarePackageController],
  providers: [CarePackageService, CommonService],
})
export class CarePackageModule {}
