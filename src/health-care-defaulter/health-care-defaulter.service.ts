import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { Staff } from 'src/schema/staff.schema';
import {
  DefaulterTypes,
  FollowUpSiteSource,
  FollowUpSource,
  FollowUpTypes,
  TransactionStatus,
  UserStatusTypes,
} from 'src/utills/enum';
import {
  DEFAULTER_TYPE_ERROR,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { HealthcareExtendDateDto } from './dto/healthcare-extend-payment-date.dto';
import { HealthcareUser } from 'src/schema/health-care-user.schema';
import { FollowUp } from 'src/schema/followup.schema';

@Injectable()
export class HealthCareDefaulterService {
  constructor(
    @InjectModel(HealthCareFinance.name)
    private financeModel: Model<HealthCareFinance>,
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    @InjectModel(HealthcareUser.name)
    private healthcareUserModel: Model<HealthcareUser>,
    @InjectModel(FollowUp.name) private followUpModel: Model<FollowUp>,
  ) {}

  //SECTION - get healthcare Prebook Defaulters
  async healthcarePrebookDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, type, search } = query as {
      page: string;
      limit: string;
      type: string;
      search: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE: Search with user name, email, or phone
    const userQuery = search
      ? {
          $or: [
            { 'userId.name': { $regex: search, $options: 'i' } },
            { 'userId.email': { $regex: search, $options: 'i' } },
            { 'userId.phone': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    const staffIds = [staff?._id];
    let isAdmin = true;
    if (staff && !/superadmin/i.test(staff?.roleId?.role)) {
      const assignStaffIds = staff?.assignStaff?.map(
        (item) => new mongoose.Types.ObjectId(item.staffId),
      );
      staffIds.push(...(assignStaffIds || []));
      isAdmin = false;
    }

    const currentDate = new Date();

    let matchCondition: Record<string, any>;
    switch (type) {
      case DefaulterTypes.TODAY: {
        // Get the start and end of the day
        const startOfDay = new Date(currentDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Condition for today
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          $or: [
            { nextPaymentDate: { $gte: startOfDay, $lte: endOfDay } },
            { extendedPaymentDate: { $gte: startOfDay, $lte: endOfDay } },
          ],
        };
        break;
      }
      case DefaulterTypes.UPCOMING: {
        // Get the end of the day
        currentDate.setUTCHours(23, 59, 59, 999);

        // Condition for upcoming
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          nextPaymentDate: { $gt: currentDate },
        };
        break;
      }
      case DefaulterTypes.OVERDUE: {
        // Get the start of the day
        currentDate.setUTCHours(0, 0, 0, 0);

        // Condition for overdue
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          nextPaymentDate: { $lt: currentDate },
          $or: [
            { extendedPaymentDate: null },
            { extendedPaymentDate: { $lt: currentDate } },
          ],
        };
        break;
      }
      case DefaulterTypes.EXTENDED: {
        // Get the start of the day
        currentDate.setUTCHours(0, 0, 0, 0);

        // Condition for extended
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          $or: [
            { extendedPaymentDate: { $gt: currentDate } },
            { nextPaymentDate: { $gt: currentDate } },
          ],
          addExtendedDate: true,
        };
        break;
      }
      default:
        throw new HttpException(DEFAULTER_TYPE_ERROR, HttpStatus.BAD_REQUEST);
    }

    const { response, count } = await this.aggregationForHealthcare(
      matchCondition,
      userQuery,
      skip,
      page,
      limit,
      staffIds,
      isAdmin,
      UserStatusTypes.PRE_BOOK,
    );

    return { data: response, count };
  }

  //SECTION - get healthcare admiited Defaulters
  async healthcareAdmittedDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, type, search } = query as {
      page: string;
      limit: string;
      type: string;
      search: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE: Search with user name, email, or phone
    const userQuery = search
      ? {
          $or: [
            { 'userId.name': { $regex: search, $options: 'i' } },
            { 'userId.email': { $regex: search, $options: 'i' } },
            { 'userId.phone': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    const staffIds = [staff?._id];
    let isAdmin = true;
    if (staff && !/superadmin/i.test(staff?.roleId?.role)) {
      const assignStaffIds = staff?.assignStaff?.map(
        (item) => new mongoose.Types.ObjectId(item.staffId),
      );
      staffIds.push(...(assignStaffIds || []));
      isAdmin = false;
    }

    const currentDate = new Date();

    let matchCondition: Record<string, any>;
    switch (type) {
      case DefaulterTypes.TODAY: {
        // Get the start and end of the day
        const startOfDay = new Date(currentDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Condition for today
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          $or: [
            { nextPaymentDate: { $gte: startOfDay, $lte: endOfDay } },
            { extendedPaymentDate: { $gte: startOfDay, $lte: endOfDay } },
          ],
        };
        break;
      }
      case DefaulterTypes.UPCOMING: {
        // Get the end of the day
        currentDate.setUTCHours(23, 59, 59, 999);

        // Condition for upcoming
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          nextPaymentDate: { $gt: currentDate },
        };
        break;
      }
      case DefaulterTypes.OVERDUE: {
        // Get the start of the day
        currentDate.setUTCHours(0, 0, 0, 0);

        // Condition for overdue
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          nextPaymentDate: { $lt: currentDate },
          $or: [
            { extendedPaymentDate: null },
            { extendedPaymentDate: { $lt: currentDate } },
          ],
        };
        break;
      }
      case DefaulterTypes.EXTENDED: {
        // Get the start of the day
        currentDate.setUTCHours(0, 0, 0, 0);

        // Condition for extended
        matchCondition = {
          transactionStatus: TransactionStatus.INSTALLMENT,
          $or: [
            { extendedPaymentDate: { $gt: currentDate } },
            { nextPaymentDate: { $gt: currentDate } },
          ],
          addExtendedDate: false,
        };
        break;
      }
      default:
        throw new HttpException(DEFAULTER_TYPE_ERROR, HttpStatus.BAD_REQUEST);
    }

    const { response, count } = await this.aggregationForHealthcare(
      matchCondition,
      userQuery,
      skip,
      page,
      limit,
      staffIds,
      isAdmin,
      UserStatusTypes.ADMITTED,
    );

    return { data: response, count };
  }

  //SECTION - get health care Closed Defaulters
  async healthcareClosedDefaulters(
    @Query() query: ParsedQs,
    staffId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    //NOTE - check staff details
    const staff = await this.staffModel
      .findById(staffId)
      .populate('roleId', 'role');

    let staffIds = [];
    let isAdmin = true;
    if (staff && !/superadmin/i.test(staff?.roleId?.role)) {
      const assignStaffIds = staff?.assignStaff?.map(
        (item) => new mongoose.Types.ObjectId(item.staffId),
      );
      staffIds.push(...(assignStaffIds || []));
      isAdmin = false;
    } else {
      if (search) {
        staffIds.push(new mongoose.Types.ObjectId(search));
        isAdmin = false;
      } else {
        staffIds = [staff?._id];
      }
    }

    const { response, count } = await this.aggregationForInstallmentClosed(
      skip,
      page,
      limit,
      staffIds,
      isAdmin,
    );

    return { data: response, count };
  }

  //SECTION - healthcare Extend paymentDate
  async healthcareExtendPaymentDate(
    payload: HealthcareExtendDateDto,
    updatedById: string,
  ): Promise<string> {
    const { paymentId, date, message } = payload;

    if (!mongoose.isValidObjectId(paymentId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Get the current date and time
    const paymentDate = new Date(date).setUTCHours(0, 0, 0, 0);

    const paymentData = await this.financeModel.findByIdAndUpdate(paymentId, {
      $set: {
        extendedPaymentDate: paymentDate,
        addExtendedDate: true,
        remarks: message,
        remarkDate: new Date().setUTCHours(0, 0, 0, 0),
        updatedBy: updatedById,
      },
    });

    if (!paymentData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const userDetails = await this.healthcareUserModel.findById(
      paymentData.userId,
    );

    await this.followUpModel.create({
      patientId: paymentData.userId,
      primaryCounsellorId: userDetails.primaryCounsellorId,
      secondaryCounsellorId: userDetails.secondaryCounsellorId,
      type: FollowUpTypes.CALL,
      nextFollowUpDate: paymentDate,
      followUpResponse: message,
      followUpSource: FollowUpSource.EXTENDED_DATE,
      siteSource: FollowUpSiteSource.HOSPITAL,
      createdBy: updatedById,
    });

    if (!userDetails.isFollowUpCreated) {
      await this.healthcareUserModel.findByIdAndUpdate(userDetails._id, {
        $set: { isFollowUpCreated: true },
      });
    }

    return UPDATE_DATA;
  }

  //ANCHOR:  Common function for the aggregation pipeline
  private async aggregationForHealthcare(
    matchCondition: Record<string, any>,
    userQuery: any,
    skip: any,
    page: any,
    limit: any,
    staffIds: string[],
    isAdmin: boolean,
    patientStatus: UserStatusTypes,
  ): Promise<any> {
    let count = 0;

    const pipeline: any = [
      { $sort: { createdAt: -1 } },
      {
        $group: { _id: '$parentOrderId', latestPayment: { $first: '$$ROOT' } },
      },
      { $replaceRoot: { newRoot: '$latestPayment' } },
      { $match: matchCondition },
      {
        $lookup: {
          from: 'hospitalorders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderId',
        },
      },
      { $unwind: { path: '$orderId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'carepackages',
          localField: 'packageId',
          foreignField: '_id',
          as: 'packageId',
        },
      },
      { $unwind: { path: '$packageId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'healthcareusers',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      { $match: userQuery },
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
      { $match: { 'userId.patientStatus': patientStatus } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          productAmount: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          extendedPaymentDate: { $ifNull: ['$extendedPaymentDate', null] },
          totalPrice: 1,
          userName: '$userId.name',
          packageName: '$packageId.title',
          user: '$userId',
          type: {
            $cond: {
              if: { $eq: ['$userId.patientStatus', UserStatusTypes.PRE_BOOK] },
              then: '$userId.patientStatus',
              else: '$userId.type',
            },
          },
          userPhone: '$userId.phone',
          primaryCounsellor: '$primaryCounsellorId.name',
          secondaryCounsellor: {
            $cond: {
              if: { $gt: ['$secondaryCounsellorId.name', null] },
              then: '$secondaryCounsellorId.name',
              else: null,
            },
          },
          parentsPhone: {
            $cond: {
              if: { $gt: ['$userId.parentNumber', null] },
              then: '$userId.parentNumber',
              else: null,
            },
          },
        },
      },
      {
        $facet: { totalCount: [{ $count: 'total' }], paginatedResults: [] },
      },
    ];

    if (!isAdmin) {
      const matchIndex = pipeline.findIndex((stage: any) => stage.$match);
      if (matchIndex !== -1) {
        pipeline.splice(matchIndex, 1); // Remove the empty $match stage
      }
      pipeline.splice(10, 0, {
        $match: {
          $or: [
            {
              'userId.primaryCounsellorId': {
                $in: staffIds,
              },
            },
            {
              'userId.secondaryCounsellorId': {
                $in: staffIds,
              },
            },
          ],
        },
      });
    }

    // Get values based on the condition
    const data = await this.financeModel.aggregate(pipeline);

    let response = data[0]?.paginatedResults;
    count = data[0]?.totalCount[0]?.total || 0;

    // Assuming response is an array of data objects
    response = await Promise.all(
      response
        .slice(skip, parseInt(page) * parseInt(limit))
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(async ({ user, extendedPaymentDate, _id, ...rest }) => {
          return {
            _id: _id,
            extendedPaymentDate,
            ...rest,
          };
        }),
    );

    if (!isAdmin) {
      count = response.length || 0;
    }

    return { response, count };
  }

  //ANCHOR:  aggregation For Installment Completed user
  private async aggregationForInstallmentClosed(
    skip: any,
    page: any,
    limit: any,
    staffIds: any[],
    isAdmin: boolean,
  ): Promise<any> {
    const currentDate = new Date();
    currentDate.setUTCHours(23, 59, 59, 999);
    let count = 0;

    //NOTE - offline course payment details
    const pipeline: any = [
      {
        $match: {
          transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
          paymentDate: { $lte: currentDate },
        },
      },
      {
        $sort: { userId: 1, updatedAt: -1 },
      },
      {
        $group: {
          _id: '$parentOrderId',
          latestPayment: {
            $first: '$$ROOT',
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$latestPayment' },
      },
      {
        $lookup: {
          from: 'hospitalorders',
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
          from: 'carepackages',
          localField: 'packageId',
          foreignField: '_id',
          as: 'packageId',
        },
      },
      { $unwind: { path: '$packageId', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'healthcareusers',
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
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          productAmount: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          transactionStatus: 1,
          extendedPaymentDate: { $ifNull: ['$extendedPaymentDate', null] },
          totalPrice: 1,
          userName: '$userId.name',
          packageName: '$packageId.title',
          user: '$userId',
          type: {
            $cond: {
              if: { $eq: ['$userId.patientStatus', UserStatusTypes.PRE_BOOK] },
              then: '$userId.patientStatus',
              else: '$userId.type',
            },
          },
          userPhone: '$userId.phone',
          primaryCounsellor: '$primaryCounsellorId.name',
          secondaryCounsellor: {
            $cond: {
              if: { $gt: ['$secondaryCounsellorId.name', null] },
              then: '$secondaryCounsellorId.name',
              else: null,
            },
          },
          parentsPhone: {
            $cond: {
              if: { $gt: ['$userId.parentNumber', null] },
              then: '$userId.parentNumber',
              else: null,
            },
          },
        },
      },
      {
        $facet: { totalCount: [{ $count: 'total' }], paginatedResults: [] },
      },
    ];

    if (!isAdmin) {
      const matchIndex = pipeline.findIndex((stage: any) => stage.$match);
      if (matchIndex !== -1) {
        pipeline.splice(matchIndex, 1);
      }
      pipeline.splice(10, 0, {
        $match: {
          transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
          paymentDate: { $lte: currentDate },
          $or: [
            {
              'userId.primaryCounsellorId': {
                $in: staffIds,
              },
            },
            {
              'userId.secondaryCounsellorId': {
                $in: staffIds,
              },
            },
          ],
        },
      });
    }

    // Get values based on the condition
    const data = await this.financeModel.aggregate(pipeline);

    let response = data[0]?.paginatedResults;
    count = data[0]?.totalCount[0]?.total || 0;

    // Assuming response is an array of data objects
    response = await Promise.all(
      response
        .slice(skip, parseInt(page) * parseInt(limit))
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(async ({ user, extendedPaymentDate, _id, ...rest }) => {
          return {
            _id: _id,
            extendedPaymentDate,
            ...rest,
          };
        }),
    );

    if (!isAdmin) {
      count = response.length || 0;
    }

    return { response, count };
  }
}
