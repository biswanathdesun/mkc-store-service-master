import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { FineTracker } from 'src/schema/fine.tracker.schema';
import { FineHistoryDto } from './dto/fine-history.dto';
import {
  ERROR_VERIFY_PAYMENT,
  INVALID_FINE_STATUS,
  PAYMENT_FAILED,
  PAYMENT_SUCCESS,
  RECORD_NOT_FOUND,
  USER_NOT_FOUND,
} from 'src/utills/messages';
import { CreateFineOrderDto } from './dto/create-fine-order.dto';
import { User } from 'src/schema/user.schema';
import {
  AttendanceTypes,
  FeeTypes,
  LiveAttendanceType,
  OfflineCoursePriceType,
  OfflinePaymentType,
  OrderTypes,
  PaymentStatus,
  SchemaReferenceType,
} from 'src/utills/enum';
import { Order } from 'src/schema/order.schema';
import { Payment } from 'src/schema/payment.schema';
import { VerifyFinePaymentDto } from './dto/verify-fine-payment.dto';
import { StudentAttendance } from 'src/schema/student-attendance.schema';
import { AttendanceReport } from 'src/schema/live-attendance-report.schema';

@Injectable()
export class FineTrackerService {
  private rzp: razorpay;
  constructor(
    @InjectModel(FineTracker.name) private fineTrackerModel: Model<FineTracker>,
    @InjectModel(AttendanceReport.name)
    private attendanceReportModel: Model<AttendanceReport>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(StudentAttendance.name)
    private attendanceModel: Model<StudentAttendance>,
  ) {
    this.rzp = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  //SECTION - get user fine history
  async fineHistory(
    payload: FineHistoryDto,
    userId: string,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit } = payload;
    const skip = (page - 1) * limit;

    //NOTE - get payment count
    const count = await this.fineTrackerModel.countDocuments({
      userId,
      isRemarkAdded: false,
      status: true,
    });

    const fineDetails: any[] = await this.fineTrackerModel
      .find({ userId, isRemarkAdded: false, status: true })
      .populate('orderId', 'mkcOrderId')
      .populate('batchId', 'name')
      .skip(skip)
      .sort({ updatedAt: -1 })
      .limit(limit);

    const response = fineDetails.map((item) => ({
      _id: item._id,
      mkcOrderId: item?.orderId?.mkcOrderId ?? null,
      batchId: item.batchId?._id ?? null,
      batchName: item.batchId?.name ?? null,
      isRemarkAdded: item?.isRemarkAdded ?? null,
      remark: item?.remark ?? null,
      remarkDate: item?.remarkDate ?? null,
      amount: item.amount ?? null,
      paymentDate: item?.paymentDate ?? null,
      attendanceStatus: item?.attendanceStatus ?? null,
      paymentStatus: item?.paymentStatus ?? null,
      isActiveForPayment: item?.isActiveForPayment ?? null,
    }));

    return { data: response, count };
  }

