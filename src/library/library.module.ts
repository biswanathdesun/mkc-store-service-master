import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import { CommonService } from 'src/utills/commonService';
import {
  CourseLibrary,
  CourseLibrarySchema,
} from 'src/schema/online-course-library.schema';
import { TestSeries, TestSeriesSchema } from 'src/schema/test-series.schema';
import {
  ReviewAndRating,
  ReviewAndRatingSchema,
} from 'src/schema/rating.schema';
import { Book, BookSchema } from 'src/schema/book.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { SaveProduct, SaveProductSchema } from 'src/schema/save-product.schema';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { LiveClass, LiveClassSchema } from 'src/schema/liveClass.schema';
import { TestResult, TestResultSchema } from 'src/schema/test.result.schema';
import { Batch, BatchSchema } from 'src/schema/batch.schema';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import {
  LessonPlanner,
  LessonPlannerSchema,
} from 'src/schema/lesson-planner.schema';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
      { name: CourseLibrary.name, schema: CourseLibrarySchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: ReviewAndRating.name, schema: ReviewAndRatingSchema },
      { name: Book.name, schema: BookSchema },
      { name: User.name, schema: UserSchema },
      { name: SaveProduct.name, schema: SaveProductSchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: LiveClass.name, schema: LiveClassSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: LessonPlanner.name, schema: LessonPlannerSchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
    ]),
  ],
  controllers: [LibraryController],
  providers: [LibraryService, CommonService],
})
export class LibraryModule {}
