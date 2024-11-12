import { Module } from '@nestjs/common';
import { TestSeriesController } from './test-series.controller';
import { TestSeriesService } from './test-series.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from 'src/schema/category.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { Language, LanguageSchema } from 'src/schema/language.schema';
import { Price, PriceSchema } from 'src/schema/price.schema';
import { CommonService } from 'src/utills/commonService';
import { TestSeries, TestSeriesSchema } from 'src/schema/test-series.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Course.name, schema: CourseSchema },
      { name: Language.name, schema: LanguageSchema },
      { name: Price.name, schema: PriceSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
    ]),
  ],
  controllers: [TestSeriesController],
  providers: [TestSeriesService, CommonService],
})
export class TestSeriesModule {}
