import mongoose, { Model } from 'mongoose';
import * as _ from 'lodash';
import * as ExcelJS from 'exceljs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TestResult } from 'src/schema/test.result.schema';
import { AttemptCountDto } from './dto/attempt-count.dto';
import {
  AnswerKeyForAdminInterface,
  AnswerKeyInterface,
  AttemptCountInterface,
} from './interface/test-report-interfaces';
import {
  ERROR_OMR_FILE_UPLOAD,
  INVALID_TEST_ATTEMPT,
  INVALID_FILE,
  INVALID_FILE_TYPE,
  INVALID_ID,
  OMR_REPORT_FILE_UPLOAD,
  RECORD_NOT_FOUND,
  DELETE_DATA,
} from 'src/utills/messages';
import { TestResultDto } from './dto/test-result.dto';
import { QuestionBank } from 'src/schema/question-bank.schema';
import {
  AnswerKeyTypes,
  AnswerPaceTypes,
  ApplicationType,
  QuestionResponseStatus,
  TestMasterAttemptModeTypes,
  TestMasterTypes,
  TestSubmitType,
} from 'src/utills/enum';
import { TestMaster } from 'src/schema/test-master.schema';
import { AdminAnswerDetailsDto } from './dto/answer-key-admin.dto';
import { OmrReport } from 'src/schema/omr.report.schema';
import { BulkUploadDto } from './dto/bulk-upload.dto';
import { StudentBatch } from 'src/schema/student-batch.schema';
import { OmrResultDto } from './dto/omr-result.dto';
import { StudentRank } from 'src/schema/student-rank.schema';
import { EventApplied } from 'src/schema/event.apply.schema';
import { AdminReportDto } from './dto/admin-list-report.dto';
import { CommonService } from 'src/utills/commonService';
import { DeleteReportDto } from './dto/delete-attempted-test.dto';

@Injectable()
export class TestReportService {
  constructor(
    @InjectModel(QuestionBank.name)
    private questionBankModel: Model<QuestionBank>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResult>,
    @InjectModel(TestMaster.name) private testMasterModel: Model<TestMaster>,
    @InjectModel(OmrReport.name) private omrReportModel: Model<OmrReport>,
    @InjectModel(StudentRank.name) private studentRankModel: Model<StudentRank>,
    @InjectModel(EventApplied.name)
    private eventAppliedModel: Model<EventApplied>,
    @InjectModel(StudentBatch.name)
    private studentBatchModel: Model<StudentBatch>,
    private readonly commonService: CommonService,
  ) {}

