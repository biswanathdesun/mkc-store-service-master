import { Module } from '@nestjs/common';
import { CourseLibraryController } from './course-library.controller';
import { CourseLibraryService } from './course-library.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { Subject, SubjectSchema } from 'src/schema/subject.schema';
import { Chapter, ChapterSchema } from 'src/schema/chapter.schema';
import { Topic, TopicSchema } from 'src/schema/topic.schema';
import {
  CourseLibrary,
  CourseLibrarySchema,
} from 'src/schema/online-course-library.schema';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { CommonService } from 'src/utills/commonService';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseLibrary.name, schema: CourseLibrarySchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
    ]),
  ],
  controllers: [CourseLibraryController],
  providers: [CourseLibraryService, CommonService],
})
export class CourseLibraryModule {}
