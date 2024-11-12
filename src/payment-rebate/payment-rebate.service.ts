import { ParsedQs } from 'qs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import {
  OfflinePaymentType,
  TransactionStatus,
  UserStatusTypes,
  UserType,
} from 'src/utills/enum';
import {
  INVALID_ID,
  PAYMENT_DISCOUNT_SUCCESS,
  RECORD_NOT_FOUND,
} from 'src/utills/messages';
import { PaymentRebateDto } from './dto/payment-rebate.dto';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { PaymentRebate } from 'src/schema/payment-rebate.schema';
import { Payment } from 'src/schema/payment.schema';
import { User } from 'src/schema/user.schema';
import { UserProductDetails } from 'src/schema/user-product-details.schema';

@Injectable()
export class PaymentRebateService {
  constructor(
    @InjectModel(OfflineCoursePayment.name)
    private offlinePaymentModel: Model<OfflineCoursePayment>,
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(PaymentRebate.name) private rebateModel: Model<PaymentRebate>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
  ) {}

  //SECTION - get all payment details of student
  async paymentDetails(id: string): Promise<{ data: any[] }> {
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    //NOTE - get payment details
    const paymentData: any[] = await this.offlinePaymentModel.aggregate([
      {
        $match: {
          userId: id,
          transactionStatus: {
            $nin: [TransactionStatus.FULL_PAYMENT],
          },
        },
      },
      { $sort: { createdAt: -1 } }, // Sort by updatedAt in descending order
      {
        $group: {
          _id: {
            courseId: '$courseId',
            parentOrderId: '$parentOrderId',
          },
          latestPayment: { $first: '$$ROOT' }, // Get the first document in each group (which will be the latest based on sorting)
        },
      },
      {
        $match: {
          'latestPayment.transactionStatus': {
            $nin: [
              TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE,
              TransactionStatus.INSTALLMENT_COMPLETE,
              TransactionStatus.INSTALLMENT_CLOSED,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: '_id.courseId',
          foreignField: '_id',
          as: 'latestPayment.courseId',
        },
      },
      {
        $unwind: {
          path: '$latestPayment.courseId',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { 'latestPayment.courseId': { $ne: null } } },
      {
        $project: {
          _id: '$latestPayment._id',
          userId: '$latestPayment.userId',
          parentOrderId: '$latestPayment.parentOrderId',
          courseId: '$latestPayment.courseId._id',
          transactionStatus: '$latestPayment.transactionStatus',
          productType: {
            $cond: {
              if: { $gt: ['$latestPayment.productType', null] },
              then: '$latestPayment.productType',
              else: null,
            },
          },
          title: '$latestPayment.courseId.title',
          outstandingAmount: '$latestPayment.outstandingAmount',
        },
      },
    ]);

    return { data: paymentData };
  }

  //SECTION - apply discount to student purchased course
  async applyDiscount(
    payload: PaymentRebateDto,
    staffId: string,
  ): Promise<string> {
    if (!mongoose.isValidObjectId(staffId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const productPayload = [];
    const { studentId, totalAmount, remarks, productDetails } = payload;
    //NOTE - get user details
    const userDetails = await this.userModel.findById(studentId);

    for (const products of productDetails) {
      const { _id, courseId, amount, productType, outstandingAmount } =
        products;

      //NOTE - check course details
      const courseDetails = await this.onlineCourseModel
        .findById(courseId)
        .populate([
          {
            path: 'priceId',
            select:
              'mrpPrice discountedPrice totalPrice discountPercentage gst',
          },
        ]);

      if (!courseDetails)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      if (amount > 0) {
        //NOTE - check course last payment
        const existingPaymentDetails = await this.offlinePaymentModel.findById(
          _id,
        );

        //NOTE - if last payment status is installment
        if (
          existingPaymentDetails.transactionStatus ===
          TransactionStatus.INSTALLMENT
        ) {
          //NOTE - calculate the gstamount
          const basePrice = Math.ceil(
            amount / (1 + existingPaymentDetails?.gst / 100),
          );

          const gstAmount = Math.ceil(amount - basePrice);

          //NOTE : Get the current date
          const currentDate = new Date();

          //NOTE : Calculate the next day's date
          const nextPaymentDate = new Date(currentDate);
          nextPaymentDate.setDate(currentDate.getDate() + 1);

          //NOTE : Format the date if needed (optional)
          const formattedNextPaymentDate = nextPaymentDate
            .toISOString()
            .split('T')[0];

          //NOTE -  offline course payment details
          const latestPayment = await this.offlinePaymentModel.create({
            userId: studentId,
            orderId: existingPaymentDetails?.orderId,
            parentOrderId: existingPaymentDetails?.parentOrderId,
            courseId: new mongoose.Types.ObjectId(courseId),
            productAmount: existingPaymentDetails?.productAmount,
            totalPrice: amount,
            gst: existingPaymentDetails?.gst,
            cgst: existingPaymentDetails?.cgst,
            sgst: existingPaymentDetails?.cgst,
            gstAmount,
            cgstAmount: gstAmount / 2,
            sgstAmount: gstAmount / 2,
            discountPercentage: existingPaymentDetails?.discountPercentage,
            discountedPrice: basePrice,
            outstandingAmount,
            totalAmtReceived: existingPaymentDetails?.totalAmtReceived + amount,
            nextPaymentDate:
              outstandingAmount !== 0 ? formattedNextPaymentDate : null,
            priceType: existingPaymentDetails?.priceType,
            transactionStatus:
              outstandingAmount === 0
                ? TransactionStatus.INSTALLMENT_COMPLETE
                : TransactionStatus.INSTALLMENT,
            paymentType: OfflinePaymentType.REBATE,
            productType,
            createdBy: staffId,
          });

          //NOTE - total amount paid percentage
          const amountPaidPercentage =
            (latestPayment.totalAmtReceived /
              existingPaymentDetails?.productAmount) *
            100;

          //NOTE - check user status
          const userStatus = await this.getStudentStatus(
            studentId,
            amountPaidPercentage,
          );

          //NOTE - update user details
          await this.userModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(studentId) },
            {
              isRegistered:
                userStatus === UserStatusTypes.ADMITTED ? true : false,
              registrationDate:
                userStatus === UserStatusTypes.ADMITTED ? new Date() : null,
              isPurchased: true,
              studentStatus: userStatus, //TODO - check the user status based on the payment
              type:
                userDetails?.type === UserType.STUDENT
                  ? UserType.STUDENT
                  : userStatus === UserStatusTypes.ADMITTED
                  ? UserType.STUDENT
                  : UserType.ENQUIRY,
              isOnlineCourseSold: true,
              updatedBy: staffId,
            },
            { new: true, runValidators: true, upsert: true },
          );

          //NOTE - check if user product details access is false then make it true
          const productDetails = await this.userProductDetailsModel.findOne({
            studentId: new mongoose.Types.ObjectId(studentId),
            onlineCourseId: courseDetails._id,
            orderId: existingPaymentDetails?.parentOrderId,
          });

          //NOTE - if false , make it as true
          if (productDetails?.haveAccess === false) {
            await this.userProductDetailsModel.findByIdAndUpdate(
              productDetails._id,
              { $set: { haveAccess: true } },
            );
          }

          //NOTE - payload for rebate schema
          productPayload.push({
            courseId,
            type: courseDetails.type,
            amount,
          });
        }
      }
    }

    //NOTE - payload for rebat model
    await this.rebateModel.create({
      userId: studentId,
      totalRebateAmount: totalAmount,
      remarks,
      productDetails: productPayload,
      createdBy: staffId,
    });

    return PAYMENT_DISCOUNT_SUCCESS;
  }

  //SECTION - get all payment
  async getAllRebateDetails(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as unknown as {
      page: string;
      limit: string;

      search: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - student name,phone email
    const filters = search
      ? {
          $or: [
            { name: { $regex: new RegExp(`^(${search})`, 'i') } },
            { phone: { $regex: new RegExp(`^(${search})`, 'i') } },
            { email: { $regex: new RegExp(`^(${search})`, 'i') } },
          ],
        }
      : {};

    //NOTE - get payment count
    const count = await this.rebateModel.countDocuments({ ...filters });

    //NOTE - find all payment data
    const rebateDetails: any[] = await this.rebateModel
      .find({ ...filters })
      .populate([
        { path: 'userId', select: 'name' },
        { path: 'createdBy', select: 'name' },
      ])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-userId -createdBy')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      rebateDetails.map(async (item) => {
        return {
          _id: item._id,
          user: item.userId?.name,
          phone: item.userId?.phone,
          totalRebateAmount: item?.totalRebateAmount,
          remarks: item?.remarks ?? null,
          createdBy: item.createdBy?.name,
        };
      }),
    );

    return { data, count };
  }

  //ANCHOR - get student status based on the product added in cart
  private async getStudentStatus(
    studentId: string,
    percentage: number,
  ): Promise<UserStatusTypes> {
    //NOTE - if full payment

    const user = await this.userModel.findById(studentId);

    //TODO: Check if the user's existing status is admitted
    if ([UserStatusTypes.ADMITTED].includes(user.studentStatus)) {
      return user.studentStatus;
    }

    if (percentage >= 50) {
      return UserStatusTypes.ADMITTED;
    } else {
      return UserStatusTypes.PRE_BOOK;
    }
  }
}
