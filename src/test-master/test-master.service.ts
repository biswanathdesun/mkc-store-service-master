import mongoose, { Model } from 'mongoose';

import { ParsedQs } from 'qs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTestMasterDto } from './dto/create-test-master.dto';
import { TestMaster } from 'src/schema/test-master.schema';
import {
  ALREDY_EXIST_DATA_WITH_SAME_NAME,
  INVALID_ID,
  RECORD_NOT_FOUND,
  DUPLICATE_NAME,
  QUESTION_LENGTH_NOT_MATCH,
  TEST_DELETE_ERROR,
  SUBMIT_TEST_SUCCESSFULLY,
  DUPLICATE_SLUG_URL,
  DUPLICATE_TEST_MASTER,
  PUBLISHED_TEST,
  CREATE_DATA,
  UPDATE_DATA,
  DELETE_DATA,
  UNIQUE_CODE_REQUIRED,
  UNIQUE_CODE_VERIFIED,
  PAPER_REQUIRED,
  DRAFT_TEST,
  TEST_SUBMIT_ERROR,
} from 'src/utills/messages';
import { UpdateTestMasterDto } from './dto/update-test-master.dto';
import { AssignQuestionDto } from './dto/assign-question.dto';
import { QuestionBank } from 'src/schema/question-bank.schema';
import { TestSeries } from 'src/schema/test-series.schema';
import { TestDraftQuestion } from 'src/schema/test-draft-question.schema';
import {
  EventModeTypes,
  OfflineModeType,
  QuestionResponseStatus,
  TestMasterTypes,
  TestStatus,
  TestMasterAttemptModeTypes,
  TestAttemptFromTypes,
} from 'src/utills/enum';
import { UpdateStatusDto } from './dto/update-status.dto';
import { User } from 'src/schema/user.schema';
import { SaveProduct } from 'src/schema/save-product.schema';
import { WrapUpTestDto } from './dto/wrap-up-test.dto';
import { TestResult } from 'src/schema/test.result.schema';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { ScoreBoard } from 'src/schema/score-board.schema';
import { GetTestMarksAndTimeDto } from './dto/get-marks-time.dto';
import { TestMarksAndTimeInterface } from './interface/test-master-interfaces';
import { Staff } from 'src/schema/staff.schema';
import { InstructorAllocation } from 'src/schema/instructor-allocation.schema';
import { Event } from 'src/schema/event.schema';
import { VerifyUniqueCodeDto } from './dto/verify-unique-code.dto';
import { ByOnlineCourseDto } from './dto/get-by-onlineCourse.dto';
import { EventApplied } from 'src/schema/event.apply.schema';
import { GetQuestionDto } from './dto/get-question.dto';
@Injectable()
export class TestMasterService {
  constructor(
    @InjectModel(TestMaster.name) private testMasterModule: Model<TestMaster>,
    @InjectModel(TestSeries.name) private testSeriesModel: Model<TestSeries>,
    @InjectModel(QuestionBank.name)
    private questionBankModel: Model<QuestionBank>,
    @InjectModel(TestDraftQuestion.name)
    private testDraftQuestionModel: Model<TestDraftQuestion>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(SaveProduct.name) private saveProductModel: Model<SaveProduct>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResult>,
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(ScoreBoard.name) private scoreBoardModel: Model<ScoreBoard>,
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    @InjectModel(InstructorAllocation.name)
    private instructorAllocationModel: Model<InstructorAllocation>,
    @InjectModel(EventApplied.name)
    private eventAppliedModule: Model<EventApplied>,
  ) {}

