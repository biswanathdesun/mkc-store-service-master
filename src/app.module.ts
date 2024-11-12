import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BookModule } from './book/book.module';
import { OnlineCourseModule } from './online-course/online-course.module';
import { TestSeriesModule } from './test-series/test-series.module';
import { ProductDetailsModule } from './product-details/product-details.module';
import { Token, TokenSchema } from './schema/token.schema';
import { CourseLibraryModule } from './course-library/course-library.module';
import { TestMasterModule } from './test-master/test-master.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { JwtMiddleware } from './middleware/jwtMiddleware';
import { LibraryModule } from './library/library.module';
import { DefaultersModule } from './defaulters/defaulters.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { InventoryCategoryModule } from './inventory-category/inventory-category.module';
import { ProductCatalogModule } from './product-catalog/product-catalog.module';
import { TestReportModule } from './test-report/test-report.module';
import { HostelModule } from './hostel/hostel.module';
import { CommentModule } from './comment/comment.module';
import { StockEntryModule } from './stock-entry/stock-entry.module';
import { CarePackageModule } from './health-hub/care-package/care-package.module';
import { PaymentRebateModule } from './payment-rebate/payment-rebate.module';
import { DefaulterReportModule } from './defaulter-report/defaulter-report.module';
import { HealthCareModule } from './health-hub/health-care-service/health-care.module';
import { HealthcareBillingModule } from './healthcare-billing/healthcare-billing.module';
import { HealthcareOrderModule } from './healthcare-order/healthcare-order.module';
import { LiveConsultingModule } from './live-consulting/live-consulting.module';
import { LabReportModule } from './lab-report/lab-report.module';
import { FineTrackerModule } from './fine-tracker/fine-tracker.module';
import { HealthCareDefaulterModule } from './health-care-defaulter/health-care-defaulter.module';
import { HostelHubPayModule } from './hostel-hub-pay/hostel-hub-pay.module';
import { HostelOrderModule } from './hostel-order/hostel-order.module';
import { HostelCartManagementModule } from './hostel-cart-management/hostel-cart-management.module';
import { HostelDefaulterModule } from './hostel-defaulter/hostel-defaulter.module';
import { HostelReportModule } from './hostel-report/hostel-report.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DB_URI,
      }),
    }),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    BookModule,
    OnlineCourseModule,
    TestSeriesModule,
    ProductDetailsModule,
    CourseLibraryModule,
    TestMasterModule,
    PaymentModule,
    OrderModule,
    LibraryModule,
    DefaultersModule,
    WarehouseModule,
    InventoryCategoryModule,
    ProductCatalogModule,
    TestReportModule,
    HostelModule,
    CommentModule,
    StockEntryModule,
    HealthCareModule,
    CarePackageModule,
    PaymentRebateModule,
    DefaulterReportModule,
    HealthcareBillingModule,
    HealthcareOrderModule,
    LiveConsultingModule,
    LabReportModule,
    FineTrackerModule,
    HealthCareDefaulterModule,
    HostelHubPayModule,
    HostelOrderModule,
    HostelCartManagementModule,
    HostelDefaulterModule,
    HostelReportModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
