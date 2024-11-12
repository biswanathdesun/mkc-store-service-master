/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import { HostelEnquiry } from 'src/schema/hostel-enquiry.schema';
import { HostelRentalPay } from 'src/schema/hostel-rental-pay.schema';
import { Staff } from 'src/schema/staff.schema';
import { DefaulterTypes, HostelTransactionStatus } from 'src/utills/enum';
import { DEFAULTER_TYPE_ERROR } from 'src/utills/messages';

@Injectable()
export class HostelDefaulterService {
  constructor(
    @InjectModel(HostelRentalPay.name)
    private hostelRentalPayRepository: Model<HostelRentalPay>,
    @InjectModel(Staff.name) private staffRepository: Model<Staff>,
    @InjectModel(HostelEnquiry.name)
    private hostelEnquiryRepository: Model<HostelEnquiry>,
  ) {}

  //SECTION - get hostel Defaulters
  async hostelDefaulterList(
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
    const staff = await this.staffRepository
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
          transactionStatus: {
            $in: [
              HostelTransactionStatus.MANUAL_INSTALLMENT,
              HostelTransactionStatus.AUTO_INSTALLMENT,
            ],
          },
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
          transactionStatus: {
            $in: [
              HostelTransactionStatus.MANUAL_INSTALLMENT,
              HostelTransactionStatus.AUTO_INSTALLMENT,
            ],
          },
          nextPaymentDate: { $gt: currentDate },
        };
        break;
      }
      case DefaulterTypes.OVERDUE: {
        // Get the start of the day
        currentDate.setUTCHours(0, 0, 0, 0);

        // Condition for overdue
        matchCondition = {
          transactionStatus: {
            $in: [
              HostelTransactionStatus.MANUAL_INSTALLMENT,
              HostelTransactionStatus.AUTO_INSTALLMENT,
            ],
          },
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
          transactionStatus: {
            $in: [
              HostelTransactionStatus.MANUAL_INSTALLMENT,
              HostelTransactionStatus.AUTO_INSTALLMENT,
            ],
          },
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

    // const { response, count } = await this.aggregationForHealthcare(
    //   matchCondition,
    //   userQuery,
    //   skip,
    //   page,
    //   limit,
    //   staffIds,
    //   isAdmin,
    // );

    return { data: [], count: 0 };
  }

  //   //ANCHOR:  Common function for the aggregation pipeline
  //   private async aggregationForHealthcare(
  //     matchCondition: Record<string, any>,
  //     userQuery: any,
  //     skip: any,
  //     page: any,
  //     limit: any,
  //     staffIds: string[],
  //     isAdmin: boolean,
  //   ): Promise<any> {
  //     let count = 0;

  //     const pipeline: any = [
  //       { $sort: { createdAt: -1 } },
  //       {
  //         $group: { _id: '$parentOrderId', latestPayment: { $first: '$$ROOT' } },
  //       },
  //       { $replaceRoot: { newRoot: '$latestPayment' } },
  //       { $match: matchCondition },
  //       {
  //         $lookup: {
  //           from: 'hospitalorders',
  //           localField: 'orderId',
  //           foreignField: '_id',
  //           as: 'orderId',
  //         },
  //       },
  //       { $unwind: { path: '$orderId', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'carepackages',
  //           localField: 'packageId',
  //           foreignField: '_id',
  //           as: 'packageId',
  //         },
  //       },
  //       { $unwind: { path: '$packageId', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'healthcareusers',
  //           localField: 'userId',
  //           foreignField: '_id',
  //           as: 'userId',
  //         },
  //       },
  //       { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
  //       { $match: userQuery },
  //       {
  //         $lookup: {
  //           from: 'staffs',
  //           localField: 'userId.primaryCounsellorId',
  //           foreignField: '_id',
  //           as: 'primaryCounsellorId',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$primaryCounsellorId',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'staffs',
  //           localField: 'userId.secondaryCounsellorId',
  //           foreignField: '_id',
  //           as: 'secondaryCounsellorId',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$secondaryCounsellorId',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       { $match: { 'userId.patientStatus': patientStatus } },
  //       { $sort: { createdAt: -1 } },
  //       {
  //         $project: {
  //           _id: 1,
  //           productAmount: 1,
  //           outstandingAmount: 1,
  //           nextPaymentDate: 1,
  //           extendedPaymentDate: { $ifNull: ['$extendedPaymentDate', null] },
  //           totalPrice: 1,
  //           userName: '$userId.name',
  //           packageName: '$packageId.title',
  //           user: '$userId',
  //           type: {
  //             $cond: {
  //               if: { $eq: ['$userId.patientStatus', UserStatusTypes.PRE_BOOK] },
  //               then: '$userId.patientStatus',
  //               else: '$userId.type',
  //             },
  //           },
  //           userPhone: '$userId.phone',
  //           primaryCounsellor: '$primaryCounsellorId.name',
  //           secondaryCounsellor: {
  //             $cond: {
  //               if: { $gt: ['$secondaryCounsellorId.name', null] },
  //               then: '$secondaryCounsellorId.name',
  //               else: null,
  //             },
  //           },
  //           parentsPhone: {
  //             $cond: {
  //               if: { $gt: ['$userId.parentNumber', null] },
  //               then: '$userId.parentNumber',
  //               else: null,
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $facet: { totalCount: [{ $count: 'total' }], paginatedResults: [] },
  //       },
  //     ];

  //     if (!isAdmin) {
  //       const matchIndex = pipeline.findIndex((stage: any) => stage.$match);
  //       if (matchIndex !== -1) {
  //         pipeline.splice(matchIndex, 1); // Remove the empty $match stage
  //       }
  //       pipeline.splice(10, 0, {
  //         $match: {
  //           $or: [
  //             {
  //               'userId.primaryCounsellorId': {
  //                 $in: staffIds,
  //               },
  //             },
  //             {
  //               'userId.secondaryCounsellorId': {
  //                 $in: staffIds,
  //               },
  //             },
  //           ],
  //         },
  //       });
  //     }

  //     // Get values based on the condition
  //     const data = await this.financeModel.aggregate(pipeline);

  //     let response = data[0]?.paginatedResults;
  //     count = data[0]?.totalCount[0]?.total || 0;

  //     // Assuming response is an array of data objects
  //     response = await Promise.all(
  //       response
  //         .slice(skip, parseInt(page) * parseInt(limit))
  //         // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //         .map(async ({ user, extendedPaymentDate, _id, ...rest }) => {
  //           return {
  //             _id: _id,
  //             extendedPaymentDate,
  //             ...rest,
  //           };
  //         }),
  //     );

  //     if (!isAdmin) {
  //       count = response.length || 0;
  //     }

  //     return { response, count };
  //   }
}
