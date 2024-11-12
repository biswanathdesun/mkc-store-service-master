import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { ParsedQs } from 'qs';
import { ExtendPaymentDateDto } from './dto/extend-payment-date.dto';
import {
  ADD_REMARK,
  BLANK_REMARK_ERROR,
  DROPPED_STUDENT,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import { FollowUp } from 'src/schema/followup.schema';
import {
  DefaulterTypes,
  DropStudentTypes,
  FollowUpSiteSource,
  FollowUpSource,
  FollowUpStatus,
  FollowUpTypes,
  NotificationSendType,
  NotificationTypes,
  SchemaReferenceType,
  TransactionStatus,
  UserStatusTypes,
} from 'src/utills/enum';
import { Staff } from 'src/schema/staff.schema';
import { User } from 'src/schema/user.schema';
import { AddRemarkDto } from './dto/add-remark.dto';
import { Timeline } from 'src/schema/timeline.schema';
import { DroppedRemarkDto } from './dto/drop-remark.dto';
import { StudentBatch } from 'src/schema/student-batch.schema';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { StudentAdmissionDetails } from 'src/schema/student-admission-date.schema';
import { SmsService } from 'src/utills/smsService';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { Communication } from 'src/schema/communication.schema';
import { EXTENDED_DATE_H_MESSAGE } from 'src/utills/templateMessages';
@Injectable()
export class DefaultersService {
  constructor(
    @InjectModel(OfflineCoursePayment.name)
    private offlineCoursePaymentModel: Model<OfflineCoursePayment>,
    @InjectModel(FollowUp.name) private followUpSchema: Model<FollowUp>,
    @InjectModel(Communication.name)
    private communicationSchema: Model<Communication>,
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(User.name) private studentModel: Model<User>,
    @InjectModel(Timeline.name) private timelineModel: Model<Timeline>,
    @InjectModel(StudentBatch.name)
    private studentBatchModel: Model<StudentBatch>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
    @InjectModel(StudentAdmissionDetails.name)
    private studentAdmissionDetailsModel: Model<StudentAdmissionDetails>,
    private readonly smsService: SmsService,
  ) {}

  //SECTION - get Prebook Defaulters
  async getPrebookDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, type, search, user } = query as {
      page: string;
      limit: string;
      type: string;
      search: string;
      user: string;
    };

    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - check if the requested staff is superadmin or any other staff
    let isStaff = false;
    const ids = [];

    if (!/superadmin/i.test(staff?.roleId?.role)) {
      ids.push(staff?._id?.toString());

      if (staff?.assignStaff?.length > 0) {
        staff?.assignStaff?.map((item) => {
          ids.push(item.staffId);
        });
      }
      isStaff = true;
    }
    if (search) {
      (isStaff = true), ids.push(search);
    }
    const currentDate = new Date();

    const staffRole = staff?.roleId?.role;

    const matchConditionSearch = user
      ? {
          $or: [
            { 'userId.name': { $regex: user, $options: 'i' } },
            { 'userId.email': { $regex: user, $options: 'i' } },
            { 'userId.phone': { $regex: user, $options: 'i' } },
          ],
        }
      : {};

    if (type === DefaulterTypes.TODAY) {
      //NOTE: Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      const nextDate = new Date();
      nextDate.setUTCHours(23, 59, 59, 999);

      //NOTE - condition for today
      const matchConditionToday = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        $or: [
          // Condition for payments due today or extended payments within today's range
          {
            $and: [
              { nextPaymentDate: { $gte: currentDate, $lte: nextDate } },
              {
                $or: [
                  { extendedPaymentDate: { $lte: currentDate } },
                  { extendedPaymentDate: null },
                ],
              },
            ],
          },
          // Condition for extended payments within the range of currentDate and nextDate
          { extendedPaymentDate: { $gte: currentDate, $lte: nextDate } },
        ],
      };

      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionToday,
        isStaff,
        UserStatusTypes.PRE_BOOK,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count: count };
    }

    if (type === DefaulterTypes.UPCOMING) {
      // Get the start of the day
      currentDate.setUTCHours(23, 59, 59, 999);

      //NOTE - condition for upcoming
      const matchConditionUpcoming = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        nextPaymentDate: { $gt: currentDate },
      };
      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionUpcoming,
        isStaff,
        UserStatusTypes.PRE_BOOK,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count: count };
    }

    if (type === DefaulterTypes.OVERDUE) {
      // Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      //NOTE - condition for today
      const matchConditionOverdue = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        nextPaymentDate: { $lt: currentDate },
        $or: [
          { extendedPaymentDate: null },
          { extendedPaymentDate: { $lt: currentDate } },
        ],
      };
      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionOverdue,
        isStaff,
        UserStatusTypes.PRE_BOOK,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count: count };
    }

    if (type == DefaulterTypes.EXTENDED) {
      // Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      //NOTE - condition for today
      const matchConditionOverdue = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        $or: [
          { extendedPaymentDate: { $gt: currentDate } },
          { nextPaymentDate: { $gt: currentDate } },
        ],
        addExtendedDate: false,
      };
      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionOverdue,
        isStaff,
        UserStatusTypes.PRE_BOOK,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );
      return { data: response, count };
    }
  }

  //SECTION - get Admitted Defaulters
  async getAdmittedDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, type, search, user } = query as {
      page: string;
      limit: string;
      type: string;
      search: string;
      user: string;
    };
    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - check if the requested staff is superadmin or any other staff
    let isStaff = false;
    const ids = [];
    if (!/superadmin/i.test(staff?.roleId?.role)) {
      ids.push(staff?._id?.toString());

      if (staff?.assignStaff?.length > 0) {
        staff?.assignStaff?.map((item) => {
          ids.push(item.staffId);
        });
      }
      isStaff = true;
    }
    if (search) {
      (isStaff = true), ids.push(search);
    }
    const currentDate = new Date();

    const staffRole = staff?.roleId?.role;

    const matchConditionSearch = user
      ? {
          $or: [
            { 'userId.name': { $regex: user, $options: 'i' } },
            { 'userId.email': { $regex: user, $options: 'i' } },
            { 'userId.phone': { $regex: user, $options: 'i' } },
          ],
        }
      : {};

    if (type === DefaulterTypes.TODAY) {
      // Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      const nextDate = new Date();
      nextDate.setUTCHours(23, 59, 59, 999);

      //NOTE - condition for today
      const matchConditionToday = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        $or: [
          // Condition for payments due today or extended payments within today's range
          {
            $and: [
              { nextPaymentDate: { $gte: currentDate, $lte: nextDate } },
              {
                $or: [
                  { extendedPaymentDate: { $lte: currentDate } },
                  { extendedPaymentDate: null },
                ],
              },
            ],
          },
          // Condition for extended payments within the range of currentDate and nextDate
          { extendedPaymentDate: { $gte: currentDate, $lte: nextDate } },
        ],
      };

      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionToday,
        isStaff,
        UserStatusTypes.ADMITTED,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count };
    }

    if (type === DefaulterTypes.UPCOMING) {
      // Get the start of the day
      currentDate.setUTCHours(23, 59, 59, 999);

      //NOTE - condition for upcoming
      const matchConditionUpcoming = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        nextPaymentDate: { $gt: currentDate },
      };
      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionUpcoming,
        isStaff,
        UserStatusTypes.ADMITTED,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count: count };
    }

    if (type === DefaulterTypes.OVERDUE) {
      // Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      //NOTE - condition for overdue
      const matchConditionOverdue = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        nextPaymentDate: { $lt: currentDate },
        $or: [
          { extendedPaymentDate: null },
          { extendedPaymentDate: { $lt: currentDate } },
        ],
      };

      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionOverdue,
        isStaff,
        UserStatusTypes.ADMITTED,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );

      return { data: response, count };
    }

    if (type === DefaulterTypes.EXTENDED) {
      // Get the start of the day
      currentDate.setUTCHours(0, 0, 0, 0);

      //NOTE - condition for today
      const matchConditionOverdue = {
        transactionStatus: TransactionStatus.INSTALLMENT,
        $or: [
          { extendedPaymentDate: { $gt: currentDate } },
          { nextPaymentDate: { $gt: currentDate } },
        ],
        addExtendedDate: false,
      };
      //NOTE - call the aggragation based the condition
      const { response, count } = await this.runAggregationPipeline(
        matchConditionOverdue,
        isStaff,
        UserStatusTypes.ADMITTED,
        ids,
        skip,
        page,
        limit,
        staffRole,
        matchConditionSearch,
      );
      return { data: response, count };
    }
  }

  //SECTION - get Closed Defaulters
  async getClosedDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    let count = 0;
    let response: any = [];
    const currentDate = new Date();
    currentDate.setUTCHours(23, 59, 59, 999);

    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate([{ path: 'roleId', select: 'role' }]);

    //NOTE - check if the requested staff is superadmin or any other staff
    let isStaff = false;
    const ids = [];
    if (!/superadmin/i.test(staff?.roleId?.role)) {
      ids.push(staff?._id?.toString());

      if (staff?.assignStaff?.length > 0) {
        staff?.assignStaff?.map((item) => {
          ids.push(item.staffId);
        });
      }
      isStaff = true;
    }
    if (search) {
      isStaff = true;
      ids.push(search);
    }

    //NOTE - offline course payment details
    const data = await this.offlineCoursePaymentModel.aggregate([
      {
        $match: {
          transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
          paymentDate: { $lte: currentDate },
        },
      },
      {
        $sort: {
          userId: 1, // Sort by user in ascending order
          createdAt: -1, // Sort by payment_date in descending order (latest first)
        },
      },
      {
        $group: {
          _id: '$orderId',
          latestPayment: {
            $first: '$$ROOT', // Get the first document in each group (latest payment)
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: '$latestPayment', // Replace the root with the latest payment document
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderId',
        },
      },
      {
        $unwind: {
          path: '$orderId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'paymentrebates',
          localField: 'userId',
          foreignField: 'userId',
          as: 'rebates',
        },
      },
      {
        $addFields: {
          userId: {
            $toObjectId: '$userId', // Convert userId to ObjectId
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.primaryCounsellorId',
          foreignField: '_id',
          as: 'primaryCounsellor',
        },
      },
      {
        $unwind: {
          path: '$primaryCounsellor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.secondaryCounsellorId',
          foreignField: '_id',
          as: 'secondaryCounsellor',
        },
      },
      {
        $unwind: {
          path: '$secondaryCounsellor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          courseId: {
            $toObjectId: '$courseId', // Convert userId to ObjectId
          },
        },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseId',
        },
      },
      {
        $unwind: {
          path: '$courseId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          userCourseId: {
            $toObjectId: '$userId.courseId', // Convert userId to ObjectId
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'userCourseId',
          foreignField: '_id',
          as: 'userCourseId',
        },
      },
      {
        $unwind: {
          path: '$userCourseId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          parentId: {
            $toObjectId: '$parentId', // Convert parentId to ObjectId
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'parentId',
          foreignField: '_id',
          as: 'parentId',
        },
      },
      {
        $unwind: {
          path: '$parentId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _id: 1,
          productAmount: 1,
          totalAmtReceived: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          totalPrice: 1,
          productId: '$courseId._id',
          userId: '$userId._id',
          username: '$userId.name', // Extract username from the user array
          type: {
            $cond: {
              if: { $eq: ['$userId.studentStatus', UserStatusTypes.PRE_BOOK] },
              then: '$userId.studentStatus',
              else: '$userId.type',
            },
          },
          categoryId: '$userId.categoryId',
          courseId: '$userId.courseId',
          courseName: '$userCourseId.name',
          categoryName: '$category.name',
          parentsPhone: '$parentId.phone' || '$userId.parentNumber', // Extract parentsPhone from the user array
          studentPhone: '$userId.phone', // Extract studentPhone from the user array
          productName: '$courseId.title',
          rebate: '$rebates',
          user: '$userId',
          primaryCounsellor: '$primaryCounsellor.name',
          secondaryCounsellor: '$secondaryCounsellor.name',
        },
      },
      {
        $facet: {
          totalCount: [
            {
              $count: 'total',
            },
          ],
          paginatedResults: [],
        },
      },
    ]);
    response = data[0]?.paginatedResults;
    count = data[0]?.totalCount[0]?.total || 0;
    //NOTE: if not super admin
    if (isStaff) {
      const staffIds = ids.map(String);

      response = response.filter((item) => {
        return (
          staffIds.includes(item.user?.primaryCounsellorId?.toString()) ||
          staffIds.includes(item.user?.secondaryCounsellorId?.toString())
        );
      });
      count = response.length || 0;
    }

    const responseData = await Promise.all(
      response?.map((item: any) => {
        let totalRebateAmount = 0;
        item?.rebate?.map((reb) => {
          reb?.productDetails?.map((courses) => {
            if (courses?.courseId == item?.productId.toString()) {
              totalRebateAmount += courses?.amount;
            }
          });
        });

        return {
          _id: item._id,
          totalAmtReceived: item.totalAmtReceived,
          paidAmount: item.totalPrice,
          productAmount: item.productAmount,
          outstandingAmount: item.outstandingAmount,
          nextPaymentDate: item.nextPaymentDate,
          amountWithoutRebate: item.totalAmtReceived - totalRebateAmount,
          productId: item.productId,
          userId: item.userId,
          username: item.username,
          type: item.type,
          categoryId: item.categoryId,
          courseId: item.courseId,
          courseName: item.courseName,
          categoryName: item.categoryName,
          parentsPhone: item.parentsPhone || null,
          studentPhone: item.studentPhone,
          productName: item.productName,
          primaryCounsellor: item?.primaryCounsellor,
          secondaryCounsellor: item?.secondaryCounsellor || null,
          user: item.user,
          totalRebateAmount,
        };
      }),
    );

    response = responseData
      .slice(skip, parseInt(page) * parseInt(limit))
      .map((item: { [x: string]: any; user: any }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, ...rest } = item;
        return rest;
      });

    // count = response.length;

    return { data: response, count: count };
  }

  //SECTION - get dropped defaulters
  async getDroppedStudents(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    let count = 0;
    let response: any = [];

    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate([{ path: 'roleId', select: 'role' }]);

    //NOTE - check if the requested staff is superadmin or any other staff
    let isStaff = false;
    const ids = [];
    if (!/superadmin/i.test(staff?.roleId?.role)) {
      ids.push(staff?._id?.toString());

      if (staff?.assignStaff?.length > 0) {
        staff?.assignStaff?.map((item) => {
          ids.push(item.staffId);
        });
      }
      isStaff = true;
    }
    if (search) {
      isStaff = true;
      ids.push(search);
    }

    //NOTE - offline course payment details
    const data = await this.offlineCoursePaymentModel.aggregate([
      { $match: { transactionStatus: TransactionStatus.INSTALLMENT_CLOSED } },
      { $sort: { userId: 1, createdAt: -1 } },
      {
        $group: { _id: '$orderId', latestPayment: { $first: '$$ROOT' } },
      },
      { $replaceRoot: { newRoot: '$latestPayment' } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderId',
        },
      },
      {
        $unwind: { path: '$orderId', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'paymentrebates',
          localField: 'userId',
          foreignField: 'userId',
          as: 'rebates',
        },
      },
      {
        $addFields: { userId: { $toObjectId: '$userId' } },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.primaryCounsellorId',
          foreignField: '_id',
          as: 'primaryCounsellor',
        },
      },
      {
        $unwind: {
          path: '$primaryCounsellor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.secondaryCounsellorId',
          foreignField: '_id',
          as: 'secondaryCounsellor',
        },
      },
      {
        $unwind: {
          path: '$secondaryCounsellor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: { courseId: { $toObjectId: '$courseId' } },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseId',
        },
      },
      {
        $unwind: {
          path: '$courseId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          userCourseId: {
            $toObjectId: '$userId.courseId',
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'userCourseId',
          foreignField: '_id',
          as: 'userCourseId',
        },
      },
      {
        $unwind: {
          path: '$userCourseId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          parentId: {
            $toObjectId: '$parentId',
          },
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $project: {
          _id: 1,
          productAmount: 1,
          totalAmtReceived: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          productId: '$courseId._id',
          userId: '$userId._id',
          username: '$userId.name',
          userStatus: '$userId.studentStatus',
          droppedRemark: 1,
          type: {
            $cond: {
              if: { $eq: ['$userId.studentStatus', UserStatusTypes.PRE_BOOK] },
              then: '$userId.studentStatus',
              else: '$userId.type',
            },
          },
          // dropRemark: {
          //   $ifNull: ['$studentBatchData.droppedRemark', null],
          // },
          categoryId: '$userId.categoryId',
          courseId: '$userId.courseId',
          courseName: '$userCourseId.name',
          categoryName: '$category.name',
          parentsPhone: {
            $ifNull: ['$parentId.phone', '$userId.parentNumber'],
          },
          studentPhone: '$userId.phone',
          productName: '$courseId.title',
          rebate: '$rebates',
          user: '$userId',
          primaryCounsellor: '$primaryCounsellor.name',
          secondaryCounsellor: '$secondaryCounsellor.name',
        },
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          paginatedResults: [],
        },
      },
    ]);
    response = data[0]?.paginatedResults;
    count = data[0]?.totalCount[0]?.total || 0;
    //NOTE: if not super admin
    if (isStaff) {
      const staffIds = ids.map(String);

      response = response.filter((item) => {
        return (
          staffIds.includes(item.user?.primaryCounsellorId?.toString()) ||
          staffIds.includes(item.user?.secondaryCounsellorId?.toString())
        );
      });
      count = response.length || 0;
    }

    const responseData = await Promise.all(
      response?.map((item: any) => {
        let totalRebateAmount = 0;
        item?.rebate?.map((reb) => {
          reb?.productDetails?.map((courses) => {
            if (courses?.courseId == item?.productId.toString()) {
              totalRebateAmount += courses?.amount;
            }
          });
        });

        return {
          _id: item._id,
          totalAmtReceived: item.totalAmtReceived,
          paidAmount: item.totalPrice,
          productAmount: item.productAmount,
          outstandingAmount: item.outstandingAmount,
          nextPaymentDate: item.nextPaymentDate,
          amountWithoutRebate: item.totalAmtReceived - totalRebateAmount,
          productId: item.productId,
          userId: item.userId,
          username: item.username,
          userStatus: item.userStatus,
          type: item.type,
          dropRemark: item.droppedRemark ?? null,
          categoryId: item.categoryId,
          courseId: item.courseId,
          courseName: item.courseName,
          categoryName: item.categoryName,
          parentsPhone: item.parentsPhone ?? null,
          studentPhone: item.studentPhone,
          productName: item.productName,
          primaryCounsellor: item?.primaryCounsellor,
          secondaryCounsellor: item?.secondaryCounsellor ?? null,
          user: item.user,
          totalRebateAmount,
        };
      }),
    );

    response = responseData
      .slice(skip, parseInt(page) * parseInt(limit))
      .map((item: { [x: string]: any; user: any }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, ...rest } = item;
        return rest;
      });

    return { data: response, count: count };
  }

  //SECTION - extend Payment Date
  async extendPaymentDate(
    id: string,
    payload: ExtendPaymentDateDto,
    updatedById: string,
  ): Promise<{ data: any }> {
    const { extendedPaymentDate, message } = payload;

    //NOTE - get user primarycounsellor Id
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const data = await this.offlineCoursePaymentModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      {
        $set: {
          extendedPaymentDate: extendedPaymentDate,
          addExtendedDate: false,
          remarks: message,
          remarkDate: new Date().setUTCHours(0, 0, 0, 0),
          updatedBy: updatedById,
        },
      },
    );
    if (!data)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const userDetails = await this.studentModel.findById(data.userId);

    await this.followUpSchema.create({
      studentId: data.userId,
      primaryCounsellorId: userDetails.primaryCounsellorId,
      secondaryCounsellorId: userDetails.secondaryCounsellorId,
      type: FollowUpTypes.CALL,
      nextFollowUpDate: extendedPaymentDate,
      followUpResponse: message,
      followUpSource: FollowUpSource.EXTENDED_DATE,
      siteSource: FollowUpSiteSource.STUDENT,
      createdBy: updatedById,
    });

    // NOTE - added timeline for remark
    await this.timelineModel.create({
      userId: data.userId,
      section: `Defaulter Remark`,
      reason: message,
      paymentId: new mongoose.Types.ObjectId(id),
      courseId: data.courseId,
      createdBy: updatedById,
    });

    if (!userDetails.isFollowUpCreated) {
      await this.studentModel.updateOne(
        { _id: userDetails._id },
        { $set: { isFollowUpCreated: true } },
      );
    }

    //NOTE - get course details
    const course = await this.onlineCourseModel.findById(data.courseId);

    if (userDetails.studentStatus !== UserStatusTypes.ADMITTED) {
      const phoneNumber = [
        { sendTo: NotificationSendType.USER, mobile: userDetails?.phone },
      ];
      if (userDetails?.parentNumber !== null) {
        phoneNumber.push({
          sendTo: NotificationSendType.PARENT,
          mobile: userDetails?.parentNumber,
        });
      }

      for (const data of phoneNumber) {
        //NOTE - send message for extend Payment Date
        await this.smsService.extendPaymentDate({
          name: userDetails?.name,
          phone: data.mobile,
          course: course?.title,
          date: await this.convertToShortDate(extendedPaymentDate),
          url: process.env.STUDENT_LOGIN,
        });

        const createdAt = new Date();
        createdAt.setHours(
          createdAt.getHours() + 5,
          createdAt.getMinutes() + 30,
        );

        const variables = {
          name: userDetails?.name,
          course: course?.title,
          date: await this.convertToShortDate(extendedPaymentDate),
          url: process.env.STUDENT_LOGIN,
        };

        const customMessage = await this.smsService.replaceMessagesContent({
          message: EXTENDED_DATE_H_MESSAGE,
          variables,
        });

        //NOTE - entry on communication model
        await this.communicationSchema.create({
          userId: new mongoose.Types.ObjectId(userDetails._id),
          userModel: SchemaReferenceType.USER,
          mobile: userDetails?.phone,
          notificationType: NotificationTypes.SMS,
          sendTo: data.sendTo,
          message: customMessage,
          createdAt,
        });
      }
    }

    return { data };
  }

  //SECTION - extend Payment Date
  async timelineUpdate(): Promise<string> {
    //NOTE: get a;l time line api details
    const timeline: any = await this.timelineModel
      .find({
        paymentId: { $exists: true },
      })
      .populate('paymentId', 'courseId');

    //NOTE: Upfdate the timeline
    for (const data of timeline) {
      await this.timelineModel.findByIdAndUpdate(data._id, {
        $set: { courseId: data.paymentId?.courseId },
      });
    }

    return UPDATE_DATA;
  }

  // SECTION - drop student by offline course payment Id
  async dropStudent(
    id: string,
    payload: DroppedRemarkDto,
    updatedById: string,
  ): Promise<string> {
    const { type, remark } = payload;
    //NOTE - Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    if (remark.trim() === '')
      throw new HttpException(BLANK_REMARK_ERROR, HttpStatus.BAD_REQUEST);

    //NOTE - Update the payment data with the specified ID
    const paymentData = await this.offlineCoursePaymentModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      {
        $set: {
          transactionStatus:
            type === DropStudentTypes.INTERESTED
              ? TransactionStatus.INSTALLMENT
              : TransactionStatus.INSTALLMENT_CLOSED,
          droppedRemark: type === DropStudentTypes.INTERESTED ? null : remark,
          droppedDate:
            type === DropStudentTypes.INTERESTED
              ? null
              : new Date().setUTCHours(0, 0, 0, 0),
          updatedBy: updatedById,
        },
      },
    );

    //NOTE - If paymentData is not found, throw a 404 error
    if (!paymentData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - Update the student data with the user ID from the payment data
    await this.studentBatchModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(paymentData.userId),
        courseId: paymentData?.courseId,
        orderId: paymentData?.parentOrderId,
      },
      {
        $set: {
          isDroppedStatus: type === DropStudentTypes.INTERESTED ? false : true,
          droppedRemark: type === DropStudentTypes.INTERESTED ? null : remark,
          droppedDate:
            type === DropStudentTypes.INTERESTED
              ? null
              : new Date().setUTCHours(0, 0, 0, 0),
          updatedBy: updatedById,
        },
      },
      { new: true },
    );
    //NOTE - Update the student data with the user ID from the payment data
    await this.userProductDetailsModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(paymentData.userId),
        onlineCourseId: paymentData?.courseId,
        orderId: paymentData?.parentOrderId,
      },
      {
        $set: {
          isDroppedStatus: type === DropStudentTypes.INTERESTED ? false : true,
          droppedDate:
            type === DropStudentTypes.INTERESTED
              ? null
              : new Date().setUTCHours(0, 0, 0, 0),
          updatedBy: updatedById,
        },
      },
      { new: true },
    );
    //NOTE - Update the student data with the user ID from the payment data
    await this.studentAdmissionDetailsModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(paymentData.userId),
        onlineCourseId: paymentData?.courseId,
      },
      {
        $set: {
          isDroppedStatus: type === DropStudentTypes.INTERESTED ? false : true,
          droppedDate:
            type === DropStudentTypes.INTERESTED
              ? null
              : new Date().setUTCHours(0, 0, 0, 0),
          updatedBy: updatedById,
        },
      },
      { new: true },
    );

    // NOTE - get student data
    const student = await this.studentModel.findById(paymentData.userId);

    if (type === DropStudentTypes.INTERESTED) {
      //NOTE - create a documnet in timeline that student enable
      await this.timelineModel.create({
        userId: new mongoose.Types.ObjectId(paymentData.userId),
        section: `Defaulter Remark`,
        reason: remark,
        paymentId: paymentData?._id,
        courseId: paymentData?.courseId,
        createdBy: updatedById,
      });
    } else {
      //NOTE -  Update follow-up records for the dropped student
      await this.followUpSchema.updateMany(
        { studentId: student._id },
        {
          followupStatus: FollowUpStatus.COMPLETED,
          updatedBy: updatedById,
        },
      );

      await this.followUpSchema.create({
        studentId: student?._id,
        primaryCounsellorId: student?.primaryCounsellorId,
        secondaryCounsellorId: student?.secondaryCounsellorId,
        type: FollowUpTypes.CALL,
        nextFollowUpDate: null,
        followUpResponse: `Drop Student`,
        followupStatus: FollowUpStatus.COMPLETED,
        followUpSource: FollowUpSource.DROPPED_STUDENT,
        siteSource: FollowUpSiteSource.STUDENT,
        createdBy: updatedById,
      });
    }

    if (!student.isFollowUpCreated) {
      await this.studentModel.updateOne(
        { _id: student._id },
        { $set: { isFollowUpCreated: true } },
      );
    }

    //NOTE -  Return a success message
    return DROPPED_STUDENT;
  }

  // SECTION - add remark for extended date
  async addRemark(payload: AddRemarkDto, createdById: string): Promise<string> {
    const { paymentId, remark } = payload;
    //NOTE - Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(paymentId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - Update the payment data with the specified ID
    const paymentData = await this.offlineCoursePaymentModel.findById(
      paymentId,
    );

    //NOTE - If paymentData is not found, throw a 404 error
    if (!paymentData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE - added timeline for remark
    await this.timelineModel.create({
      userId: paymentData?.userId,
      section: `Defaulter Remark`,
      reason: remark,
      paymentId: paymentData?._id,
      courseId: paymentData?.courseId,
      createdBy: createdById,
    });

    //NOTE -  Return a success message
    return ADD_REMARK;
  }

  //ANCHOR:  Common function for the aggregation pipeline
  private async runAggregationPipeline(
    matchCondition: Record<string, any>,
    isStaff: boolean,
    studentStatus: UserStatusTypes,
    ids: string[],
    skip: any,
    page: any,
    limit: any,
    staffRole: string,
    matchConditionSearch: any,
  ): Promise<any> {
    let count = 0;
    //NOTE - dynamic aggragation for defaulter
    const pipeline: any = [
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$parentOrderId',
          latestPayment: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestPayment' } },
      { $match: matchCondition },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderId',
        },
      },
      {
        $unwind: {
          path: '$orderId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          userId: {
            $cond: {
              if: {
                $or: [{ $eq: ['$userId', null] }, { $eq: ['$userId', ''] }],
              },
              then: null,
              else: { $toObjectId: '$userId' },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchConditionSearch },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.primaryCounsellorId',
          foreignField: '_id',
          as: 'primaryCounsellorId',
        },
      },
      {
        $unwind: {
          path: '$primaryCounsellorId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: 'userId.secondaryCounsellorId',
          foreignField: '_id',
          as: 'secondaryCounsellorId',
        },
      },
      {
        $unwind: {
          path: '$secondaryCounsellorId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'userId.studentStatus': studentStatus,
        },
      },
      {
        $addFields: {
          categoryId: {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$userId.categoryId', null] },
                  { $eq: ['$userId.categoryId', ''] },
                ],
              },
              then: null,
              else: { $toObjectId: '$userId.categoryId' },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          courseId: {
            $cond: {
              if: {
                $or: [{ $eq: ['$courseId', null] }, { $eq: ['$courseId', ''] }],
              },
              then: null, // or whatever default value you want to assign for null or empty string
              else: { $toObjectId: '$courseId' },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseId',
        },
      },
      {
        $unwind: { path: '$courseId', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          userCourseId: {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$userId.courseId', null] },
                  { $eq: ['$userId.courseId', ''] },
                ],
              },
              then: null, // or whatever default value you want to assign for null or empty string
              else: { $toObjectId: '$userId.courseId' },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'userCourseId',
          foreignField: '_id',
          as: 'userCourseId',
        },
      },
      {
        $unwind: {
          path: '$userCourseId',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          parentId: {
            $cond: {
              if: {
                $or: [{ $eq: ['$parentId', null] }, { $eq: ['$parentId', ''] }],
              },
              then: null, // or whatever default value you want to assign for null
              else: { $toObjectId: '$parentId' },
            },
          },
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'parentId',
          foreignField: '_id',
          as: 'parentDetails',
        },
      },
      {
        $unwind: {
          path: '$parentDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'studentbatches',
          let: {
            studentId: '$userId._id',
            courseId: '$courseId._id',
            orderId: '$parentOrderId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$studentId', '$$studentId'] },
                    { $eq: ['$courseId', '$$courseId'] },
                    { $eq: ['$orderId', '$$orderId'] },
                  ],
                },
              },
            },
          ],
          as: 'studentBatchData',
        },
      },
      {
        $unwind: {
          path: '$studentBatchData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          batchId: {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$studentBatchData.batchId', null] },
                  { $eq: ['$studentBatchData.batchId', ''] },
                ],
              },
              then: null, // or whatever default value you want to assign for null or empty string
              else: '$studentBatchData.batchId',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch',
        },
      },
      {
        $unwind: {
          path: '$batch',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'slots',
          localField: 'batch.slotId',
          foreignField: '_id',
          as: 'slot',
        },
      },
      {
        $unwind: {
          path: '$slot',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'studentattendances',
          let: {
            studentId: '$userId._id',
            studentBatchId: '$studentBatchData._id',
            date: { $toDate: new Date().setUTCHours(0, 0, 0, 0) },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$studentId', '$$studentId'] },
                    { $eq: ['$studentBatchId', '$$studentBatchId'] },
                    { $eq: ['$date', '$$date'] },
                  ],
                },
              },
            },
          ],
          as: 'studentAttendancesData',
        },
      },
      {
        $unwind: {
          path: '$studentAttendancesData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          productAmount: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          extendedPaymentDate: 1,
          totalPrice: 1,
          totalAmtReceived: 1,
          userId: '$userId._id',
          name: '$userId.name',
          type: {
            $cond: {
              if: { $eq: ['$userId.studentStatus', UserStatusTypes.PRE_BOOK] },
              then: '$userId.studentStatus',
              else: '$userId.type',
            },
          },
          categoryId: '$userId.categoryId',
          courseId: '$userId.courseId',
          course: '$userCourseId.name',
          category: '$category.name',
          studentPhone: '$userId.phone',
          batch: { $ifNull: ['$batch.name', null] },
          slot: { $ifNull: ['$slot.name', null] },
          attendance: { $ifNull: ['$studentAttendancesData.attendance', null] },
          productName: '$courseId.title',
          user: '$userId',
          primaryCounsellor: '$primaryCounsellorId.name',
          secondaryCounsellor: {
            $cond: {
              if: { $gt: ['$secondaryCounsellorId.name', null] },
              then: '$secondaryCounsellorId.name',
              else: null,
            },
          },
          parentsPhone: { $ifNull: ['$parentDetails.phone', null] },
        },
      },
      {
        $facet: {
          totalCount: [
            {
              $count: 'total',
            },
          ],
          paginatedResults: [],
        },
      },
    ];

    //NOTE - get values based on the condition
    const data = await this.offlineCoursePaymentModel.aggregate(pipeline);

    let response = data[0]?.paginatedResults;
    count = data[0]?.totalCount[0]?.total || 0;

    //NOTE: if not super admin
    if (isStaff) {
      const staffIds = ids.map(String);
      response = response.filter(
        (item: {
          user: {
            primaryCounsellorId: { toString: () => string };
            secondaryCounsellorId: { toString: () => string };
          };
        }) =>
          staffIds.includes(item.user?.primaryCounsellorId?.toString()) ||
          staffIds.includes(item.user?.secondaryCounsellorId?.toString()),
      );
      count = response.length || 0;
    }

    //NOTE: Assuming response is an array of data objects
    response = await Promise.all(
      response.slice(skip, parseInt(page) * parseInt(limit)).map(
        async ({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          user,
          extendedPaymentDate,
          nextPaymentDate,
          addExtendedDate,
          parentsPhone,
          _id,
          ...rest
        }) => {
          const timelineExists = await this.timelineModel.findOne({
            paymentId: _id,
          });

          return {
            _id: _id,
            ...rest,
            nextPaymentDate: extendedPaymentDate
              ? extendedPaymentDate
              : nextPaymentDate,
            addExtendedDate:
              studentStatus === UserStatusTypes.ADMITTED &&
              staffRole &&
              /superadmin|recovery head/i.test(staffRole)
                ? true
                : studentStatus === UserStatusTypes.PRE_BOOK &&
                  staffRole &&
                  /superadmin|telecaller|counsellor/i.test(staffRole)
                ? true
                : addExtendedDate !== undefined
                ? addExtendedDate
                : !extendedPaymentDate,
            parentsPhone: parentsPhone || null,
            timelineExists: timelineExists ? true : false,
          };
        },
      ),
    );

    return { response, count: count };
  }

  //ANCHOR - convert To Short Date
  private async convertToShortDate(
    dateString: Date | null,
  ): Promise<string | null> {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }
}
