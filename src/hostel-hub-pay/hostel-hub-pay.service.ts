import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ParsedQs } from 'qs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { HostelOrder } from 'src/schema/hostel-order.schema';
import { HostelRentalPay } from 'src/schema/hostel-rental-pay.schema';
import { HostelManualBookingDto } from './dto/hostel-book-admin.dto';
import { Hostel } from 'src/schema/hostel.schema';
import {
  AMOUNT_NOT_VALID,
  BED_TYPE_CHANGE,
  HOSTEL_PAYMENT_SUCCESS,
  INVALID_DATE,
  INVALID_ID,
  INVALID_TYPE,
  JOINING_DATE_CHANGE,
  JOINING_DATE_PASSED_ERROR,
  MKC_ORDER_ID_DUPLICATE,
  ORDER_CREATE_ERROR,
  PAYMENT_FAILED,
  PAYMENT_SUCCESS,
  RECORD_NOT_FOUND,
  ROOM_NUMBER_CHANGE,
  SECURITY_NOT_FOUND,
  SECURITY_REFUND_SUCCESS,
  USER_NOT_FOUND,
} from 'src/utills/messages';
import {
  ChangeHostelType,
  EnquiryStatus,
  HdfcPaymentStatus,
  HostelPaymentType,
  HostelPriceType,
  OrderTypes,
  PaymentStatus,
  SchemaReferenceType,
  HostelTransactionStatus,
  UserType,
  BedTypes,
} from 'src/utills/enum';
import { HostelEnquiry } from 'src/schema/hostel-enquiry.schema';
import { UserHostelValidity } from 'src/schema/user.hostel.validity.schema';
import { SecurityRefundOrDepositeDto } from './dto/security-refund.dto';
import { GetSecurityAmount } from './dto/get-security-amount.sto';
import { HostelCart } from 'src/schema/hostel-cart.schema';
import { HostelPaymentSummary } from 'src/schema/hostel.payment.summary';
import { VerifyHostelPaymentDto } from './dto/verify-hostel-payment.dto';
import { Token } from 'src/schema/token.schema';
import { ChangeHostelInfoDto } from './dto/change-hostel.dto';
import { Timeline } from 'src/schema/timeline.schema';
import { HostelChangeHistory } from 'src/schema/hostel-change-history.schema';
import { HostelExistingManualBookingDto } from './dto/manual-existing-booking.dto';

@Injectable()
export class HostelHubPayService {
  constructor(
    @InjectModel(Hostel.name) private hostelModel: Model<Hostel>,
    @InjectModel(Timeline.name) private timelineModel: Model<Timeline>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(HostelPaymentSummary.name)
    private hostelPaymentSummaryRepository: Model<HostelPaymentSummary>,
    @InjectModel(UserHostelValidity.name)
    private userHostelValidityModel: Model<UserHostelValidity>,
    @InjectModel(HostelEnquiry.name)
    private hostelEnquiryModel: Model<HostelEnquiry>,
    @InjectModel(HostelOrder.name) private hostelOrderModel: Model<HostelOrder>,
    @InjectModel(HostelRentalPay.name)
    private hostelRentalPayModel: Model<HostelRentalPay>,
    @InjectModel(HostelCart.name)
    private hostelCartRepository: Model<HostelCart>,
    @InjectModel(HostelChangeHistory.name)
    private changeHistoryModel: Model<HostelChangeHistory>,
  ) {}

