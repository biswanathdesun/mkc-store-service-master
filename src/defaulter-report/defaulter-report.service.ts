/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable, Query } from '@nestjs/common';
import { ParsedQs } from 'qs';
import * as pdf from 'html-pdf';
import moment from 'moment';
import {
  DefaulterTypes,
  TransactionStatus,
  UserStatusTypes,
} from 'src/utills/enum';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import { CommonService } from 'src/utills/commonService';
@Injectable()
export class DefaulterReportService {
  constructor(
    @InjectModel(OfflineCoursePayment.name)
    private offlineCoursePaymentModel: Model<OfflineCoursePayment>,
    private commonService: CommonService,
  ) {}

  //SECTION - get Admitted Defaulters
  async getPrebookAndAdmittedDefaultersReport(
    @Query() query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, type, date } = query as {
      page: string;
      limit: string;
      type: string;
      date: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const currentDate = new Date(date);
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setUTCHours(23, 59, 59, 999);

    const userQuery =
      type === DefaulterTypes.ADMITTED
        ? UserStatusTypes.ADMITTED
        : type === DefaulterTypes.PREBOOK
        ? UserStatusTypes.PRE_BOOK
        : null;

    const matchQuery = {
      transactionStatus: TransactionStatus.INSTALLMENT,
      $or: [
        //TODO: Condition for today's payments or extended payments within today's range
        {
          $or: [
            { nextPaymentDate: { $gte: currentDate, $lte: nextDate } },
            { extendedPaymentDate: { $gte: currentDate, $lte: nextDate } },
          ],
        },
        //TODO: Condition for overdue payments
        {
          nextPaymentDate: { $lt: currentDate },
          $or: [
            { extendedPaymentDate: null },
            { extendedPaymentDate: { $lt: currentDate } },
          ],
        },
      ],
    };

    const { response, count } = await this.runAggregationPipeline(
      matchQuery,
      userQuery,
    );

    const responseData = await Promise.all(
      response
        .slice(skip, parseInt(page) * parseInt(limit))
        .map(async (item: any) => {
          return item;
        }),
    );

    return { data: responseData, count };
  }
  async getPrebookAndAdmittedDefaultersPdf(
    @Query() query: ParsedQs,
  ): Promise<string> {
    const { type, date } = query as {
      type: string;
      date: string;
    };
    const currentDate = new Date(date);
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setUTCHours(23, 59, 59, 999);

    const userQuery =
      type === DefaulterTypes.ADMITTED
        ? UserStatusTypes.ADMITTED
        : type === DefaulterTypes.PREBOOK
        ? UserStatusTypes.PRE_BOOK
        : null;

    // const matchQuery = {
    //   transactionStatus: TransactionStatus.INSTALLMENT,
    //   $or: [
    //     { nextPaymentDate: { $gte: currentDate, $lte: nextDate } },
    //     { extendedPaymentDate: { $gte: currentDate, $lte: nextDate } },
    //   ],
    // };

    const matchQuery = {
      transactionStatus: TransactionStatus.INSTALLMENT,
      $or: [
        //TODO: Condition for today's payments or extended payments within today's range
        {
          $or: [
            { nextPaymentDate: { $gte: currentDate, $lte: nextDate } },
            { extendedPaymentDate: { $gte: currentDate, $lte: nextDate } },
          ],
        },
        //TODO: Condition for overdue payments
        {
          nextPaymentDate: { $lt: currentDate },
          $or: [
            { extendedPaymentDate: null },
            { extendedPaymentDate: { $lt: currentDate } },
          ],
        },
      ],
    };

    const { response } = await this.runAggregationPipeline(
      matchQuery,
      userQuery,
    );
    const jsonData = {
      path:
        type === DefaulterTypes.PREBOOK
          ? process.env.PREBOOK_REPORT_EJS_URL
          : process.env.ADMITTED_REPORT_EJS_URL,
      data: response?.map((data) => ({
        ...data,
        extendedPaymentDate: data?.extendedPaymentDate
          ? moment(data.extendedPaymentDate).format('DD-MM-YYYY')
          : null,
        nextPaymentDate: data?.nextPaymentDate
          ? moment(data.nextPaymentDate).format('DD-MM-YYYY')
          : null,
        remarkDate: data?.remarkDate
          ? moment(data.remarkDate).format('DD-MM-YYYY')
          : null,
      })),
      date: moment(date).format('DD-MM-YYYY'),
    };
    const pdf = await this.generatePdfForReports(jsonData);

    return pdf;
  }

