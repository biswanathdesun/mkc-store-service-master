import { Module } from '@nestjs/common';
import { TestReportController } from './test-report.controller';
import { TestReportService } from './test-report.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TestResult, TestResultSchema } from 'src/schema/test.result.schema';
import {
  QuestionBank,
  QuestionBankSchema,
} from 'src/schema/question-bank.schema';
import { ScoreBoard, ScoreBoardSchema } from 'src/schema/score-board.schema';
import { TestMaster, TestMasterSchema } from 'src/schema/test-master.schema';
import { OmrReport, OmrReportSchema } from 'src/schema/omr.report.schema';
import {
  StudentBatch,
  StudentBatchSchema,
} from 'src/schema/student-batch.schema';
import { StudentRank, StudentRankSchema } from 'src/schema/student-rank.schema';
import {
  EventApplied,
  EventAppliedSchema,
} from 'src/schema/event.apply.schema';
import { CommonService } from 'src/utills/commonService';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionBank.name, schema: QuestionBankSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: ScoreBoard.name, schema: ScoreBoardSchema },
      { name: TestMaster.name, schema: TestMasterSchema },
      { name: OmrReport.name, schema: OmrReportSchema },
      { name: StudentBatch.name, schema: StudentBatchSchema },
      { name: StudentRank.name, schema: StudentRankSchema },
      { name: EventApplied.name, schema: EventAppliedSchema },
    ]),
  ],
  controllers: [TestReportController],
  providers: [TestReportService, CommonService],
})
export class TestReportModule {}