  //SECTION - create Test Master
  async createTestMaster(
    payload: CreateTestMasterDto,
    createdById: string,
  ): Promise<string> {
    const {
      batchId,
      mode,
      title,
      slugUrl,
      categoryId,
      courseIds,
      languageIds,
      startAfter,
      startBefore,
      duration,
      noOfQuestions,
      testStatus,
      isFree,
      eventId,
      examId,
      paperId,
      attemptMode,
      offlineMode,
      uniqueCode,
    } = payload;

    //NOTE - check if mode is event
    const eventDetails: any = await this.eventModel
      .findById(eventId)
      .select('_id mode');

    //NOTE - if mode is event and mode have CBT , need unique code or if mode is offline and offlineMode have CBT , need unique code
    if (
      (!uniqueCode || uniqueCode.toString().length !== 6) &&
      ((mode === TestMasterTypes.EVENT &&
        eventDetails?.mode.includes(EventModeTypes.CBT)) ||
        (mode === TestMasterTypes.OFFLINE &&
          offlineMode === OfflineModeType.CBT))
    ) {
      throw new HttpException(UNIQUE_CODE_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    if (mode === TestMasterTypes.EVENT && !paperId)
      throw new HttpException(PAPER_REQUIRED, HttpStatus.BAD_REQUEST);

    // NOTE - check slugUrl is already exist or not with the same name
    const isUniqueUrl = await this.testMasterModule.findOne({
      slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    if (mode === TestMasterTypes.EVENT) {
      // NOTE - check if any test master is already exist or not  with eventId , examId , categoryId , courseId
      const isExistWithSameData = await this.testMasterModule.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        examId: new mongoose.Types.ObjectId(examId),
        paperId: new mongoose.Types.ObjectId(paperId),
        categoryId,
        courseIds: {
          $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });

      if (isExistWithSameData) {
        throw new HttpException(DUPLICATE_TEST_MASTER, HttpStatus.CONFLICT);
      }
    }

    //NOTE - query for match
    const query: any = {
      $and: [
        {
          $or: [
            { title: { $regex: new RegExp(`^${title}$`, 'i') } }, //TODO: Match exact title
            { title: { $regex: new RegExp(`^.*${title}\\d.*$`, 'i') } }, //TODO: Match title with numbers
          ],
        },
        { categoryId }, //TODO: Add categoryId condition
        { courseIds }, //TODO: Add courseIds condition
      ],
    };

    //NOTE - Check the test master with same title is exist or not
    const existingTestMaster = await this.testMasterModule.findOne(query);

    if (existingTestMaster)
      throw new HttpException(
        ALREDY_EXIST_DATA_WITH_SAME_NAME,
        HttpStatus.BAD_REQUEST,
      );

    const testNumber = await this.generateTestNumber();

    //NOTE - if same test master is not exist create it
    await this.testMasterModule.create({
      batchId,
      mode,
      title,
      slugUrl,
      categoryId,
      courseIds,
      languageIds,
      testNumber,
      startAfter,
      startBefore,
      duration,
      noOfQuestions,
      testStatus,
      isFree,
      eventId,
      examId,
      attemptMode:
        mode === TestMasterTypes.EVENT
          ? TestMasterAttemptModeTypes.SINGLE
          : attemptMode,
      offlineMode,
      uniqueCode,
      paperId,
      createdBy: createdById,
    });

    return CREATE_DATA;
  }

  //SECTION - get all test master details
  async getAllTestMaster(
    query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, search, date, testStatus } = query as unknown as {
      page: string;
      limit: string;
      search: string;
      date: Date;
      testStatus: TestStatus;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search based on test master title and test number also
    const searchParams: any = {};

    if (search) {
      const searchAsNumber = Number(search);
      if (!isNaN(searchAsNumber)) {
        searchParams.$or = [{ testNumber: searchAsNumber }];
      } else {
        searchParams.$or = [{ title: { $regex: search, $options: 'i' } }];
      }
    }

    //NOTE -  Define the dateQuery based on the Date
    const currentDate = date ? new Date(date) : new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(currentDate);
    nextDate.setUTCHours(23, 59, 59, 999);

    const dateQuery = date
      ? { startAfter: { $gte: currentDate, $lte: nextDate } }
      : {};
    const testStatusQuery = testStatus ? { testStatus } : {};

    //NOTE: Find test master documents using $in operator
    const testMasterQuery: any = {
      ...searchParams,
      ...dateQuery,
      ...testStatusQuery,
    };

    // Get staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    let batchIds: string[] = [];
    if (/teacher/i.test(staff?.roleId?.role)) {
      const getBatches: any = await this.instructorAllocationModel.find({
        teacherId: staff._id.toString(),
      });

      batchIds = getBatches
        .map((batch: { id: any }) => batch.id.toString())
        .flat();

      testMasterQuery.batchId = { $in: batchIds };
    }

    const count = await this.testMasterModule.countDocuments(testMasterQuery);

    const all_test_master_Details: any = await this.testMasterModule
      .find(testMasterQuery)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'batchId', select: 'name' },
        { path: 'eventId', select: 'title mode' },
        { path: 'examId', select: 'name' },
        { path: 'languageIds', select: 'language' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        '-categoryId -courseIds -batchId -eventId -examId -languageIds -createdBy -updatedBy',
      )
      .lean();

    //NOTE: Map the test master data to the desired format
    const data = all_test_master_Details.map((item: any) => ({
      _id: item._id,
      title: item?.title,
      slugUrl: item?.slugUrl ?? null,
      mode: item?.mode ?? null,
      noOfQuestions: item?.noOfQuestions,
      categoryName: item.categoryId?.name,
      courseNames: item.courseIds.map((ele: any) => ele.name),
      language: item.languageIds
        ? item.languageIds.map((lang: any) => lang.language)
        : null,
      batch: item.batchId?.name ?? null,
      event: item.eventId?.title ?? null,
      eventMode: item.eventId?.mode ?? null,
      exam: item.examId?.name ?? null,
      startAfter: item?.startAfter,
      startBefore: item?.startBefore,
      duration: item?.duration,
      status: item.status,
      testStatus: item?.testStatus,
      isFree: item?.isFree,
      attemptMode: item.attemptMode,
      offlineMode: item?.offlineMode ?? null,
      uniqueCode: item?.uniqueCode ?? null,
      testNumber: item?.testNumber,
      createdByName: item.createdBy?.name ?? null,
      updatedByName: item.updatedBy?.name ?? null,
    }));

    return { data, count };
  }

  // SECTION - get test master by id details
  async getTestMasterById(id: string): Promise<any> {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get test master details
    const test_master: any = await this.testMasterModule
      .findById(id)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'eventId', select: 'title eventName mode' },
        { path: 'examId', select: 'name' },
        { path: 'languageIds', select: 'language' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
        { path: 'batchId', select: 'name' },
        { path: 'paperId', select: 'name' },
      ])
      .select(
        '-categoryId -courseIds -languageIds -createdBy -updatedBy -batchId -paperId',
      )
      .lean();

    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE : Exclude createdBy, updatedBy field from the test master object
    delete test_master.updatedBy;
    delete test_master.createdBy;

    const response = { ...test_master };

    return response;
  }