  //SECTION - get dropped and closed defaulters
  async getCloseAndDroppedReport(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, search, fromDate, toDate, type } = query as {
      page: string;
      limit: string;
      fromDate: string;
      toDate: string;
      search: string;
      type: DefaulterTypes;
    };

    const currentDate = new Date(fromDate);
    // Get the start of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(toDate);
    nextDate.setUTCHours(23, 59, 59, 999);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let matchQuery: any;
    if (type === DefaulterTypes.CLOSED) {
      matchQuery = {
        transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
        paymentDate: { $gte: currentDate, $lte: nextDate },
      };
    }
    if (type === DefaulterTypes.DROPPED) {
      matchQuery = {
        transactionStatus: TransactionStatus.INSTALLMENT_CLOSED,
        updatedAt: { $gte: currentDate, $lte: nextDate },
      };
    }

    //NOTE - offline course payment details
    const { data, count } = await this.CloseAndDroppedAggregationPipeline(
      matchQuery,
    );
    const response = data
      .slice(skip, parseInt(page) * parseInt(limit))
      .map((item: any) => {
        return item;
      });

    return { data: response, count };
  }
  //SECTION - get dropped and closed defaulters
  async getCloseAndDroppedReportPdf(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    const { fromDate, toDate, type, staffId } = query as {
      fromDate: string;
      toDate: string;
      staffId: string;
      type: DefaulterTypes;
    };
    const currentDate = new Date(fromDate);
    // Get the start of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(toDate);
    nextDate.setUTCHours(23, 59, 59, 999);

    let matchQuery: any;
    if (type === DefaulterTypes.CLOSED) {
      matchQuery = {
        transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
        paymentDate: { $gte: currentDate, $lte: nextDate },
      };
    }
    if (type === DefaulterTypes.DROPPED) {
      matchQuery = {
        transactionStatus: TransactionStatus.INSTALLMENT_CLOSED,
        updatedAt: { $gte: currentDate, $lte: nextDate },
      };
    }

    //NOTE - offline course payment details
    const { data } = await this.CloseAndDroppedAggregationPipeline(matchQuery);
    const jsonData = {
      path:
        type === DefaulterTypes.CLOSED
          ? process.env.CLOSED_REPORT_EJS_URL
          : process.env.DROPPED_REPORT_EJS_URL,
      data: data?.map((student: any) => ({
        ...student,
        extendedPaymentDate: student?.extendedPaymentDate
          ? moment(student.extendedPaymentDate).format('DD-MM-YYYY')
          : null,
        nextPaymentDate: student?.nextPaymentDate
          ? moment(student.nextPaymentDate).format('DD-MM-YYYY')
          : null,
      })),
      date: moment(fromDate).format('DD-MM-YYYY'),
    };
    const pdf = await this.generatePdfForReports(jsonData);
    return pdf;
  }

  //ANCHOR:  Common function for the aggregation pipeline
  private async runAggregationPipeline(
    matchCondition: Record<string, any>,
    studentStatus: UserStatusTypes,
  ): Promise<any> {
    //NOTE - dynamic aggragation for defaulter
    const pipeline: any = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'studentbatches',
          let: {
            orderId: '$parentOrderId',
            courseId: '$courseId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$orderId', '$$orderId'] },
                    { $eq: ['$courseId', '$$courseId'] },
                  ],
                },
              },
            },
          ],
          as: 'studentbatches',
        },
      },
      {
        $unwind: {
          path: '$studentbatches',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'studentbatches.batchId',
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
        $group: {
          _id: '$parentOrderId',
          latestPayment: {
            $first: '$$ROOT',
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: '$latestPayment',
        },
      },
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
            $toObjectId: '$userId',
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
        $match: { 'userId.studentStatus': studentStatus },
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
        $lookup: {
          from: 'studentadmissiondetails',
          let: {
            courseId: '$courseId._id',
            userId: '$userId._id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$onlineCourseId', '$$courseId'] },
                    { $eq: ['$studentId', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'studentadmission',
        },
      },
      {
        $unwind: {
          path: '$studentadmission',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: { parentId: { $toObjectId: '$parentId' } },
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
          from: 'timelines',
          let: {
            courseId: '$courseId._id',
            userId: '$userId._id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$courseId', '$$courseId'] },
                    { $eq: ['$userId', '$$userId'] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'timelinesDetails',
        },
      },

      {
        $unwind: {
          path: '$timelinesDetails',
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
          totalAmtReceived: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          extendedPaymentDate: 1,
          remark: { $ifNull: ['$timelinesDetails.reason', null] },
          remarkDate: { $ifNull: ['$timelinesDetails.createdAt', null] },
          username: { $ifNull: ['$userId.name', null] },
          studentPhone: '$userId.phone',
          batch: { $ifNull: ['$batch.name', null] },
          course: { $ifNull: ['$courseId.title', null] },
          primaryCounsellor: '$primaryCounsellorId.name',
          secondaryCounsellor: {
            $cond: {
              if: { $gt: ['$secondaryCounsellorId.name', null] },
              then: '$secondaryCounsellorId.name',
              else: null,
            },
          },
          parentsPhone: '$userId.parentNumber',
          admissionDate: { $ifNull: ['$studentadmission.admissionDate', null] },
        },
      },
    ];

    //NOTE - get values based on the condition
    const data = await this.offlineCoursePaymentModel.aggregate(pipeline);
    const response = data;

    const count = response?.length;
    return { response, count };
  }

  //ANCHOR: Close And Dropped Aggregation Pipeline
  private async CloseAndDroppedAggregationPipeline(
    matchQuery: any,
  ): Promise<any> {
    // Convert staffId to ObjectId
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'studentbatches',
          let: { orderId: '$parentOrderId', courseId: '$courseId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$orderId', '$$orderId'] },
                    { $eq: ['$courseId', '$$courseId'] },
                  ],
                },
              },
            },
          ],
          as: 'studentbatches',
        },
      },
      {
        $unwind: { path: '$studentbatches', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'studentbatches.batchId',
          foreignField: '_id',
          as: 'batch',
        },
      },
      { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$parentOrderId',
          latestPayment: { $first: '$$ROOT' },
        },
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
      { $unwind: { path: '$orderId', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userId: { $toObjectId: '$userId' },
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
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
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
        $addFields: {
          courseId: { $toObjectId: '$courseId' },
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
      { $unwind: { path: '$courseId', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          parentId: { $toObjectId: '$parentId' },
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
      { $unwind: { path: '$parentId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: '$userId._id',
          totalAmtReceived: 1,
          productAmount: 1,
          outstandingAmount: 1,
          nextPaymentDate: 1,
          remark: { $ifNull: ['$remarks', null] },
          remarkDate: { $ifNull: ['$remarkDate', null] },
          username: { $ifNull: ['$userId.name', null] },
          studentPhone: { $ifNull: ['$userId.phone', null] },
          parentsPhone: { $ifNull: ['$parentId.phone', null] },
          course: { $ifNull: ['$courseId.title', null] },
          batch: { $ifNull: ['$batch.name', null] },
          primaryCounsellor: {
            $cond: {
              if: { $gt: ['$primaryCounsellorId.name', null] },
              then: '$primaryCounsellorId.name',
              else: null,
            },
          },
          secondaryCounsellor: {
            $cond: {
              if: { $gt: ['$secondaryCounsellorId.name', null] },
              then: '$secondaryCounsellorId.name',
              else: null,
            },
          },
        },
      },
    ];

    // Execute the pipeline
    const data = await this.offlineCoursePaymentModel.aggregate(pipeline);

    return { data, count: data.length };
  }

  //ANCHOR - generate Pdf For Reports
  private async generatePdfForReports(jsonData: any): Promise<any> {
    // NOTE - sending to a functionn to render the data and send back html
    const htmlString = await this.commonService.pdfGenerator(jsonData);

    const pdfOptions: any = {
      format: 'A4', //TODO: Set the paper size to A5
    };

    // NOTE - creating a pdf buffer from the html
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.create(htmlString, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    return pdfBuffer;
  }
}