  //SECTION - hostel Booking from Admin
  async hostelBookingfromAdmin(
    payload: HostelManualBookingDto,
    staffId: string,
  ): Promise<{ message: any }> {
    try {
      const {
        userId,
        name,
        parentName,
        parentNumber,
        gender,
        type,
        hostelId,
        bedType,
        roomNumber,
        floorNumber,
        priceType,
        paymentType,
        chequeOrTransNo,
        nextPaymentDate,
        securityFee,
        paidSecurityFee,
        securityFeeOutStanding,
        hostelPaidAmount,
        hostelOutstanding,
        accommodationPaidAmount,
        accommodationOutstanding,
        mealPaidAmount,
        mealOutstanding,
        totalDays,
        paidAmount,
        totalOutstanding,
        joiningDate,
        miscellaneousCost,
        bankDetails,
        existingPaymentDate,
        monthCount,
        discountedAmount,
        daysCount,
      } = payload;

      const monthWise = type === HostelPaymentType.MONTH_WISE;
      const dayWise = type === HostelPaymentType.DAY_WISE;

      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);

      const { totalDaysInMonth } = await this.getMonthInfo(joiningDate);

      //NOTE - get hostel details
      const [hostelDetails] = await this.hostelModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
        {
          $project: {
            bedDetails: {
              $filter: {
                input: '$bedDetails',
                as: 'bed',
                cond: {
                  $eq: ['$$bed.bedType', bedType],
                },
              },
            },
            roomMapping: {
              $filter: {
                input: '$roomMapping',
                as: 'room',
                cond: {
                  $and: [
                    { $eq: ['$$room.bedType', bedType] },
                    { $eq: ['$$room.roomNumber', roomNumber] },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            bedDetails: { $arrayElemAt: ['$bedDetails', 0] },
            roomMapping: { $arrayElemAt: ['$roomMapping', 0] },
          },
        },
        {
          $addFields: {
            'bedDetails.securityFee': {
              $cond: {
                if: { $gt: [securityFee, 0] },
                then: {
                  $let: {
                    vars: {
                      filteredFees: {
                        $filter: {
                          input: '$bedDetails.securityFee',
                          as: 'fee',
                          cond: { $eq: ['$$fee.fees', securityFee] },
                        },
                      },
                    },
                    in: {
                      $cond: {
                        if: { $gt: [{ $size: '$$filteredFees' }, 0] },
                        then: { $arrayElemAt: ['$$filteredFees.fees', 0] },
                        else: null,
                      },
                    },
                  },
                },
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            bedDetails: 1,
            'roomMapping.roomNumber': 1,
            'roomMapping.floorNumber': 1,
            'roomMapping.bedType': 1,
            'roomMapping.totalBeds': 1,
            'roomMapping.vacant': 1,
            'roomMapping.purchasedBed': 1,
          },
        },
      ]);

      if (!hostelDetails)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      if (dayWise) {
        const totalAmount =
          hostelDetails?.bedDetails?.perDayCost * totalDays +
          (securityFee ?? 0);

        if (paidAmount > totalAmount) {
          throw new HttpException(AMOUNT_NOT_VALID, HttpStatus.BAD_REQUEST);
        }
      }

      //NOTE - get user details
      const hostelUser = await this.hostelEnquiryModel.findById(userId);

      if (!hostelUser)
        throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

      const newReceiptNumber = await this.generateHostelReceiptNumber();

      //NOTE: Get the current date and time
      const paymentDate = new Date();
      //NOTE: Add 5 hours and 30 minutes to the current date and time
      paymentDate.setHours(
        paymentDate.getHours() + 5,
        paymentDate.getMinutes() + 30,
      );

      const miscellaneousTotalCost =
        miscellaneousCost && miscellaneousCost.length > 0
          ? miscellaneousCost.reduce(
              (total, ele) => total + Number(ele.amount),
              0,
            )
          : 0;

      const removeAmount = miscellaneousTotalCost + (paidSecurityFee || 0);

      const actualPaidAmount =
        type === HostelPaymentType.DAY_WISE
          ? paidAmount - (paidSecurityFee ?? 0)
          : paidAmount - removeAmount;

      //NOTE - get per day charges based on the monthly amount
      const perDayChanges =
        monthWise && daysCount === 0
          ? hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth
          : monthWise && daysCount !== 0
          ? (hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth) *
            daysCount
          : hostelDetails?.bedDetails?.perDayCost;

      //NOTE: get validity date based on the payment
      const getDaysBasedOnAmount =
        monthWise && daysCount === 0
          ? Math.round((actualPaidAmount + discountedAmount) / perDayChanges)
          : monthWise && daysCount !== 0
          ? daysCount
          : totalDays;

      const hostelLeaveDate = new Date(joiningDate);

      //NOTE -  Add duration in  the current date to calculate Valid Upto date
      if (getDaysBasedOnAmount === 0) {
        // NOTE - Set time to end of the day cause course is valid until the end of the day
        hostelLeaveDate.setHours(23, 59, 59, 999);
      } else {
        hostelLeaveDate.setDate(
          hostelLeaveDate.getDate() + (getDaysBasedOnAmount - 1),
        );

        // NOTE - Set time to end of the day cause course is valid until the end of the day
        hostelLeaveDate.setHours(23, 59, 59, 999);
      }

      //NOTE - check if gst applicable
      const isGstApplicable =
        monthWise && hostelDetails?.bedDetails?.totalGst > 0 ? true : false;

      //NOTE - create order for new payment
      const { order } = await this.createOrderForAdminNewPayment(
        monthWise,
        dayWise,
        hostelDetails,
        payload,
        hostelUser,
        staffId,
      );

      //NOTE: create a hostel rental pay
      const payment = await this.hostelRentalPayModel.create({
        userId,
        orderId: order._id,
        parentOrderId: order._id,
        hostelId,
        type,
        roomNumber,
        floorNumber,
        bedType,
        monthCount,
        daysCount,
        discountedAmount,
        securityFee:
          ((monthWise || dayWise) && hostelDetails?.bedDetails?.securityFee) ??
          0,
        paidSecurityFee: ((monthWise || dayWise) && paidSecurityFee) ?? 0,
        securityFeeOutStanding:
          ((monthWise || dayWise) && securityFeeOutStanding) ?? 0,
        netHostelCharge:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.hostelCharge * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.hostelCharge / totalDaysInMonth) *
              daysCount) ??
          0,
        hostelCharge:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.hostelChargeWithGst * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.hostelChargeWithGst /
              totalDaysInMonth) *
              daysCount) ??
          0,
        hostelGst: (monthWise && hostelDetails?.bedDetails?.hostelGst) ?? 0,
        hostelPaidAmount: (monthWise && hostelPaidAmount) ?? 0,
        hostelOutstanding: (monthWise && hostelOutstanding) ?? 0,
        hostelGstAmount:
          (monthWise &&
            (await this.calculateGstAmount(
              hostelPaidAmount,
              hostelDetails?.bedDetails?.hostelGst,
            ))) ??
          0,
        netAccommodationCost:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.accommodationCost * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.accommodationCost / totalDaysInMonth) *
              daysCount) ??
          0,
        accommodationCost:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.accommodationCostWithGst * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.accommodationCostWithGst /
              totalDaysInMonth) *
              daysCount) ??
          0,
        accommodationGst:
          (monthWise && hostelDetails?.bedDetails?.accommodationGst) ?? 0,
        accommodationPaidAmount: (monthWise && accommodationPaidAmount) ?? 0,
        accommodationOutstanding: (monthWise && accommodationOutstanding) ?? 0,
        accommodationGstAmount:
          (monthWise &&
            (await this.calculateGstAmount(
              accommodationPaidAmount,
              hostelDetails?.bedDetails?.accommodationGst,
            ))) ??
          0,
        netMealCost:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.mealCost * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.mealCost / totalDaysInMonth) *
              daysCount) ??
          0,
        mealCost:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.mealCostWithGst * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.mealCostWithGst / totalDaysInMonth) *
              daysCount) ??
          0,
        mealGst: (monthWise && hostelDetails?.bedDetails?.mealGst) ?? 0,
        mealPaidAmount: (monthWise && mealPaidAmount) ?? 0,
        mealOutstanding: (monthWise && mealOutstanding) ?? 0,
        mealGstAmount:
          (monthWise &&
            (await this.calculateGstAmount(
              mealPaidAmount,
              hostelDetails?.bedDetails?.mealGst,
            ))) ??
          0,
        totalGst:
          (monthWise &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.totalGst * monthCount) ??
          (monthWise &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.totalGst / totalDaysInMonth) *
              daysCount) ??
          0,
        perDayCost: (dayWise && hostelDetails?.bedDetails?.perDayCost) ?? 0,
        totalDays,
        totalAmountWithSecurity:
          monthWise && daysCount === 0
            ? hostelDetails?.bedDetails?.totalPriceToPay * monthCount +
              (hostelDetails?.bedDetails?.securityFee ?? 0)
            : monthWise && daysCount !== 0
            ? ((hostelDetails?.bedDetails?.totalPriceToPay +
                (hostelDetails?.bedDetails?.securityFee ?? 0)) /
                totalDaysInMonth) *
              daysCount
            : (hostelDetails?.bedDetails?.securityFee ?? 0) +
              hostelDetails?.bedDetails?.perDayCost * totalDays, //TODO - if day wise
        totalAmountWithOutSecurity:
          monthWise && daysCount === 0
            ? hostelDetails?.bedDetails?.totalPriceToPay * monthCount
            : monthWise && daysCount !== 0
            ? (hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth) *
              daysCount
            : hostelDetails?.bedDetails?.perDayCost * totalDays,
        paidAmount: actualPaidAmount,
        totalPaidAmount: actualPaidAmount,
        outstandingAmount: totalOutstanding,
        totalAmtReceived: paidAmount,
        nextPaymentDate,
        priceType,
        transactionStatus:
          totalOutstanding > 0
            ? HostelTransactionStatus.MANUAL_INSTALLMENT
            : HostelTransactionStatus.MANUAL_FULL_PAYMENT,
        chequeOrTransNo,
        bankDetails,
        receiptNumber: newReceiptNumber,
        paymentType,
        purchaseBy: hostelUser?.type,
        miscellaneousCost,
        createdBy: staffId,
        isGstApplicable,
        paymentDate: existingPaymentDate ? existingPaymentDate : paymentDate,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      //NOTE - update the user details
      await this.hostelEnquiryModel.findByIdAndUpdate(hostelUser._id, {
        $set: {
          name,
          gender,
          hostelPaymentType: monthWise
            ? HostelPaymentType.MONTH_WISE
            : HostelPaymentType.DAY_WISE,
          type: UserType.HOSTELLER,
          enquiryStatus: EnquiryStatus.COMPLETED,
          parentName,
          parentNumber,
        },
      });

      //NOTE: create the user hostel validity details
      await this.userHostelValidityModel.create({
        userId,
        hostelId,
        orderId: order?._id,
        paymentId: payment?._id,
        type,
        totalDays: dayWise && totalDays,
        bedType,
        roomNumber,
        floorNumber,
        joiningDate,
        isSecurityFeeAdded: paidSecurityFee ? true : false,
        isSecurityFeeFullPaid: securityFeeOutStanding === 0 ? true : false,
        validityStartDate: joiningDate,
        validityEndDate: hostelLeaveDate,
        createdBy: staffId,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      //NOTE - update the hostel bed mapping
      await this.hostelModel.findOneAndUpdate(
        { _id: hostelId, 'roomMapping.roomNumber': roomNumber },
        {
          $inc: {
            'roomMapping.$.vacant': -1,
            'roomMapping.$.purchasedBed': 1,
          },
        },
        { new: true, runValidators: true, upsert: true },
      );

      return { message: HOSTEL_PAYMENT_SUCCESS };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - get all payment
  async getSecurityAmountForUser(
    payload: GetSecurityAmount,
  ): Promise<{ data: any }> {
    const { userId, hostelId, bedType } = payload;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(hostelId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const [hostelExists, userExists] = await Promise.all([
      this.hostelModel.exists({ _id: hostelId }),
      this.hostelEnquiryModel.exists({ _id: userId }),
    ]);

    if (!hostelExists || !userExists)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const checkRefund = await this.hostelRentalPayModel.exists({
      userId: new mongoose.Types.ObjectId(userId),
      hostelId: new mongoose.Types.ObjectId(hostelId),
      bedType,
      type: HostelPaymentType.SUCURITY_REFUND,
    });

    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
      hostelId: new mongoose.Types.ObjectId(hostelId),
      bedType,
      type: checkRefund
        ? HostelPaymentType.SUCURITY_REFUND
        : { $in: [HostelPaymentType.MONTH_WISE, HostelPaymentType.DAY_WISE] },
    };

    const groupStage = {
      _id: null,
      settledAmount: { $sum: checkRefund ? '$settledAmount' : { $literal: 0 } },
      adjustedAmount: {
        $sum: checkRefund ? '$adjustedAmount' : { $literal: 0 },
      },
      totalPaidSecurityFee: {
        $sum: checkRefund ? { $literal: 0 } : '$paidSecurityFee',
      },
      securityFee: { $first: '$securityFee' },
      securityReason: {
        $first: checkRefund ? '$securityReason' : { $literal: null },
      },
      orderId: { $first: '$parentOrderId' },
      bedType: { $first: '$bedType' },
      roomNumber: { $first: '$roomNumber' },
      floorNumber: { $first: '$floorNumber' },
      userId: { $first: '$userId' },
      hostelId: { $first: '$hostelId' },
    };

    const [results] = await this.hostelRentalPayModel.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: 1 } },
      { $group: groupStage },
      {
        $lookup: {
          from: 'hostelenquiries',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $lookup: {
          from: 'hostels',
          localField: 'hostelId',
          foreignField: '_id',
          as: 'hostelDetails',
        },
      },
      {
        $project: {
          _id: 0,
          settledAmount: { $ifNull: ['$settledAmount', null] },
          adjustedAmount: { $ifNull: ['$adjustedAmount', null] },
          totalPaidSecurityFee: { $ifNull: ['$totalPaidSecurityFee', null] },
          securityFee: { $ifNull: ['$securityFee', null] },
          securityReason: { $ifNull: ['$securityReason', null] },
          orderId: { $ifNull: ['$orderId', null] },
          bedType: { $ifNull: ['$bedType', null] },
          roomNumber: { $ifNull: ['$roomNumber', null] },
          floorNumber: { $ifNull: ['$floorNumber', null] },
          user: { $ifNull: [{ $arrayElemAt: ['$userDetails.name', 0] }, null] },
          hostel: {
            $ifNull: [{ $arrayElemAt: ['$hostelDetails.name', 0] }, null],
          },
        },
      },
    ]);

    if (!results)
      throw new HttpException(SECURITY_NOT_FOUND, HttpStatus.NOT_FOUND);

    return { data: results };
  }

  //SECTION - security Refund of User
  async securityRefundForUser(
    payload: SecurityRefundOrDepositeDto,
    staffId: string,
  ): Promise<string> {
    const {
      userId,
      hostelId,
      orderId,
      bedType,
      securityFee,
      settledAmount,
      roomNumber,
      floorNumber,
      paymentType,
      chequeOrTransNo,
      adjustedAmount,
      reason,
    } = payload;
    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(hostelId) ||
      !mongoose.isValidObjectId(orderId)
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get hostel details
    const hostelExists = await this.hostelModel.exists({ _id: hostelId });

    if (!hostelExists)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - get userDetails details
    const user = await this.hostelEnquiryModel.findById(userId);

    if (!user)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const receiptNumber = await this.generateHostelReceiptNumber();

    //NOTE - create payment
    await this.hostelRentalPayModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      orderId: new mongoose.Types.ObjectId(orderId),
      parentOrderId: new mongoose.Types.ObjectId(orderId),
      hostelId: new mongoose.Types.ObjectId(hostelId),
      type: HostelPaymentType.SUCURITY_REFUND,
      roomNumber,
      floorNumber,
      bedType,
      securityFee,
      settledAmount,
      adjustedAmount: adjustedAmount ?? 0,
      securityReason: reason ?? null,
      totalAmtReceived: settledAmount,
      priceType: HostelPriceType.REFUND,
      transactionStatus: HostelTransactionStatus.SECURITY_REFUND,
      chequeOrTransNo,
      receiptNumber,
      paymentType,
      purchaseBy: user.type,
      createdBy: staffId,
      createdByModel: SchemaReferenceType.STAFF,
      updatedByModel: SchemaReferenceType.STAFF,
    });

    //NOTE - update the hostel bed mapping for old
    await this.hostelModel.findOneAndUpdate(
      { _id: hostelId, 'roomMapping.roomNumber': roomNumber },
      {
        $inc: {
          'roomMapping.$.vacant': 1,
          'roomMapping.$.purchasedBed': -1,
        },
      },
      { new: true, runValidators: true, upsert: true },
    );

    //NOTE - update the user details
    await this.hostelEnquiryModel.findByIdAndUpdate(userId, {
      $set: { enquiryStatus: EnquiryStatus.CLOSED },
    });

    return SECURITY_REFUND_SUCCESS;
  }

  //SECTION - create order for hostel
  async hostelTransaction(userId: string): Promise<{ data: any }> {
    try {
      //NOTE: Get the current date and time
      const paymentDate = new Date();
      //NOTE: Add 5 hours and 30 minutes to the current date and time
      paymentDate.setHours(
        paymentDate.getHours() + 5,
        paymentDate.getMinutes() + 30,
      );

      //NOTE - check the requested user details
      const user: any = await this.hostelEnquiryModel.findById(userId);

      if (!user)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      //NOTE - get product details from cart
      const [cart] = await this.hostelCartRepository.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'hostels',
            localField: 'hostelId',
            foreignField: '_id',
            as: 'hostelDetails',
          },
        },
        {
          $unwind: { path: '$hostelDetails', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            hostelId: 1,
            bedType: 1,
            count: 1,
            joiningDate: 1,
            securityAmount: 1,
            bedDetails: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$hostelDetails.bedDetails',
                    as: 'bed',
                    cond: { $eq: ['$$bed.bedType', '$bedType'] },
                  },
                },
                0,
              ],
            },
          },
        },
      ]);

      //NOTE - get payment details
      const payment_deatails =
        await this.hostelPaymentSummaryRepository.findOne({
          userId: new mongoose.Types.ObjectId(userId),
        });

      const mkcOrderId = await this.generateOrderUniqueID();
      //NOTE: create order from hdfc
      const order = await this.createHdfcHostelOrder(
        mkcOrderId,
        payment_deatails.amountToBePaid,
        user,
      );

      if (!order)
        throw new HttpException(ORDER_CREATE_ERROR, HttpStatus.BAD_REQUEST);

      const monthWise = cart.type === HostelPaymentType.MONTH_WISE;
      const dayWise = cart.type === HostelPaymentType.DAY_WISE;

      const monthlyData =
        monthWise && cart
          ? {
              securityFee: cart?.securityAmount,
              paidSecurityFee: cart?.securityAmount,
              hostelCharge: cart?.bedDetails?.hostelChargeWithGst,
              hostelGst: cart?.bedDetails?.hostelGst,
              hostelPaidAmount: cart?.bedDetails?.hostelChargeWithGst,
              accommodationCost: cart?.bedDetails?.accommodationCostWithGst,
              accommodationGst: cart?.bedDetails?.accommodationGst,
              accommodationPaidAmount:
                cart?.bedDetails?.accommodationCostWithGst,
              mealCost: cart?.bedDetails?.mealCostWithGst,
              mealGst: cart?.bedDetails?.mealGst,
              mealPaidAmount: cart?.bedDetails?.mealCostWithGst,
              totalGst: cart?.bedDetails?.totalGst,
              totalAmount: cart?.bedDetails?.totalPriceToPay,
              paidAmount: payment_deatails.amountToBePaid,
            }
          : null;

      const dayWiseData =
        dayWise && cart
          ? {
              perDayCost: cart?.bedDetails?.perDayCost,
              totalDays: cart?.count,
              totalAmount: payment_deatails.amountToBePaid,
              paidAmount: payment_deatails.amountToBePaid,
            }
          : null;
      try {
        const newOrder = await this.hostelOrderModel.create({
          mkcOrderId: await this.generateOrderUniqueID(),
          orderNumber: order.id,
          userId,
          hostelId: cart.hostelId,
          bedType: cart.bedType,
          paymentDate,
          type: cart.type,
          monthlyPaymentDetail: monthlyData,
          daywisePaymentDetail: dayWiseData,
          paidAmount: payment_deatails.amountToBePaid,
          purchaseBy: user?.type,
          joiningDate: cart.joiningDate,
          createdBy: userId,
          createdByModel: SchemaReferenceType.HOSTEL_USER,
          updatedByModel: SchemaReferenceType.HOSTEL_USER,
        });

        await this.hostelOrderModel.findByIdAndUpdate(newOrder?._id, {
          $set: { parentOrderId: newOrder?._id },
        });
      } catch (error) {
        if (error.code === 11000) {
          throw new HttpException(MKC_ORDER_ID_DUPLICATE, HttpStatus.CONFLICT);
        } else {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
      }
      return { data: order?.payment_links?.web };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - verify Payment for hostel web and mobile
  async transactionValidation(
    payload: VerifyHostelPaymentDto,
    userId: string,
  ): Promise<any> {
    try {
      const { order_id } = payload;

      try {
        //NOTE: Get the current date and time
        const paymentDate = new Date();
        //NOTE: Add 5 hours and 30 minutes to the current date and time
        paymentDate.setHours(
          paymentDate.getHours() + 5,
          paymentDate.getMinutes() + 30,
        );

        //NOTE: Fetch the current user data including the coins field
        const user = await this.hostelEnquiryModel.findById(userId);

        const checkPayment = await this.verifyHdfcHostelOrder(order_id);

        const getOrder = await this.hostelOrderModel.findOne({
          mkcOrderId: order_id,
        });

        //NOTE: Check if the received amount matches the requested amount and if the signatures match
        if (
          getOrder.paidAmount === checkPayment.amount &&
          checkPayment.status === HdfcPaymentStatus.CHARGED
        ) {
          const receiptNumber = await this.generateHostelReceiptNumber();

          //NOTE - update health care order model
          const updateOrder = await this.hostelOrderModel.findOneAndUpdate(
            { orderNumber: checkPayment.id, mkcOrderId: order_id },
            {
              $set: {
                paymentId: checkPayment.txn_id,
                payment_method_type: checkPayment.payment_method_type,
                payment_method: checkPayment.payment_method,
                paymentDate: new Date(),
                paymentStatus: PaymentStatus.PAID,
                receiptNumber,
              },
            },
          );

          //NOTE - get payment details
          const payment = await this.hostelPaymentSummaryRepository.findOne({
            userId: new mongoose.Types.ObjectId(userId),
          });

          //NOTE - get product details from cart
          const [cart] = await this.hostelCartRepository.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
              $lookup: {
                from: 'hostels',
                localField: 'hostelId',
                foreignField: '_id',
                as: 'hostelDetails',
              },
            },
            {
              $unwind: {
                path: '$hostelDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                type: 1,
                hostelId: 1,
                bedType: 1,
                count: 1,
                joiningDate: 1,
                amount: 1,
                totalGst: 1,
                securityAmount: 1,
                totalAmount: { $add: ['$totalGst', '$amount'] },
                bedDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$hostelDetails.bedDetails',
                        as: 'bed',
                        cond: { $eq: ['$$bed.bedType', '$bedType'] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          ]);
          const monthWise = cart.type === HostelPaymentType.MONTH_WISE;
          const dayWise = cart.type === HostelPaymentType.DAY_WISE;

          //NOTE - update the user details
          const user = await this.hostelEnquiryModel.findByIdAndUpdate(userId, {
            $set: {
              type: UserType.HOSTELLER,
              joiningDate: cart.joiningDate,
              enquiryStatus: EnquiryStatus.COMPLETED,
              updatedBy: userId,
              hostelPaymentType: monthWise
                ? HostelPaymentType.MONTH_WISE
                : HostelPaymentType.DAY_WISE,
              updatedByModel: SchemaReferenceType.HOSTEL_USER,
            },
          });

          //NOTE: create a hostel rental pay
          const rentalPayment = await this.hostelRentalPayModel.create({
            userId,
            orderId: updateOrder._id,
            parentOrderId: updateOrder._id,
            hostelId: cart.hostelId,
            type: cart.type,
            bedType: cart.bedType,
            securityFee: (monthWise && cart?.securityAmount) ?? 0,
            paidSecurityFee: (monthWise && cart?.securityAmount) ?? 0,
            securityFeeOutStanding: 0,
            netHostelCharge: (monthWise && cart?.bedDetails?.hostelCharge) ?? 0,
            hostelCharge:
              (monthWise && cart?.bedDetails?.hostelChargeWithGst) ?? 0,
            hostelGst: (monthWise && cart?.bedDetails?.hostelGst) ?? 0,
            hostelPaidAmount:
              (monthWise && cart?.bedDetails?.hostelChargeWithGst) ?? 0,
            hostelOutstanding: 0,
            hostelGstAmount:
              (monthWise &&
                (await this.calculateGstAmount(
                  cart?.bedDetails?.hostelChargeWithGst,
                  cart?.bedDetails?.hostelGst,
                ))) ??
              0,
            netAccommodationCost:
              (monthWise && cart?.bedDetails?.accommodationCost) ?? 0,
            accommodationCost:
              (monthWise && cart?.bedDetails?.accommodationCostWithGst) ?? 0,
            accommodationGst:
              (monthWise && cart?.bedDetails?.accommodationGst) ?? 0,
            accommodationPaidAmount:
              (monthWise && cart?.bedDetails?.accommodationCostWithGs) ?? 0,
            accommodationOutstanding: 0,
            accommodationGstAmount:
              (monthWise &&
                (await this.calculateGstAmount(
                  cart?.bedDetails?.accommodationCostWithGst,
                  cart?.bedDetails?.accommodationGst,
                ))) ??
              0,
            netMealCost: (monthWise && cart?.bedDetails?.mealCost) ?? 0,
            mealCost: (monthWise && cart?.bedDetails?.mealCostWithGst) ?? 0,
            mealGst: (monthWise && cart?.bedDetails?.mealGst) ?? 0,
            mealPaidAmount:
              (monthWise && cart?.bedDetails?.mealCostWithGst) ?? 0,
            mealOutstanding: 0,
            mealGstAmount:
              (monthWise &&
                (await this.calculateGstAmount(
                  cart?.bedDetails?.mealCostWithGst,
                  cart?.bedDetails?.mealGst,
                ))) ??
              0,
            totalGst: (monthWise && cart?.bedDetails?.totalGst) ?? 0,
            perDayCost: (dayWise && cart?.bedDetails?.perDayCost) ?? 0,
            totalDays: (dayWise && cart.count) ?? 0,
            totalAmountWithSecurity: payment.totalAmount,
            totalAmountWithOutSecurity: payment.totalPrice,
            paidAmount: payment.amountToBePaid,
            totalPaidAmount: payment.amountToBePaid,
            totalAmtReceived: payment.amountToBePaid,
            receiptNumber,
            purchaseBy: user?.type,
            createdBy: userId,
            isGstApplicable: cart.totalGst > 0,
            paymentDate,
            createdByModel: SchemaReferenceType.STAFF,
            updatedByModel: SchemaReferenceType.STAFF,
          });

          const hostelLeaveDate = new Date(cart.joiningDate);

          const getDaysBasedOnAmount = dayWise ? cart.count : 30 * cart.count;

          //NOTE - Add duration in  the current date to calculate Valid Upto date
          hostelLeaveDate.setDate(
            hostelLeaveDate.getDate() + (getDaysBasedOnAmount - 1),
          );

          // NOTE - Set time to end of the day cause course is valid untill the end of the day
          hostelLeaveDate.setHours(23, 59, 59, 999);

          //NOTE: create the user hostel validity details
          await this.userHostelValidityModel.create({
            userId,
            hostelId: cart.hostelId,
            orderId: updateOrder?._id,
            paymentId: rentalPayment?._id,
            type: cart.type,
            totalDays: dayWise && cart.count,
            bedType: cart.bedType,
            joiningDate: cart.joiningDate,
            isSecurityFeeAdded: monthWise ? true : false,
            isSecurityFeeFullPaid: monthWise ? true : false,
            validityStartDate: cart.joiningDate,
            validityEndDate: hostelLeaveDate,
            createdBy: userId,
            createdByModel: SchemaReferenceType.HOSTEL_USER,
            updatedByModel: SchemaReferenceType.HOSTEL_USER,
          });

          //NOTE: Remove all data from cart based on studentId
          await this.hostelCartRepository.deleteOne({ userId: user._id });

          //NOTE: Remove all data from paymnet summary
          await this.hostelPaymentSummaryRepository.deleteOne({
            userId: user._id,
          });

          //NOTE -check in token table user details
          const token = await this.tokenModel.findOne({
            userId: user._id.toString(),
          });

          if (
            user.type === UserType.HOSTEL_ENQUIRY &&
            token.userType === UserType.HOSTELLER
          ) {
            //NOTE: check token , if exist then update the token
            await this.tokenModel.findByIdAndUpdate(token._id, {
              $set: { userType: UserType.HOSTELLER },
            });
          }

          return PAYMENT_SUCCESS;
        } else {
          //NOTE - update paymnet status in order table
          await this.hostelOrderModel.findOneAndUpdate(
            { mkcOrderId: order_id },
            { paymentStatus: PaymentStatus.FAILED, paymentDate: new Date() },
          );

          //NOTE: Remove all data from cart based on studentId
          await this.hostelCartRepository.deleteMany({ userId: user._id });
          return PAYMENT_FAILED;
        }
      } catch (error) {
        return PAYMENT_FAILED;
      }
    } catch (error) {
      throw new InternalServerErrorException('Error verifying payment');
    }
  }

  //SECTION - get Hostel Return Url
  async getHostelReturnUrl(orderId: string): Promise<string> {
    //NOTE - get total paid amount
    const order = await this.hostelOrderModel
      .findOne({
        mkcOrderId: orderId,
      })
      .select('paidAmount')
      .lean();

    //NOTE: Check if order is found
    if (!order) throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    const url = `${process.env.HOSTEL_PAYMENT_RETURN_URL}?orderId=${orderId}&paidAmount=${order.paidAmount}`;

    return url;
  }

  //SECTION - change Hostel Joining Date or room number or hostel
  async modifyHostelInfo(
    payload: ChangeHostelInfoDto,
    staffId: string,
  ): Promise<string> {
    const {
      type,
      userId,
      hostelId,
      joiningDate,
      bedType,
      roomNumber,
      floorNumber,
    } = payload;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(hostelId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    //NOTE: Construct the filter
    const filter: any = {
      userId: new mongoose.Types.ObjectId(userId),
      hostelId: new mongoose.Types.ObjectId(hostelId),
    };

    if (bedType && type === ChangeHostelType.ROOM_NUMBER) {
      filter.bedType = bedType;
    }

    // NOTE - get hostel validity
    const hostelDetails = await this.userHostelValidityModel
      .findOne(filter)
      .sort({ createdAt: -1 });

    if (!hostelDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    // NOTE - get user details
    const users = await this.hostelEnquiryModel.findById(userId).select('type');
    if (!users) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    let message: string | PromiseLike<string>;

    switch (type) {
      case ChangeHostelType.JOINING_DATE: {
        message = await this.changeJoiningDate(
          userId,
          hostelId,
          hostelDetails,
          today,
          joiningDate,
          staffId,
        );
        break;
      }
      case ChangeHostelType.ROOM_NUMBER: {
        message = await this.changeRoomNumber(
          userId,
          hostelId,
          hostelDetails,
          roomNumber,
          floorNumber,
          staffId,
        );
        break;
      }
      case ChangeHostelType.BED_TYPE: {
        message = await this.changeBedTypeNumber(
          userId,
          hostelId,
          hostelDetails,
          bedType,
          roomNumber,
          floorNumber,
          staffId,
          users.type,
        );
        break;
      }
      default:
        throw new HttpException(INVALID_TYPE, HttpStatus.BAD_REQUEST);
    }

    return message;
  }

  //SECTION - hostel Existing Booking from Admin
  async hostelExistingBookingfromAdmin(
    payload: HostelExistingManualBookingDto,
    staffId: string,
  ): Promise<{ message: any }> {
    try {
      const {
        userId,
        type,
        hostelId,
        paymentType,
        chequeOrTransNo,
        nextPaymentDate,
        paidSecurityFee,
        securityFeeOutStanding,
        hostelPaidAmount,
        hostelOutstanding,
        accommodationPaidAmount,
        accommodationOutstanding,
        mealPaidAmount,
        mealOutstanding,
        totalDays,
        paidAmount,
        totalOutstanding,
        miscellaneousCost,
        bankDetails,
        monthCount,
        discountedAmount,
        isMonthChange,
        existingPaymentDate,
        daysCount,
      } = payload;

      const monthWise = type === HostelPaymentType.MONTH_WISE;
      const dayWise = type === HostelPaymentType.DAY_WISE;

      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);

      //NOTE - get user details
      const hostelUser = await this.hostelEnquiryModel.findById(userId);

      if (!hostelUser)
        throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

      //NOTE - get last paymnet details
      const payment = await this.hostelRentalPayModel
        .findOne({
          userId: new mongoose.Types.ObjectId(userId),
          hostelId: new mongoose.Types.ObjectId(hostelId),
          type,
        })
        .sort({ createdAt: -1 });

      //NOTE - get user validity
      const validity = await this.userHostelValidityModel
        .findOne({ paymentId: payment._id })
        .sort({ createdAt: -1 });

      //NOTE - get hostel details
      const [hostelDetails] = await this.hostelModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
        {
          $project: {
            bedDetails: {
              $filter: {
                input: '$bedDetails',
                as: 'bed',
                cond: {
                  $eq: ['$$bed.bedType', payment.bedType],
                },
              },
            },
          },
        },
        {
          $project: { bedDetails: { $arrayElemAt: ['$bedDetails', 0] } },
        },
        {
          $addFields: {
            'bedDetails.securityFee': {
              $cond: {
                if: { $gt: [payment.securityFee, 0] },
                then: {
                  $let: {
                    vars: {
                      filteredFees: {
                        $filter: {
                          input: '$bedDetails.securityFee',
                          as: 'fee',
                          cond: { $eq: ['$$fee.fees', payment.securityFee] },
                        },
                      },
                    },
                    in: {
                      $cond: {
                        if: { $gt: [{ $size: '$$filteredFees' }, 0] },
                        then: { $arrayElemAt: ['$$filteredFees.fees', 0] },
                        else: null,
                      },
                    },
                  },
                },
                else: 0,
              },
            },
          },
        },
      ]);

      const { totalDaysInMonth } = await this.getMonthInfo(
        validity?.validityEndDate,
      );

      //NOTE: Get the current date and time
      const paymentDate = new Date(existingPaymentDate);
      //NOTE: Add 5 hours and 30 minutes to the current date and time
      paymentDate.setHours(
        paymentDate.getHours() + 5,
        paymentDate.getMinutes() + 30,
      );

      const miscellaneousTotalCost =
        miscellaneousCost && miscellaneousCost.length > 0
          ? miscellaneousCost.reduce((total, ele) => total + ele.amount, 0)
          : 0;

      const actualPaidAmount =
        type === HostelPaymentType.DAY_WISE
          ? paidAmount - (paidSecurityFee ?? 0)
          : paidAmount - (miscellaneousTotalCost + paidSecurityFee);
      //NOTE - get per day charges based on the monthly amount
      const perDayChanges =
        monthWise && daysCount === 0
          ? hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth
          : monthWise && daysCount !== 0
          ? (hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth) *
            daysCount
          : hostelDetails?.bedDetails?.perDayCost;

      //NOTE: get validity date based on the payment
      const getDaysBasedOnAmount =
        monthWise && daysCount === 0
          ? Math.round((actualPaidAmount + discountedAmount) / perDayChanges)
          : monthWise && daysCount !== 0
          ? daysCount
          : totalDays;

      const startDate = new Date(validity?.validityEndDate);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);
      const hostelStartDate = startDate;

      const hostelLeaveDate = new Date(hostelStartDate);

      //NOTE -  Add duration in  the current date to calculate Valid Upto date
      hostelLeaveDate.setDate(
        hostelLeaveDate.getDate() + (getDaysBasedOnAmount - 1),
      );

      // NOTE - Set time to end of the day cause course is valid untill the end of the day
      hostelLeaveDate.setHours(23, 59, 59, 999);

      const newReceiptNumber = await this.generateHostelReceiptNumber();

      //NOTE - check if gst applicable
      const isGstApplicable =
        monthWise && hostelDetails?.bedDetails?.totalGst > 0 ? true : false;

      //NOTE: create a hostel rental pay
      const newPayment = await this.hostelRentalPayModel.create({
        userId,
        orderId: payment.orderId,
        parentOrderId: payment.orderId,
        hostelId,
        type,
        monthCount,
        daysCount: totalOutstanding > 0 ? payment.daysCount : 0,
        discountedAmount,
        roomNumber: payment.roomNumber,
        floorNumber: payment.floorNumber,
        bedType: payment.bedType,
        securityFee: payment.securityFee,
        paidSecurityFee: ((monthWise || dayWise) && paidSecurityFee) ?? 0,
        securityFeeOutStanding:
          ((monthWise || dayWise) && securityFeeOutStanding) ?? 0,
        netHostelCharge:
          (monthWise && !isMonthChange && payment?.netHostelCharge) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.hostelCharge / totalDaysInMonth) *
              daysCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.hostelCharge * monthCount) ??
          0,
        hostelCharge:
          (monthWise && !isMonthChange && payment?.hostelCharge) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.hostelChargeWithGst * monthCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.hostelChargeWithGst /
              totalDaysInMonth) *
              daysCount) ??
          0,
        hostelGst:
          (monthWise && !isMonthChange && payment?.hostelGst) ??
          (monthWise &&
            isMonthChange &&
            hostelDetails?.bedDetails?.hostelGst) ??
          0,
        hostelPaidAmount: (monthWise && hostelPaidAmount) ?? 0,
        hostelOutstanding: (monthWise && hostelOutstanding) ?? 0,
        hostelGstAmount:
          (monthWise &&
            !isMonthChange &&
            (await this.calculateGstAmount(
              hostelPaidAmount,
              payment?.hostelGst,
            ))) ??
          (monthWise &&
            isMonthChange &&
            (await this.calculateGstAmount(
              hostelPaidAmount,
              hostelDetails?.bedDetails?.hostelGst,
            ))) ??
          0,
        netAccommodationCost:
          (monthWise && !isMonthChange && payment?.netAccommodationCost) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.accommodationCost * monthCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.accommodationCost / totalDaysInMonth) *
              daysCount) ??
          0,
        accommodationCost:
          (monthWise && !isMonthChange && payment?.accommodationCost) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.accommodationCostWithGst * monthCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.accommodationCostWithGst /
              totalDaysInMonth) *
              daysCount) ??
          0,
        accommodationGst:
          (monthWise && !isMonthChange && payment?.accommodationGst) ??
          (monthWise &&
            isMonthChange &&
            hostelDetails?.bedDetails?.accommodationGst) ??
          0,
        accommodationPaidAmount: (monthWise && accommodationPaidAmount) ?? 0,
        accommodationOutstanding: (monthWise && accommodationOutstanding) ?? 0,
        accommodationGstAmount:
          (monthWise &&
            !isMonthChange &&
            (await this.calculateGstAmount(
              accommodationPaidAmount,
              payment?.accommodationGst,
            ))) ??
          (monthWise &&
            isMonthChange &&
            (await this.calculateGstAmount(
              accommodationPaidAmount,
              hostelDetails?.bedDetails?.accommodationGst,
            ))) ??
          0,
        netMealCost:
          (monthWise && !isMonthChange && payment?.netMealCost) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.mealCost * monthCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.mealCost / totalDaysInMonth) *
              daysCount) ??
          0,
        mealCost:
          (monthWise && !isMonthChange && payment.mealCost) ??
          (monthWise &&
            isMonthChange &&
            daysCount === 0 &&
            hostelDetails?.bedDetails?.mealCostWithGst * monthCount) ??
          (monthWise &&
            isMonthChange &&
            daysCount !== 0 &&
            (hostelDetails?.bedDetails?.mealCostWithGst / totalDaysInMonth) *
              daysCount) ??
          0,
        mealGst:
          (monthWise && !isMonthChange && payment.mealGst) ??
          (monthWise && isMonthChange && hostelDetails?.bedDetails?.mealGst) ??
          0,
        mealPaidAmount: (monthWise && mealPaidAmount) ?? 0,
        mealOutstanding: (monthWise && mealOutstanding) ?? 0,
        mealGstAmount:
          (monthWise &&
            !isMonthChange &&
            (await this.calculateGstAmount(
              mealPaidAmount,
              payment?.mealGst,
            ))) ??
          (monthWise &&
            isMonthChange &&
            (await this.calculateGstAmount(
              mealPaidAmount,
              hostelDetails?.bedDetails?.mealGst,
            ))) ??
          0,
        totalGst:
          (monthWise && !isMonthChange && payment?.totalGst) ??
          (monthWise &&
            isMonthChange &&
            hostelDetails?.bedDetails?.totalGst * monthCount) ??
          0,
        perDayCost: (dayWise && payment?.perDayCost) ?? 0,
        totalDays,
        totalAmountWithSecurity:
          monthWise && daysCount === 0
            ? hostelDetails?.bedDetails?.totalPriceToPay * monthCount +
              (hostelDetails?.bedDetails?.securityFee ?? 0)
            : monthWise && daysCount !== 0
            ? ((hostelDetails?.bedDetails?.totalPriceToPay +
                (hostelDetails?.bedDetails?.securityFee ?? 0)) /
                totalDaysInMonth) *
              daysCount
            : (hostelDetails?.bedDetails?.securityFee ?? 0) +
              hostelDetails?.bedDetails?.perDayCost * totalDays, //TODO - if day wise
        totalAmountWithOutSecurity:
          monthWise && daysCount === 0
            ? hostelDetails?.bedDetails?.totalPriceToPay * monthCount
            : monthWise && daysCount !== 0
            ? (hostelDetails?.bedDetails?.totalPriceToPay / totalDaysInMonth) *
              daysCount
            : hostelDetails?.bedDetails?.perDayCost * totalDays,
        paidAmount: actualPaidAmount,
        totalPaidAmount:
          payment?.outstandingAmount === 0
            ? actualPaidAmount
            : payment?.totalPaidAmount + actualPaidAmount,
        outstandingAmount: totalOutstanding,
        totalAmtReceived: paidAmount,
        nextPaymentDate,
        priceType: HostelPriceType.PRE_BOOK,
        transactionStatus:
          totalOutstanding > 0
            ? HostelTransactionStatus.MANUAL_INSTALLMENT
            : HostelTransactionStatus.MANUAL_FULL_PAYMENT,
        chequeOrTransNo,
        bankDetails,
        receiptNumber: newReceiptNumber,
        paymentType,
        purchaseBy: hostelUser?.type,
        miscellaneousCost,
        createdBy: staffId,
        isGstApplicable,
        paymentDate,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      if (
        (monthWise &&
          (hostelPaidAmount > 0 ||
            accommodationPaidAmount > 0 ||
            mealPaidAmount > 0)) ||
        (dayWise && paidAmount + discountedAmount > 0)
      ) {
        //NOTE: create the user hostel validity details
        await this.userHostelValidityModel.create({
          userId,
          hostelId,
          orderId: payment?.orderId,
          paymentId: newPayment?._id,
          type,
          totalDays: dayWise && totalDays,
          bedType: payment?.bedType,
          roomNumber: payment?.roomNumber,
          floorNumber: payment?.floorNumber,
          joiningDate: validity?.joiningDate,
          isSecurityFeeAdded: payment?.securityFee > 0 ? true : false,
          isSecurityFeeFullPaid: securityFeeOutStanding === 0 ? true : false,
          validityStartDate: hostelStartDate,
          validityEndDate: hostelLeaveDate,
          createdBy: staffId,
          createdByModel: SchemaReferenceType.STAFF,
          updatedByModel: SchemaReferenceType.STAFF,
        });
      }

      return { message: HOSTEL_PAYMENT_SUCCESS };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION -get all Hostel Payment
  async getAllHostelPayment(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search, fromDate, toDate, status } =
      query as unknown as {
        page: string;
        limit: string;
        fromDate: Date;
        toDate: Date;
        status: string;
        search: string;
      };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - date based filter
    const dateFilter =
      fromDate && toDate
        ? {
            paymentDate: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    //NOTE - name , phone and razor payId  based filter
    const filters = search
      ? {
          $or: [
            {
              userId: {
                $in: (
                  await this.hostelEnquiryModel
                    .find({
                      $or: [
                        { name: { $regex: new RegExp(`^(${search})`, 'i') } },
                        { phone: { $regex: new RegExp(`^(${search})`, 'i') } },
                        { email: { $regex: new RegExp(`^(${search})`, 'i') } },
                      ],
                    })
                    .select('_id')
                ).map((id) => id._id.toString()), // Convert each ObjectId to a string
              },
            },
            {
              orderId: {
                $in: (
                  await this.hostelOrderModel
                    .find({
                      mkcOrderId: { $regex: new RegExp(`^(${search})`, 'i') },
                    })
                    .select('_id')
                ).map((id) => id._id),
              },
            },
            { paymentId: { $regex: new RegExp(`^(${search})`, 'i') } },
            !isNaN(parseInt(search))
              ? { totalAmtReceived: parseInt(search) }
              : null,
          ].filter(Boolean),
        }
      : {};

    //NOTE - date based filter
    const paymentFilter = status ? { paymentStatus: status } : {};

    // Prepare the shared filter object
    const priceTypeFilter = {
      priceType: {
        $in: [HostelPriceType.PRE_BOOK, HostelPriceType.FULL_PAYMENT],
      },
    };

    // Execute the count and find queries in parallel
    const [count, paymentDetails] = await Promise.all([
      this.hostelRentalPayModel.countDocuments({
        ...dateFilter,
        ...filters,
        ...paymentFilter,
        ...priceTypeFilter, // Reuse the priceTypeFilter
      }),

      this.hostelRentalPayModel
        .find({
          ...dateFilter,
          ...filters,
          ...paymentFilter,
          ...priceTypeFilter, // Reuse the priceTypeFilter
        })
        .populate([
          { path: 'userId', select: 'name phone' },
          { path: 'parentId', select: 'name' },
          { path: 'orderId', select: 'mkcOrderId orderType paymentId' },
          { path: 'createdBy', select: 'name' },
        ])
        .skip(skip)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-userId -parentId -orderId')
        .lean(),
    ]);

    // Now you have both the count and paymentDetails in parallel

    //NOTE - push final data
    const data = paymentDetails.map((item: any) => {
      const orderType =
        item.priceType === HostelPriceType.BED_TYPE_CHANGE
          ? HostelPriceType.BED_TYPE_CHANGE
          : item.transactionStatus ===
            HostelTransactionStatus.INSTALLMENT_TERMINATED
          ? item.orderId.orderType
          : item.transactionStatus ===
              HostelTransactionStatus.AUTO_FULL_PAYMENT ||
            item.transactionStatus === HostelTransactionStatus.AUTO_INSTALLMENT
          ? OrderTypes.AUTOMATION
          : item.transactionStatus ===
              HostelTransactionStatus.MANUAL_FULL_PAYMENT ||
            item.transactionStatus ===
              HostelTransactionStatus.MANUAL_INSTALLMENT ||
            item.transactionStatus ===
              HostelTransactionStatus.INSTALLMENT_COMPLETE
          ? OrderTypes.MANUAL
          : item.transactionStatus;
      return {
        _id: item._id,
        type: item?.type ?? null,
        roomNumber: item?.roomNumber ?? null,
        floorNumber: item?.floorNumber ?? null,
        bedType: item?.bedType ?? null,
        orderId: item.orderId?._id ?? null,
        mkcOrderId: item.orderId?.mkcOrderId ?? null,
        orderType: orderType ?? null,
        user: item.userId?.name ?? null,
        phone: item.userId?.phone ?? null,
        paymentId: item.orderId?.paymentId ?? null,
        totalAmountWithSecurity: item?.totalAmountWithSecurity ?? null,
        totalAmountWithOutSecurity: item?.totalAmountWithOutSecurity ?? null,
        paidAmount: item?.paidAmount ?? null,
        totalPaidAmount: item?.totalPaidAmount ?? null,
        totalAmtReceived: item?.totalAmtReceived ?? null,
        outstandingAmount: item?.outstandingAmount ?? 0,
        paymentType: item?.paymentType ?? null,
        bankDetails: item?.bankDetails ?? null,
        paymentDate: item?.paymentDate ?? null,
        paymentStatus: item.paymentStatus ?? null,
        chequeOrTransNo: item?.chequeOrTransNo ?? null,
        nextPaymentDate: item?.nextPaymentDate ?? null,
        purchaseBy: item?.purchaseBy ?? null,
        priceType: item?.priceType ?? null,
        isGstApplicable: item?.isGstApplicable ?? null,
        isSecurityFeePaid: item?.paidSecurityFee > 0 ? true : false,
        createdBy: item?.createdBy?.name ?? null,
      };
    });

    return { data, count };
  }

  //SECTION - export Payment Details
  async exportPaymentDetails(query: ParsedQs): Promise<any> {
    const { search, fromDate, toDate } = query as unknown as {
      search: string;
      fromDate: Date;
      toDate: Date;
    };
    //NOTE - Date-based filter
    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    //NOTE - name , phone and razor payId  based filter
    const filters = search
      ? {
          $or: [
            {
              userId: {
                $in: (
                  await this.hostelEnquiryModel
                    .find({
                      $or: [
                        { name: { $regex: new RegExp(`^(${search})`, 'i') } },
                        { phone: { $regex: new RegExp(`^(${search})`, 'i') } },
                        { email: { $regex: new RegExp(`^(${search})`, 'i') } },
                      ],
                    })
                    .select('_id')
                ).map((id) => id._id.toString()), // Convert each ObjectId to a string
              },
            },
            {
              orderId: {
                $in: (
                  await this.hostelOrderModel
                    .find({
                      mkcOrderId: { $regex: new RegExp(`^(${search})`, 'i') },
                    })
                    .select('_id')
                ).map((id) => id._id),
              },
            },
            { paymentId: { $regex: new RegExp(`^(${search})`, 'i') } },
            !isNaN(parseInt(search))
              ? { totalAmtReceived: parseInt(search) }
              : null,
          ].filter(Boolean),
        }
      : {};

    //NOTE: Find all payment list
    const paymentDetails: any = await this.hostelRentalPayModel
      .find({ ...filters, ...dateFilter, paymentStatus: PaymentStatus.PAID })
      .populate([
        { path: 'userId', select: 'name phone enrollmentNumber isMkcStudent' },
        { path: 'parentId', select: 'name' },
        { path: 'hostelId', select: 'name' },
        { path: 'orderId', select: 'mkcOrderId orderType paymentId' },
        { path: 'createdBy', select: 'name' },
      ])
      .sort({ createdAt: 1 })
      .select('-parentId -orderId')
      .lean();

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Details');

    // Defining headers
    worksheet.columns = [
      { header: 'DATE', key: 'item.createdAt', width: 10 },
      { header: 'MKC STUDENT', key: 'item.userId.isMkcStudent', width: 10 },
      { header: 'ROLL NO', key: 'item.userId.enrollmentNumber', width: 35 },
      { header: 'NAME', key: 'item.userId.name', width: 35 },
      { header: 'HOSTEL NAME', key: 'item.hostelId.name', width: 35 },
      { header: 'BED TYPE', key: 'item.bedType', width: 10 },
      { header: 'ORDER TYPE', key: 'item.orderId.orderType', width: 10 },
      { header: 'PAY MODE', key: 'item.paymentType', width: 10 },
      { header: 'RECEIPT NO', key: 'item.receiptNumber', width: 20 },
      { header: 'DD/CHQ/TRN NO', key: 'item.chequeOrTransNo', width: 20 },
      { header: 'Actual SECURITY Fee', key: 'item.securityFee', width: 10 },
      {
        header: 'Actual MONTHLY FEES',
        key: 'item.totalAmountWithOutSecurity',
        width: 10,
      },
      {
        header: 'To be PAID AMOUNT',
        key: 'item.totalAmountWithSecurity',
        width: 10,
      },
      { header: 'Paid Security', key: 'item.paidSecurityFee', width: 10 },
      { header: 'Paid Monthly Fee', key: 'item.totalPaidAmount', width: 10 },
      {
        header: 'Miscellaneous Cost',
        key: 'item.miscellaneousCost',
        width: 10,
      },
      { header: 'Discounted Amount', key: 'item.discountedAmount', width: 10 },
      { header: 'Total Paid Amount', key: 'item.totalAmtReceived', width: 10 },
      { header: 'CREATED BY', key: 'item.createdBy.name', width: 10 },
    ];

    // Adding data as row
    await Promise.all(
      paymentDetails.map(async (item: any) => {
        const miscellaneousTotalCost =
          item.miscellaneousCost?.length > 0
            ? item.miscellaneousCost.reduce(
                (total, ele) => total + Number(ele.amount),
                0,
              )
            : 0;

        worksheet.addRow([
          item?.createdAt,
          item.userId?.isMkcStudent === true ? 'MKC' : 'NON MKC',
          item.userId?.enrollmentNumber,
          item.userId?.name,
          item.hostelId?.name,
          item?.bedType,
          item.orderId?.orderType,
          item.paymentType,
          item?.receiptNumber,
          item?.chequeOrTransNo,
          item.paidSecurityFee > 0 || item.securityFeeOutStanding > 0
            ? item.securityFee
            : 0,
          item?.totalAmountWithOutSecurity,
          item.paidSecurityFee > 0 || item.securityFeeOutStanding > 0
            ? item?.totalAmountWithSecurity
            : item?.totalAmountWithOutSecurity,
          ,
          item?.paidSecurityFee,
          item?.totalPaidAmount,
          miscellaneousTotalCost,
          item?.discountedAmount,
          item?.totalAmtReceived,
          item.createdBy?.name,
        ]);
      }),
    );

    // Save Excel workbook to a file
    const tempFilePath = path.join(__dirname, 'payment_details.xlsx');
    await workbook.xlsx.writeFile(tempFilePath);
    return { data: tempFilePath };
  }

  //ANCHOR - create Order For Admin New Payment
  private async createOrderForAdminNewPayment(
    monthWise: boolean,
    dayWise: boolean,
    hostelDetails: any,
    params: any,
    user: any,
    staffId: string,
  ): Promise<{ order: any }> {
    const {
      userId,
      hostelId,
      roomNumber,
      floorNumber,
      bedType,
      paidSecurityFee,
      hostelPaidAmount,
      accommodationPaidAmount,
      mealPaidAmount,
      paidAmount,
      type,
      totalDays,
      paymentDate,
      priceType,
      paymentType,
      chequeOrTransNo,
      joiningDate,
      nextPaymentDate,
      miscellaneousCost,
      bankDetails,
      existingPaymentDate,
      monthCount,
      discountedAmount,
      daysCount,
    } = params;

    const newReceiptNumber = await this.generateHostelReceiptNumber();

    const monthlyData =
      monthWise && hostelDetails
        ? {
            securityFee: hostelDetails?.bedDetails?.securityFee,
            paidSecurityFee,
            hostelCharge:
              hostelDetails?.bedDetails?.hostelChargeWithGst * monthCount,
            hostelGst: hostelDetails?.bedDetails?.hostelGst,
            hostelPaidAmount,
            accommodationCost:
              hostelDetails?.bedDetails?.accommodationCostWithGst * monthCount,
            accommodationGst: hostelDetails?.bedDetails?.accommodationGst,
            accommodationPaidAmount,
            mealCost: hostelDetails?.bedDetails?.mealCostWithGst * monthCount,
            mealGst: hostelDetails?.bedDetails?.mealGst,
            mealPaidAmount,
            totalGst: hostelDetails?.bedDetails?.totalGst * monthCount,
            totalAmount:
              hostelDetails?.bedDetails?.totalPriceToPay * monthCount,
            paidAmount,
          }
        : null;

    const dayWiseData =
      dayWise && hostelDetails
        ? {
            securityFee: hostelDetails?.bedDetails?.securityFee ?? 0,
            perDayCost: hostelDetails?.bedDetails?.perDayCost,
            totalDays,
            totalAmount:
              (hostelDetails?.bedDetails?.perDayCost || 0) * totalDays,
            paidAmount,
          }
        : null;

    console.log('dayWiseData', dayWiseData);

    const newOrder = await this.hostelOrderModel.create({
      mkcOrderId: await this.generateOrderUniqueID(),
      daysCount,
      userId,
      hostelId,
      roomNumber,
      floorNumber,
      bedType,
      paymentDate: existingPaymentDate ? existingPaymentDate : paymentDate,
      type,
      monthCount,
      discountedAmount,
      monthlyPaymentDetail: monthlyData,
      daywisePaymentDetail: dayWiseData,
      paymentStatus: PaymentStatus.PAID,
      priceType,
      orderType: OrderTypes.MANUAL,
      purchaseBy: user?.type,
      paymentType,
      chequeOrTransNo,
      bankDetails,
      joiningDate,
      nextPaymentDate,
      receiptNumber: newReceiptNumber,
      miscellaneousCost,
      createdBy: staffId,
      paidAmount,
      createdByModel: SchemaReferenceType.STAFF,
      updatedByModel: SchemaReferenceType.STAFF,
    });

    await this.hostelOrderModel.findByIdAndUpdate(newOrder?._id, {
      $set: { parentOrderId: newOrder?._id },
    });

    return { order: newOrder };
  }

  //ANCHOR -generate Receipt for hostel
  private async generateHostelReceiptNumber(): Promise<string> {
    try {
      const lastReceipt = await this.hostelRentalPayModel
        .findOne({
          paymentStatus: PaymentStatus.PAID,
          receiptNumber: { $regex: `^HOS-`, $options: 'i' },
        })
        .sort({ receiptNumber: -1 })
        .select('receiptNumber');

      let nextReceiptNumber: number;

      if (!lastReceipt) {
        nextReceiptNumber = 10001;
      } else {
        const lastNumber = parseInt(
          lastReceipt.receiptNumber.split('-')[1],
          10,
        );
        nextReceiptNumber = lastNumber + 1;
      }

      const receiptNumber = `HOS-${nextReceiptNumber}`;

      return receiptNumber;
    } catch (error) {
      throw error;
    }
  }

  //ANCHOR - generate mkc Order UniqueID for hostel
  private async generateOrderUniqueID(): Promise<string> {
    const prefix = 'MKC_HOST_ORD_';
    const lastOrder = await this.hostelOrderModel.findOne(
      {},
      {},
      { sort: { createdAt: -1 } },
    );

    let id = '001';
    if (lastOrder) {
      const lastUniqueId = lastOrder.mkcOrderId?.replace(prefix, '') || '000';
      const incrementedUniqueId = (parseInt(lastUniqueId, 10) + 1)
        .toString()
        .padStart(3, '0');

      id = incrementedUniqueId;
    }
    return prefix + id;
  }

  //ANCHOR - get months end date and days left based on the current date
  private async getMonthInfo(joiningDate: Date): Promise<any> {
    // Get current date
    const currentDate = new Date(joiningDate);

    // Get the last day of the current month
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    lastDayOfMonth.setHours(
      lastDayOfMonth.getHours() + 5,
      lastDayOfMonth.getMinutes() + 30,
    );

    // Calculate total days in the month
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Calculate difference in days
    const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    const daysLeft = Math.ceil(
      (lastDayOfMonth.getTime() - currentDate.getTime()) / millisecondsPerDay,
    );

    // Format the last day of the month as YYYY-MM-DD
    const formattedLastDayOfMonth = lastDayOfMonth.toISOString().slice(0, 10);

    return {
      endDate: formattedLastDayOfMonth,
      totalDaysInMonth,
      daysLeft,
    };
  }

  //ANCHOR - create Hdfc Hospital Order
  private async createHdfcHostelOrder(
    mkcOrderId: string,
    totalAmount: number,
    user: { uniqueId: string; email: string; phone: string; name: string },
  ): Promise<any> {
    try {
      //NOTE - ceate auth string by api key
      const username = 'F8728EF53374F3EA8291234EC9C71D';
      const password = '';
      const basicAuthString = Buffer.from(`${username}:${password}`).toString(
        'base64',
      );

      //NOTE - create order
      const order = await axios.post(
        process.env.HDFC_SESSION_URL,
        {
          order_id: mkcOrderId,
          amount: totalAmount,
          customer_id: user.uniqueId,
          customer_email: user.email,
          customer_phone: user.phone,
          payment_page_client_id: process.env.PAYMENT_PAGE_CLIENT_ID,
          action: process.env.ACTION,
          currency: process.env.HDFC_CURRENCY,
          return_url: process.env.HOSTEL_RETURN_URL,
          description: 'Complete your payment',
          first_name: user.name,
        },
        {
          headers: {
            Authorization: `Basic ${basicAuthString}`,
            'Content-Type': 'application/json',
            'x-merchantid': process.env.HOSTEL_MERCHANT_ID,
            'x-customerid': process.env.HOSTEL_CUSTOMER_ID,
          },
        },
      );

      return order.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - verify Hdfc hostel Order
  private async verifyHdfcHostelOrder(order_id: string): Promise<any> {
    try {
      const username = 'F8728EF53374F3EA8291234EC9C71D';
      const password = '';
      const basicAuthString = Buffer.from(`${username}:${password}`).toString(
        'base64',
      );

      const response = await axios.post(
        `https://smartgatewayuat.hdfcbank.com/orders/${order_id}`,
        null,
        {
          headers: {
            Authorization: `Basic ${basicAuthString}`,
            version: '2023-06-30',
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-merchantid': 'SG185',
            'x-customerid': 'test123',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - get days info
  private async getDaysDifference(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
        throw new HttpException(INVALID_DATE, HttpStatus.BAD_REQUEST);

      const differenceMs = endDate.getTime() - startDate.getTime();
      const differenceDays = differenceMs / (1000 * 60 * 60 * 24);
      const roundedDifferenceDays = Math.round(differenceDays * 100) / 100;

      return roundedDifferenceDays;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - convert To Short Date
  private async convertToShortDate(
    date: Date | string | null,
  ): Promise<string | null> {
    if (!date) return null;

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime()))
      throw new HttpException(INVALID_DATE, HttpStatus.BAD_REQUEST);

    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return formattedDate;
  }

  //ANCHOR - change Joining Date
  private async changeJoiningDate(
    userId: string,
    hostelId: string,
    hostelDetails: any,
    today: Date,
    joiningDate: Date,
    staffId: string,
  ): Promise<string> {
    try {
      const oldJoiningDate = new Date(hostelDetails.joiningDate);
      oldJoiningDate.setUTCHours(0, 0, 0, 0);

      //NOTE: Check if hostelDetails.joiningDate is lessthan today's date
      if (oldJoiningDate < today) {
        throw new HttpException(
          JOINING_DATE_PASSED_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      const days = await this.getDaysDifference(
        hostelDetails.validityStartDate,
        hostelDetails.validityEndDate,
      );

      const hostelLeaveDate = new Date(joiningDate);
      //NOTE -  Add duration in  the current date to calculate Valid Upto date
      hostelLeaveDate.setDate(hostelLeaveDate.getDate() + (days - 1));

      //NOTE - update the joining date
      await this.userHostelValidityModel.findByIdAndUpdate(hostelDetails._id, {
        $set: {
          joiningDate: new Date(joiningDate),
          validityStartDate: new Date(joiningDate).setUTCHours(0, 0, 0, 0),
          validityEndDate: new Date(hostelLeaveDate).setUTCHours(
            23,
            59,
            59,
            999,
          ),
          updatedBy: staffId,
          updatedByModel: SchemaReferenceType.STAFF,
        },
      });

      const oldDate = await this.convertToShortDate(oldJoiningDate);
      const newDate = await this.convertToShortDate(joiningDate);

      //NOTE - update in timelime
      await this.timelineModel.create({
        hostelUserId: new mongoose.Types.ObjectId(userId),
        section: 'Hostel Change',
        reason: `Change joining date from ${oldDate} to ${newDate} `,
        userHostelValidityId: hostelDetails._id,
        createdBy: staffId,
      });

      //NOTE - update in change hostel history
      await this.changeHistoryModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        hostelId,
        orderId: hostelDetails.orderId,
        type: ChangeHostelType.JOINING_DATE,
        joiningDate: oldJoiningDate,
        changeJoiningDate: joiningDate,
        createdBy: staffId,
      });
      return JOINING_DATE_CHANGE;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - change room number
  private async changeRoomNumber(
    userId: string,
    hostelId: string,
    hostelDetails: any,
    roomNumber: number,
    floorNumber: number,
    staffId: string,
  ): Promise<string> {
    try {
      //NOTE - update the rooom number
      await this.userHostelValidityModel.findOneAndUpdate(
        { _id: hostelDetails._id, bedType: hostelDetails.bedType },
        {
          $set: {
            roomNumber,
            floorNumber,
            updatedBy: staffId,
            updatedByModel: SchemaReferenceType.STAFF,
          },
        },
      );

      //NOTE - update the user Hostel Validity Model as status false
      const documents = await this.userHostelValidityModel
        .find({
          hostelId: hostelDetails.hostelId,
          orderId: hostelDetails.orderId,
          userId: hostelDetails.userId,
          bedType: hostelDetails.bedType,
        })
        .sort({ createdAt: -1 })
        .select('_id');

      if (documents.length > 1) {
        const idsToUpdate = documents.slice(1).map((doc) => doc._id); // Exclude the last document

        //NOTE: Update the identified documents
        await this.userHostelValidityModel.updateMany(
          { _id: { $in: idsToUpdate } },
          { $set: { status: false } },
        );
      }

      //NOTE - update the room number in payment table
      await this.hostelRentalPayModel.findByIdAndUpdate(
        hostelDetails.paymentId,
        {
          $set: {
            roomNumber,
            floorNumber,
            updatedBy: staffId,
            updatedByModel: SchemaReferenceType.STAFF,
          },
        },
      );

      //NOTE - update the hostel bed mapping for new
      await this.hostelModel.findOneAndUpdate(
        { _id: hostelId, 'roomMapping.roomNumber': roomNumber },
        {
          $inc: {
            'roomMapping.$.vacant': -1,
            'roomMapping.$.purchasedBed': 1,
          },
        },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE - update the hostel bed mapping for old
      await this.hostelModel.findOneAndUpdate(
        { _id: hostelId, 'roomMapping.roomNumber': hostelDetails.roomNumber },
        {
          $inc: {
            'roomMapping.$.vacant': 1,
            'roomMapping.$.purchasedBed': -1,
          },
        },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE - update in timelime
      await this.timelineModel.create({
        hostelUserId: new mongoose.Types.ObjectId(userId),
        section: 'Hostel Change',
        reason: `Change room number from ${hostelDetails.roomNumber} to ${roomNumber} `,
        userHostelValidityId: hostelDetails._id,
        createdBy: staffId,
      });

      //NOTE - update in change hoste history
      await this.changeHistoryModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        hostelId,
        orderId: hostelDetails.orderId,
        type: ChangeHostelType.ROOM_NUMBER,
        roomNumber: hostelDetails.roomNumber,
        changeRoomNumber: roomNumber,
        createdBy: staffId,
      });
      return ROOM_NUMBER_CHANGE;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - change bed type and room number
  private async changeBedTypeNumber(
    userId: string,
    hostelId: string,
    hostelDetails: any,
    bedType: BedTypes,
    roomNumber: number,
    floorNumber: number,
    staffId: string,
    userType: UserType,
  ): Promise<string> {
    try {
      //NOTE: Get the current date and time
      const paymentDate = new Date();
      //NOTE: Add 5 hours and 30 minutes to the current date and time
      paymentDate.setHours(
        paymentDate.getHours() + 5,
        paymentDate.getMinutes() + 30,
      );

      //NOTE - get hostel details
      const hostel = await this.hostelModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
        {
          $project: {
            bedDetails: {
              $filter: {
                input: '$bedDetails',
                as: 'bed',
                cond: {
                  $eq: ['$$bed.bedType', bedType],
                },
              },
            },
            roomMapping: {
              $filter: {
                input: '$roomMapping',
                as: 'room',
                cond: {
                  $and: [
                    { $eq: ['$$room.bedType', bedType] },
                    { $eq: ['$$room.roomNumber', roomNumber] },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            bedDetails: { $arrayElemAt: ['$bedDetails', 0] },
            roomMapping: { $arrayElemAt: ['$roomMapping', 0] },
          },
        },
        {
          $project: {
            bedDetails: 1,
            'roomMapping.roomNumber': 1,
            'roomMapping.floorNumber': 1,
            'roomMapping.bedType': 1,
            'roomMapping.totalBeds': 1,
            'roomMapping.vacant': 1,
            'roomMapping.purchasedBed': 1,
          },
        },
      ]);

      if (!hostel[0])
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      //NOTE: get the payment details
      const payment = await this.hostelRentalPayModel
        .findOne({
          userId: new mongoose.Types.ObjectId(userId),
          hostelId: new mongoose.Types.ObjectId(hostelId),
        })
        .sort({ createdAt: -1 });

      const monthWise = payment?.type === HostelPaymentType.MONTH_WISE;
      const dayWise = payment?.type === HostelPaymentType.DAY_WISE;

      //NOTE: get previous order details
      const previousOrder = await this.hostelOrderModel.findById(
        payment.parentOrderId,
      );

      //NOTE - create new order payload
      const monthlyData =
        monthWise && hostel[0]
          ? {
              securityFee: previousOrder?.monthlyPaymentDetail?.securityFee,
              paidSecurityFee:
                previousOrder?.monthlyPaymentDetail?.securityFee -
                payment?.securityFeeOutStanding,
              hostelCharge: hostel[0]?.bedDetails?.hostelChargeWithGst,
              hostelGst: hostel[0]?.bedDetails?.hostelGst,
              hostelPaidAmount:
                previousOrder?.monthlyPaymentDetail?.hostelCharge -
                payment?.hostelOutstanding,
              accommodationCost:
                hostel[0]?.bedDetails?.accommodationCostWithGst,
              accommodationGst: hostel[0]?.bedDetails?.accommodationGst,
              accommodationPaidAmount:
                previousOrder?.monthlyPaymentDetail?.accommodationCost -
                payment?.accommodationOutstanding,
              mealCost: hostel[0]?.bedDetails?.mealCostWithGst,
              mealGst: hostel[0]?.bedDetails?.mealGst,
              mealPaidAmount:
                previousOrder?.monthlyPaymentDetail?.mealCost -
                payment?.mealOutstanding,
              totalGst: hostel[0]?.bedDetails?.totalGst,
              totalAmount: hostel[0]?.bedDetails?.totalPriceToPay,
              paidAmount: payment?.totalPaidAmount,
            }
          : null;

      const dayWiseData =
        dayWise && hostel[0]
          ? {
              perDayCost: hostel[0]?.bedDetails?.perDayCost,
              totalDays: payment?.totalDays,
              totalAmount:
                (hostel[0]?.bedDetails?.perDayCost || 0) * payment?.totalDays,
              paidAmount: payment?.totalPaidAmount,
            }
          : null;

      //NOTE - create new order
      const newOrder = await this.hostelOrderModel.create({
        mkcOrderId: await this.generateOrderUniqueID(),
        userId,
        hostelId,
        roomNumber,
        floorNumber,
        bedType,
        paymentDate,
        type: payment?.type,
        monthlyPaymentDetail: monthlyData,
        daywisePaymentDetail: dayWiseData,
        paymentStatus: PaymentStatus.PAID,
        priceType: HostelPriceType.BED_TYPE_CHANGE,
        orderType: OrderTypes.BED_TYPE_CHANGE,
        purchaseBy: userType,
        paymentType: payment?.paymentType,
        chequeOrTransNo: payment?.chequeOrTransNo,
        bankDetails: payment?.bankDetails,
        joiningDate: previousOrder.joiningDate,
        nextPaymentDate: payment?.nextPaymentDate,
        receiptNumber: null,
        miscellaneousCost: null,
        createdBy: staffId,
        paidAmount: payment?.totalPaidAmount,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      await this.hostelOrderModel.findByIdAndUpdate(newOrder?._id, {
        $set: { parentOrderId: newOrder?._id },
      });

      const hostelOutstanding = Math.max(
        (monthWise &&
          hostel[0]?.bedDetails?.hostelChargeWithGst -
            (payment?.hostelCharge - payment?.hostelOutstanding)) ??
          0,
        0,
      );

      const accommodationOutstanding = Math.max(
        (monthWise &&
          hostel[0]?.bedDetails?.accommodationCostWithGst -
            (payment?.accommodationCost - payment?.accommodationOutstanding)) ??
          0,
        0,
      );

      const mealOutstanding = Math.max(
        (monthWise &&
          hostel[0]?.bedDetails?.mealCostWithGst -
            (payment?.mealCost - payment?.mealOutstanding)) ??
          0,
        0,
      );

      const totalAmount = hostel[0]?.bedDetails?.perDayCost * payment.totalDays;

      //NOTE - calculate outstanding amount
      let outstanding = monthWise
        ? hostelOutstanding + accommodationOutstanding + mealOutstanding
        : totalAmount - payment?.totalPaidAmount;

      // Ensure outstanding amount is not negative
      outstanding = Math.max(0, outstanding);

      //NOTE - check if gst applicable
      const isGstApplicable =
        monthWise && hostel[0]?.bedDetails?.totalGst > 0 ? true : false;

      //NOTE - create hostel Rental Pay Model
      const newPayment = await this.hostelRentalPayModel.create({
        userId,
        orderId: newOrder._id,
        parentOrderId: newOrder._id,
        hostelId,
        type: payment?.type,
        roomNumber,
        floorNumber,
        bedType,
        securityFee:
          (monthWise && previousOrder?.monthlyPaymentDetail?.securityFee) ?? 0,
        paidSecurityFee:
          (monthWise &&
            previousOrder?.monthlyPaymentDetail?.securityFee -
              payment?.securityFeeOutStanding) ??
          0,
        securityFeeOutStanding:
          (monthWise && payment?.securityFeeOutStanding) ?? 0,
        netHostelCharge:
          (monthWise && hostel[0]?.bedDetails?.hostelCharge) ?? 0,
        hostelCharge:
          (monthWise && hostel[0]?.bedDetails?.hostelChargeWithGst) ?? 0,
        hostelGst: (monthWise && hostel[0]?.bedDetails?.hostelGst) ?? 0,
        hostelPaidAmount:
          (monthWise && payment?.hostelCharge - payment?.hostelOutstanding) ??
          0,
        hostelOutstanding,
        netAccommodationCost:
          (monthWise && hostel[0]?.bedDetails?.accommodationCost) ?? 0,
        accommodationCost:
          (monthWise && hostel[0]?.bedDetails?.accommodationCostWithGst) ?? 0,
        accommodationGst:
          (monthWise && hostel[0]?.bedDetails?.accommodationGst) ?? 0,
        accommodationPaidAmount:
          (monthWise &&
            payment?.accommodationCost - payment?.accommodationOutstanding) ??
          0,
        accommodationOutstanding,
        netMealCost: (monthWise && hostel[0]?.bedDetails?.mealCost) ?? 0,
        mealCost: (monthWise && hostel[0]?.bedDetails?.mealCostWithGst) ?? 0,
        mealGst: (monthWise && hostel[0]?.bedDetails?.mealGst) ?? 0,
        mealPaidAmount:
          (monthWise && payment?.mealCost - payment?.mealOutstanding) ?? 0,
        mealOutstanding,
        totalGst: (monthWise && hostel[0]?.bedDetails?.totalGst) ?? 0,
        perDayCost: (dayWise && hostel[0]?.bedDetails?.perDayCost) ?? 0,
        totalDays: payment?.totalDays,
        totalAmountWithSecurity: monthWise
          ? Number(
              hostel[0]?.bedDetails?.totalPriceToPay +
                previousOrder?.monthlyPaymentDetail?.securityFee,
            )
          : Number(hostel[0]?.bedDetails?.perDayCost * payment?.totalDays), //TODO - if day wise
        totalAmountWithOutSecurity: monthWise
          ? Number(hostel[0]?.bedDetails?.totalPriceToPay)
          : Number(hostel[0]?.bedDetails?.perDayCost * payment?.totalDays),
        paidAmount: payment?.totalPaidAmount,
        totalPaidAmount: payment?.totalPaidAmount,
        outstandingAmount: outstanding,
        totalAmtReceived: payment?.totalPaidAmount,
        nextPaymentDate: payment?.nextPaymentDate,
        priceType: HostelPriceType.BED_TYPE_CHANGE,
        transactionStatus:
          outstanding > 0
            ? HostelTransactionStatus.MANUAL_INSTALLMENT
            : HostelTransactionStatus.MANUAL_FULL_PAYMENT,
        chequeOrTransNo: payment?.chequeOrTransNo,
        bankDetails: payment?.bankDetails,
        receiptNumber: null,
        paymentType: payment?.paymentType,
        purchaseBy: userType,
        miscellaneousCost: payment?.miscellaneousCost,
        createdBy: staffId,
        isGstApplicable,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      //NOTE: create the user hostel validity details
      await this.userHostelValidityModel.create({
        userId,
        hostelId,
        orderId: newOrder?._id,
        paymentId: newPayment?._id,
        type: newPayment.type,
        totalDays: dayWise && newPayment.totalDays,
        bedType,
        roomNumber,
        floorNumber,
        joiningDate: hostelDetails.joiningDate,
        isSecurityFeeAdded: hostelDetails.isSecurityFeeAdded,
        isSecurityFeeFullPaid: hostelDetails.isSecurityFeeFullPaid,
        validityStartDate: hostelDetails.validityStartDate,
        validityEndDate: hostelDetails.validityEndDate,
        createdBy: staffId,
        createdByModel: SchemaReferenceType.STAFF,
        updatedByModel: SchemaReferenceType.STAFF,
      });

      //NOTE - update the hostel bed mapping for new
      await this.hostelModel.findOneAndUpdate(
        { _id: hostelId, 'roomMapping.roomNumber': roomNumber },
        {
          $inc: {
            'roomMapping.$.vacant': -1,
            'roomMapping.$.purchasedBed': 1,
          },
        },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE - update the hostel bed mapping for old
      await this.hostelModel.findOneAndUpdate(
        { _id: hostelId, 'roomMapping.roomNumber': payment?.roomNumber },
        {
          $inc: {
            'roomMapping.$.vacant': 1,
            'roomMapping.$.purchasedBed': -1,
          },
        },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE - update the old payment as installment close
      await this.hostelRentalPayModel.findByIdAndUpdate(payment._id, {
        $set: {
          transactionStatus: HostelTransactionStatus.INSTALLMENT_TERMINATED,
        },
      });

      //NOTE - update the user Hostel Validity Model as status false
      const documents = await this.userHostelValidityModel
        .find({
          hostelId: hostelDetails.hostelId,
          userId: hostelDetails.userId,
        })
        .sort({ createdAt: -1 })
        .select('_id');

      if (documents.length > 1) {
        const idsToUpdate = documents.slice(1).map((doc) => doc._id); // Exclude the last document

        //NOTE: Update the identified documents
        await this.userHostelValidityModel.updateMany(
          { _id: { $in: idsToUpdate } },
          { $set: { status: false } },
        );
      }

      return BED_TYPE_CHANGE;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - calculate gst amount
  private async calculateGstAmount(
    amount: number,
    gst: number,
  ): Promise<number> {
    const basePrice = amount / (1 + gst / 100);

    //NOTE: Round the base price to ensure it is a whole number
    const roundedBasePrice = Math.ceil(basePrice);

    const gstAmount = Math.ceil(amount - roundedBasePrice);

    return gstAmount;
  }
}