  // SECTION - get test attempt count of the user
  async getAttemptCount(
    payload: AttemptCountDto,
    studentId: string,
  ): Promise<{ data: AttemptCountInterface[] }> {
    const { testId, userId, application } = payload;

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    //NOTE - serach based on testId
    const testParams = testId
      ? objectIdPattern.test(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - get latested test attempt count
    const attempt = await this.testResultModel
      .findOne({
        studentId:
          application === ApplicationType.ADMIN
            ? new mongoose.Types.ObjectId(userId)
            : new mongoose.Types.ObjectId(studentId),
        ...testParams,
      })
      .sort({ createdAt: -1 });

    if (!attempt)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    //NOTE - create the attempt options
    const attemptOptions = attempt
      ? Array.from({ length: attempt.attemptCount }, (_, index) => ({
          value: index + 1,
          label: `${index + 1} attempt${index > 0 ? 's' : ''}`,
        }))
      : [];

    return { data: attemptOptions };
  }

  // SECTION - get Answer Key Details
  async getAnswerKeyDetails(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{
    all: number;
    correct: number;
    inCorrect: number;
    unAttempted: number;
    data: AnswerKeyInterface[];
  }> {
    let allCount = 0;
    let correctCount = 0;
    let inCorrectCount = 0;
    let unAttemptedCount = 0;

    const { type, testId, attemptCount, userId, application } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId:
          application === ApplicationType.ADMIN
            ? new mongoose.Types.ObjectId(userId)
            : new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate([{ path: 'scoreSchemaId', select: 'plus minus' }])
      .select('-scoreSchemaId')
      .lean();

    //NOTE - get all count
    allCount = attempt.length;

    if (!attempt)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    //NOTE : Common function to process question details
    const processQuestionDetails = async (data: any, type: AnswerKeyTypes) => {
      const { uniqueId, answer } = data;

      const questionDetails = await this.questionBankModel.findOne({
        uniqueId,
      });

      const isAttempted =
        data.responseStatus === QuestionResponseStatus.ATTEMPTED;

      const isNotAttempted =
        data.responseStatus !== QuestionResponseStatus.ATTEMPTED;

      const isCorrect = isAttempted && answer === questionDetails.answer;
      const isInCorrect = isAttempted && answer !== questionDetails.answer;

      //NOTE - update counts value keys
      correctCount += isCorrect ? 1 : 0;
      inCorrectCount += isAttempted && !isCorrect ? 1 : 0;
      unAttemptedCount += !isAttempted ? 1 : 0;

      //NOTE - calculate the marks
      const marks = isCorrect
        ? Number(data?.scoreSchemaId?.plus)
        : isAttempted
        ? -Number(data?.scoreSchemaId?.minus)
        : 0;

      let userAnswer = answer;
      if (['a', 'b', 'c', 'd', 'e'].includes(answer)) {
        userAnswer = `<p>${answer})</p> ${questionDetails[answer]}`;
      }

      let realAnswer: any = questionDetails.answer;
      if (['a', 'b', 'c', 'd', 'e'].includes(questionDetails.answer)) {
        realAnswer = `<p>${questionDetails.answer})</p> ${
          questionDetails[questionDetails.answer]
        }`;
      }

      if (
        type === AnswerKeyTypes.ALL ||
        (type === AnswerKeyTypes.CORRECT && isCorrect) ||
        (type === AnswerKeyTypes.INCORRECT && isInCorrect) ||
        (type === AnswerKeyTypes.UNATTEMPTED && isNotAttempted)
      ) {
        return {
          _id: questionDetails._id,
          question: questionDetails.question,
          answer: userAnswer,
          correctAnswer: realAnswer,
          spendTime: data.spendTime,
          difficultyLevels: questionDetails.difficultyLevels,
          explanation: questionDetails.explanation,
          marks,
          isCorrect,
        };
      }

      return null;
    };

    const resultPromises = attempt.map(async (data: any) =>
      processQuestionDetails(data, type),
    );
    //NOTE - find final response
    const result = (await Promise.all(resultPromises)).filter(
      (item) => item !== null,
    );

    return {
      all: allCount,
      correct: correctCount,
      inCorrect: inCorrectCount,
      unAttempted: unAttemptedCount,
      data: result,
    };
  }

  // SECTION - get Student Efficiency
  async getStudentEfficiency(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate([
        { path: 'scoreSchemaId', select: 'plus minus' },
        { path: 'testId', select: 'duration' },
      ])
      .select('-scoreSchemaId -testId')
      .lean();

    if (!attempt)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    const attemptQuestionCount = attempt.filter(
      (attempt: { responseStatus: QuestionResponseStatus }) =>
        attempt.responseStatus !== QuestionResponseStatus.SKIPPED,
    ).length;

    //NOTE: Calculate total time in minutes and seconds
    const { timeTakenByUser } = await this.calculateTotalTime(
      attempt.map((attempt: { spendTime: string }) => attempt.spendTime),
    );
    //NOTE: Calculate total time in minutes and seconds
    const { averagetime } = await this.calculateAverageTime(
      attemptQuestionCount,
      attempt.map((attempt: { spendTime: string }) => attempt.spendTime),
    );

    const result = {
      totalTime: `${attempt[0]?.testId?.duration} Min`,
      timeTaken: timeTakenByUser,
      averagetime,
    };

    return { data: result };
  }

  // SECTION - Time wise question Analysis
  async questionAnalysis(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount, mode } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - if OMR result
    if (mode === TestSubmitType.OMR) {
      const omrResult = await this.questionAnalysisForOmr(
        studentId,
        testParams,
      );

      return { data: omrResult };
    }

    // NOTE - get latest test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate({ path: 'scoreSchemaId', select: 'plus minus' })
      .populate({
        path: 'testId',
        select: 'duration testNumber title eventId paperId createdAt',
        populate: [
          { path: 'eventId', select: 'eventName date' },
          { path: 'examId', select: 'name' },
        ],
      })
      .select('-scoreSchemaId')
      .lean();

    if (!attempt)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    //NOTE - get count
    const result = await attempt.reduce(async (countsPromise, data) => {
      const counts = await countsPromise;
      const { uniqueId, answer, testId } = data;
      const questionDetails = await this.questionBankModel.findOne({
        uniqueId,
      });

      const isAttempted =
        data.responseStatus === QuestionResponseStatus.ATTEMPTED;
      const isCorrect = isAttempted && answer === questionDetails.answer;

      // NOTE - update counts value keys
      counts.correctCount += isCorrect ? 1 : 0;
      counts.inCorrectCount += isAttempted && !isCorrect ? 1 : 0;
      counts.unAttemptedCount += !isAttempted ? 1 : 0;

      // Add event name and test title to the result
      counts.eventName = testId.eventId?.eventName;
      counts.paperName = testId.examId?.name; //FIXME - send the exam name(need to change the key name)
      counts.testTitle = testId.title;
      counts.testNumber = testId.testNumber;
      counts.eventDate = await this.convertToShortDate(testId.eventId?.date);
      counts.testDate = await this.convertToShortDate(testId?.createdAt);
      return counts;
    }, Promise.resolve({ correctCount: 0, inCorrectCount: 0, unAttemptedCount: 0 }));

    //NOTE -

    return { data: result };
  }

  // SECTION - get user achieved Percentage for a test
  async achievedPercentage(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: number }> {
    const { testId, attemptCount } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate([{ path: 'scoreSchemaId', select: 'plus minus' }])
      .select('-scoreSchemaId')
      .lean();

    //NOTE - get test total marks
    const totalMarks = attempt.reduce(
      (sum: number, item: { scoreSchemaId: { plus: string | number } }) =>
        sum + +item.scoreSchemaId?.plus,
      0,
    );

    //NOTE - get user correct marks based on the correct answer attempt
    const correctAnswerMarks = await attempt.reduce(
      async (promiseAcc: Promise<number>, data) => {
        const acc = await promiseAcc; //TODO: Wait for the previous Promise to resolve
        const { uniqueId, answer, responseStatus, scoreSchemaId } = data;
        const { plus } = scoreSchemaId;
        const questionDetails = await this.questionBankModel.findOne({
          uniqueId,
        });

        const isAttempted = responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect = isAttempted && answer === questionDetails.answer;

        return isCorrect ? acc + Number(plus) : acc;
      },
      Promise.resolve(0), //TODO: Initial value, a resolved Promise with 0
    );

    //NOTE - calculate Percentage
    const calculatePercentage = (correctAnswerMarks / totalMarks) * 100;

    return { data: calculatePercentage };
  }

  //SECTION - get test attempted student details (for admin)
  async getAttemptedStudent(
    payload: AdminReportDto,
  ): Promise<{ data: any; count: number }> {
    const { testId, mode, page, limit } = payload;

    //NOTE - get all attempted test details
    const testResults = await this.testResultModel.aggregate([
      {
        $match: {
          testId: new mongoose.Types.ObjectId(testId),
          ...(mode && { mode }),
        },
      },
      {
        $group: {
          _id: { studentId: '$studentId', testId: '$testId' },
          attemptCount: { $last: '$$ROOT' },
          totalCount: { $sum: 1 },
        },
      },
      {
        $replaceRoot: { newRoot: '$attemptCount' },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentDetails',
        },
      },
      { $unwind: '$studentDetails' },
      {
        $lookup: {
          from: 'testmasters',
          localField: 'testId',
          foreignField: '_id',
          as: 'testDetails',
        },
      },
      { $unwind: '$testDetails' },
      {
        $addFields: { testBatchId: { $toObjectId: '$testDetails.batchId' } },
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'testBatchId',
          foreignField: '_id',
          as: 'testBatchId',
        },
      },
      {
        $unwind: { path: '$testBatchId', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'studentranks',
          let: { testId: '$testId', studentId: '$studentId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$testId', '$$testId'] },
                    { $eq: ['$studentId', '$$studentId'] },
                  ],
                },
              },
            },
          ],
          as: 'rankDetails',
        },
      },
      {
        $addFields: {
          rank: {
            $cond: [
              { $eq: [{ $size: '$rankDetails' }, 0] },
              null,
              { $arrayElemAt: ['$rankDetails.rank', 0] },
            ],
          },
          percentage: {
            $cond: [
              { $eq: [{ $size: '$rankDetails' }, 0] },
              null,
              {
                $round: [{ $arrayElemAt: ['$rankDetails.percentage', 0] }, 2],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          testId: 1,
          studentId: 1,
          attemptCount: 1,
          scoreSchemaId: 1,
          responseStatus: 1,
          rank: 1,
          attemptedFrom: { $ifNull: ['$attemptedFrom', null] },
          studentAttemptedMode: '$mode',
          percentage: 1,
          studentName: '$studentDetails.name',
          batchName: '$testBatchId.name',
          testName: '$testDetails.title',
          attemptMode: '$testDetails.attemptMode',
          mode: '$testDetails.mode',
          totalMarks: { $ifNull: ['$testDetails.totalMarks', 0] },
          createdAt: 1,
        },
      },
      { $sort: { rank: 1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          count: [{ $count: 'total' }],
        },
      },
    ]);

    //NOTE: Extract the paginated data and count from the result
    const [{ data, count }] = testResults;

    if (!testResults) {
      return { data: [], count: count[0].total };
    }

    //NOTE: Iterate over testResults to calculate marks for each result
    await Promise.all(
      data.map(
        async (data: {
          marks?: any;
          testId?: any;
          studentId?: any;
          attemptCount?: any;
        }) => {
          const { testId, studentId, attemptCount } = data;

          //NOTE: Get all result based on the attemptCount
          const resultDetails: any = await this.testResultModel
            .find({
              testId,
              studentId,
              attemptCount,
            })
            .populate('scoreSchemaId', 'plus minus');

          //NOTE: Calculate the total marks for the current testResult
          const marksPromises = resultDetails.map(
            async (result: {
              responseStatus?: any;
              questionId?: any;
              scoreSchemaId?: any;
              answer?: any;
            }) => {
              const { questionId, scoreSchemaId, answer, responseStatus } =
                result;
              //NOTE: Get question details
              const questionDetails = await this.questionBankModel.findById(
                questionId,
              );

              const isAttempted =
                responseStatus === QuestionResponseStatus.ATTEMPTED;

              const isCorrect =
                isAttempted && answer === questionDetails.answer;
              const inCorrect =
                isAttempted && answer !== questionDetails.answer;

              // Calculate the marks and add to the total
              const correctMark = isCorrect ? Number(scoreSchemaId?.plus) : 0;
              const inCorrectMark = inCorrect
                ? Number(scoreSchemaId?.minus)
                : 0;

              return { correctMark, inCorrectMark };
            },
          );

          // Calculate total marks and other statistics
          const marksData = await Promise.all(marksPromises);
          const totalCorrectMark = marksData.reduce(
            (sum, { correctMark }) => sum + correctMark,
            0,
          );
          const totalIncorrectMark = marksData.reduce(
            (sum, { inCorrectMark }) => sum + inCorrectMark,
            0,
          );

          data.marks = Number(
            (totalCorrectMark - totalIncorrectMark).toFixed(2),
          );
        },
      ),
    );

    //NOTE: Sort based on marks if rank is null
    data.sort(
      (
        a: { rank: number; marks: number },
        b: { rank: number; marks: number },
      ) => {
        if (!a.rank && !b.rank) {
          return b.marks - a.marks;
        }
      },
    );

    return { data, count: count[0]?.total ?? 0 };
  }

  //SECTION - get Report By Subject
  async getReportBySubject(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount, userId, application, mode } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          }
      : {};

    const requestedUserId =
      application === ApplicationType.ADMIN
        ? new mongoose.Types.ObjectId(userId)
        : new mongoose.Types.ObjectId(studentId);

    if (mode === TestSubmitType.OMR) {
      const omrResult = await this.checkOmrSubjectResult(
        testParams,
        requestedUserId,
      );

      return { data: omrResult };
    }

    //NOTE - get all attempted test details
    const attempt_test: any = await this.testResultModel
      .find({ studentId: requestedUserId, attemptCount, ...testParams })
      .populate([
        { path: 'studentId', select: 'name' },
        { path: 'subjectIds', select: 'name' },
        { path: 'scoreSchemaId', select: 'plus minus' },
        { path: 'testId', select: 'duration title' },
        { path: 'questionId', select: 'answer' },
      ])
      .select('-studentId -scoreSchemaId -testId -questionId')
      .lean();

    if (!attempt_test)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    // NOTE - get all subject details
    const subjectDetailsMap = attempt_test.reduce((map, attempt) => {
      // attempt.subjectIds.forEach((subject) => {
      const key = `${attempt.subjectIds?._id}_${attempt.subjectIds?.name}`;
      if (!map.has(key)) {
        map.set(key, {
          subject: attempt.subjectIds.name,
          totalQuestions: 0,
          correct: 0,
          inCorrect: 0,
          unAttempted: 0,
        });
      }

      const subjectResult = map.get(key);
      subjectResult.totalQuestions += 1;
      subjectResult.correct +=
        attempt.answer === attempt.questionId?.answer ? 1 : 0;
      subjectResult.inCorrect +=
        attempt.answer.trim() !== '' &&
        attempt.answer !== attempt.questionId?.answer
          ? 1
          : 0;
      subjectResult.unAttempted +=
        attempt.responseStatus !== QuestionResponseStatus.ATTEMPTED ? 1 : 0;
      // });
      return map;
    }, new Map());

    //NOTE: Extract the values from the map to get the final result
    const testResult = Array.from(subjectDetailsMap.values());

    //NOTE: Construct the final response
    const finalResponse = {
      studentId: attempt_test[0].studentId?._id,
      studentName: attempt_test[0].studentId?.name,
      testName: attempt_test[0].testId?.title,
      duration: attempt_test[0].testId?.duration,
      result: testResult,
    };

    return { data: finalResponse };
  }

  // SECTION - Check your score to measure the level of preparation
  async getScoreSummary(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount, mode } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    if (mode === TestSubmitType.OMR) {
      const omrScore = await this.omrScoreSummary(testParams, studentId);

      return { data: omrScore };
    }

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate([{ path: 'scoreSchemaId', select: 'plus minus' }])
      .select('-scoreSchemaId')
      .lean();

    //NOTE - get test total marks
    const totalMarks = attempt.reduce(
      (sum: number, item: { scoreSchemaId: { plus: string | number } }) =>
        sum + +item.scoreSchemaId.plus,
      0,
    );

    //NOTE - get user correct marks based on the correct answer attempt
    const correctAnswerMarks = await attempt.reduce(
      async (promiseAcc: Promise<number>, data) => {
        const acc = await promiseAcc; //TODO: Wait for the previous Promise to resolve
        const { uniqueId, answer, responseStatus, scoreSchemaId } = data;
        const { plus } = scoreSchemaId;
        const questionDetails = await this.questionBankModel.findOne({
          uniqueId,
        });

        const isAttempted = responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect = isAttempted && answer === questionDetails.answer;

        return isCorrect ? acc + Number(plus) : acc;
      },
      Promise.resolve(0), //TODO: Initial value, a resolved Promise with 0
    );

    //NOTE - get user correct marks based on the correct answer attempt
    const inCorrectAnswerMarks = await attempt.reduce(
      async (promiseAcc: Promise<number>, data) => {
        const acc = await promiseAcc; //TODO: Wait for the previous Promise to resolve
        const { uniqueId, answer, responseStatus, scoreSchemaId } = data;
        const { minus } = scoreSchemaId;
        const questionDetails = await this.questionBankModel.findOne({
          uniqueId,
        });

        const isAttempted = responseStatus === QuestionResponseStatus.ATTEMPTED;
        const inCorrect = isAttempted && answer !== questionDetails.answer;

        return inCorrect ? acc + Number(minus) : acc;
      },
      Promise.resolve(0), //TODO: Initial value, a resolved Promise with 0
    );

    //NOTE - Push final result
    const result = {
      totalMarks: totalMarks.toFixed(2),
      scoreAchieved: (correctAnswerMarks - inCorrectAnswerMarks).toFixed(2),
    };

    return { data: result };
  }

  // SECTION - Analyze your performance based on time spent
  async timePerformanceMetrics(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          } //NOTE - to find testId by slugUrl in testMaster model
      : {};

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate([
        { path: 'scoreSchemaId', select: 'plus minus' },
        { path: 'testId', select: 'noOfQuestions duration' },
      ])
      .select('-scoreSchemaId')
      .lean();

    const result = [];
    const paceCounts = {};
    //NOTE Extract all possible answerPace values from the enum
    const allAnswerPaceValues = Object.values(AnswerPaceTypes);

    const timePerQuestion = await this.calculateTimePerQuestion(
      attempt[0].testId?.duration,
      attempt[0].testId?.noOfQuestions,
    );

    for (const data of attempt) {
      const { answer, spendTime, responseStatus, uniqueId } = data;

      if (responseStatus === QuestionResponseStatus.ATTEMPTED) {
        // NOTE - get question bank answer details
        const question_details = await this.questionBankModel.findOne({
          uniqueId,
        });

        const answerPace = await this.getAnswerPace(spendTime, timePerQuestion);

        paceCounts[answerPace] = paceCounts[answerPace] ?? {
          answerPace,
          correctQuestion: 0,
          inCorrectQuestion: 0,
        };

        paceCounts[answerPace].correctQuestion +=
          answer === question_details.answer ? 1 : 0;
        paceCounts[answerPace].inCorrectQuestion +=
          answer !== question_details.answer ? 1 : 0;
      }
    }

    //NOTE Add missing answerPace values with default values
    allAnswerPaceValues.forEach((answerPace) => {
      if (!paceCounts[answerPace]) {
        paceCounts[answerPace] = {
          answerPace,
          correctQuestion: 0,
          inCorrectQuestion: 0,
        };
      }
    });

    //NOTE Convert the object values to an array
    result.push(...Object.values(paceCounts));

    return { data: result };
  }

  // SECTION - get Answer Key Details foor admin
  async answerkeysForAdmin(payload: AdminAnswerDetailsDto): Promise<{
    data: AnswerKeyForAdminInterface;
  }> {
    const { testId, attemptCount, userId } = payload;

    //NOTE - get latested test attempt count
    const attempt: any = await this.testResultModel
      .find({
        testId: new mongoose.Types.ObjectId(testId),
        studentId: new mongoose.Types.ObjectId(userId),
        attemptCount,
      })
      .populate([
        { path: 'testId', select: 'title duration assignedQuestion' },
        { path: 'studentId', select: 'name' },
        { path: 'scoreSchemaId', select: 'plus minus' },
      ])
      .select('-testId -studentId -scoreSchemaId')
      .lean();

    if (!attempt)
      throw new HttpException(INVALID_TEST_ATTEMPT, HttpStatus.BAD_REQUEST);

    //NOTE: Calculate total time in minutes and seconds
    const { timeTakenByUser } = await this.calculateTotalTime(
      attempt.map((attempt: { spendTime: string }) => attempt.spendTime),
    );

    //NOTE - get all question data
    const questionData = await Promise.all(
      attempt.map(async (data: any) => {
        const { questionId, answer, spendTime } = data;

        // NOTE - get questions details
        const questionDetails: any = await this.questionBankModel.findById(
          questionId,
        );

        const isAttempted =
          data.responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect = isAttempted && answer === questionDetails.answer;

        // NOTE: Calculate the marks
        const marks = isCorrect
          ? Number(data?.scoreSchemaId?.plus)
          : isAttempted
          ? -Number(data?.scoreSchemaId?.minus)
          : 0;

        return {
          _id: questionDetails._id,
          question: questionDetails.question,
          a: questionDetails.a,
          b: questionDetails.b,
          c: questionDetails.c,
          d: questionDetails.d,
          e: questionDetails.e,
          answer: questionDetails.answer,
          answerGivenByStudent: answer,
          difficultyLevel: questionDetails.difficultyLevel,
          isCorrect,
          spendTime,
          marks,
          isAttempted,
        };
      }),
    );

    // NOTE: Calculate correctCount, inCorrectCount, unAttemptedCount
    const [correctCount, inCorrectCount, unAttemptedCount] =
      questionData.reduce(
        (counts, question) => {
          counts[0] += question.isCorrect ? 1 : 0;
          counts[1] += question.isAttempted && !question.isCorrect ? 1 : 0;
          counts[2] += !question.isAttempted ? 1 : 0;
          return counts;
        },
        [0, 0, 0],
      );

    //NOTE : push final data
    const finalResponse = {
      _id: attempt[0]?.testId?._id,
      testName: attempt[0]?.testId?.title,
      totalQuestions: attempt[0]?.testId?.assignedQuestion?.length,
      duration: attempt[0]?.testId?.duration,
      timeTakeByStudent: timeTakenByUser,
      studentName: attempt[0]?.studentId?.name,
      correctAnswer: correctCount,
      unAttemptedAnswer: unAttemptedCount,
      wrongAnswer: inCorrectCount,
      question: questionData,
    };

    return { data: finalResponse };
  }

  // SECTION - upload Omr Result
  async uploadOmrResult(
    file: Express.Multer.File,
    payload: BulkUploadDto,
  ): Promise<any> {
    try {
      const { staffId, testId } = payload;

      if (
        !mongoose.isValidObjectId(testId) ||
        !mongoose.isValidObjectId(staffId)
      )
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

      //NOTE: Check if the file buffer exists
      if (!file?.buffer)
        throw new HttpException(INVALID_FILE, HttpStatus.BAD_REQUEST);

      //NOTE: Check if the file is a .docx file
      if (!_.includes(file.originalname, '.xlsx'))
        throw new HttpException(INVALID_FILE_TYPE, HttpStatus.BAD_REQUEST);

      //NOTE: Read the file buffer using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      //NOTE: Assuming the first sheet contains the data
      const worksheet = workbook.worksheets[0];

      //NOTE: Convert each row of the worksheet into JSON
      const rows = [];
      worksheet.eachRow((row) => {
        const rowData = {};
        row.eachCell((cell, index) => {
          rowData[`column${index}`] = cell.value;
        });
        rows.push(rowData);
      });

      const finalData = await this.convertData(rows, testId, staffId);

      try {
        const result = await this.omrReportModel.insertMany(finalData);

        if (result) {
          await this.testMasterModel.findByIdAndUpdate(testId, {
            $set: { isOmrResultUploaded: true },
          });
        }
      } catch (error) {
        console.error('InsertMany Error:', error); //TODO - need this for check error
      }

      return OMR_REPORT_FILE_UPLOAD;
    } catch (error) {
      throw new HttpException(ERROR_OMR_FILE_UPLOAD, HttpStatus.BAD_REQUEST);
    }
  }

  // SECTION - get test attempt count of the user
  async getOmrTestResult(payload: OmrResultDto): Promise<{ data: any[] }> {
    const { testId } = payload;

    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const result = await this.omrReportModel.find({
      testId: new mongoose.Types.ObjectId(testId),
    });

    if (!result) {
      return { data: [] };
    }

    return { data: result };
  }

  // SECTION - Check your score to measure the level of preparation
  async testOverviewReport(
    payload: TestResultDto,
    studentId: string,
  ): Promise<{ data: any }> {
    const { testId, attemptCount, mode } = payload;

    //NOTE - serach based on testId
    const testParams = testId
      ? mongoose.isValidObjectId(testId)
        ? { testId: new mongoose.Types.ObjectId(testId) }
        : {
            testId: (await this.testMasterModel.findOne({ slugUrl: testId }))
              ._id,
          }
      : {};

    if (mode === TestSubmitType.OMR) {
      const overViewReport = await this.checkOmrOverviewReport(
        testParams,
        studentId,
      );

      return { data: overViewReport };
    }

    //NOTE - get test result
    const attempt: any = await this.testResultModel
      .find({
        studentId: new mongoose.Types.ObjectId(studentId),
        attemptCount,
        ...testParams,
      })
      .populate('scoreSchemaId', 'plus minus')
      .populate('testId', 'attemptMode')
      .populate('questionId', 'answer')
      .select('-scoreSchemaId -testId')
      .lean();

    //NOTE - check rank
    const rankDetails =
      attempt &&
      attempt[0].testId.attemptMode === TestMasterAttemptModeTypes.SINGLE
        ? await this.studentRankModel.findOne({
            studentId: new mongoose.Types.ObjectId(studentId),
            ...testParams,
          })
        : null;

    //NOTE - get test total marks
    const totalMarks = attempt.reduce(
      (sum: number, item: { scoreSchemaId: { plus: string | number } }) =>
        sum + +item.scoreSchemaId.plus,
      0,
    );

    //NOTE - get user correct marks based on the correct answer attempt
    const correctAnswerMarks = await attempt.reduce(
      async (promiseAcc: Promise<number>, data) => {
        const acc = await promiseAcc; //TODO: Wait for the previous Promise to resolve
        const { uniqueId, answer, responseStatus, scoreSchemaId } = data;
        const { plus } = scoreSchemaId;
        const questionDetails = await this.questionBankModel.findOne({
          uniqueId,
        });

        const isAttempted = responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect = isAttempted && answer === questionDetails.answer;

        return isCorrect ? acc + Number(plus) : acc;
      },
      Promise.resolve(0), //TODO: Initial value, a resolved Promise with 0
    );

    //NOTE - get user correct marks based on the correct answer attempt
    const inCorrectAnswerMarks = await attempt.reduce(
      async (promiseAcc: Promise<number>, data) => {
        const acc = await promiseAcc; //TODO: Wait for the previous Promise to resolve
        const { uniqueId, answer, responseStatus, scoreSchemaId } = data;
        const { minus } = scoreSchemaId;
        const questionDetails = await this.questionBankModel.findOne({
          uniqueId,
        });

        const isAttempted = responseStatus === QuestionResponseStatus.ATTEMPTED;
        const inCorrect = isAttempted && answer !== questionDetails.answer;

        return inCorrect ? acc + Number(minus) : acc;
      },
      Promise.resolve(0), //TODO: Initial value, a resolved Promise with 0
    );

    //NOTE - get correct incorrect and unAttempted count
    const countDetails = await attempt.reduce(
      async (
        countsPromise: any,
        data: { responseStatus?: any; answer?: any; questionId: any },
      ) => {
        const counts = await countsPromise;
        const { answer, questionId } = data;

        const isAttempted =
          data.responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect = isAttempted && answer === questionId.answer;

        // NOTE - update counts value keys
        counts.correctCount += isCorrect ? 1 : 0;
        counts.inCorrectCount += isAttempted && !isCorrect ? 1 : 0;
        counts.unAttemptedCount += !isAttempted ? 1 : 0;

        return counts;
      },
      Promise.resolve({
        correctCount: 0,
        inCorrectCount: 0,
        unAttemptedCount: 0,
      }),
    );

    const calculateAccuracy = (
      (100 / (countDetails?.correctCount + countDetails?.inCorrectCount)) *
      countDetails?.correctCount
    ).toFixed(2);

    //NOTE - Push final result
    const result = {
      score: `${(correctAnswerMarks - inCorrectAnswerMarks).toFixed(
        2,
      )}/${totalMarks.toFixed(2)}`,
      rank: Number(rankDetails?.rank) ?? null,
      percentage: Number(rankDetails?.percentage) ?? null,
      correct: countDetails?.correctCount,
      inCorrectCount: countDetails?.inCorrectCount,
      unAttemptedCount: countDetails?.unAttemptedCount,
      accuracy: Number(calculateAccuracy),
    };

    return { data: result };
  }

  //ANCHOR -  Calculate total time taken by the user forr attempt test
  async calculateTotalTime(
    durations: string[],
  ): Promise<{ timeTakenByUser: string }> {
    const totalTimeInSeconds = durations
      .map((duration) => {
        const [hours, minutes, seconds] = duration.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      })
      .reduce((total, seconds) => total + seconds, 0);

    const totalMinutes = Math.floor(totalTimeInSeconds / 60);
    const remainingSeconds = totalTimeInSeconds % 60;

    //NOTE: Check if there are non-zero minutes or seconds
    const nonZeroParts: string[] = [];
    if (totalMinutes > 0) {
      nonZeroParts.push(`${totalMinutes} Min`);
    }
    if (remainingSeconds > 0) {
      nonZeroParts.push(`${remainingSeconds} Sec`);
    }

    //NOTE: Construct the timeTakenByUser string
    const timeTakenByUser = nonZeroParts.join(' ');

    return { timeTakenByUser };
  }

  //ANCHOR - calculate Average Time taken by the user for each question
  async calculateAverageTime(
    questionCount: number,
    durations: string[],
  ): Promise<{ averagetime: string }> {
    const totalTimeInSeconds = durations
      .map((duration) => {
        const [hours, minutes, seconds] = duration.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      })
      .reduce((total, seconds) => total + seconds, 0);

    const timeBasedOnQuestion = totalTimeInSeconds / questionCount;

    const totalMinutes = Math.floor(timeBasedOnQuestion / 60);
    const remainingSeconds = Math.round(timeBasedOnQuestion % 60); // Round seconds to the nearest whole number

    //NOTE: Check if there are non-zero minutes or seconds
    const nonZeroParts: string[] = [];
    if (totalMinutes > 0) {
      nonZeroParts.push(`${totalMinutes} Min`);
    }
    if (remainingSeconds > 0) {
      nonZeroParts.push(`${remainingSeconds} Sec`);
    }

    //NOTE: Construct the averagetime string
    const averagetime = nonZeroParts.join(' ');

    return { averagetime };
  }

  // SECTION - generate test Report based on subject
  async generateSubjectReport(id: string): Promise<any> {
    // NOTE - check whether id is valid or not and if it is not then throw error
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - get test details
    const test: any = await this.testMasterModel
      .findById(id)
      .select('title subjectIds startAfter')
      .populate('subjectIds', 'name');

    // NOTE - get all subject names and create a subject order map
    const subjectNames = test.subjectIds.map(
      (ele: { name: string }) => ele.name,
    );

    // Create a subject order map
    const subjectOrderMap = test.subjectIds.reduce((map, subject, index) => {
      map.set(subject._id.toString(), index);
      return map;
    }, new Map<string, number>());

    if (!test)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE - get all attempted test details
    const attempt_test: any = await this.testResultModel
      .find({ testId: test._id })
      .populate([
        { path: 'studentId', select: 'name' },
        { path: 'subjectIds', select: 'name' },
        { path: 'scoreSchemaId', select: 'plus minus' },
        { path: 'testId', select: 'duration title' },
        { path: 'questionId', select: 'answer' },
      ])
      .select('-studentId -scoreSchemaId -testId -questionId')
      .lean();

    const studentIds = new Set(
      attempt_test.map((attempt) => attempt.studentId?._id),
    );

    const finalResponses = [];

    // Loop through each unique student ID
    for (const studentId of studentIds) {
      // Filter attempts for the current student ID
      const studentAttempts = attempt_test.filter(
        (attempt) => attempt.studentId?._id.toString() === studentId.toString(),
      );

      // Construct subject details map for the student's attempts
      const subjectDetailsMap = studentAttempts.reduce((map, attempt) => {
        const subjectId = attempt.subjectIds?._id.toString();
        const subjectName = attempt.subjectIds?.name;

        // If the map doesn't have the subject key, initialize it
        if (!map.has(subjectId)) {
          map.set(subjectId, {
            subjectId,
            subject: subjectName,
            correct: 0,
            inCorrect: 0,
            unAttempted: 0,
            score: 0,
          });
        }

        const isAttempted =
          attempt.responseStatus === QuestionResponseStatus.ATTEMPTED;
        const isCorrect =
          isAttempted && attempt.answer === attempt.questionId.answer;
        const inCorrect =
          isAttempted && attempt.answer !== attempt.questionId.answer;

        const subjectResult = map.get(subjectId);
        subjectResult.correct += isCorrect ? 1 : 0;
        subjectResult.inCorrect += inCorrect ? 1 : 0;
        subjectResult.unAttempted += isAttempted ? 0 : 1;

        // Calculate score based on correct and incorrect answers
        const correctAnswerMarks =
          subjectResult.correct * Number(attempt.scoreSchemaId.plus);
        const inCorrectAnswerMarks =
          subjectResult.inCorrect * Number(attempt.scoreSchemaId.minus);

        subjectResult.score = Number(
          (correctAnswerMarks - inCorrectAnswerMarks).toFixed(2),
        );

        return map;
      }, new Map());

      // Extract the values from the map to get the final result and sort by subject order
      const testResult = Array.from(subjectDetailsMap.values()).sort(
        (a: any, b: any) => {
          const orderA = subjectOrderMap.get(a.subjectId);
          const orderB = subjectOrderMap.get(b.subjectId);
          return (orderA || 0) - (orderB || 0);
        },
      );

      // Calculate total mark
      const totalMark = testResult.reduce(
        (total: any, subject: { score: any }) => total + subject.score,
        0,
      );

      // Construct the final response for the current student
      const finalResponse: {
        studentId: any;
        name: any;
        result: any[];
        rank?: number;
        percentage?: number;
        totalMark?: any;
      } = {
        studentId: studentAttempts[0].studentId?._id,
        name: studentAttempts[0].studentId?.name,
        result: testResult,
      };

      // Get student rank and percentage
      const studentRanks = await this.studentRankModel.findOne({
        testId: test._id,
        studentId: studentAttempts[0].studentId?._id,
      });

      if (studentRanks) {
        finalResponse.rank = studentRanks.rank;
        finalResponse.percentage = studentRanks.percentage;
        finalResponse.totalMark = totalMark;
      } else {
        finalResponse.rank = 0;
        finalResponse.percentage = 0;
        finalResponse.totalMark = 0;
      }

      // Push the final response for the current student into the array
      finalResponses.push(finalResponse);
    }

    // Sort the final responses by rank
    finalResponses.sort((a, b) => {
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      } else {
        return a.rank ? -1 : 1;
      }
    });

    // NOTE - Custom json to send to ejs file to replace the variables there
    const jsonData = {
      path: process.env.TEST_SUBJECT_REPORT_EJS_URL,
      data: {
        title: test.title,
        date: await this.convertToShortDate(test?.startAfter),
        subjectNames,
        students: finalResponses,
      },
    };

    const pdf = await this.commonService.generateLandscapePdfForReports(
      jsonData,
    );
    return pdf;
  }

  //ANCHOR - convert the time format
  private async getTimeInSeconds(time): Promise<any> {
    const [hours, minutes, secondsWithMilliseconds] = time
      .split(':')
      .map((t: string) => t.split('.'));

    const seconds = parseInt(secondsWithMilliseconds[0], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  //ANCHOR - convert the time format
  private async getAnswerPace(
    time: number,
    timePerQuestion: number,
  ): Promise<string> {
    const getTime = await this.getTimeInSeconds(time);

    if (getTime <= 30) {
      return AnswerPaceTypes.TOO_FAST;
    } else if (getTime <= timePerQuestion) {
      return AnswerPaceTypes.OVERTIME;
    } else {
      return AnswerPaceTypes.IDEAL;
    }
  }

  //REVIEW -  - delete Attempted Test
  async deleteAttemptedTest(payload: DeleteReportDto): Promise<string> {
    const { testId } = payload;

    // Delete the found test results
    await this.testResultModel.deleteMany({
      testId: new mongoose.Types.ObjectId(testId),
      attemptCount: { $ne: 1 },
    });

    return DELETE_DATA;
  }

  //ANCHOR - convert Data for upload the report
  private async convertData(
    data: any,
    testId: string,
    staffId: string,
  ): Promise<any> {
    const headerRow = data[0];
    const totqIndex = Object.values(headerRow).indexOf('TOTQ') + 1; // Add 1 to get 1-based index
    const totalQuestionColumnName = `column${totqIndex}`;

    //NOTE - get test details
    const testDetails = await this.testMasterModel.findById(testId);

    const transformedData = await Promise.all(
      data.slice(1).map(async (row) => {
        const subjectDetails = [];
        let reachedTotq = false; // Flag to track if TOTQ column is reached
        for (const columnName in row) {
          if (
            columnName !== 'column1' &&
            columnName !== 'column2' &&
            columnName !== 'column3' &&
            columnName !== 'column4' &&
            columnName !== 'column5' &&
            columnName !== 'column6' &&
            columnName !== 'column7'
          ) {
            const name = headerRow[columnName];
            const value = row[columnName];
            if (!reachedTotq && columnName !== `column${totqIndex}`) {
              subjectDetails.push({ name, value });
            }
            if (columnName === `column${totqIndex}`) {
              reachedTotq = true; // Set the flag to true when TOTQ column is reached
            }
          }
        }

        //NOTE: Calculate other values based on totalQuestion
        const totalAttemptedQuestion = row[`column${totqIndex + 1}`];
        const totalRightQuestion = row[`column${totqIndex + 2}`];
        const totalWrongQuestion = row[`column${totqIndex + 3}`];
        const totalUnattemptedQuestion = row[`column${totqIndex + 4}`];
        const rightPercentage = row[`column${totqIndex + 5}`];
        const wrongPercentage = row[`column${totqIndex + 6}`];
        const total = row[`column${totqIndex + 7}`];
        const testRank = row[`column${totqIndex + 8}`];
        const finalRank = row[`column${totqIndex + 9}`];
        const percentage = row[`column${totqIndex + 10}`];

        let student: any;
        //NOTE - based on the enrollmentNumber or rollNumber get student details
        if (testDetails.mode === TestMasterTypes.OFFLINE) {
          student = await this.studentBatchModel.findOne({
            newEnrollmentNumber: row.column1,
          });
        } else {
          student = await this.eventAppliedModel.findOne({
            eventId: testDetails?.eventId,
            rollNumber: row.column1,
          });
        }

        return {
          enrollmentNumber: row.column1,
          studentId: student?.studentId ?? null,
          candidateName: row.column2,
          father: row.column3 ?? null,
          group: row?.column4,
          other: row.column5,
          testNo: row.column6,
          testId: new mongoose.Types.ObjectId(testId),
          testName: row.column7,
          subjectDetails,
          totalQuestion: row[totalQuestionColumnName],
          totalAttemptedQuestion: totalAttemptedQuestion,
          totalRightQuestion: totalRightQuestion,
          totalWrongQuestion: totalWrongQuestion,
          totalUnattemptedQuestion: totalUnattemptedQuestion,
          rightPercentage: rightPercentage,
          wrongPercentage: wrongPercentage,
          total: total,
          testRank: testRank,
          finalRank: finalRank,
          percentage: percentage,
          createdBy: new mongoose.Types.ObjectId(staffId),
        };
      }),
    );

    return transformedData;
  }

  //ANCHOR -  calculate Time Per Question
  private async calculateTimePerQuestion(
    totalTimeMinutes: number,
    numberOfQuestions: number,
  ): Promise<number> {
    const totalTimeSeconds: number = totalTimeMinutes * 60;
    const timePerQuestion: number = totalTimeSeconds / numberOfQuestions;
    return timePerQuestion;
  }

  //ANCHOR -  calculate Time Per Question
  private async checkOmrSubjectResult(
    testParams: any,
    requestedUserId: any,
  ): Promise<any> {
    const result: any = await this.omrReportModel
      .findOne({
        studentId: requestedUserId,
        ...testParams,
      })
      .populate([
        { path: 'studentId', select: 'name' },
        { path: 'testId', select: 'duration title' },
      ]);

    const subjectSummary = await this.generateSubjectSummary(
      result.subjectDetails,
    );

    const finalResponse = {
      studentId: result.studentId?._id,
      studentName: result.studentId?.name,
      testName: result.testId?.title,
      duration: result.testId?.duration,
      result: subjectSummary,
    };

    return finalResponse;
  }

  //ANCHOR - generate Subject Summary for omr result
  private async generateSubjectSummary(subjectDetails: any[]): Promise<any> {
    const subjectMap = new Map<string, any>();

    subjectDetails.forEach((detail) => {
      const [subjectName, questionType] = detail.name.split(' ');

      const subjectSummary = subjectMap.get(subjectName) || {
        subject: subjectName,
        totalQuestions: 0,
        correct: 0,
        inCorrect: 0,
        unAttempted: 0,
      };

      if (questionType === 'R') {
        subjectSummary.correct += detail.value;
        subjectSummary.totalQuestions += detail.value;
      } else if (questionType === 'W') {
        subjectSummary.inCorrect += detail.value;
        subjectSummary.totalQuestions += detail.value;
      } else if (questionType === 'L') {
        subjectSummary.unAttempted += detail.value;
        subjectSummary.totalQuestions += detail.value;
      }

      subjectMap.set(subjectName, subjectSummary);
    });

    return Array.from(subjectMap.values());
  }

  //ANCHOR - - question Analysis For Omr
  private async questionAnalysisForOmr(
    studentId: string,
    testParams: any,
  ): Promise<any> {
    const testResult: any = await this.omrReportModel
      .findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        ...testParams,
      })
      .populate({
        path: 'testId',
        select: 'testNumber title eventId paperId createdAt',
        populate: [
          { path: 'eventId', select: 'eventName date' },
          { path: 'examId', select: 'name' },
        ],
      });

    //NOTE - final response
    const result = {
      correctCount: testResult.totalRightQuestion,
      inCorrectCount: testResult.totalWrongQuestion,
      unAttemptedCount: testResult.totalUnattemptedQuestion,
      eventName: testResult?.testId?.eventId?.eventName,
      paperName: testResult?.testId?.examId?.name, //FIXME - send the exam name(need to change the key name)
      testTitle: testResult?.testId?.title,
      testNumber: testResult?.testId?.testNumber,
      eventDate: await this.convertToShortDate(
        testResult?.testId?.eventId?.date,
      ),
      testDate: await this.convertToShortDate(testResult?.testId?.createdAt),
    };

    return result;
  }

  //ANCHOR - - ScoreSummary For Omr
  private async omrScoreSummary(
    testParams: any,
    studentId: string,
  ): Promise<any> {
    const testResult: any = await this.omrReportModel
      .findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        ...testParams,
      })
      .populate('testId', 'totalMarks');

    //NOTE - final response
    const result = {
      totalMarks: testResult.testId?.totalMarks.toFixed(2),
      scoreAchieved: testResult.total.toFixed(2),
    };

    return result;
  }

  //ANCHOR - - ScoreSummary For Omr
  private async checkOmrOverviewReport(
    testParams: any,
    studentId: string,
  ): Promise<any> {
    const testResult: any = await this.omrReportModel
      .findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        ...testParams,
      })
      .populate('testId', 'totalMarks');

    const calculateAccuracy = (
      (100 /
        (testResult?.totalRightQuestion + testResult?.totalWrongQuestion)) *
      testResult?.totalRightQuestion
    ).toFixed(2);

    const calculatePercentage = (
      (testResult.total / testResult.testId?.totalMarks) *
      100
    ).toFixed(2);

    //NOTE - final response
    const result = {
      score: `${testResult.total.toFixed(
        2,
      )}/${testResult.testId?.totalMarks.toFixed(2)}`,
      rank: Number(testResult?.finalRank) ?? null,
      correct: testResult?.totalRightQuestion,
      inCorrectCount: testResult?.totalWrongQuestion,
      unAttemptedCount: testResult?.totalUnattemptedQuestion,
      accuracy: Number(calculateAccuracy),
      percentage: Number(calculatePercentage),
    };

    return result;
  }

  //ANCHOR - format Date
  private async convertToShortDate(date: Date | null): Promise<string | null> {
    if (!date) return null;

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return formattedDate;
  }
}