  //SECTION - update test master details
  async updateTestMaster(
    id: string,
    payload: UpdateTestMasterDto,
    updateById: string,
  ): Promise<string> {
    const {
      batchId,
      mode,
      categoryId,
      courseIds,
      languageIds,
      title,
      slugUrl,
      startAfter,
      startBefore,
      duration,
      noOfQuestions,
      testStatus,
      isFree,
      eventId,
      examId,
      paperId,
      attemptMode,
      offlineMode,
      uniqueCode,
    } = payload;

    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check if any test master exist with the id or not
    const existData: any = await this.testMasterModule.findById(id);

    //NOTE -  if not throw error
    if (!existData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - if mode is offline and offlineMode have CBT , need unique code
    if (
      mode === TestMasterTypes.OFFLINE &&
      offlineMode === OfflineModeType.CBT &&
      (!uniqueCode || uniqueCode.toString().length !== 6)
    ) {
      throw new HttpException(UNIQUE_CODE_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    if (mode === TestMasterTypes.EVENT && !paperId)
      throw new HttpException(PAPER_REQUIRED, HttpStatus.BAD_REQUEST);

    //NOTE - check if mode is event
    const eventDetails: any = await this.eventModel
      .findById(eventId)
      .select('_id mode');

    //NOTE - if mode is evemt and mode have CBT , need unique code
    if (
      mode === TestMasterTypes.EVENT &&
      eventDetails?.mode.includes(EventModeTypes.CBT) &&
      (!uniqueCode || uniqueCode.toString().length !== 6)
    ) {
      throw new HttpException(UNIQUE_CODE_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    // NOTE - check if any test master is already exist or not  with eventId , examId , categoryId , courseId
    const isExistWithSameData = await this.testMasterModule.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      eventId: new mongoose.Types.ObjectId(eventId),
      paperId: new mongoose.Types.ObjectId(paperId),
      examId: new mongoose.Types.ObjectId(examId),
      categoryId: categoryId,
      courseIds: {
        $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    });

    if (isExistWithSameData) {
      throw new HttpException(DUPLICATE_TEST_MASTER, HttpStatus.CONFLICT);
    }

    if (title) {
      const query: any = {
        _id: { $ne: id },
        $and: [
          {
            $or: [
              { title: { $regex: new RegExp(`^${title}$`, 'i') } }, //TODO: Match exact name
              { title: { $regex: new RegExp(`^.*${title}\\d.*$`, 'i') } }, //TODO: Match name with numbers
            ],
          },
          { categoryId }, //TODO: Add categoryId condition
          { courseIds }, //TODO: Add courseIds condition
        ],
      };

      // NOTE - check if any other test master exists with the same title
      const duplicateTestMaster = await this.testMasterModule.findOne(query);

      if (duplicateTestMaster?.title === title) {
        throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
      }
    }

    // NOTE - check slugUrl is already exist or not with the same name
    const isUniqueUrl = await this.testMasterModule.findOne({
      _id: { $ne: id },
      slugUrl: slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    let updatedPayload: any = {
      //NOTE: Define an object to hold the updated payload
      batchId,
      mode,
      categoryId,
      courseIds,
      languageIds,
      title,
      slugUrl,
      startAfter,
      startBefore,
      duration,
      noOfQuestions,
      testStatus,
      isFree,
      eventId,
      examId,
      paperId,
      attemptMode:
        mode === TestMasterTypes.EVENT
          ? TestMasterAttemptModeTypes.SINGLE
          : attemptMode,
      offlineMode,
      updatedBy: updateById,
    };

    //NOTE: Check if mode is online, then remove uniqueCode from the payload
    if (mode === TestMasterTypes.ONLINE) {
      updatedPayload = {
        ...updatedPayload,
        uniqueCode: null,
      };
    } else {
      updatedPayload = {
        ...updatedPayload,
        uniqueCode,
      };
    }

    await this.testMasterModule.findByIdAndUpdate(id, {
      $set: { ...updatedPayload },
    });

    return UPDATE_DATA;
  }

  //SECTION - delete test master details
  async deleteTestMaster(id: string): Promise<string> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const testMasterToDelete = await this.testMasterModule.findById(id);

    if (!testMasterToDelete)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: If the test status is "published," throw an error
    if (testMasterToDelete.testStatus === TestStatus.PUBLISHED)
      throw new HttpException(TEST_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.testMasterModule.findByIdAndDelete(id);

    return DELETE_DATA;
  }

  //SECTION - draft questions for test master
  async mapQuestionInTest(
    payload: AssignQuestionDto,
    userId: string,
  ): Promise<any> {
    const { testId, questions } = payload;

    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Check if the test exists
    const testMaster = await this.testMasterModule.findById(testId);

    if (!testMaster)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Check if the number of questions does not exceed the limit
    if (questions.length > testMaster.noOfQuestions)
      throw new HttpException(
        QUESTION_LENGTH_NOT_MATCH,
        HttpStatus.BAD_REQUEST,
      );

    //NOTE: Prepare bulk operations
    const bulkOperations = questions.map((data) => {
      const {
        questionNo,
        subjectId,
        chapterIds,
        topicIds,
        difficultyLevels,
        questionTypeId,
        scoreSchemaId,
        uniqueId,
      } = data;
      const filter = { testMasterId: testId, questionNo: questionNo };
      const update = {
        $set: {
          testMasterId: testId,
          questionNo: questionNo,
          uniqueId: uniqueId ?? null,
          subjectId: subjectId ?? null,
          chapterIds: chapterIds ?? null,
          topicIds: topicIds ?? null,
          difficultyLevels: difficultyLevels ?? null,
          questionTypeId: questionTypeId ?? null,
          scoreSchemaId,
          updatedBy: userId,
        },
        $setOnInsert: { createdBy: userId },
      };
      return {
        updateOne: { filter, update, upsert: true },
      };
    });

    //NOTE: Execute bulk write operations
    await this.testDraftQuestionModel.bulkWrite(bulkOperations);

    //NOTE: Update the test master with isMapQuestions true
    await this.testMasterModule.findByIdAndUpdate(testId, {
      $set: {
        isMapQuestions: true,
        assignedQuestion: null,
        totalMarks: 0,
        updatedBy: userId,
      },
    });

    return CREATE_DATA;
  }

  //SECTION - get all test master by testSeries Id
  async testMasterBySeriesById(seriesId: string): Promise<any> {
    if (!mongoose.isValidObjectId(seriesId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get test series data
    const series_data = await this.testSeriesModel.findById(seriesId);

    if (!series_data)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - find all test master data
    const all_test_master_Details = await this.testMasterModule.find({
      categoryId: series_data.categoryId,
      mode: { $ne: TestMasterTypes.EVENT },
      testStatus: TestStatus.PUBLISHED,
    });
    //NOTE - push final data
    const data = await Promise.all(
      all_test_master_Details.map(async (item) => {
        return {
          _id: item._id,
          title: item.title,
        };
      }),
    );

    return data;
  }

  //SECTION - Assign questions in test master , when update Status
  async updateStatus(
    payload: UpdateStatusDto,
    userId: string,
  ): Promise<string> {
    const { testId } = payload;

    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check question details
    const test_master = await this.testMasterModule.findById(testId);

    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (test_master.testStatus === TestStatus.PUBLISHED) {
      await this.testMasterModule.findByIdAndUpdate(testId, {
        $set: { testStatus: TestStatus.DRAFT },
      });
    } else {
      //NOTE - common properties for update test master
      const commonUpdate = {
        testStatus:
          test_master.testStatus === TestStatus.DRAFT
            ? TestStatus.PUBLISHED
            : TestStatus.DRAFT,
        assignedQuestion: null,
        totalMarks: 0,
        subjectIds: null,
        updatedBy: userId,
      };

      //NOTE - check if question already map or not
      if (
        test_master.isMapQuestions === true &&
        test_master.assignedQuestion === null &&
        test_master.testStatus === TestStatus.DRAFT
      ) {
        //NOTE - check draft questions
        const draft_questions: any[] = await this.testDraftQuestionModel.find({
          testMasterId: test_master._id.toString(),
        });

        //NOTE Keep track of used uniqueIds across multiple iterations
        const usedUniqueIds = new Set();

        const questionPromises = draft_questions.map(async (qu) => {
          const matchCriteria: any = {};

          if (qu.subjectId) {
            matchCriteria.subjectIds = qu.subjectId;
          }

          if (qu.chapterIds && qu.chapterIds.length > 0) {
            matchCriteria.chapterIds = { $in: qu.chapterIds };
          }

          if (qu.topicIds && qu.topicIds.length > 0) {
            matchCriteria.topicIds = { $in: qu.topicIds };
          }

          if (qu.difficultyLevels && qu.difficultyLevels.length > 0) {
            matchCriteria.difficultyLevels = { $all: qu.difficultyLevels };
          }

          if (qu.questionTypeId) {
            matchCriteria.questionType = qu.questionTypeId;
          }

          if (qu.uniqueId) {
            matchCriteria.uniqueId = qu.uniqueId;
          } else {
            matchCriteria.uniqueId = { $nin: Array.from(usedUniqueIds) };
          }

          let question_data: string | any[];
          do {
            question_data = await this.questionBankModel.aggregate([
              {
                $match: matchCriteria,
              },
              { $sample: { size: 1 } },
            ]);

            if (question_data.length === 0) {
              console.warn(
                'No more questions available for the given criteria.',
              ); //TODO - need this for check error
              return null;
            }

            const uniqueId = question_data[0].uniqueId;
            if (!usedUniqueIds.has(uniqueId)) {
              usedUniqueIds.add(uniqueId);

              return {
                questionNo: qu.questionNo,
                uniqueId: uniqueId,
                scoreSchemaId: qu.scoreSchemaId,
                subjectId: question_data[0].subjectIds,
                createdBy: userId,
                updatedBy: userId,
              };
            }
          } while (true);
        });

        const questionPayload = (await Promise.all(questionPromises)).filter(
          (payload) => payload !== null,
        );

        const scorePromises = questionPayload.map(async (data) => {
          const { scoreSchemaId } = data;
          //NOTE - get score score board data
          const scoreBoard = await this.scoreBoardModel.findById(scoreSchemaId);
          return +Number(scoreBoard.plus);
        });

        const correctAnswerMarksArray = await Promise.all(scorePromises);
        const correctAnswerMarks = correctAnswerMarksArray.reduce(
          (acc, val) => acc + val,
          0,
        );

        const uniqueSubjectIds = questionPayload.reduce(
          (accumulator: any[], payload) => {
            const idString = payload.subjectId.toHexString();
            if (!accumulator.some((id) => id.toHexString() === idString)) {
              accumulator.push(payload.subjectId);
            }
            return accumulator;
          },
          [],
        );

        commonUpdate.assignedQuestion = questionPayload;
        commonUpdate.totalMarks = correctAnswerMarks;
        commonUpdate.subjectIds = uniqueSubjectIds;
      } else {
        delete commonUpdate.assignedQuestion;
        delete commonUpdate.totalMarks;
        delete commonUpdate.subjectIds;
      }

      await this.testMasterModule.findByIdAndUpdate(testId, {
        $set: commonUpdate,
      });
    }

    return test_master.testStatus === TestStatus.PUBLISHED
      ? DRAFT_TEST
      : PUBLISHED_TEST;
  }

  //SECTION - get all free test master based on userId
  async freeTestDetails(query: ParsedQs, studentId: string): Promise<any> {
    //NOTE - add paginanation
    const { page, limit } = query as {
      page: string;
      limit: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - get student details
    const student_details = await this.userModel.findById({ _id: studentId });

    //NOTE - find all test master data
    const all_test_master_Details = await this.testMasterModule
      .find({
        categoryId: student_details?.categoryId,
        courseIds: student_details?.courseId,
        isMapQuestions: true,
        testStatus: TestStatus.PUBLISHED,
        isFree: true,
        status: true,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    //NOTE - push final data
    const data = await Promise.all(
      all_test_master_Details.map(async (item) => {
        //NOTE - check if test saved or not
        const savedProduct = await this.saveProductModel
          .findOne({ testId: item._id, userId: studentId })
          .select('testId');

        //NOTE - check if test attempted by user or not
        const isAttempted = await this.testResultModel
          .findOne({
            testId: item._id,
            studentId: new mongoose.Types.ObjectId(studentId),
          })
          .select('testId');

        return {
          _id: item._id,
          title: item.title,
          mode: item.mode ?? null,
          noOfQuestions: item.noOfQuestions,
          duration: item.duration,
          slugUrl: item?.slugUrl ?? null,
          isFree: item.isFree,
          attemptMode: item?.attemptMode,
          isSaved: savedProduct !== null ? true : false,
          offlineMode: item?.offlineMode ?? null,
          isAttempted: !!isAttempted,
          isStudentImageExist: !!student_details?.image,
          startAfter: item?.startAfter ?? null,
          startBefore: item?.startBefore ?? null,
          currentTime: currentDate,
        };
      }),
    );

    return data;
  }

  // SECTION - get test master questions
  async getTestQuestions(id: string): Promise<any> {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    // NOTE: get test master details
    const test_master: any = await this.testMasterModule
      .findOne({
        $or: [
          objectIdPattern.test(id)
            ? { _id: new mongoose.Types.ObjectId(id) }
            : { slugUrl: id },
        ],
      })
      .populate('languageIds', 'language')
      .populate('subjectIds', 'name')
      .populate('assignedQuestion.subjectId', 'name')
      .populate('assignedQuestion.scoreSchemaId', 'name plus minus');

    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE: Add subject names from subjectIds to a Set
    const subjectNames = new Set(['All Subjects']);
    test_master.subjectIds.forEach((subject: any) => {
      subjectNames.add(subject.name);
    });

    // NOTE - Extract unique question IDs
    const questionIds = test_master.assignedQuestion.map(
      (ele: any) => ele.uniqueId,
    );

    // NOTE: Fetch all questions in one go
    const questions = await this.questionBankModel
      .find({ uniqueId: { $in: questionIds } })
      .populate('languageId', 'language')
      .populate('subjectIds', 'name');

    // NOTE: Create a map for fast lookup of assigned questions
    const assignedQuestionMap = new Map();
    test_master.assignedQuestion.forEach((ele: any) => {
      assignedQuestionMap.set(ele.uniqueId, ele);
    });

    // NOTE: Initialize a map for grouped questions
    const groupedQuestions = new Map();

    // NOTE: Map the fetched questions to the desired format and group them
    questions.forEach((question: any) => {
      const assignedQuestion = assignedQuestionMap.get(question.uniqueId);
      if (!assignedQuestion) return;

      const { questionNo, subjectId, scoreSchemaId } = assignedQuestion;
      const subjectName = subjectId?.name;
      const plus = scoreSchemaId?.plus;
      const minus = scoreSchemaId?.minus;

      if (!groupedQuestions.has(question.uniqueId)) {
        groupedQuestions.set(question.uniqueId, {
          uniqueId: question.uniqueId,
          questionNo,
          subjectName,
          timer: 0,
          answer: '',
          isAnswered: false,
          responseStatus: QuestionResponseStatus.SKIPPED,
          plus: Number(plus),
          minus: -Number(minus),
        });
      }

      // Add language-specific details to the existing entry
      const existingEntry = groupedQuestions.get(question.uniqueId);
      existingEntry[question.languageId.language.toLowerCase()] = {
        _id: question._id,
        question: question.question,
        options: {
          a: question.a,
          b: question.b,
          c: question.c,
          d: question.d,
          e: question.e,
        },
      };
    });

    // NOTE: Convert map values to an array
    const result = Array.from(groupedQuestions.values()).map(
      (item: any, index) => ({
        questionIndex: index + 1,
        ...item,
      }),
    );

    // NOTE - push the final response
    const response = {
      count: test_master?.noOfQuestions,
      languages: test_master?.languageIds?.map((ele: { language: string }) =>
        ele?.language.toLowerCase(),
      ),
      subjectNames: Array.from(subjectNames),
      questions: result,
    };

    return response;
  }

  // SECTION - submit test answer of the test
  async wrapUpTest(payload: WrapUpTestDto, studentId: string): Promise<any> {
    const { testId, attemptCount, mode, attemptedFrom, questions } = payload;
    if (
      !mongoose.isValidObjectId(testId) ||
      !mongoose.isValidObjectId(studentId)
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Fetch testMaster document
    const test_master = await this.testMasterModule.findById(testId);
    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    const attemptMode =
      test_master?.mode === TestMasterTypes.ONLINE ||
      test_master?.mode === TestMasterTypes.EVENT
        ? test_master?.attemptMode
        : null;

    if (attemptMode === TestMasterAttemptModeTypes.SINGLE) {
      const testResult = await this.testResultModel.exists({
        testId: new mongoose.Types.ObjectId(testId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });

      if (testResult)
        throw new HttpException(TEST_SUBMIT_ERROR, HttpStatus.NOT_FOUND);
    }

    //NOTE - attempted from which device
    const device = attemptedFrom ? attemptedFrom : TestAttemptFromTypes.MOBILE;

    const currentTime = new Date();
    //NOTE: Add 5 hours and 30 minutes to the current timestamp
    const updateTime = new Date(currentTime.getTime() + 5.5 * 60 * 60 * 1000);

    //NOTE - get attempt count
    const newAttemptCount = attemptCount + 1;

    //NOTE: Create an array to store the data for bulk insertion
    const bulkInsertData = questions.map(
      async ({ questionNo, uniqueId, answer, spendTime, responseStatus }) => {
        //NOTE: Fetch question document
        const question = await this.questionBankModel.findOne({ uniqueId });

        //NOTE: Find assigned question item
        const assignedQuestionItem = test_master.assignedQuestion.find(
          (item) =>
            item.uniqueId === uniqueId && item.questionNo === questionNo,
        );

        //NOTE: Get score schema ID
        const scoreSchemaId = assignedQuestionItem?.scoreSchemaId;

        //NOTE: Return test result data for this iteration
        return {
          studentId: new mongoose.Types.ObjectId(studentId),
          mode,
          testId: test_master._id,
          questionId: question._id,
          questionNo,
          uniqueId,
          subjectIds: question.subjectIds,
          scoreSchemaId,
          answer,
          spendTime,
          responseStatus,
          createdBy: studentId,
          attemptCount: newAttemptCount,
          attemptMode,
          attemptedFrom: device,
          createdAt: updateTime,
          updatedAt: updateTime,
        };
      },
    );

    //NOTE: Wait for all promises in bulkInsertData to resolve
    const resolvedBulkInsertData = await Promise.all(bulkInsertData);

    //NOTE: Perform bulk create operation
    await this.testResultModel.insertMany(resolvedBulkInsertData);

    //NOTE - if test for event update the student as event attempted
    if (test_master?.mode === TestMasterTypes.EVENT) {
      await this.eventAppliedModule.findOneAndUpdate(
        {
          eventId: test_master.eventId,
          studentId: new mongoose.Types.ObjectId(studentId),
        },
        { $set: { isEventAttempted: true } },
      );
    }

    return SUBMIT_TEST_SUCCESSFULLY;
  }

  // SECTION - get test master based on online course type , category and course
  async getByOnlineCourse(
    payload: ByOnlineCourseDto,
  ): Promise<{ data: any[] }> {
    const { onlineCourseId } = payload;
    const onlineCourseIdQuery = onlineCourseId
      ? {
          _id: {
            $in: onlineCourseId.map((id) => new mongoose.Types.ObjectId(id)),
          },
        }
      : {};
    //NOTE - get online course details
    const course_details = await this.onlineCourseModel.find(
      onlineCourseIdQuery,
    );
    //NOTE - get test matser based on online course type , category and course
    const test_details = await this.testMasterModule.find({
      mode: { $in: course_details.map((course) => course.type) },
      categoryId: {
        $in: course_details.map((course) => course.categoryId.toString()),
      },
      courseIds: { $in: course_details.flatMap((course) => course.courseIds) },
      testStatus: TestStatus.PUBLISHED,
      status: true,
    });

    //NOTE - push final data
    const response = test_details.map((item) => {
      return {
        _id: item._id,
        title: item.title,
      };
    });

    return { data: response };
  }

  // SECTION - get test total masrks and duration
  async getTestMarksAndTime(
    payload: GetTestMarksAndTimeDto,
    userId: string,
  ): Promise<{ data: TestMarksAndTimeInterface }> {
    const { testId } = payload;

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    //NOTE: Initialize the search query with testId
    const searchQuery: any = objectIdPattern.test(testId)
      ? { _id: new mongoose.Types.ObjectId(testId) }
      : { slugUrl: testId };

    //NOTE: Get test master details
    const test_master = await this.testMasterModule
      .findOne(searchQuery)
      .select(
        'duration totalMarks slugUrl startAfter startBefore mode attemptMode',
      );

    //NOTE: Throw an error if test master not found
    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Find testId based on slugUrl if necessary
    const resolvedTestId = mongoose.isValidObjectId(testId)
      ? test_master._id
      : (await this.testMasterModule.findOne({ slugUrl: testId }))._id;

    //NOTE: Get latest attempt count
    const latestAttempt = await this.testResultModel
      .findOne({
        studentId: new mongoose.Types.ObjectId(userId),
        testId: resolvedTestId,
      })
      .sort({ attemptCount: -1 });

    //NOTE - check if attemptMode is single, student can't reattempt
    // Check if attemptMode is single, student can't reattempt
    const attemptStatus =
      test_master?.attemptMode === TestMasterAttemptModeTypes.SINGLE
        ? !latestAttempt
        : true;

    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    //NOTE: Return the final response
    const result = {
      _id: test_master._id,
      duration: test_master?.duration ?? 0,
      totalMarks: test_master?.totalMarks ?? 0,
      startAfter: test_master?.startAfter ?? null,
      startBefore: test_master?.startBefore ?? null,
      slugUrl: test_master.slugUrl ?? null,
      latestAttemptCount: latestAttempt ? latestAttempt.attemptCount : 0,
      attemptStatus,
      currentTime: currentDate,
    };

    return { data: result };
  }

  // SECTION - verify Unique Code for cbt test
  async verifyUniqueCode(payload: VerifyUniqueCodeDto): Promise<string> {
    const { testId, uniqueCode } = payload;

    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get online course details
    const test_details = await this.testMasterModule.findOne({
      _id: new mongoose.Types.ObjectId(testId),
      uniqueCode,
      testStatus: TestStatus.PUBLISHED,
      status: true,
    });

    if (!test_details)
      throw new HttpException(UNIQUE_CODE_REQUIRED, HttpStatus.BAD_REQUEST);

    return UNIQUE_CODE_VERIFIED;
  }

  // SECTION - preview Questiondetails based on language
  async previewQuestiondetails(
    payload: GetQuestionDto,
  ): Promise<{ data: any[] }> {
    const { testId, languageId } = payload;

    if (
      !mongoose.isValidObjectId(testId) ||
      !mongoose.isValidObjectId(languageId)
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const test_details: any = await this.testMasterModule
      .findOne({
        _id: testId,
        testStatus: TestStatus.PUBLISHED,
        status: true,
      })
      .populate('assignedQuestion.subjectId', 'name');

    if (!test_details)
      throw new HttpException(UNIQUE_CODE_REQUIRED, HttpStatus.BAD_REQUEST);

    const questionIds = test_details.assignedQuestion.map(
      (ele: any) => ele.uniqueId,
    );

    const questionDetailsPromises = questionIds.map(async (uniqueId: any) => {
      const assignedQuestion = test_details.assignedQuestion.find(
        (ele: any) => ele.uniqueId === uniqueId,
      );
      const subjectName = assignedQuestion?.subjectId?.name;

      // Fetch questions for the current uniqueId and languageId
      const question: any = await this.questionBankModel
        .findOne({
          uniqueId: uniqueId,
          languageId: new mongoose.Types.ObjectId(languageId),
          status: true,
        })
        .populate('questionType', 'type');

      if (!question) {
        return null;
      }

      return {
        _id: question._id,
        questionNo: assignedQuestion.questionNo,
        uniqueId: question.uniqueId,
        question: question.question,
        subjectName,
        questionType: question.questionType?.type,
        answer: question.answer,
        options: {
          a: question.a,
          b: question.b,
          c: question.c,
          d: question.d,
          e: question.e,
        },
      };
    });

    const questionDetailsArrays = await Promise.all(questionDetailsPromises);
    // Filter out null values
    const filteredQuestionDetails = questionDetailsArrays.filter(
      (question) => question !== null,
    );
    // Flatten the array
    const flattenedQuestionDetails = filteredQuestionDetails.flat();

    return { data: flattenedQuestionDetails };
  }

  // SECTION - get test assign languages
  async getTestlanguages(
    payload: GetTestMarksAndTimeDto,
  ): Promise<{ data: any[] }> {
    const { testId } = payload;

    // Get test master details
    const test_master: any = await this.testMasterModule
      .findById(testId)
      .populate({ path: 'languageIds', select: '_id language' })
      .select('_id languageIds');

    if (!test_master)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Construct final response
    const result = test_master?.languageIds.map((ele) => ({
      _id: ele._id,
      language: ele.language,
      testId: test_master._id,
    }));

    return { data: result };
  }

  // SECTION - get Maped Question In Test
  async getMapedQuestionInTest(
    payload: UpdateStatusDto,
  ): Promise<{ data: any[] }> {
    const { testId } = payload;

    // Get test master details
    const draft_questions: any = await this.testDraftQuestionModel
      .find({
        testMasterId: testId,
        status: true,
      })
      .populate([
        { path: 'subjectId', select: 'name' },
        { path: 'chapterIds', select: 'name' },
        { path: 'topicIds', select: 'name' },
        { path: 'questionTypeId', select: 'type' },
        { path: 'scoreSchemaId', select: 'name' },
      ]);

    if (!draft_questions)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return { data: draft_questions };
  }

  //ANCHOR - generate Test Number dynamically
  private async generateTestNumber(): Promise<number> {
    // Get the current year
    const currentYear = new Date().getFullYear() % 100; // Get last two digits of the year
    const latestTest = await this.testMasterModule.findOne(
      {},
      {},
      { sort: { testNumber: -1 } },
    );
    const testNumber =
      latestTest && Math.floor(latestTest.testNumber / 1000000) === currentYear
        ? latestTest.testNumber + 1
        : currentYear * 1000000 + 1;

    return testNumber;
  }
}