  //SECTION - create Order For Fine
  async createOrderForFine(
    payload: CreateFineOrderDto,
    userId: string,
  ): Promise<{ data: any }> {
    const { fineId } = payload;

    const payment_details = await this.fineTrackerModel.findById(fineId);

    if (!payment_details)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (!payment_details.isActiveForPayment) {
      throw new HttpException(INVALID_FINE_STATUS, HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(userId);

    if (!payment_details)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - payload for create order in razorpay
    const orderDetails = {
      amount: Math.ceil(payment_details.amount * 100),
      currency: process.env.CURRENCY,
    };

    const order: any = await this.rzp.orders.create(orderDetails);

    const orderPayload = {
      orderNumber: order.id,
      userId,
      totalPrice: payment_details.amount,
      gst: 0,
      cgst: 0,
      sgst: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      shippingCharge: 0,
      totalAmount: payment_details.amount,
      paidAmount: payment_details.amount,
      priceType: OfflineCoursePriceType.BASE_PRICE,
      purchaseBy: user?.type,
      feeType: FeeTypes.FINE,
      createdBy: userId,
    };

    const order_details = await this.orderModel.create({
      ...orderPayload,
      mkcOrderId: await this.generateOrderUniqueID(),
    });

    await this.orderModel.findByIdAndUpdate(order_details._id, {
      $set: { parentOrderId: order_details._id },
    });

    //NOTE - enter payment details in payment table
    const payment = await this.paymentModel.create({
      orderId: order_details._id,
      orderNumber: order.id,
      userId,
      totalAmount: payment_details.amount,
      totalAmtReceived: payment_details.amount,
      productAmount: payment_details.amount,
      purchaseBy: user.type,
      createdBy: userId,
    });

    //NOTE - update fine Tracker Model
    await this.fineTrackerModel.findByIdAndUpdate(fineId, {
      $set: {
        orderId: order_details._id,
        paymentId: payment._id,
        updatedBy: userId,
        updatedByModel: SchemaReferenceType.USER,
      },
    });

    return { data: order };
  }

  //SECTION -verify Payment For Fine
  async verifyPaymentForFine(
    payload: VerifyFinePaymentDto,
    userId: string,
  ): Promise<string> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        payload;

      // Generate signature including the paid amount
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      try {
        const getOrder = await this.orderModel.findOne({
          orderNumber: razorpay_order_id,
        });
        //NOTE: Configure the API endpoint
        const apiUrl = `${process.env.RAZORPAY_ORDER_CONFIRM_API}/${razorpay_order_id}/payments`;

        //NOTE: Configure request headers
        const headers = {
          Authorization: `Basic ${Buffer.from(
            process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET,
          ).toString('base64')}`,
        };

        //NOTE: Make the API request to fetch payment details for razorpay
        const response = await axios.get(apiUrl, { headers });

        const { items } = response.data;
        const { amount } = items[0];

        //NOTE: Payload for comparing with received amount and signature
        const requestedAmount = Math.ceil(getOrder.paidAmount * 100);
        if (
          requestedAmount === amount &&
          generated_signature === razorpay_signature
        ) {
          const receipt = await this.generateReceiptNumber();

          const currentDate = new Date();
          currentDate.setHours(
            currentDate.getHours() + 5,
            currentDate.getMinutes() + 30,
          );

          //NOTE - update paymnet status in order table
          const updateOrder = await this.orderModel.findOneAndUpdate(
            { orderNumber: razorpay_order_id },
            {
              paymentStatus: PaymentStatus.PAID,
              paymentDate: currentDate,
            },
          );

          //NOTE - update paymnet status in payment table
          const payment_details = await this.paymentModel.findOneAndUpdate(
            { orderId: updateOrder._id, orderNumber: razorpay_order_id },
            {
              receiptNumber: receipt,
              paymentId: razorpay_payment_id,
              paymentStatus: PaymentStatus.PAID,
              paymentDate: currentDate,
            },
          );

          //NOTE - update fine Tracker Model
          const fine = await this.fineTrackerModel.findOneAndUpdate(
            {
              orderId: updateOrder._id,
              paymentId: payment_details._id,
              isActiveForPayment: true,
            },
            {
              $set: {
                razorpay_payment_id: razorpay_payment_id,
                paymentDate: currentDate,
                receiptNumber: receipt,
                orderType: OrderTypes.AUTOMATION,
                paymentType: OfflinePaymentType.UPI,
                paymentStatus: PaymentStatus.PAID,
                isActiveForPayment: false,
                updatedBy: userId,
                updatedByModel: SchemaReferenceType.USER,
              },
            },
          );

          if (fine.attendanceModel === SchemaReferenceType.ONLINE_ATTENDANCE) {
            await this.attendanceReportModel.updateMany(
              {
                batchId: fine.batchId,
                studentId: new mongoose.Types.ObjectId(userId),
                attendanceDate: fine.attendanceDate,
              },
              {
                $set: {
                  attendance: LiveAttendanceType.FINE_ACTIVE,
                  isFinePaid: true,
                  updatedBy: userId,
                },
              },
            );
          } else {
            //NOTE - attendance Model update
            await this.attendanceModel.findByIdAndUpdate(fine.attendanceId, {
              $set: {
                isFinePaid: true,
                isNotRusticated: true,
                isSuspended: false,
                attendance: AttendanceTypes.PRESENT,
              },
            });
          }
        }
      } catch (error) {
        throw new HttpException(PAYMENT_FAILED, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(ERROR_VERIFY_PAYMENT, HttpStatus.BAD_REQUEST);
    }

    return PAYMENT_SUCCESS;
  }

  //ANCHOR - generate mkc Order UniqueID
  private async generateOrderUniqueID(): Promise<string> {
    const prefix = 'MKC_ORD_';
    const lastOrder = await this.orderModel.findOne(
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

  //ANCHOR - generate Receipt Number
  private async generateReceiptNumber(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const lastReceipt: any = await this.paymentModel
        .findOne({
          paymentStatus: PaymentStatus.PAID,
          receiptNumber: { $ne: null },
        })
        .sort({ receiptNumber: -1 })
        .select('receiptNumber');

      if (
        lastReceipt === null ||
        lastReceipt.receiptNumber.slice(0, 2) !==
          currentYear.toString().slice(-2)
      ) {
        // If there's no last receipt or if the last receipt is not from the current year,
        // start with the new format
        return `${currentYear.toString().slice(-2)}00000001`;
      }

      // Get the numeric part of the last receipt number and increment it by 1
      const lastNumber = parseInt(lastReceipt.receiptNumber.slice(-8), 10);
      const nextReceiptNumber = lastNumber + 1;

      // Ensure that the receipt number has at least 8 digits, padding with zeros if necessary
      const receiptNumber = `${currentYear
        .toString()
        .slice(-2)}${nextReceiptNumber.toString().padStart(8, '0')}`;

      return receiptNumber;
    } catch (error) {
      throw error;
    }
  }
}
