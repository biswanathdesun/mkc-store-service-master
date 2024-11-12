import { Module } from '@nestjs/common';
import { TestMasterController } from './test-master.controller';
import { TestMasterService } from './test-master.service';
import { Staff, StaffSchema } from 'src/schema/staff.schema';
import { Category, CategorySchema } from 'src/schema/category.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { TestMaster, TestMasterSchema } from 'src/schema/test-master.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuestionBank,
  QuestionBankSchema,
} from 'src/schema/question-bank.schema';
import { TestSeries, TestSeriesSchema } from 'src/schema/test-series.schema';
import {
  TestDraftQuestion,
  TestDraftQuestionSchema,
} from 'src/schema/test-draft-question.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import { SaveProduct, SaveProductSchema } from 'src/schema/save-product.schema';
import { TestResult, TestResultSchema } from 'src/schema/test.result.schema';
import {
  OnlineCourse,
  OnlineCourseSchema,
} from 'src/schema/online-course.schema';
import { Language, LanguageSchema } from 'src/schema/language.schema';
import { ScoreBoard, ScoreBoardSchema } from 'src/schema/score-board.schema';
import { ExamSchema, Exam } from 'src/schema/exam.schema';
import {
  InstructorAllocation,
  InstructorAllocationSchema,
} from 'src/schema/instructor-allocation.schema';
import { Role, RolesSchema } from 'src/schema/role.schema';
import { Event, EventSchema } from 'src/schema/event.schema';
import {
  EventApplied,
  EventAppliedSchema,
} from 'src/schema/event.apply.schema';
import {
  QuestionType,
  QuestionTypeSchema,
} from 'src/schema/question-type.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: EventApplied.name, schema: EventAppliedSchema },
      { name: Event.name, schema: EventSchema },
      { name: Role.name, schema: RolesSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Course.name, schema: CourseSchema },
      { name: Language.name, schema: LanguageSchema },
      { name: User.name, schema: UserSchema },
      { name: TestMaster.name, schema: TestMasterSchema },
      { name: QuestionBank.name, schema: QuestionBankSchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: TestDraftQuestion.name, schema: TestDraftQuestionSchema },
      { name: SaveProduct.name, schema: SaveProductSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: OnlineCourse.name, schema: OnlineCourseSchema },
      { name: ScoreBoard.name, schema: ScoreBoardSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: QuestionType.name, schema: QuestionTypeSchema },
      { name: InstructorAllocation.name, schema: InstructorAllocationSchema },
    ]),
  ],
  controllers: [TestMasterController],
  providers: [TestMasterService],
})
export class TestMasterModule {}
