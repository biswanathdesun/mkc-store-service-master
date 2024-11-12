import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import axios from 'axios';
import crypto from 'crypto';
import * as ExcelJS from 'exceljs';
import * as pdf from 'html-pdf';
import mongoose, { Model, Types } from 'mongoose';
import * as path from 'path';
import { ParsedQs } from 'qs';
import razorpay from 'razorpay';
import { Batch } from 'src/schema/batch.schema';
import { Book } from 'src/schema/book.schema';
import { Cart } from 'src/schema/cart.schema';
import { CoinsTransaction } from 'src/schema/coins.transaction.schema';
import { Communication } from 'src/schema/communication.schema';
import { Coupon } from 'src/schema/coupon.schema';
import { CouponTransaction } from 'src/schema/coupon.transaction.schema';
import { Event } from 'src/schema/event.schema';
import { FineTracker } from 'src/schema/fine.tracker.schema';
import { FollowUp } from 'src/schema/followup.schema';
import { AttendanceReport } from 'src/schema/live-attendance-report.schema';
import { MasterBatch } from 'src/schema/master-batch.schema';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { Order } from 'src/schema/order.schema';
import { Payment } from 'src/schema/payment.schema';
import { PaymentSummary } from 'src/schema/payment.summary.schema';
import { PreviousCourseHistory } from 'src/schema/previous-course-history.schema';
import { Setting } from 'src/schema/site-setting.schema';
import { Staff } from 'src/schema/staff.schema';
import { StudentAdmissionDetails } from 'src/schema/student-admission-date.schema';
import { StudentAttendance } from 'src/schema/student-attendance.schema';
import { StudentBatch } from 'src/schema/student-batch.schema';
import { Timeline } from 'src/schema/timeline.schema';
import { Token } from 'src/schema/token.schema';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { User } from 'src/schema/user.schema';
import { CommonService } from 'src/utills/commonService';
import {
  AdmissionStatus,
  AttendanceTypes,
  BatchDurationType,
  BookType,
  CoinTransactionReasonTypes,
  FeeTypes,
  FollowUpStatus,
  GenerateReceipt,
  LiveAttendanceType,
  ModeTypes,
  NotificationSendType,
  NotificationTypes,
  OfflineCoursePriceType,
  OfflinePaymentType,
  OrderGenerateType,
  OrderTypes,
  PaymentStatus,
  PaymentUpdateSourceType,
  ProductType,
  SchemaReferenceType,
  ShippingStatusType,
  TransactionStatus,
  UserStatusTypes,
  UserType,
} from 'src/utills/enum';
import {
  BATCH_FULL_ERROR,
  COUPON_APPLIED_FAILED,
  COURSE_CHANGED,
  COURSE_TYPE,
  FAILED_TO_GENERATE_ROLL_NUMBER,
  INSTALLMENT_CLOSED_ERROR,
  INVALID_ID,
  MISCELLANEOUS_PAYMENT_SUCCESS,
  NOT_HAVE_AUTHORIZATION,
  PAYMENT_CREATED,
  PAYMENT_EDIT_ERROR,
  PAYMENT_FAILED,
  PAYMENT_SUCCESS,
  PURCHASE_COURSE_UPDATED,
  RECORD_ALREADY_PAID,
  RECORD_NOT_FOUND,
  SAME_COURSE,
  STUDENT_STATUS_UPDATE,
  UPDATE_DATA,
  USER_ALREADY_STUDENT,
  USER_NOT_FOUND,
  WAREHOUSE_IN_PRODUCT_STOCK,
  WAREHOUSE_IS_NOT_FOUND,
} from 'src/utills/messages';
import { PAYMENT_RECEIPT } from 'src/utills/s3BucketFolder';
import { SmsService } from 'src/utills/smsService';
import {
  ORDER_CONFIRMATION_MESSAGE,
  PRE_BOOK_INSTANT_H_MESSAGE,
} from 'src/utills/templateMessages';
import { ConvertStudentDto } from './dto/convert-student.dto';
import { CreateCourseChangeDto } from './dto/create-course-change.dto';
import { OfflineCourseOrderDto } from './dto/create-offline-course-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OfflinePaymentDto } from './dto/create-payment.dto';
import { MiscellaneousPaymentDto } from './dto/miscellaneous-payment.dto';
import { CoursePaymentHistoryDto } from './dto/offline-payment-history.dto';
import { PreBookStudentCourseChangeDto } from './dto/pre-book-course-change.dto';
import { SalesPaymentDto } from './dto/sales-order.dto';
import { GetStudentOfflineCourseDto } from './dto/student-offline-course.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdatePaymentDetailsDto } from './dto/update-payment.dto';
import { UpdateReceiptNumberDto } from './dto/updateReceiptNumber.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { InventoryItemTransaction } from 'src/schema/inventory-item-transaction.schema';
import { Warehouse } from 'src/schema/warehouse.schema';
import { ManualOrderReportDto } from './dto/manual-order-report.dto';
@Injectable()
export class PaymentService {
  private rzp: razorpay; //TODO: Define the Razorpay instance property
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(AttendanceReport.name)
    private attendanceReportModel: Model<AttendanceReport>,
    @InjectModel(FollowUp.name) private followUpModel: Model<FollowUp>,
    @InjectModel(FineTracker.name) private fineTrackerModel: Model<FineTracker>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Communication.name)
    private communicationModel: Model<Communication>,
    @InjectModel(PaymentSummary.name)
    private paymentSummaryModel: Model<PaymentSummary>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(StudentBatch.name)
    private studentBatchModel: Model<StudentBatch>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(CouponTransaction.name)
    private couponTransactionModel: Model<CouponTransaction>,
    @InjectModel(CoinsTransaction.name)
    private coinsTransactionModel: Model<CoinsTransaction>,
    @InjectModel(OfflineCoursePayment.name)
    private offlineCoursePaymentModel: Model<OfflineCoursePayment>,
    @InjectModel(Setting.name)
    private SettingModel: Model<Setting>,
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(StudentAdmissionDetails.name)
    private admissionDetailsModel: Model<StudentAdmissionDetails>,
    @InjectModel(PreviousCourseHistory.name)
    private previousCourseHistoryModel: Model<PreviousCourseHistory>,
    @InjectModel(Timeline.name)
    private timelineModel: Model<Timeline>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(MasterBatch.name) private masterBatchModel: Model<MasterBatch>,
    @InjectModel(Staff.name) private staffNewModel: Model<Staff>,
    @InjectModel(Book.name) private bookModal: Model<Book>,
    @InjectModel(StudentAttendance.name)
    private readonly studentAttdnceModel: Model<StudentAttendance>,
    private readonly commonService: CommonService,
    private readonly smsService: SmsService,
    @InjectModel(InventoryItemTransaction.name)
    private itemTransactionRepository: Model<InventoryItemTransaction>,
    @InjectModel(Warehouse.name) private warehouseRepository: Model<Warehouse>,
  ) {
    this.rzp = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  //SECTION - create order for products
  async createOrder(
    payload: CreateOrderDto,
    userId: string, //TODO - this userId will be the parent id when parent doing paymnet. that time we will get studentId from payload
  ): Promise<{ data: any }> {
    try {
      //TODO - studentId will come when parent doing paymnet for student
      const { addressId, eventId, studentId } = payload;

      //NOTE - check the requested user is parent or student
      const check_user_type = await this.userModel
        .findById(userId)
        .select('type');

      let totalAmount = 0;

      if (!eventId) {
        //NOTE - get paymnet details
        const amount = await this.paymentSummaryModel.findOne({
          userId: new mongoose.Types.ObjectId(userId),
        });

        totalAmount = amount?.amountToBePaid;
      } else {
        const event: any = await this.eventModel
          .findById(eventId)
          .populate('priceId', 'totalPrice')
          .select('-priceId')
          .lean();

        totalAmount = event?.priceId?.totalPrice;
      }

      if (!check_user_type)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      if (totalAmount === 0) {
        const data = await this.createOrderForZeroPayment(
          totalAmount,
          addressId,
          check_user_type.type === UserType.PARENT ? studentId : userId, //TODO - if parent purchase send studentId else userId
          check_user_type.type === UserType.PARENT ? check_user_type._id : null, //TODO - if parent purchase send parentId
          check_user_type.type, //TODO: send user type
        );

        return { data };
      } else {
        //NOTE - if order created for event
        if (eventId) {
          const createOrder = await this.createOrderForEvent(
            totalAmount,
            eventId,
            check_user_type.type === UserType.PARENT ? studentId : userId,
            check_user_type.type === UserType.PARENT
              ? check_user_type._id
              : null,
            check_user_type.type,
          );

          return { data: createOrder };
          ///NOTE - if order created for product
        } else {
          //NOTE - get cart details based on the userId
          const cart_details: any = await this.cartModel
            .find({
              userId:
                check_user_type.type === UserType.PARENT
                  ? check_user_type._id
                  : new mongoose.Types.ObjectId(userId),
            })
            .populate([
              {
                path: 'onlineCourseId',
                select: 'coins',
                populate: [
                  {
                    path: 'priceId',
                    select:
                      'totalPrice mrpPrice discountedPrice discountPercentage',
                  },
                ],
              },
              {
                path: 'bookId',
                select: 'coins',
              },
              {
                path: 'testId',
                select: 'coins',
              },
            ]);

          //NOTE - get paymnet summary details based on the userId
          const payment_summary: any = await this.paymentSummaryModel.findOne({
            userId:
              check_user_type.type === UserType.PARENT
                ? check_user_type._id
                : new Types.ObjectId(userId),
          });

          const checkCouponId = cart_details[0]?.couponId;

          if (checkCouponId !== null) {
            //NOTE - get currentdate to check expiry date is valide or not
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            //NOTE - push productType
            const productType = [
              ...new Set(
                cart_details.map(
                  (item: { productType: any }) => item.productType,
                ),
              ),
            ];

            const check_coupon = await this.couponModel.findOne({
              _id: checkCouponId,
              validFor: { $all: productType },
              minimumOrderPrice: { $lte: payment_summary?.totalAmount },
              expiryDate: { $gte: currentDate },
              availableCoupon: { $ne: 0 },
            });

            if (!check_coupon) {
              throw new HttpException(
                COUPON_APPLIED_FAILED,
                HttpStatus.BAD_REQUEST,
              );
            }
          }

          //NOTE - payload for create order in razorpay
          const orderDetails = {
            amount: Math.ceil(totalAmount * 100),
            currency: process.env.CURRENCY,
          };

          const order: any = await this.rzp.orders.create(orderDetails);

          //NOTE - create order in order table and payment table
          if (order) {
            //NOTE - course details
            const courseDetail = cart_details
              .filter(
                (item: any) =>
                  item.productType === ProductType.ONLINE_COURSE ||
                  item.productType === ProductType.OFFLINE_COURSE,
              )
              .map((item: any) => {
                return {
                  onlineCourseId: item.onlineCourseId._id,
                  type:
                    item.productType === ProductType.ONLINE_COURSE
                      ? ModeTypes.ONLINE
                      : ModeTypes.OFFLINE,
                  quantity: item.quantity,
                  languageId: item.languageId,
                  productAmount: item.onlineCourseId.priceId?.totalPrice,
                  totalPrice: item.totalPrice,
                  gst: item.gst,
                  cgst: item.gst / 2,
                  sgst: item.gst / 2,
                  gstAmount: item.gstAmount,
                  cgstAmount: item.gstAmount / 2,
                  sgstAmount: item.gstAmount / 2,
                  discountPercentage: item.discountPercentage,
                  discountedPrice: item.discountedPrice,
                  shippingCharge: item.shippingCharge,
                  coins: item.onlineCourseId?.coins || 0,
                  paymnetStatus:
                    item.payment_type === OfflineCoursePriceType.PRE_BOOK
                      ? OfflineCoursePriceType.PRE_BOOK
                      : OfflineCoursePriceType.DISCOUNT_PRICE,
                };
              });

            //NOTE - book details
            const bookDetail = cart_details
              .filter((item: any) => item.productType === ProductType.BOOK)
              .map((item: any) => ({
                bookId: item.bookId._id,
                quantity: item.quantity,
                languageId: item.languageId,
                bookType: item.bookType,
                totalPrice: item.totalPrice,
                gst: item.gst,
                cgst: item.gst / 2,
                sgst: item.gst / 2,
                gstAmount: item.gstAmount,
                cgstAmount: item.gstAmount / 2,
                sgstAmount: item.gstAmount / 2,
                discountPercentage: item.discountPercentage,
                discountedPrice: item.discountedPrice,
                shippingCharge: item.shippingCharge,
                coins: item.bookId?.coins || 0,
              }));

            //NOTE - test details
            const testDetail = cart_details
              .filter(
                (item: any) => item.productType === ProductType.TEST_SERIES,
              )
              .map((item: any) => ({
                testId: item.testId._id,
                quantity: item.quantity,
                languageId: item.languageId,
                totalPrice: item.totalPrice,
                gst: item.gst,
                cgst: item.gst / 2,
                sgst: item.gst / 2,
                gstAmount: item.gstAmount,
                cgstAmount: item.gstAmount / 2,
                sgstAmount: item.gstAmount / 2,
                discountPercentage: item.discountPercentage,
                discountedPrice: item.discountedPrice,
                shippingCharge: item.shippingCharge,
                coins: item.testId?.coins || 0,
              }));

            //NOTE - payload for order
            const orderPayload = {
              orderNumber: order.id,
              userId:
                check_user_type.type === UserType.PARENT ? studentId : userId,
              parentId:
                check_user_type.type === UserType.PARENT
                  ? check_user_type._id
                  : null,
              addressId,
              totalAmount: payment_summary.totalAmount,
              onlineCourseDetails: courseDetail,
              bookDetails: bookDetail,
              testSeriesDetails: testDetail,
              couponId: cart_details[0].couponId,
              couponAmount: payment_summary.discountedPrice,
              totalPrice: payment_summary.totalPrice,
              gst: payment_summary.gst,
              cgst: payment_summary.gst / 2,
              sgst: payment_summary.gst / 2,
              gstAmount: payment_summary.gstAmount,
              cgstAmount: payment_summary.gstAmount / 2,
              sgstAmount: payment_summary.gstAmount / 2,
              shippingCharge: payment_summary.shippingCharge,
              paidAmount: payment_summary.amountToBePaid,
              walletAmount: payment_summary.walletAmount,
              purchaseBy: check_user_type.type,
              createdBy: userId,
            };
            //NOTE - create order in db
            const order_details = new this.orderModel(orderPayload);
            order_details.mkcOrderId = await this.generateOrderUniqueID(
              OrderGenerateType.PRODUCT,
            );

            await order_details.save();

            //NOTE: Update the parentOrderId
            const parentOrderId = order_details._id;

            await this.orderModel.findOneAndUpdate(
              { _id: parentOrderId },
              { parentOrderId: parentOrderId },
            );

            //NOTE - enter payment details in payment table
            await this.paymentModel.create({
              orderId: order_details._id,
              orderNumber: order.id,
              userId:
                check_user_type.type === UserType.PARENT ? studentId : userId,
              parentId:
                check_user_type.type === UserType.PARENT
                  ? check_user_type._id
                  : null,
              totalAmount,
              totalAmtReceived: totalAmount,
              productAmount: payment_summary.totalAmount,
              purchaseBy: check_user_type.type,
              createdBy: userId,
            });
          }
          return { data: order };
        }
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - verify Payment for web and mobile
  async verifyPayment(
    payload: VerifyPaymentDto,
    buyByUserId: string, //TODO - this userId will be the parent id when parent doing payment
  ): Promise<any> {
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

        //NOTE: Check if the received amount matches the requested amount and if the signatures match
        if (
          requestedAmount === amount &&
          generated_signature === razorpay_signature
        ) {
          const receipt = await this.generateReceiptNumber();

          //NOTE - update paymnet status in order table
          const updateOrder = await this.orderModel.findOneAndUpdate(
            { orderNumber: razorpay_order_id },
            {
              $set: {
                'bookDetails.$[elem].shippingStatus':
                  ShippingStatusType.ORDERED,
              },
              paymentStatus: PaymentStatus.PAID,
              paymentDate: new Date(),
            },
            {
              new: true,
              upsert: true,
              arrayFilters: [{ 'elem.bookType': BookType.PAPER_BACK }],
            },
          );

          //NOTE - update paymnet status in payment table
          const payment_details = await this.paymentModel.findOneAndUpdate(
            { orderId: updateOrder._id, orderNumber: razorpay_order_id },
            {
              receiptNumber: receipt,
              paymentId: razorpay_payment_id,
              paymentStatus: PaymentStatus.PAID,
              paymentDate: new Date(),
            },
            { new: true, runValidators: true, upsert: true },
          );

          //TODO - get the studentId from payment or order table , because parent also can buy the product for student
          const studentId = payment_details.userId;

          if (
            Array.isArray(updateOrder.eventDetails) &&
            updateOrder.eventDetails.length === 0
          ) {
            //NOTE: Find all cart items associated with the userId
            const cartItems: any = await this.cartModel
              .find({ userId: new Types.ObjectId(buyByUserId) })
              .populate([
                {
                  path: 'onlineCourseId',
                  select: 'coins',
                  populate: { path: 'priceId', select: 'totalPrice' },
                },
                { path: 'bookId', select: 'coins' },
                { path: 'testId', select: 'coins' },
              ]);

            //NOTE: Create a map to map product types to flags
            const productTypeToFlag = {
              [ProductType.BOOK]: 'isBookSold',
              [ProductType.TEST_SERIES]: 'isTestSeriesSold',
              [ProductType.ONLINE_COURSE]: 'isOnlineCourseSold',
              [ProductType.OFFLINE_COURSE]: 'isOfflineCourseSold',
            };

            //NOTE: Initialize flags
            const flags = {
              isBookSold: false,
              isTestSeriesSold: false,
              isOnlineCourseSold: false,
              isOfflineCourseSold: false,
            };

            //NOTE: Iterate through cart items and update flags
            for (const data of cartItems) {
              const flagName = productTypeToFlag[data.productType];
              if (flagName) {
                flags[flagName] = true;
              }
            }

            // NOTE - Check if produck has a paperback book, if yes, then generate an invoice number and update the payment
            for (const data of cartItems) {
              if (
                data.productType == ProductType.BOOK &&
                data.bookType == BookType.PAPER_BACK
              ) {
                const invoiceNo = this.commonService.genereatInvoiceNumber();
                await this.paymentModel.findOneAndUpdate(
                  { orderId: updateOrder._id },
                  { $set: { invoiceNumber: invoiceNo } },
                );
                break;
              }
            }

            //NOTE - check if coins used or not
            let coinsUsed = 0;

            //NOTE: Fetch the current user data including the coins field
            const user = await this.userModel.findById(studentId);

            if (updateOrder.walletAmount > 0) {
              coinsUsed = await this.calculateCoinsFromRupees(
                updateOrder.walletAmount,
              );

              //NOTE - if coins used then create a transaction
              await this.coinsTransactionModel.create({
                userId: user._id,
                orderId: updateOrder._id,
                debit: coinsUsed,
                transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
              });
            }

            //NOTE: Calculate the new coins value by subtracting coinsUsed from the existing coins
            const newCoins = user.coins - coinsUsed;

            //NOTE - get user status
            const userUpdateStatus = await this.getStudentStatusBasedOnCart(
              cartItems,
              studentId.toString(),
            );

            //NOTE Define an object to hold the update data for the user table
            const userUpdateData: any = {
              isPurchased: true,
              isRegistered: true,
              registrationDate: new Date(),
              studentStatus: userUpdateStatus,
              type:
                userUpdateStatus === UserStatusTypes.ADMITTED
                  ? UserType.STUDENT
                  : UserType.ENQUIRY,
              ...flags,
              coins: newCoins, // Update the coins field with the new value
            };

            //NOTE: Update the user table
            const update_user = await this.userModel.findOneAndUpdate(
              { _id: studentId },
              userUpdateData,
              { new: true, runValidators: true, upsert: true },
            );

            let couponId: any;
            //NOTE :Update user product deatils
            for (const data of cartItems) {
              const enrollment = await this.generateEnrollmentNumber();

              const userProductDetails: any =
                await this.userProductDetailsModel.create({
                  studentId,
                  productType: data?.productType,
                  bookId:
                    data?.productType === ProductType.BOOK
                      ? data?.bookId
                      : null,
                  onlineCourseId:
                    data?.productType === ProductType.ONLINE_COURSE ||
                    data?.productType === ProductType.OFFLINE_COURSE
                      ? data?.onlineCourseId
                      : null,
                  testId:
                    data?.productType === ProductType.TEST_SERIES
                      ? data?.testId
                      : null,
                  bookType:
                    data?.productType === ProductType.BOOK
                      ? data?.bookType
                      : null,
                  orderId: updateOrder?._id,
                  languageId: data?.languageId,
                  quantity: data?.quantity,
                  haveAccess: true,
                  createdBy: studentId,
                });

              //NOTE - get course details
              const course_details = await this.onlineCourseModel.findById(
                data.onlineCourseId,
              );

              //NOTE - assign batch to student if online course buy
              if (data.productType === ProductType.ONLINE_COURSE) {
                const batchDetails = await this.batchModel.findById(
                  course_details.batchId,
                );

                const generateRollNumber = await this.generateStudentRollNumber(
                  data.onlineCourseId._id,
                  course_details.batchId.toString(),
                );
                const { masterRollNumber, masterBatchId } =
                  await this.generateMasterRollNumber(
                    course_details.batchId.toString(),
                  );
                await this.studentBatchModel.create({
                  studentId: new mongoose.Types.ObjectId(studentId),
                  batchId: course_details.batchId,
                  courseId: data.onlineCourseId._id,
                  rollNumber: generateRollNumber,
                  newEnrollmentNumber: enrollment,
                  masterRollNumber: masterRollNumber,
                  masterBatchId: masterBatchId,
                  orderId: updateOrder._id,
                  createdBy: studentId,
                });

                //NOTE -  Get the current date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = today;

                let validUptoDate: Date;
                if (
                  batchDetails?.batchDurationType === BatchDurationType.DAYS
                ) {
                  const currentDate = new Date();
                  //NOTE -  Add duration in  the current date to calculate Valid Upto date
                  currentDate.setDate(
                    currentDate.getDate() + batchDetails?.duration,
                  );

                  // NOTE - Set time to end of the day cause course is valid untill the end of the day
                  currentDate.setHours(23, 59, 59, 999);
                  validUptoDate = currentDate;
                } else {
                  validUptoDate = batchDetails?.endDate;
                }

                //NOTE - update in user Product Details
                await this.userProductDetailsModel.findByIdAndUpdate(
                  userProductDetails._id,
                  {
                    $set: {
                      startDate,
                      batchId: batchDetails._id,
                      validUpto: validUptoDate,
                    },
                  },
                );

                await this.offlineCoursePaymentModel.create({
                  userId: studentId,
                  parentId: buyByUserId,
                  orderId: updateOrder?._id,
                  parentOrderId: updateOrder?._id,
                  courseId: data?.onlineCourseId,
                  productAmount: data.onlineCourseId?.priceId?.totalPrice,
                  totalPrice: data?.totalPrice,
                  gst: data?.gst,
                  cgst: data?.gst / 2,
                  sgst: data?.gst / 2,
                  gstAmount: data?.gstAmount,
                  cgstAmount: data?.gstAmount / 2,
                  sgstAmount: data?.gstAmount / 2,
                  discountPercentage: data?.discountPercentage,
                  discountedPrice: data?.discountedPrice,
                  totalAmtReceived: updateOrder?.paidAmount,
                  priceType:
                    data?.payment_type === null
                      ? OfflineCoursePriceType.BASE_PRICE
                      : data.payment_type,
                  nextPaymentDate: data?.nextPaymentDate,
                  receiptNumber: receipt,
                  transactionStatus: TransactionStatus.FULL_PAYMENT,
                  purchaseBy: payment_details.purchaseBy,
                  productType: data.productType,
                  createdBy: studentId,
                });
              }

              //NOTE - assign couponId
              couponId = data.couponId;

              //NOTE - update the coins transaction if coins is not 0
              if (
                ((data.productType === ProductType.ONLINE_COURSE ||
                  data.productType === ProductType.OFFLINE_COURSE) &&
                  data.onlineCourseId.coins !== 0) ||
                (data.productType === ProductType.BOOK &&
                  data.bookId.coins !== 0) ||
                (data.productType === ProductType.TEST_SERIES &&
                  data.testId.coins !== 0)
              ) {
                //NOTE: Update coupon transaction
                await this.coinsTransactionModel.create({
                  userId: studentId,
                  orderId: updateOrder._id,
                  credit:
                    data.productType === ProductType.ONLINE_COURSE ||
                    data.productType === ProductType.OFFLINE_COURSE
                      ? data.onlineCourseId.coins
                      : data.productType === ProductType.BOOK
                      ? data.bookId.coins
                      : data.testId.coins,
                  transactionReason:
                    CoinTransactionReasonTypes.PRODUCT_PURCHASE,
                });
                //NOTE: Update user coins
                await this.userModel.findOneAndUpdate(
                  { _id: studentId },
                  {
                    coins:
                      data.productType === ProductType.ONLINE_COURSE ||
                      data.productType === ProductType.OFFLINE_COURSE
                        ? update_user.coins + data.onlineCourseId.coins
                        : data.productType === ProductType.BOOK
                        ? update_user.coins + data.bookId.coins
                        : update_user.coins + data.testId.coins,
                  },
                  { new: true, runValidators: true, upsert: true },
                );
              }

              //NOTE - if offline course payment
              if (data.productType === ProductType.OFFLINE_COURSE) {
                //NOTE - calculate the outstanding Amount
                const calculateOutstandingAmount =
                  data.payment_type === OfflineCoursePriceType.PRE_BOOK
                    ? data.onlineCourseId.priceId?.totalPrice -
                      data.prebook_amount
                    : 0;

                //NOTE - generate batch without  batchId
                await this.studentBatchModel.create({
                  studentId: new mongoose.Types.ObjectId(studentId),
                  courseId: data.onlineCourseId,
                  batchId: null,
                  rollNumber: null,
                  newEnrollmentNumber: enrollment,
                  orderId: updateOrder._id,
                  createdBy: studentId,
                });

                await this.offlineCoursePaymentModel.create({
                  userId: studentId,
                  parentId: buyByUserId,
                  orderId: updateOrder?._id,
                  parentOrderId: updateOrder?._id,
                  courseId: data?.onlineCourseId,
                  productAmount: data.onlineCourseId?.priceId?.totalPrice,
                  totalPrice: data?.totalPrice,
                  gst: data?.gst,
                  cgst: data?.gst / 2,
                  sgst: data?.gst / 2,
                  gstAmount: data?.gstAmount,
                  cgstAmount: data?.gstAmount / 2,
                  sgstAmount: data?.gstAmount / 2,
                  discountPercentage: data?.discountPercentage,
                  discountedPrice: data?.discountedPrice,
                  outstandingAmount: calculateOutstandingAmount,
                  totalAmtReceived: updateOrder?.paidAmount,
                  priceType: data?.payment_type,
                  nextPaymentDate: data?.nextPaymentDate,
                  receiptNumber: receipt,
                  transactionStatus:
                    data.payment_type === OfflineCoursePriceType.PRE_BOOK
                      ? TransactionStatus.INSTALLMENT
                      : TransactionStatus.FULL_PAYMENT,
                  purchaseBy: payment_details.purchaseBy,
                  productType: data.productType,
                  createdBy: studentId,
                });

                //NOTE - update the outstandingAmount amount
                await this.paymentModel.findOneAndUpdate(
                  { orderId: updateOrder._id, orderNumber: razorpay_order_id },
                  {
                    outstandingAmount:
                      calculateOutstandingAmount +
                      payment_details.outstandingAmount,
                  },
                  { new: true, runValidators: true, upsert: true },
                );
              }
            }

            if (couponId !== null && couponId !== undefined) {
              const check_coupon = await this.couponModel.findById(couponId);
              //NOTE - update the coupon as applied
              const update_coupon = await this.couponModel.findOneAndUpdate(
                { _id: check_coupon._id },
                { appliedCoupon: check_coupon.appliedCoupon + 1 },
                { new: true, runValidators: true, upsert: true },
              );

              //NOTE -update availableCoupon
              await this.couponModel.findOneAndUpdate(
                { _id: check_coupon._id },
                {
                  availableCoupon:
                    update_coupon.numberOfIssued - update_coupon.appliedCoupon,
                },
                { new: true, runValidators: true, upsert: true },
              );

              //NOTE: update coupon transaction table
              await this.couponTransactionModel.create({
                userId: studentId,
                couponId: check_coupon._id,
                orderId: updateOrder._id,
                createdBy: studentId,
              });
            }

            //NOTE: Remove all data from cart based on studentId
            await this.cartModel.deleteMany({
              userId:
                payment_details.parentId !== null
                  ? payment_details.parentId
                  : new mongoose.Types.ObjectId(payment_details.userId),
            });

            //NOTE: Delete paymnet details
            await this.paymentSummaryModel.findOneAndDelete({
              userId:
                payment_details.parentId !== null
                  ? payment_details.parentId
                  : new mongoose.Types.ObjectId(payment_details.userId),
            });
          }

          //NOTE - send order confirmation
          const orderData: any = await this.orderModel
            .findById(updateOrder._id)
            .populate([
              { path: 'userId', select: 'phone' },
              { path: 'parentId', select: 'phone' },
            ])
            .select('paidAmount mkcOrderId');

          const phoneNumbers = [
            {
              phone: orderData.userId.phone,
              sendTo: NotificationSendType.USER,
            },
          ];

          if (orderData?.parentId?.phone) {
            phoneNumbers.push({
              phone: orderData.parentId.phone,
              sendTo: NotificationSendType.PARENT,
            });
          }

          const createdAt = new Date();
          createdAt.setHours(
            createdAt.getHours() + 5,
            createdAt.getMinutes() + 30,
          );

          // NOTE - send message of order confirmation
          for (const { phone, sendTo } of phoneNumbers) {
            const variables = {
              amount: orderData.paidAmount,
              order: orderData.mkcOrderId,
              phone: '9696330033',
            };

            const message = await this.smsService.replaceMessagesContent({
              message: ORDER_CONFIRMATION_MESSAGE,
              variables,
            });

            //NOTE - entry on communication model
            await this.communicationModel.create({
              userId: new mongoose.Types.ObjectId(orderData?.userId._id),
              userModel: SchemaReferenceType.USER,
              mobile: phone,
              notificationType: NotificationTypes.SMS,
              sendTo,
              message,
              createdAt,
            });

            await this.smsService.messageOnOrderConfirmation({
              amount: orderData.paidAmount,
              orderId: orderData.mkcOrderId,
              number: phone,
              phone: '9696330033',
            });
          }

          //NOTE - check user details
          const user = await this.userModel.findById(studentId);

          //NOTE -check in token table user details
          const token = await this.tokenModel.findOne({ userId: studentId });

          if (
            user.type === UserType.STUDENT &&
            token.userType === UserType.ENQUIRY
          ) {
            //NOTE: check token , if exist then update the token
            await this.tokenModel.findOneAndUpdate(
              { userId: studentId },
              { userType: UserType.STUDENT },
              { new: true, runValidators: true, upsert: true },
            );
          }

          return PAYMENT_SUCCESS;
        } else {
          //NOTE - update paymnet status in order table
          const updateOrder = await this.orderModel.findOneAndUpdate(
            {
              orderNumber: razorpay_order_id,
            },
            { paymentStatus: PaymentStatus.FAILED, paymentDate: new Date() },
            { new: true, runValidators: true, upsert: true },
          );

          //NOTE - update paymnet status in payment table
          await this.paymentModel.findOneAndUpdate(
            { orderId: updateOrder._id, orderNumber: razorpay_order_id },
            {
              paymentId: razorpay_payment_id,
              paymentStatus: PaymentStatus.FAILED,
              paymentDate: new Date(),
            },
            { new: true, runValidators: true, upsert: true },
          );

          //NOTE - remove all data from cart based on studentId
          await this.cartModel.deleteMany({ userId: buyByUserId });

          //NOTE: Delete paymnet details
          await this.paymentSummaryModel.findOneAndDelete({
            userId: new mongoose.Types.ObjectId(updateOrder.userId),
          });

          return PAYMENT_FAILED;
        }
      } catch (error) {
        return PAYMENT_FAILED;
      }
    } catch (error) {
      throw new InternalServerErrorException('Error verifying payment');
    }
  }

  //SECTION - get all payment
  async getAllPayment(
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
                  await this.userModel
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
                  await this.orderModel
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

    //NOTE - get payment count
    const count = await this.paymentModel.countDocuments({
      ...dateFilter,
      ...filters,
      ...paymentFilter,
    });

    //NOTE - find all payment data
    const paymentDetails: any[] = await this.paymentModel
      .find({ ...dateFilter, ...filters, ...paymentFilter })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'parentId', select: 'name' },
        { path: 'orderId', select: 'mkcOrderId orderType' },
        { path: 'courseId', select: 'title type' },
        {
          path: 'createdBy',
          select: 'name',
          options: { model: 'User' },
        },
      ])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-userId -parentId -orderId -courseId')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      paymentDetails.map(async (item) => {
        return {
          _id: item._id,
          orderId: item.orderId?._id,
          mkcOrderId: item.orderId?.mkcOrderId,
          orderType: item.orderId?.orderType ?? OrderTypes.MANUAL,
          user: item.userId?.name,
          phone: item.userId?.phone,
          parentName: item.parentId?.name,
          paymentId: item?.paymentId || null,
          course: item.courseId?.title,
          courseType: item.courseId?.type,
          productAmount: item?.productAmount,
          totalAmtReceived: item?.totalAmtReceived,
          totalAmount: item?.totalAmount,
          outstandingAmount: item.outstandingAmount || 0,
          paymentType: item?.paymentType,
          paymentDate: item.paymentDate,
          paymentStatus: item.paymentStatus,
          chequeOrTransNo: item.chequeOrTransNo,
          nextPaymentDate: item.nextPaymentDate,
          feeType: item.feeType ?? FeeTypes.PRODUCT_PURCHASE,
          purchaseBy: item?.purchaseBy,
          createdBy:
            (item.orderId?.orderType === OrderTypes.AUTOMATION &&
              item.userId?.name) ||
            item?.createdBy[0]?.name ||
            null,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - offline Payment flow for admin panel
  async offlinePayment(
    payload: OfflinePaymentDto,
    staffId: string,
  ): Promise<any> {
    const {
      courseId,
      userId,
      priceType,
      isPreBook,
      amount,
      chequeOrTransNo,
      nextPaymentDate,
      outstandingAmount,
      paymentType,
      batchId,
      categoryId,
      coursesId,
      name,
      gender,
      state,
      city,
      address,
      pincode,
      parentName,
      parentNumber,
      isAdmitted,
    } = payload;
    //NOTE - staff check
    const staff = await this.staffNewModel
      .findById(staffId)
      .populate([{ path: 'roleId', select: 'role' }]);

    //NOTE - get user details
    const user_details = await this.userModel.findById(userId);

    if (!isAdmitted) {
      if (user_details.type === UserType.STUDENT) {
        throw new HttpException(USER_ALREADY_STUDENT, HttpStatus.BAD_REQUEST);
      }
    }

    // NOTE - firstly check if the student has beem assigned to any secondary counsellor or not  and  if created by user is primary counsellor or not
    const isSecondaryCousellorNotAssigned = await this.userModel.findOne({
      _id: user_details?._id,
      secondaryCounsellorId: { $eq: null },
      primaryCounsellorId: { $ne: new mongoose.Types.ObjectId(staffId) },
    });
    // NOTE -  secondary counsellor is not assigned then only
    if (isSecondaryCousellorNotAssigned) {
      // NOTE -  if staff is not superadmin then we will assign to student as secondary counsellor
      if (!/superadmin/i.test(staff?.roleId?.role)) {
        await this.userModel.findByIdAndUpdate(
          user_details?._id,
          { $set: { secondaryCounsellorId: staffId } },
          { new: true },
        );
      }
    }
    // NOTE - assigned secondary counsellor to the student Logic End

    //NOTE - get order details
    const order = await this.orderModel
      .findOne({
        userId,
        'onlineCourseDetails.onlineCourseId': courseId,
        paymentStatus: PaymentStatus.PAID,
      })
      .populate({
        path: 'onlineCourseDetails.onlineCourseId',
        select: '_id type',
      })
      .sort({ createdAt: -1 });

    //NOTE - check price deatils based on the courseId
    const course_details = await this.onlineCourseModel
      .findById(courseId)
      .populate([
        {
          path: 'priceId',
          select: 'mrpPrice discountedPrice totalPrice discountPercentage gst',
        },
      ]);

    //NOTE - Unauthorized to give online course discount.
    if (
      !staff.roleId?.role.match(/superAdmin/i) &&
      course_details?.priceId?.totalPrice < amount
    ) {
      throw new HttpException(NOT_HAVE_AUTHORIZATION, HttpStatus.BAD_REQUEST);
    }

    let totalPrice: number;
    let gstAmount: number;
    let paidAmount: number;
    let totalAmount: number;
    let basePrice: number;

    //NOTE - if no order (new payment)
    if (!order) {
      if (course_details?.type === ModeTypes.OFFLINE) {
        if (priceType === OfflineCoursePriceType.DISCOUNT_PRICE && !isPreBook) {
          totalPrice = course_details.priceId?.totalPrice;
          basePrice = Math.ceil(
            totalPrice / (1 + course_details.priceId?.gst / 100),
          );
          gstAmount = Math.ceil(totalPrice - basePrice);
          totalAmount = course_details.priceId.totalPrice;
          paidAmount = course_details.priceId.totalPrice;
        } else if (
          priceType === OfflineCoursePriceType.BASE_PRICE &&
          !isPreBook
        ) {
          basePrice = Math.ceil(
            course_details.priceId.mrpPrice /
              (1 + course_details.priceId?.gst / 100),
          );
          totalPrice = basePrice;
          gstAmount = Math.ceil(course_details.priceId.mrpPrice - basePrice);
          totalAmount = amount;
          paidAmount = amount;
        } else if (
          (priceType === OfflineCoursePriceType.DISCOUNT_PRICE ||
            priceType === OfflineCoursePriceType.BASE_PRICE) &&
          isPreBook
        ) {
          basePrice = Math.ceil(
            amount / (1 + course_details.priceId?.gst / 100),
          );
          totalPrice = amount;
          gstAmount = Math.ceil(amount - basePrice);
          totalAmount = amount;
          paidAmount = amount;
        }
      } else {
        if (isPreBook) {
          basePrice = Math.ceil(
            amount / (1 + course_details.priceId?.gst / 100),
          );
          totalPrice = amount;
          gstAmount = Math.ceil(amount - basePrice);
          totalAmount = amount;
          paidAmount = amount;
        } else {
          totalPrice = course_details.priceId?.totalPrice;

          basePrice = course_details.priceId?.discountedPrice;

          gstAmount = totalPrice - basePrice;
          totalAmount = course_details.priceId?.totalPrice;
          paidAmount = course_details.priceId?.totalPrice;
        }
      }
      //NOTE - create order payload
      const orderPayload = {
        userId,
        paymentStatus: PaymentStatus.PAID,
        onlineCourseDetails: [
          {
            onlineCourseId: courseId,
            type: course_details?.type,
            languageId: course_details?.languageId,
            quantity: 1,
            productAmount:
              priceType === OfflineCoursePriceType.DISCOUNT_PRICE
                ? course_details.priceId?.totalPrice
                : course_details.priceId?.mrpPrice,
            totalPrice: amount,
            gst: course_details.priceId?.gst,
            cgst: course_details.priceId?.gst / 2,
            sgst: course_details.priceId?.gst / 2,
            gstAmount,
            cgstAmount: gstAmount / 2,
            sgstAmount: gstAmount / 2,
            discountPercentage: course_details.priceId?.discountPercentage,
            discountedPrice: basePrice,
            coins: course_details?.coins,
            paymnetStatus: priceType,
          },
        ],
        totalPrice,
        gst: course_details.priceId?.gst,
        cgst: course_details.priceId?.gst / 2,
        sgst: course_details.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        shippingCharge: 0,
        totalAmount,
        paidAmount,
        priceType,
        orderType: OrderTypes.MANUAL,
        createdBy: staffId,
      };

      const order_details = new this.orderModel(orderPayload);
      order_details.mkcOrderId = await this.generateOrderUniqueID(
        OrderGenerateType.PRODUCT,
      );
      await order_details.save();

      //NOTE - generate recipt and enrollment
      const receipt = await this.generateReceiptNumber();
      const enrollment = await this.generateEnrollmentNumber();

      const parentOrderId = order_details?._id;

      await this.orderModel.findOneAndUpdate(
        { _id: order_details?._id },
        { parentOrderId: parentOrderId },
      );

      //NOTE - payment table
      const payment = await this.paymentModel.create({
        orderId: order_details?._id,
        courseId,
        userId,
        productAmount:
          priceType === OfflineCoursePriceType.DISCOUNT_PRICE
            ? course_details.priceId?.totalPrice
            : course_details.priceId?.mrpPrice,
        totalAmount,
        totalAmtReceived: totalAmount,
        outstandingAmount,
        chequeOrTransNo,
        nextPaymentDate,
        paymentStatus: PaymentStatus.PAID,
        paymentType,
        receiptNumber: receipt,
        createdBy: staffId,
      });

      const amountPaidPercentage = totalAmount / 2;

      //NOTE -  offline course payment details
      await this.offlineCoursePaymentModel.create({
        userId,
        orderId: order_details?._id,
        parentOrderId: order_details?._id,
        courseId: new mongoose.Types.ObjectId(courseId),
        productAmount:
          priceType === OfflineCoursePriceType.DISCOUNT_PRICE
            ? course_details.priceId?.totalPrice
            : course_details.priceId?.mrpPrice,
        totalPrice,
        gst: course_details.priceId?.gst,
        cgst: course_details.priceId?.gst / 2,
        sgst: course_details.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        discountPercentage: course_details.priceId?.discountPercentage,
        discountedPrice: basePrice,
        outstandingAmount,
        totalAmtReceived: amount,
        nextPaymentDate,
        priceType: priceType,
        transactionStatus:
          (priceType === OfflineCoursePriceType.DISCOUNT_PRICE &&
            outstandingAmount === 0) ||
          (priceType === OfflineCoursePriceType.BASE_PRICE &&
            outstandingAmount === 0)
            ? TransactionStatus.FULL_PAYMENT
            : TransactionStatus.INSTALLMENT,
        chequeOrTransNo,
        paymentType,
        receiptNumber: receipt,
        productType:
          course_details?.type === ModeTypes.ONLINE
            ? ProductType.ONLINE_COURSE
            : ProductType.OFFLINE_COURSE,
        createdBy: staffId,
      });

      if (
        !batchId &&
        course_details?.type === ModeTypes.OFFLINE &&
        !isAdmitted
      ) {
        //NOTE - assign without batch
        await this.studentBatchModel.create({
          studentId: new mongoose.Types.ObjectId(userId),
          courseId: courseId,
          newEnrollmentNumber: enrollment,
          orderId: order_details?._id,
          createdBy: staffId,
        });
      } else if (!batchId && course_details?.type === ModeTypes.ONLINE) {
        const batch_details: any = await this.batchModel.findById(
          course_details.batchId,
        );

        const generateRollNumber = await this.generateStudentRollNumber(
          course_details._id,
          course_details.batchId.toString(),
        );
        const { masterRollNumber, masterBatchId } =
          await this.generateMasterRollNumber(batchId);
        //NOTE - assign  batch
        await this.studentBatchModel.create({
          studentId: new mongoose.Types.ObjectId(userId),
          batchId: course_details.batchId,
          courseId: courseId,
          masterRollNumber: masterRollNumber,
          masterBatchId: masterBatchId,
          rollNumber: generateRollNumber,
          newEnrollmentNumber: enrollment,
          orderId: order_details?._id,
          createdBy: staffId,
        });

        let remaningSeat = batch_details?.remaningSeat;
        //NOTE - update batch model
        if (batch_details?.remaningSeat > 0) {
          //NOTE: Update occupiedSeats and remaningSeat if there are available seats
          remaningSeat = batch_details?.remaningSeat - 1;
        }

        const currentOccupiedSeats = batch_details?.occupiedSeats;

        const newOccupiedSeats = isNaN(currentOccupiedSeats)
          ? 1
          : currentOccupiedSeats + 1;

        await this.batchModel.findByIdAndUpdate(course_details?.batchId, {
          $set: { remaningSeat, occupiedSeats: newOccupiedSeats },
        });

        //NOTE -  Get the current date
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        let validUptoDate: Date;
        if (batch_details?.batchDurationType === BatchDurationType.DAYS) {
          const currentDate = new Date();
          //NOTE -  Add duration in  the current date to calculate Valid Upto date
          currentDate.setDate(currentDate.getDate() + batch_details?.duration);
          currentDate.setHours(23, 59, 59, 999);
          validUptoDate = currentDate;
        } else {
          validUptoDate = batch_details?.endDate;
        }

        //NOTE - update on user Product Details Model
        await this.userProductDetailsModel.create({
          studentId: userId,
          productType: ProductType.ONLINE_COURSE,
          onlineCourseId: new mongoose.Types.ObjectId(courseId),
          batchId: course_details.batchId,
          orderId: order_details?._id,
          languageId: course_details.languageId,
          startDate,
          validUpto: validUptoDate,
          haveAccess: true,
          quantity: 1,
        });
      }

      //NOTE - if more than 50% paymnet
      if (
        payment?.totalAmtReceived >= amountPaidPercentage ||
        payment?.totalAmtReceived >= course_details.admittedAmount
      ) {
        //NOTE - assign batch to student
        if (
          batchId &&
          course_details?.type === ModeTypes.OFFLINE &&
          isAdmitted
        ) {
          const batch_details = await this.batchModel.findById(
            new mongoose.Types.ObjectId(batchId),
          );

          const generateRollNumber = await this.generateStudentRollNumber(
            courseId,
            batchId,
          );

          const { masterRollNumber, masterBatchId } =
            await this.generateMasterRollNumber(batch_details._id.toString());
          //NOTE - assign with batch
          await this.studentBatchModel.create({
            studentId: new mongoose.Types.ObjectId(userId),
            batchId: batchId ? batchId : null,
            courseId: courseId,
            masterRollNumber: masterRollNumber ?? null,
            masterBatchId: masterBatchId ?? null,
            rollNumber: generateRollNumber,
            newEnrollmentNumber: enrollment,
            orderId: order_details?._id,
            createdBy: staffId,
          });

          let remaningSeat = batch_details?.remaningSeat;
          //NOTE - update batch model
          if (batch_details?.remaningSeat > 0) {
            //NOTE: Update occupiedSeats and remaningSeat if there are available seats
            remaningSeat = batch_details?.remaningSeat - 1;
          }

          await this.batchModel.findByIdAndUpdate(batch_details._id, {
            $set: {
              remaningSeat,
              occupiedSeats: batch_details?.occupiedSeats + 1,
            },
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = today;

          let validUptoDate: Date;
          if (batch_details?.batchDurationType === BatchDurationType.DAYS) {
            //NOTE -  Get the current date
            const currentDate = new Date();
            //NOTE -  Add duration in  the current date to calculate Valid Upto date
            currentDate.setDate(
              currentDate.getDate() + batch_details?.duration,
            );
            currentDate.setHours(23, 59, 59, 999);
            validUptoDate = currentDate;
          } else {
            validUptoDate = batch_details?.endDate;
          }

          //NOTE - update on user Product Details Model
          await this.userProductDetailsModel.create({
            studentId: userId,
            productType: ProductType.OFFLINE_COURSE,
            onlineCourseId: new mongoose.Types.ObjectId(courseId),
            batchId: batch_details._id,
            orderId: order_details?._id,
            languageId: course_details.languageId,
            startDate,
            validUpto: validUptoDate,
            haveAccess: true,
            quantity: 1,
          });
        } else if (
          !batchId &&
          course_details.type === ModeTypes.OFFLINE &&
          !isAdmitted
        ) {
          //NOTE - update on user Product Details Model
          await this.userProductDetailsModel.create({
            studentId: userId,
            productType: ProductType.OFFLINE_COURSE,
            onlineCourseId: new mongoose.Types.ObjectId(courseId),
            orderId: order_details?._id,
            languageId: course_details.languageId,
            haveAccess: true,
            quantity: 1,
          });
        }

        //NOTE - check user status
        const user_status = await this.getStudentForOfflinePayment(
          isPreBook,
          priceType === OfflineCoursePriceType.DISCOUNT_PRICE
            ? course_details.priceId?.totalPrice
            : course_details.priceId?.mrpPrice,
          amount,
          userId,
        );

        //NOTE - update user details
        await this.userModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(userId) },
          {
            categoryId,
            courseId: coursesId,
            name,
            gender,
            state,
            city,
            address,
            pincode,
            parentName,
            parentNumber,
            isRegistered:
              user_status === UserStatusTypes.ADMITTED ? true : false,
            registrationDate:
              user_status === UserStatusTypes.ADMITTED ? new Date() : null,
            isPurchased: true,
            studentStatus: isAdmitted
              ? UserStatusTypes.ADMITTED
              : UserStatusTypes.PRE_BOOK, //TODO - check the user status based on the payment
            type: isAdmitted ? UserType.STUDENT : UserType.ENQUIRY,
            isOnlineCourseSold: true,
            updatedBy: staffId,
          },
          { new: true, runValidators: true, upsert: true },
        );
      } else {
        await this.userModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(userId) },
          {
            categoryId,
            courseId: coursesId,
            name,
            gender,
            state,
            city,
            address,
            pincode,
            parentName,
            parentNumber,
            isPurchased: true,
            studentStatus: UserStatusTypes.PRE_BOOK,
            isOnlineCourseSold: true,
            updatedBy: staffId,
          },
          { new: true, runValidators: true, upsert: true },
        );
      }

      //NOTE - update the coins transaction if coins is not 0
      if (course_details.coins !== 0) {
        //NOTE: Update coupon transaction
        await this.coinsTransactionModel.create({
          userId,
          orderId: order_details?._id,
          credit: course_details.coins,
          transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
        });

        //NOTE: Update user coins
        await this.userModel.findOneAndUpdate(
          { _id: userId },
          { coins: user_details.coins + course_details.coins },
          { new: true, runValidators: true, upsert: true },
        );
      }

      //NOTE - check if any follow up exist for the student close
      await this.followUpModel.updateMany(
        { studentId: user_details._id },
        { $set: { followupStatus: FollowUpStatus.COMPLETED } },
      );

      //NOTE - send order confirmation
      const orderData: any = await this.orderModel
        .findOne({ _id: order_details?._id })
        .populate([
          { path: 'userId', select: 'phone' },
          { path: 'parentId', select: 'phone' },
        ])
        .select('paidAmount mkcOrderId');

      const phoneNumbers = [
        { phone: orderData?.userId?.phone, sendTo: NotificationSendType.USER },
      ];

      if (orderData?.parentId?.phone) {
        phoneNumbers.push({
          phone: orderData?.parentId?.phone,
          sendTo: NotificationSendType.PARENT,
        });
      }

      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() + 5, createdAt.getMinutes() + 30);

      // NOTE - send message of order confirmation
      for (const { phone, sendTo } of phoneNumbers) {
        const variables = {
          amount: orderData?.paidAmount,
          order: orderData?.mkcOrderId,
          phone: '9696330033',
        };

        const message = await this.smsService.replaceMessagesContent({
          message: ORDER_CONFIRMATION_MESSAGE,
          variables,
        });

        //NOTE - entry on communication model
        await this.communicationModel.create({
          userId: new mongoose.Types.ObjectId(orderData?.userId._id),
          userModel: SchemaReferenceType.USER,
          mobile: phone,
          notificationType: NotificationTypes.SMS,
          sendTo: sendTo,
          message,
          createdAt,
        });

        await this.smsService.messageOnOrderConfirmation({
          amount: orderData?.paidAmount,
          orderId: orderData?.mkcOrderId,
          phone: '9696330033',
          number: phone,
        });
      }

      if (outstandingAmount > 0) {
        //NOTE - send message for pre book
        await this.smsService.preBookInstantSms({
          name: user_details?.name,
          phone: user_details?.phone,
          course: course_details?.title,
          date: nextPaymentDate,
          url: process.env.STUDENT_LOGIN,
        });

        const variables = {
          name: user_details.name,
          course: course_details?.title,
          date: nextPaymentDate,
          url: process.env.STUDENT_LOGIN,
        };

        const message = await this.smsService.replaceMessagesContent({
          message: PRE_BOOK_INSTANT_H_MESSAGE,
          variables,
        });

        //NOTE - entry on communication model
        await this.communicationModel.create({
          userId: new mongoose.Types.ObjectId(user_details._id),
          userModel: SchemaReferenceType.USER,
          mobile: user_details?.phone,
          notificationType: NotificationTypes.SMS,
          sendTo: NotificationSendType.USER,
          message,
          createdAt,
        });
      }
    } else {
      const existingOfflinePayment = await this.offlineCoursePaymentModel
        .findOne({
          orderId: order._id,
          // transactionStatus: TransactionStatus.INSTALLMENT,
        })
        .sort({ createdAt: -1 });

      if (
        existingOfflinePayment.transactionStatus ===
        TransactionStatus.INSTALLMENT_CLOSED
      ) {
        throw new HttpException(
          INSTALLMENT_CLOSED_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      } else if (
        existingOfflinePayment.transactionStatus ===
        TransactionStatus.INSTALLMENT
      ) {
        const receipt = await this.generateReceiptNumber();

        const existingPayment = await this.paymentModel
          .findOne({ orderId: order._id })
          .sort({ updatedAt: -1 });

        // //TODO - need to delete the details from paymnet table, as we are not going to track offline course paymnet from paymnet table
        await this.paymentModel.create({
          orderId: order._id,
          courseId,
          userId,
          productAmount: existingPayment.productAmount,
          totalAmount: amount,
          totalAmtReceived: existingPayment?.totalAmtReceived + amount,
          paymentDate: new Date(),
          paymentStatus: PaymentStatus.PAID,
          outstandingAmount,
          chequeOrTransNo,
          nextPaymentDate,
          paymentType,
          receiptNumber: receipt,
          createdBy: staffId,
        });

        //NOTE - calculate the Price
        totalPrice = amount;
        basePrice = Math.ceil(
          totalPrice / (1 + course_details.priceId?.gst / 100),
        );
        gstAmount = Math.ceil(totalPrice - basePrice);

        const offlineCoursePayment =
          await this.offlineCoursePaymentModel.create({
            userId,
            orderId: order._id,
            parentOrderId: order._id,
            courseId: new mongoose.Types.ObjectId(courseId),
            productAmount: existingOfflinePayment?.productAmount,
            totalPrice: amount,
            gst: course_details.priceId?.gst,
            cgst: course_details.priceId?.gst / 2,
            sgst: course_details.priceId?.gst / 2,
            gstAmount,
            cgstAmount: gstAmount / 2,
            sgstAmount: gstAmount / 2,
            discountPercentage: course_details.priceId?.discountPercentage,
            discountedPrice: basePrice,
            outstandingAmount,
            totalAmtReceived:
              Number(existingOfflinePayment?.totalAmtReceived) + amount,
            priceType: priceType,
            transactionStatus:
              outstandingAmount === 0
                ? TransactionStatus.INSTALLMENT_COMPLETE
                : TransactionStatus.INSTALLMENT,
            chequeOrTransNo,
            receiptNumber: receipt,
            paymentType,
            nextPaymentDate,
            createdBy: staffId,
            productType:
              course_details.type === ModeTypes.ONLINE
                ? ProductType.ONLINE_COURSE
                : ProductType.OFFLINE_COURSE,
          });

        const amountPaidPercentage = existingPayment.productAmount / 2;

        if (
          offlineCoursePayment.totalAmtReceived >= amountPaidPercentage ||
          offlineCoursePayment.totalAmtReceived >= course_details.admittedAmount
        ) {
          if (batchId && isAdmitted) {
            const batch_details = await this.batchModel.findById(
              new mongoose.Types.ObjectId(batchId),
            );
            //NOTE - assign batch to student if online course buy
            const generateRollNumber = await this.generateStudentRollNumber(
              courseId,
              batchId,
            );
            const { masterRollNumber, masterBatchId } =
              await this.generateMasterRollNumber(batchId);
            //NOTE - update batch user
            await this.studentBatchModel.findOneAndUpdate(
              {
                studentId: new mongoose.Types.ObjectId(userId),
                courseId: new mongoose.Types.ObjectId(courseId) || courseId,
                orderId: order.parentOrderId,
              },
              {
                batchId,
                masterRollNumber,
                masterBatchId,
                rollNumber: generateRollNumber,
                updatedBy: userId,
              },
              { new: true, runValidators: true },
            );
            let remaningSeat = batch_details?.remaningSeat;
            //NOTE - update batch model
            if (batch_details.remaningSeat > 0) {
              //NOTE: Update occupiedSeats and remaningSeat if there are available seats
              remaningSeat = batch_details?.remaningSeat - 1;
            }
            await this.batchModel.findOneAndUpdate(batch_details._id, {
              $set: {
                remaningSeat,
                occupiedSeats: batch_details?.occupiedSeats + 1,
              },
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = today;

            let validUptoDate: Date;
            if (batch_details?.batchDurationType === BatchDurationType.DAYS) {
              //NOTE -  Get the current date
              const currentDate = new Date();
              //NOTE -  Add duration in  the current date to calculate Valid Upto date
              currentDate.setDate(
                currentDate.getDate() + batch_details?.duration,
              );
              // NOTE - Set time to end of the day cause course is valid untill the end of the day
              currentDate.setHours(23, 59, 59, 999);
              validUptoDate = currentDate;
            } else {
              validUptoDate = batch_details?.endDate;
            }

            // NOTE - update user Product Details
            await this.userProductDetailsModel.findOneAndUpdate(
              {
                studentId: new mongoose.Types.ObjectId(userId),
                orderId: existingOfflinePayment?.parentOrderId,
                onlineCourseId: new mongoose.Types.ObjectId(courseId),
              },
              {
                $set: {
                  batchId: new mongoose.Types.ObjectId(batchId),
                  validUpto: validUptoDate,
                  startDate,
                  haveAccess: true,
                },
              },
            );
          }
          //NOTE - check user status
          const user_status = await this.getStudentForOfflinePayment(
            isPreBook,
            priceType === OfflineCoursePriceType.DISCOUNT_PRICE
              ? course_details.priceId?.totalPrice
              : course_details.priceId?.mrpPrice,
            Number(existingOfflinePayment?.totalAmtReceived) + amount,
            userId,
          );
          // NOTE - update user
          await this.userModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(userId) },
            {
              isRegistered:
                user_status === UserStatusTypes.ADMITTED ? true : false,
              registrationDate:
                user_status === UserStatusTypes.ADMITTED ? new Date() : null,
              isPurchased: true,
              studentStatus: isAdmitted
                ? UserStatusTypes.ADMITTED
                : UserStatusTypes.PRE_BOOK, //TODO - check the user status based on the payment
              type: isAdmitted ? UserType.STUDENT : UserType.ENQUIRY,
              isOnlineCourseSold: true,
              updatedBy: staffId,
            },
            { new: true, runValidators: true, upsert: true },
          );
          //NOTE - update user admission table data, if any admission date exist
          await this.admissionDetailsModel.findOneAndUpdate(
            {
              studentId: userId,
              onlineCourseId: new mongoose.Types.ObjectId(courseId),
            },
            {
              admissionStatus: AdmissionStatus.DONE,
              status: false,
              updatedBy: staffId,
            },
            { new: true, runValidators: true, upsert: true },
          );
        } else {
          //NOTE - check user status
          const user_status = await this.getStudentForOfflinePayment(
            isPreBook,
            priceType === OfflineCoursePriceType.DISCOUNT_PRICE
              ? course_details.priceId?.totalPrice
              : course_details.priceId?.mrpPrice,
            Number(existingOfflinePayment?.totalAmtReceived) + amount,
            userId,
          );
          await this.userModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(userId) },
            {
              isPurchased: true,
              studentStatus: user_status,
              isOnlineCourseSold: true,
              updatedBy: staffId,
            },
            { new: true, runValidators: true, upsert: true },
          );
        }

        //NOTE - check if online course and student librery acccess is deactivate then activate it
        if (course_details.type === ModeTypes.ONLINE) {
          //NOTE - check user librery details
          const library = await this.userProductDetailsModel.findOne({
            productType: ProductType.ONLINE_COURSE,
            orderId: order._id,
            studentId: user_details._id,
            onlineCourseId: course_details._id,
          });
          if (library.haveAccess === false) {
            return this.userProductDetailsModel.updateOne(
              { _id: library._id },
              { $set: { haveAccess: true } },
            );
          }
        }

        //NOTE - check if any follow up exist for the student close
        await this.followUpModel.updateMany(
          { studentId: user_details._id },
          { $set: { followupStatus: FollowUpStatus.COMPLETED } },
        );

        //NOTE - send payment confirmation
        const orderData: any = await this.orderModel
          .findOne({ _id: order._id })
          .populate([
            { path: 'userId', select: 'phone' },
            { path: 'parentId', select: 'phone' },
          ])
          .select('mkcOrderId');

        const phoneNumbers = [
          { phone: orderData.userId.phone, sendTo: NotificationSendType.USER },
        ];

        if (orderData?.parentId?.phone) {
          phoneNumbers.push({
            phone: orderData.parentId.phone,
            sendTo: NotificationSendType.PARENT,
          });
        }

        const createdAt = new Date();
        createdAt.setHours(
          createdAt.getHours() + 5,
          createdAt.getMinutes() + 30,
        );

        // NOTE - send message of order confirmation
        for (const { phone, sendTo } of phoneNumbers) {
          const variables = {
            amount,
            order: orderData?.mkcOrderId,
            phone: '9696330033',
          };

          const message = await this.smsService.replaceMessagesContent({
            message: ORDER_CONFIRMATION_MESSAGE,
            variables,
          });

          //NOTE - entry on communication model
          await this.communicationModel.create({
            userId: new mongoose.Types.ObjectId(orderData?.userId._id),
            userModel: SchemaReferenceType.USER,
            mobile: phone,
            notificationType: NotificationTypes.SMS,
            sendTo,
            message,
            createdAt,
          });

          await this.smsService.messageOnOrderConfirmation({
            amount,
            orderId: orderData?.mkcOrderId,
            phone: '9696330033',
            number: phone,
          });
        }
      }
    }

    return PAYMENT_CREATED;
  }

  //SECTION -generate Recipt
  async generateRecipt(query: ParsedQs): Promise<any> {
    //NOTE - add paginanation
    const { orderId, type } = query as unknown as {
      orderId: string;
      type: string;
    };
    //NOTE - when type payment
    if (type === GenerateReceipt.PAYMENT) {
      const paymentList: any = await this.paymentModel
        .findOne({
          _id: new mongoose.Types.ObjectId(orderId),
        })
        .populate([
          {
            path: 'userId',
            select: 'name parentName phone email _id parentId studentStatus',
            populate: [{ path: 'parentId', select: 'name' }],
          },
        ])
        .lean();

      const settings: any = await this.SettingModel.findOne()
        .select('gstNumber logoLink instituteName instituteAddress')
        .lean();

      //NOTE - convert payment date
      const payemtnDate = new Date(paymentList?.createdAt);
      const formattedDate = payemtnDate.toLocaleDateString('en-GB');

      //NOTE - final data
      const jsonData: any = {
        path: process.env.PRODUCT_RECEIPT_EJS_URL,
        gstNo: settings?.gstNumber,
        logoLink: settings?.logoLink,
        InstituteName: settings?.instituteName,
        address: settings?.instituteAddress,
        reciptNumber:
          paymentList?.receiptNumber !== null ? paymentList?.receiptNumber : '',
        EnrollmentNo: '',
        currentDate: formattedDate ? formattedDate : '',
        studentName: paymentList.userId?.name ? paymentList.userId?.name : '',
        courseName: paymentList.userId?.courseId?.name || '',
        parentName:
          paymentList.userId?.parentId?.name ||
          paymentList.userId?.parentName ||
          '',
        Batch: '',
        joiningDate: '',
        EndingDate: '',
        status: paymentList.userId?.studentStatus,
        Code: 999293,
        Mode: paymentList.paymentType,
        BankDetails: '',
        cgst: '',
        sgst: '',
        Amount: paymentList.totalAmount ? paymentList.totalAmount : '',
        totalPrice: paymentList.totalAmtReceived
          ? paymentList.totalAmtReceived
          : '',
      };

      const data: any = await this.pdfGenerator(jsonData);

      return data.Location;
    } else if (type === GenerateReceipt.INSTALLMENT) {
      const installmentPayment: any = await this.offlineCoursePaymentModel
        .findById(orderId)
        .populate([
          {
            path: 'userId',
            select: 'name parentName parentId studentStatus',
            populate: [
              {
                path: 'parentId',
                select: 'name',
              },
            ],
          },
          {
            path: 'courseId',
            select: 'title',
          },
        ]);
      if (!installmentPayment) {
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const settings: any = await this.SettingModel.findOne()
        .select('gstNumber logoLink instituteName instituteAddress')
        .lean();

      const batches: any = await this.studentBatchModel
        .findOne({
          orderId: new mongoose.Types.ObjectId(
            installmentPayment?.parentOrderId,
          ),
          studentId: new mongoose.Types.ObjectId(
            installmentPayment?.userId?._id,
          ),
          courseId: installmentPayment?.courseId?._id,
        })
        .populate([{ path: 'batchId', select: 'name -_id duration' }])
        .lean();

      const courseData = [installmentPayment?.courseId?.title];
      //NOTE - convert payment date
      const payemtnDate = new Date(installmentPayment?.createdAt);
      const formattedDate = payemtnDate.toLocaleDateString('en-GB');
      //NOTE - convert payment date
      let batchJoinDate: string;
      let batchEndingDate: string;
      if (batches) {
        const batchJoin = new Date(batches.createdAt);
        batchJoinDate = batchJoin.toLocaleDateString('en-GB');
        if (batches.batchId) {
          //NOTE - last date of batch
          const lastDay = new Date(batches.createdAt);
          lastDay.setDate(lastDay.getDate() + batches?.batchId?.duration);
          batchEndingDate = lastDay.toLocaleDateString('en-GB');
        }
      }
      // Create the array of objects
      const itemsArray = [
        {
          type: 'Course',
          Code: 999293,
          BankDetails: installmentPayment?.chequeOrTransNo || '',
          Mode: installmentPayment?.paymentType,
          totalPrice:
            installmentPayment?.totalPrice - installmentPayment?.gstAmount,
        },
      ];
      const isInstallmentPayment = await this.offlineCoursePaymentModel.findOne(
        {
          _id: new mongoose.Types.ObjectId(orderId),
          transactionStatus: TransactionStatus.INSTALLMENT,
        },
      );

      //NOTE - check if after rebate outstandingAmount will 0 or not
      const installmentWithRebate = await this.offlineCoursePaymentModel
        .findOne({
          userId: installmentPayment?.userId?._id.toString(),
          courseId: installmentPayment?.courseId?._id,
          createdAt: { $gt: installmentPayment.createdAt },
          paymentType: OfflinePaymentType.REBATE,
          outstandingAmount: 0,
          transactionStatus: TransactionStatus.INSTALLMENT_COMPLETE,
        })
        .sort({ createdAt: 1 })
        .limit(1);

      const jsonData = {
        path: process.env.PRODUCT_RECEIPT_EJS_URL,
        gstNo: settings?.gstNumber,
        logoLink: settings?.logoLink,
        InstituteName: settings?.instituteName,
        address: settings?.instituteAddress,
        reciptNumber:
          installmentPayment?.receiptNumber !== null
            ? installmentPayment?.receiptNumber
            : '',
        EnrollmentNo: batches?.newEnrollmentNumber ?? null,
        currentDate: formattedDate ? formattedDate : '',
        studentName: installmentPayment?.userId?.name || '',
        courseName: courseData ? courseData : '',
        parentName:
          installmentPayment.userId?.parentId?.name ||
          installmentPayment.userId?.parentName ||
          '',
        Batch: batches?.batchId?.name || '',
        joiningDate: batchJoinDate ? batchJoinDate : '',
        EndingDate: batchEndingDate ? batchEndingDate : '',
        status: installmentPayment?.userId?.studentStatus,
        items: itemsArray,
        BankDetails: '',
        cgstPercentage: installmentPayment?.cgst || 0,
        sgstPercentage: installmentPayment?.sgst || 0,
        discountPercentage:
          Math.floor(installmentPayment?.discountPercentage * 10) / 10 || 0,
        cgst: installmentPayment?.cgstAmount || 0,
        sgst: installmentPayment?.sgstAmount || 0,
        discountAmount: installmentPayment?.discountedPrice || 0,
        dueAmount:
          installmentWithRebate && installmentWithRebate
            ? 0
            : isInstallmentPayment &&
              installmentPayment?.userId?.studentStatus !=
                UserStatusTypes.PRE_BOOK
            ? isInstallmentPayment?.outstandingAmount
            : 0,
        dueDate:
          installmentWithRebate && installmentWithRebate
            ? 0
            : isInstallmentPayment &&
              installmentPayment?.userId?.studentStatus !=
                UserStatusTypes.PRE_BOOK
            ? isInstallmentPayment?.nextPaymentDate.toLocaleDateString('en-GB')
            : 0,

        totalPrice: installmentPayment?.totalPrice || '',
      };

      const data: any = await this.pdfGenerator(jsonData);
      return data.Location;
    } else {
      const paymentList: any = await this.paymentModel.findOne({
        orderId: new mongoose.Types.ObjectId(orderId),
      });
      if (!paymentList) {
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const settings: any = await this.SettingModel.findOne()
        .select('gstNumber logoLink instituteName instituteAddress')
        .lean();

      const batches: any = await this.studentBatchModel
        .findOne({ orderId: new mongoose.Types.ObjectId(orderId) })
        .populate([{ path: 'batchId', select: 'name -_id duration' }])
        .lean();
      //NOTE: get order details
      const orderData: any = await this.orderModel
        .findById(orderId)
        .populate([
          {
            path: 'userId',
            select: 'name parentName phone email _id parentId studentStatus',
            populate: [{ path: 'parentId', select: 'name' }],
          },
          {
            path: 'onlineCourseDetails',
            select: 'onlineCourseId ',
            populate: [{ path: 'onlineCourseId', select: 'title productCode' }],
          },
          {
            path: 'bookDetails',
            select: 'bookId',
            populate: [{ path: 'bookId', select: 'bookName skuCode' }],
          },
          {
            path: 'testSeriesDetails',
            select: 'testId',
            populate: [{ path: 'testId', select: 'title productCode' }],
          },
        ])
        .select('-userId')
        .lean();

      //NOTE - extract course name
      const extractedData: any = {
        onlineCourseTitles: orderData.onlineCourseDetails.map(
          (item: { onlineCourseId: { title: any } }) =>
            item.onlineCourseId?.title,
        ),
        bookNames: orderData.bookDetails.map(
          (item: { bookId: { bookName: any } }) => item.bookId?.bookName,
        ),
        testTitles: orderData.testSeriesDetails.map(
          (item: { testId: { title: any } }) => item.testId?.title,
        ),
      };

      const combinedDataArray = [
        extractedData.onlineCourseTitles.join(', '),
        extractedData.bookNames.join(', '),
        extractedData.testTitles.join(', '),
      ];

      const courseData = combinedDataArray
        .filter((value) => value.trim() !== '')
        .join(', ');

      //NOTE - extract code
      const codeData: any = {
        courseCode: orderData.onlineCourseDetails.map(
          (item: { onlineCourseId: { productCode: any } }) =>
            String(item.onlineCourseId?.productCode),
        ),
        bookCode: orderData.bookDetails.map(
          (item: { bookId: { skuCode: any } }) => String(item.bookId.skuCode),
        ),
        testCode: orderData.testSeriesDetails.map(
          (item: { testId: { productCode: any } }) =>
            String(item.testId?.productCode),
        ),
      };
      const codeCombine = [
        codeData.courseCode.join(', '),
        codeData.bookCode.join(', '),
        codeData.testCode.join(', '),
      ];
      codeCombine.filter((value) => value.trim() !== '').join(', ');

      //NOTE - convert payment date
      const payemtnDate = new Date(paymentList?.createdAt);
      const formattedDate = payemtnDate.toLocaleDateString('en-GB');

      //NOTE - convert payment date
      let batchJoinDate: string;
      let batchEndingDate: string;
      if (batches) {
        const batchJoin = new Date(batches.createdAt);
        batchJoinDate = batchJoin.toLocaleDateString('en-GB');
        if (batches.batchId) {
          //NOTE - last date of batch
          const lastDay = new Date(batches.createdAt);
          lastDay.setDate(lastDay.getDate() + batches?.batchId?.duration);
          batchEndingDate = lastDay.toLocaleDateString('en-GB');
        }
      }
      // Function to create a new array of objects with type and totalPrice
      const transformItems = (details, itemType, code) => {
        return details.map((item) => ({
          type: itemType,
          Code: code,
          BankDetails: '',
          Mode: paymentList?.paymentType,
          totalPrice: item?.totalPrice - item?.gstAmount,
        }));
      };

      // Create the array of objects
      const itemsArray = [
        ...transformItems(orderData.onlineCourseDetails, 'Course', 999293),
        ...transformItems(orderData.bookDetails, 'Book', 4901),
        ...transformItems(orderData.testSeriesDetails, 'Test Series', 999293),
      ];
      const isInstallmentPayment = await this.offlineCoursePaymentModel.findOne(
        {
          orderId: new mongoose.Types.ObjectId(orderId),
          transactionStatus: TransactionStatus.INSTALLMENT,
        },
      );
      const jsonData = {
        path: process.env.PRODUCT_RECEIPT_EJS_URL,
        gstNo: settings?.gstNumber,
        logoLink: settings?.logoLink,
        InstituteName: settings?.instituteName,
        address: settings?.instituteAddress,
        reciptNumber:
          paymentList?.receiptNumber !== null ? paymentList?.receiptNumber : '',
        EnrollmentNo:
          batches !== null && batches.newEnrollmentNumber
            ? batches.newEnrollmentNumber
            : '',
        currentDate: formattedDate ? formattedDate : '',
        studentName: orderData.userId?.name ? orderData.userId.name : '',
        courseName: courseData ? courseData : '',
        parentName:
          orderData.userId?.parentId?.name ||
          orderData.userId?.parentName ||
          '',

        Batch: batches?.batchId ? batches.batchId?.name : '',
        joiningDate: batchJoinDate ? batchJoinDate : '',
        EndingDate: batchEndingDate ? batchEndingDate : '',
        status: orderData.userId?.studentStatus,
        items: itemsArray,
        BankDetails: '',
        cgstPercentage: orderData?.cgst || 0,
        sgstPercentage: orderData?.sgst || 0,
        cgst: orderData?.cgstAmount || 0,
        sgst: orderData?.sgstAmount || 0,

        dueAmount: isInstallmentPayment
          ? isInstallmentPayment?.outstandingAmount
          : 0,
        dueDate: isInstallmentPayment
          ? isInstallmentPayment?.nextPaymentDate?.toLocaleDateString(
              'en-GB',
            ) || ''
          : 0,
        totalPrice: orderData?.paidAmount ? orderData?.paidAmount : '',
      };

      const data: any = await this.pdfGenerator(jsonData);
      return data.Location;
    }
  }

  //SECTION - get user paymnet history
  async userPaymentList(
    @Query() query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as unknown as {
      page: string;
      limit: string;
      search: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - get payment count
    const count = await this.offlineCoursePaymentModel.countDocuments({
      userId: search,
    });

    const paymnet_details: any[] = await this.offlineCoursePaymentModel
      .find({ userId: search })
      .populate([
        { path: 'courseId', select: 'title' },
        { path: 'orderId', select: 'orderType' },
      ])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const response = paymnet_details.map((item) => ({
      _id: item._id,
      course: item.courseId?.title,
      productAmount: item?.productAmount,
      productType: item?.productType,
      totalAmtReceived: item?.totalAmtReceived,
      totalPrice: item?.totalPrice,
      gstAmount: item?.gstAmount,
      outstandingAmount: item?.outstandingAmount,
      paymentDate: item?.paymentDate,
      nextPaymentDate: item?.nextPaymentDate,
      paymentType: item?.paymentType,
      orderId: item?.orderId,
      transactionStatus: item?.transactionStatus,
      isEditable: !(
        (item?.transactionStatus === TransactionStatus.FULL_PAYMENT &&
          item?.orderId?.orderType === OrderTypes.AUTOMATION) ||
        item?.priceType === OfflineCoursePriceType.PRE_BOOK ||
        item.paymentType === OfflinePaymentType.COURSE_CHANGE ||
        item.paymentType === OfflinePaymentType.REBATE ||
        item?.transactionStatus ===
          TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE
      ),

      chequeOrTransNo: item?.chequeOrTransNo ?? null,
    }));
    return { data: response, count };
  }

  //SECTION - get offline Payment history
  async offlinePaymentHistory(
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[] }> {
    //NOTE: check userId based on the user type
    let usersId: string;
    if (userId && (userType === UserType.PARENT || !studentId)) {
      const idToCheck = studentId || userId;
      if (!mongoose.isValidObjectId(idToCheck))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      usersId = idToCheck;
    }

    //NOTE: get user offline course payment details
    const course_details = await this.offlineCoursePaymentModel.aggregate([
      {
        $match: {
          userId: usersId,
          transactionStatus: {
            $nin: [TransactionStatus.FULL_PAYMENT],
          },
        },
      },
      {
        $sort: { parentOrderId: 1, createdAt: -1 },
      },
      {
        $group: { _id: '$parentOrderId', latestDocument: { $first: '$$ROOT' } },
      },
      {
        $match: {
          'latestDocument.transactionStatus': {
            $ne: TransactionStatus.INSTALLMENT_COMPLETE,
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$latestDocument' },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseData',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderData',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    //NOTE - push final data
    const response = course_details.map((item) => ({
      _id: item._id,
      courseId: item.courseId,
      course: item.courseData[0]?.title,
      orderId: item.orderData[0].parentOrderId,
      mkcOrderId: item.orderData[0]?.mkcOrderId,
      paymentDate: item.paymentDate,
      productAmount: item.productAmount,
      paymentStatus: item.paymentStatus,
      outstandingAmount: item.outstandingAmount,
      nextPaymentDate: item.nextPaymentDate,
    }));

    return { data: response };
  }

  //SECTION - get offline Payment details
  async offlinePaymentDetails(
    payload: CoursePaymentHistoryDto,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[] }> {
    //NOTE: check userId based on the user type
    let usersId: string;
    if (userId && (userType === UserType.PARENT || !studentId)) {
      const idToCheck = studentId || userId;
      if (!mongoose.isValidObjectId(idToCheck))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      usersId = idToCheck;
    }
    const { orderId, courseId } = payload;

    //NOTE: get user offline course payment details
    const paymnet_details = await this.offlineCoursePaymentModel
      .find({
        parentOrderId: new mongoose.Types.ObjectId(orderId),
        courseId: new mongoose.Types.ObjectId(courseId),
        userId: usersId,
      })
      .populate([
        {
          path: 'courseId',
          select: 'title',
        },
      ]);

    //NOTE: push final data
    const response = paymnet_details.map((item: any) => ({
      _id: item._id,
      courseName: item.courseId.title,
      productAmount: item.productAmount,
      totalAmtReceived: item.totalAmtReceived,
      outstandingAmount: item.outstandingAmount,
      paymentDate: item.paymentDate,
      nextPaymentDate: item.nextPaymentDate,
      paymentType: item?.paymentType,
    }));

    return { data: response };
  }

  //SECTION - create offline and online course intstallment order
  async offlineCourseOrder(
    payload: OfflineCourseOrderDto,
    userId: string, //TODO - this userId will be the parent id when parent doing paymnet.
    userType: UserType,
    studentId?: string,
  ): Promise<{ data: any }> {
    try {
      const {
        totalAmount,
        outStandingAmount,
        orderId,
        courseId,
        nextPaymentDate,
      } = payload;

      //NOTE: get parent order details
      const parent_order = await this.orderModel
        .findById({ _id: orderId })
        .populate([
          {
            path: 'onlineCourseDetails',
            match: { 'onlineCourseDetails.onlineCourseId': courseId },
            populate: [
              {
                path: 'onlineCourseDetails.onlineCourseId',
                select: 'title',
              },
            ],
          },
        ]);

      //NOTE - payload for create order in razorpay
      const orderDetails = {
        amount: Math.ceil(totalAmount * 100),
        currency: process.env.CURRENCY,
      };

      const order: any = await this.rzp.orders.create(orderDetails);

      //NOTE - create order in order table and payment table
      if (order) {
        const course_details = await this.onlineCourseModel
          .findById({
            _id: courseId,
          })
          .populate([
            {
              path: 'priceId',
              select:
                'mrpPrice totalPrice discountedPrice discountPercentage gst',
            },
          ])
          .select('-priceId')
          .lean();

        const basePrice = Math.ceil(
          totalAmount / (1 + course_details.priceId?.gst / 100),
        );
        const gstAmount = Math.ceil(totalAmount - basePrice);

        //NOTE - Calculate the outstanding amount

        //NOTE - payload for order
        const orderPayload = {
          orderNumber: order.id,
          userId: userType === UserType.PARENT ? studentId : userId,
          parentId:
            userType === UserType.PARENT
              ? new mongoose.Types.ObjectId(userId)
              : null,
          parentOrderId: new mongoose.Types.ObjectId(orderId),
          onlineCourseDetails: [
            {
              onlineCourseId: courseId,
              type: course_details.type,
              languageId: course_details.languageId,
              quantity: 1,
              productAmount: parent_order.onlineCourseDetails[0].productAmount,
              totalPrice: totalAmount,
              gst: course_details.priceId?.gst,
              cgst: course_details.priceId?.gst / 2,
              sgst: course_details.priceId?.gst / 2,
              gstAmount,
              cgstAmount: gstAmount / 2,
              sgstAmount: gstAmount / 2,
              discountPercentage: course_details.priceId?.discountPercentage,
              discountedPrice: totalAmount - gstAmount,
              paymentStatus:
                outStandingAmount !== 0
                  ? OfflineCoursePriceType.PRE_BOOK
                  : OfflineCoursePriceType.DISCOUNT_PRICE,
            },
          ],
          totalAmount,
          totalPrice: totalAmount - gstAmount,
          gst: course_details.priceId?.gst,
          cgst: course_details.priceId?.gst / 2,
          sgst: course_details.priceId?.gst / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          shippingCharge: 0,
          paidAmount: totalAmount,
        };
        //NOTE - create order in db
        const order_details = new this.orderModel(orderPayload);
        order_details.mkcOrderId = await this.generateOrderUniqueID(
          OrderGenerateType.PRODUCT,
        );

        await order_details.save();

        //NOTE - enter payment details in payment table
        await this.paymentModel.create({
          orderId: order_details._id,
          orderNumber: order.id,
          userId: userType === UserType.PARENT ? studentId : userId,
          parentId: userType === UserType.PARENT ? userId : null,
          totalAmount,
          totalAmtReceived: totalAmount,
          productAmount: parent_order.onlineCourseDetails[0].productAmount,
          outstandingAmount: outStandingAmount,
          nextPaymentDate,
        });
      }
      return { data: order };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - verify Payment offline payment
  async offlineVerifyPayment(
    payload: VerifyPaymentDto,
    userId: string, //TODO - this userId will be the parent id when parent doing paymnet.
    userType: UserType,
    studentId?: string,
  ): Promise<any> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        payload;

      const user_details = await this.userModel.findById(
        userType === UserType.PARENT ? studentId : userId,
      );

      //NOTE - generate signature
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
          //NOTE - update paymnet status in order table
          const updateOrder = await this.orderModel.findOneAndUpdate(
            { orderNumber: razorpay_order_id },
            {
              paymentStatus: PaymentStatus.PAID,
              paymentDate: new Date(),
            },
            { new: true, upsert: true },
          );
          //NOTE - update paymnet status in payment table
          const payment_details = await this.paymentModel.findOneAndUpdate(
            { orderId: updateOrder._id, orderNumber: razorpay_order_id },
            {
              receiptNumber: receipt,
              paymentId: razorpay_payment_id,
              paymentStatus: PaymentStatus.PAID,
              paymentDate: new Date(),
            },
            { new: true, runValidators: true, upsert: true },
          );

          if (
            Array.isArray(updateOrder?.eventDetails) &&
            updateOrder?.eventDetails.length === 0
          ) {
            //NOTE - check course details
            const course = await this.onlineCourseModel.findById(
              updateOrder?.onlineCourseDetails[0]?.onlineCourseId,
            );
            const existingOfflinePayment = await this.offlineCoursePaymentModel
              .findOne({
                parentOrderId: new mongoose.Types.ObjectId(
                  updateOrder.parentOrderId,
                ),
                transactionStatus: TransactionStatus.INSTALLMENT,
              })
              .sort({ createdAt: -1 });

            //NOTE - caloculate the outstanding Amount
            const calculateOutstandingAmount =
              existingOfflinePayment.outstandingAmount -
              updateOrder.totalAmount;

            console.log('existingOfflinePayment', existingOfflinePayment);

            await this.offlineCoursePaymentModel.create({
              userId: userType === UserType.PARENT ? studentId : userId,
              parentId: userType === UserType.PARENT ? userId : null,
              orderId: updateOrder?._id,
              parentOrderId: existingOfflinePayment?.parentOrderId,
              courseId: existingOfflinePayment?.courseId,
              productAmount: existingOfflinePayment?.productAmount,
              totalPrice: updateOrder?.onlineCourseDetails[0]?.totalPrice,
              gst: updateOrder?.onlineCourseDetails[0]?.gst,
              cgst: updateOrder?.onlineCourseDetails[0]?.gst / 2,
              sgst: updateOrder?.onlineCourseDetails[0]?.gst / 2,
              gstAmount: updateOrder?.onlineCourseDetails[0]?.gstAmount,
              cgstAmount: updateOrder?.onlineCourseDetails[0]?.gstAmount / 2,
              sgstAmount: updateOrder?.onlineCourseDetails[0]?.gstAmount / 2,
              discountPercentage:
                updateOrder?.onlineCourseDetails[0]?.discountPercentage,
              discountedPrice:
                updateOrder?.onlineCourseDetails[0]?.discountedPrice,
              outstandingAmount: calculateOutstandingAmount,
              totalAmtReceived:
                existingOfflinePayment.totalAmtReceived +
                updateOrder.paidAmount,
              priceType: existingOfflinePayment.priceType,
              nextPaymentDate: payment_details.nextPaymentDate,
              transactionStatus:
                calculateOutstandingAmount === 0
                  ? TransactionStatus.INSTALLMENT_COMPLETE
                  : TransactionStatus.INSTALLMENT,
              productType:
                course.type === ModeTypes.ONLINE
                  ? ProductType.ONLINE_COURSE
                  : ProductType.OFFLINE_COURSE,
              receiptNumber: receipt,
            });

            let studentStatus: any;
            if (
              calculateOutstandingAmount >=
                0.5 * existingOfflinePayment.productAmount ||
              user_details.studentStatus === UserStatusTypes.ADMITTED
            ) {
              studentStatus = UserStatusTypes.ADMITTED;
            } else {
              studentStatus = UserStatusTypes.PRE_BOOK;
            }

            //NOTE Define an object to hold the update data for the user table
            const userUpdateData: any = {
              studentStatus,
              type:
                studentStatus === UserStatusTypes.ADMITTED
                  ? UserType.STUDENT
                  : UserType.ENQUIRY,
              isRegistered:
                studentStatus === UserStatusTypes.ADMITTED ? true : false,
              registationDate:
                studentStatus === UserStatusTypes.ADMITTED ? new Date() : null,
            };

            //NOTE: Update the user table
            await this.userModel.findOneAndUpdate(
              { _id: userType === UserType.PARENT ? studentId : userId },
              userUpdateData,
              { new: true, runValidators: true, upsert: true },
            );

            if (
              calculateOutstandingAmount >=
              0.5 * existingOfflinePayment.productAmount
            ) {
              //NOTE - update user admission table data, if any admission date exist
              await this.admissionDetailsModel.findOneAndUpdate(
                {
                  studentId: userType === UserType.PARENT ? studentId : userId,
                  onlineCourseId: existingOfflinePayment?.courseId,
                  status: true,
                },
                {
                  admissionStatus: AdmissionStatus.DONE,
                  status: false,
                },
                { new: true, runValidators: true, upsert: true },
              );
            }
            //NOTE - check if online course and student librery acccess is deactivate then activate it
            if (course.type === ModeTypes.ONLINE) {
              //NOTE - check user librery details
              const library = await this.userProductDetailsModel.findOne({
                productType: ProductType.ONLINE_COURSE,
                orderId: existingOfflinePayment?.parentOrderId,
                studentId: user_details._id,
                onlineCourseId: course._id,
              });

              if (library.haveAccess === false) {
                return this.userProductDetailsModel.updateOne(
                  { _id: library._id },
                  { $set: { haveAccess: true } },
                );
              }
            }
          }

          return PAYMENT_SUCCESS;
        } else {
          //NOTE - update paymnet status in order table
          const updateOrder = await this.orderModel.findOneAndUpdate(
            {
              orderNumber: razorpay_order_id,
            },
            { paymentStatus: PaymentStatus.FAILED, paymentDate: new Date() },
            { new: true, runValidators: true, upsert: true },
          );

          //NOTE - update paymnet status in payment table
          await this.paymentModel.findOneAndUpdate(
            {
              orderId: updateOrder._id,
              orderNumber: razorpay_order_id,
            },
            {
              paymentId: razorpay_payment_id,
              paymentStatus: PaymentStatus.FAILED,
              paymentDate: new Date(),
            },
            { new: true, runValidators: true, upsert: true },
          );

          return PAYMENT_FAILED;
        }
      } catch (error) {
        return PAYMENT_FAILED;
      }
    } catch (error) {
      throw new InternalServerErrorException('Error verifying payment');
    }
  }

  //SECTION - take miscellaneous Payment for admin panel
  async miscellaneousPayment(
    payload: MiscellaneousPaymentDto,
    staffId: string,
  ): Promise<string> {
    if (!mongoose.isValidObjectId(staffId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const {
      type,
      attendanceId,
      userId,
      amount,
      paymentType,
      chequeOrTransNo,
      feeType,
      batchId,
      attendanceDate,
    } = payload;

    const receipt = await this.generateReceiptNumber();
    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    //NOTE - if attendance then create order payment
    if (attendanceId) {
      const user = await this.userModel.findById(userId);

      const orderPayload = {
        userId,
        paymentStatus: PaymentStatus.PAID,
        totalPrice: amount,
        gst: 0,
        cgst: 0,
        sgst: 0,
        gstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        shippingCharge: 0,
        totalAmount: amount,
        paidAmount: amount,
        priceType: OfflineCoursePriceType.BASE_PRICE,
        orderType: OrderTypes.MANUAL,
        purchaseBy: user.type,
        feeType: FeeTypes.FINE,
        createdBy: userId,
      };

      const order_details = await this.orderModel.create({
        ...orderPayload,
        mkcOrderId: await this.generateOrderUniqueID(OrderGenerateType.PRODUCT),
      });

      await this.orderModel.findByIdAndUpdate(order_details._id, {
        $set: { parentOrderId: order_details._id },
      });

      //NOTE - create paymnet
      const payment = await this.paymentModel.create({
        orderId: order_details._id,
        userId,
        productAmount: amount,
        totalAmount: amount,
        totalAmtReceived: amount,
        paymentStatus: PaymentStatus.PAID,
        paymentType,
        chequeOrTransNo,
        receiptNumber: receipt,
        feeType,
        purchaseBy: user.type,
        createdBy: staffId,
      });

      if (type === ModeTypes.ONLINE) {
        const convertedDate = new Date(attendanceDate);
        convertedDate.setUTCHours(0, 0, 0, 0);

        await this.attendanceReportModel.updateMany(
          {
            batchId: new mongoose.Types.ObjectId(batchId),
            studentId: new mongoose.Types.ObjectId(userId),
            attendanceDate: convertedDate,
          },
          {
            $set: {
              attendance: LiveAttendanceType.PRESENT,
              isFinePaid: true,
              updatedBy: staffId,
            },
          },
        );

        //NOTE - update fine module
        await this.fineTrackerModel.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(userId),
            batchId: new mongoose.Types.ObjectId(batchId),
            isActiveForPayment: true,
            attendanceModel: SchemaReferenceType.ONLINE_ATTENDANCE,
          },
          {
            $set: {
              orderId: order_details._id,
              paymentId: payment._id,
              chequeOrTransNo,
              paymentDate: currentDate,
              receiptNumber: receipt,
              orderType: OrderTypes.MANUAL,
              paymentType,
              paymentStatus: PaymentStatus.PAID,
              isActiveForPayment: false,
              updatedBy: staffId,
              updatedByModel: SchemaReferenceType.STAFF,
            },
          },
        );
      } else {
        const attendance = await this.studentAttdnceModel.findByIdAndUpdate(
          attendanceId,
          {
            $set: {
              attendance: AttendanceTypes.PRESENT,
              isSuspended: false,
              isFinePaid: true,
            },
          },
        );

        //NOTE - update fine Tracker Model
        await this.fineTrackerModel.findOneAndUpdate(
          {
            userId: user._id,
            batchId: attendance.batchId,
            studentBatchId: attendance.studentBatchId,
            isActiveForPayment: true,
          },
          {
            $set: {
              orderId: order_details._id,
              paymentId: payment._id,
              chequeOrTransNo,
              paymentDate: currentDate,
              receiptNumber: receipt,
              orderType: OrderTypes.MANUAL,
              paymentType,
              paymentStatus: PaymentStatus.PAID,
              isActiveForPayment: false,
              updatedBy: staffId,
              updatedByModel: SchemaReferenceType.STAFF,
            },
          },
        );
      }
    } else {
      await this.paymentModel.create({
        userId,
        productAmount: amount,
        totalAmount: amount,
        totalAmtReceived: amount,
        paymentStatus: PaymentStatus.PAID,
        paymentType,
        chequeOrTransNo,
        receiptNumber: receipt,
        feeType,
        createdBy: staffId,
      });
    }

    return MISCELLANEOUS_PAYMENT_SUCCESS;
  }

  //SECTION - get miscellaneous Payment details of user
  async getMiscellaneousPayment(
    payload: GetStudentOfflineCourseDto,
    userId: string,
    userType: UserType,
    studentId: string,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit } = payload;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let usersId: string;
    if (userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      usersId = studentId;
    } else {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      usersId = userId;
    }

    //NOTE - get payment count
    const count = await this.paymentModel.countDocuments({
      userId: usersId,
      feeType: { $nin: [FeeTypes.PRODUCT_PURCHASE, FeeTypes.HOSTEL_PAYMENT] },
    });

    //NOTE - find all payment data
    const paymentDetails: any[] = await this.paymentModel
      .find({
        userId: usersId,
        feeType: { $nin: [FeeTypes.PRODUCT_PURCHASE, FeeTypes.HOSTEL_PAYMENT] },
      })
      .populate([{ path: 'userId', select: 'name' }])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-userId')
      .lean();

    //NOTE - push final data
    const response = paymentDetails.map((item) => {
      return {
        _id: item._id,
        user: item.userId?.name,
        totalAmount: item.totalAmount,
        paymentDate: item.paymentDate,
        paymentType: item.paymentType,
        paymentStatus: item.paymentStatus,
        chequeOrTransNo: item.chequeOrTransNo,
        feeType: item.feeType,
      };
    });

    return { data: response, count };
  }

  //SECTION - revoke Miscellaneous Payment of user
  async revokeMiscellaneousPayment(
    payload: GetStudentOfflineCourseDto,
    userId: string,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - check staff is valid or not
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    const { page, limit } = payload;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - get payment count
    const count = await this.paymentModel.countDocuments({
      userId,
      feeType: { $nin: [FeeTypes.PRODUCT_PURCHASE, FeeTypes.HOSTEL_PAYMENT] },
    });

    //NOTE - find all payment data
    const paymentDetails: any[] = await this.paymentModel
      .find({
        userId,
        feeType: { $nin: [FeeTypes.PRODUCT_PURCHASE, FeeTypes.HOSTEL_PAYMENT] },
      })
      .populate([{ path: 'userId', select: 'name' }])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-userId')
      .lean();

    //NOTE - push final data
    const response = paymentDetails.map((item) => {
      return {
        _id: item._id,
        user: item.userId?.name,
        totalAmount: item.totalAmount,
        paymentDate: item.paymentDate,
        paymentType: item.paymentType,
        paymentStatus: item.paymentStatus,
        chequeOrTransNo: item.chequeOrTransNo,
        feeType: item.feeType,
      };
    });

    return { data: response, count };
  }
  //SECTION - student online / offline course change of user by staff
  async studentCourseChange(
    payload: CreateCourseChangeDto,
    staffId: string,
  ): Promise<string> {
    const {
      studentId,
      currentCourseId,
      previousCourseId,
      previousbatchId,
      currentbatchId,
      paymentId,
      type,
      isPayment,
    } = payload;

    if (previousCourseId === currentCourseId)
      throw new HttpException(SAME_COURSE, HttpStatus.BAD_REQUEST);

    // NOTE - get current course details
    const courseData: any = await this.onlineCourseModel
      .findById(currentCourseId)
      .populate([
        {
          path: 'priceId',
          select: 'totalPrice mrpPrice gst discountPercentage discountedPrice',
        },
        { path: 'batchId', select: 'batchDurationType duration endDate' },
      ]);

    if (type !== courseData.type)
      throw new HttpException(COURSE_TYPE, HttpStatus.BAD_REQUEST);

    if (isPayment) {
      const paymentHistory: any = await this.paymentModel
        .findById(paymentId)
        .populate([{ path: 'courseId', select: 'title' }]);

      const orderId = await this.createOrderForChangedCourse(
        studentId,
        courseData,
        paymentHistory,
        staffId,
      );

      const paymentData = {
        priceType: OfflineCoursePriceType.DISCOUNT_PRICE,
      };
      const { gstAmount, totalPrice } = await this.generatePriceAmounts(
        paymentData,
        courseData,
      );

      await this.offlineCoursePaymentModel.findOneAndUpdate(
        { parentOrderId: paymentHistory.orderId },
        {
          $set: {
            transactionStatus:
              TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE,
          },
        },
      );

      // NOTE - calculate next payment date
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 6);
      currentDate.setHours(23, 59, 59, 999);

      const nextPaymentDate = currentDate;
      const outstanding = totalPrice - paymentHistory?.totalAmtReceived;

      //NOTE -  offline course payment details
      await this.offlineCoursePaymentModel.create({
        userId: studentId,
        parentId: paymentHistory?.parentId,
        orderId: orderId,
        parentOrderId: paymentHistory?.orderId,
        courseId: courseData?._id,
        productAmount: totalPrice,
        totalPrice: totalPrice,
        gst: courseData?.priceId?.gst,
        cgst: courseData?.priceId?.gst / 2,
        sgst: courseData?.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        discountPercentage: courseData?.priceId?.discountPercentage,
        discountedPrice: courseData?.priceId?.discountedPrice,
        outstandingAmount: outstanding,
        totalAmtReceived: paymentHistory?.totalAmtReceived,
        priceType: OfflineCoursePriceType.DISCOUNT_PRICE,
        nextPaymentDate,
        transactionStatus:
          outstanding > 0
            ? TransactionStatus.INSTALLMENT
            : TransactionStatus.INSTALLMENT_COMPLETE,
        purchaseBy: UserType.STUDENT,
        paymentStatus: PaymentStatus.PAID,
        paymentType: OfflinePaymentType.COURSE_CHANGE,
        productType:
          courseData?.type === ModeTypes.ONLINE
            ? ProductType.ONLINE_COURSE
            : ProductType.OFFLINE_COURSE,
        createdBy: staffId,
      });

      //NOTE: Determine the new batch ID based on the course type
      const newBatchId =
        courseData?.type === ModeTypes.ONLINE
          ? courseData?.batchId?._id.toString()
          : currentbatchId;

      // NOTE - assign new batch and update the Batch Details
      await this.updateBatchDetails(
        studentId,
        previousCourseId,
        currentCourseId,
        previousbatchId,
        newBatchId,
        paymentHistory?.orderId.toString(),
        paymentHistory?.orderId.toString(),
        staffId,
      );

      // NOTE - update user Product Details data
      await this.updateUserProductDetails(
        studentId,
        previousCourseId,
        courseData,
        paymentHistory,
        currentbatchId,
        paymentHistory?.orderId.toString(),
        paymentHistory?.orderId.toString(),
        staffId,
      );

      // NOTE - create timeline
      await this.timelineModel.create({
        userId: studentId,
        section: 'course change',
        reason: `${paymentHistory?.courseId?.title} to ${courseData?.title}`,
        createdBy: staffId,
      });
    } else {
      //NOTE - get payment history
      const paymentHistory: any = await this.offlineCoursePaymentModel
        .findById(paymentId)
        .populate([{ path: 'courseId', select: 'title' }]);

      const orderId = await this.createOrderForChangedCourse(
        studentId,
        courseData,
        paymentHistory,
        staffId,
      );

      const { gstAmount, totalPrice } = await this.generatePriceAmounts(
        paymentHistory,
        courseData,
      );
      // NOTE - calculate next payment date
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 6);
      currentDate.setHours(23, 59, 59, 999);

      const outstandingAmount =
        totalPrice > paymentHistory?.totalAmtReceived
          ? totalPrice - paymentHistory?.totalAmtReceived
          : 0;

      const nextPaymentDate =
        totalPrice > paymentHistory?.totalAmtReceived ? currentDate : null;

      //NOTE - update the previous paymnet details
      if (paymentHistory.transactionStatus === TransactionStatus.INSTALLMENT) {
        await this.offlineCoursePaymentModel.findByIdAndUpdate(
          paymentHistory._id,
          {
            $set: {
              transactionStatus:
                TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE,
            },
          },
        );
      }

      //NOTE -  offline course payment details
      await this.offlineCoursePaymentModel.create({
        userId: studentId,
        parentId: paymentHistory?.parentId,
        orderId,
        parentOrderId: orderId,
        courseId: courseData?._id,
        productAmount: totalPrice,
        totalPrice: paymentHistory?.totalAmtReceived,
        gst: courseData?.priceId?.gst,
        cgst: courseData?.priceId?.gst / 2,
        sgst: courseData?.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        discountPercentage: courseData?.priceId?.discountPercentage,
        discountedPrice: courseData?.priceId?.discountedPrice,
        outstandingAmount,
        totalAmtReceived: paymentHistory?.totalAmtReceived,
        priceType: paymentHistory?.priceType,
        nextPaymentDate,
        transactionStatus:
          outstandingAmount > 0
            ? TransactionStatus.INSTALLMENT
            : TransactionStatus.INSTALLMENT_COMPLETE,
        purchaseBy: paymentHistory?.purchaseBy,
        paymentStatus: PaymentStatus.PAID,
        paymentType: OfflinePaymentType.COURSE_CHANGE,
        productType:
          courseData?.type === ModeTypes.ONLINE
            ? ProductType.ONLINE_COURSE
            : ProductType.OFFLINE_COURSE,
        createdBy: staffId,
      });

      //NOTE: Determine the new batch ID based on the course type
      const newBatchId =
        courseData?.type === ModeTypes.ONLINE
          ? courseData?.batchId?._id.toString()
          : currentbatchId;

      // NOTE - assign new batch and update the Batch Details
      await this.updateBatchDetails(
        studentId,
        previousCourseId,
        currentCourseId,
        previousbatchId,
        newBatchId,
        paymentHistory?.parentOrderId.toString(),
        orderId,
        staffId,
      );

      // NOTE - update user Product Details data
      await this.updateUserProductDetails(
        studentId,
        previousCourseId,
        courseData,
        paymentHistory,
        currentbatchId,
        paymentHistory?.parentOrderId?.toString(),
        orderId,
        staffId,
      );

      // NOTE - create timeline
      await this.timelineModel.create({
        userId: studentId,
        section: 'course change',
        reason: `${paymentHistory?.courseId?.title} to ${courseData?.title}`,
        createdBy: staffId,
      });

      // NOTE - create timeline
      await this.timelineModel.create({
        userId: studentId,
        section: 'course change',
        reason: `${paymentHistory?.courseId?.title} to ${courseData?.title}`,
        createdBy: staffId,
      });
    }

    // NOTE - storing log
    await this.previousCourseHistoryModel.create({
      studentId,
      previousCourseId,
      currentCourseId,
      createdBy: staffId,
    });
    return COURSE_CHANGED;
  }

  private async createOrderForChangedCourse(
    studentId: string,
    courseData: any,
    payment: any,
    staffId: string,
  ): Promise<string> {
    let totalPrice: number;
    let basePrice: number;
    let gstAmount: number;
    let totalAmount: number;
    let paidAmount: number;

    if (payment?.productAmount === courseData?.priceId?.totalPrice) {
      totalPrice = courseData?.priceId?.totalPrice;
      basePrice = courseData?.priceId?.discountedPrice;
      gstAmount = totalPrice - basePrice;
      totalAmount = courseData.priceId?.totalPrice;
      paidAmount = courseData.priceId?.totalPrice;
    } else if (payment?.productAmount < courseData?.priceId?.totalPrice) {
      totalPrice = courseData?.priceId?.discountedPrice;
      totalAmount = courseData.priceId?.totalPrice;
      gstAmount = totalAmount - totalPrice;
      paidAmount = payment?.totalAmtReceived;
    } else if (payment?.productAmount > courseData?.priceId?.totalPrice) {
      totalPrice = courseData?.priceId?.totalPrice;
      basePrice = courseData?.priceId?.discountedPrice;
      gstAmount = totalPrice - basePrice;
      totalAmount = courseData.priceId?.totalPrice;
      paidAmount = payment?.totalAmtReceived;
    }

    //NOTE - create order payload
    const orderPayload = {
      userId: studentId,
      paymentStatus: PaymentStatus.PAID,
      onlineCourseDetails: [
        {
          onlineCourseId: courseData?._id,
          type: courseData?.type,
          languageId: courseData?.languageId,
          quantity: 1,
          productAmount:
            payment?.priceType === OfflineCoursePriceType.DISCOUNT_PRICE
              ? courseData.priceId?.totalPrice
              : courseData.priceId?.mrpPrice,
          totalPrice: totalAmount,
          gst: courseData.priceId?.gst,
          cgst: courseData.priceId?.gst / 2,
          sgst: courseData.priceId?.gst / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          discountPercentage: courseData.priceId?.discountPercentage,
          discountedPrice: basePrice,
          coins: courseData?.coins,
          paymentStatus: payment?.priceType,
        },
      ],
      totalPrice,
      parentOrderId: payment?.parentOrderId,
      gst: courseData.priceId?.gst,
      cgst: courseData.priceId?.gst / 2,
      sgst: courseData.priceId?.gst / 2,
      gstAmount,
      cgstAmount: gstAmount / 2,
      sgstAmount: gstAmount / 2,
      shippingCharge: 0,
      totalAmount,
      paidAmount,
      priceType: payment?.priceType,
      orderType: OrderTypes.COURSE_CHANGE,
      createdBy: staffId,
    };

    const order_details = new this.orderModel(orderPayload);
    order_details.mkcOrderId = await this.generateOrderUniqueID(
      OrderGenerateType.PRODUCT,
    );
    if (payment?.productAmount < courseData?.priceId?.totalPrice) {
      order_details.parentOrderId = order_details?._id;
    }
    const newOrder = await order_details.save();

    const oldPayment = await this.paymentModel.findOne({
      orderId: payment?.orderId,
    });
    // NOTE - calculate next payment date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 6);
    currentDate.setHours(23, 59, 59, 999);
    const nextPaymentDate = currentDate;

    //NOTE - payment table
    await this.paymentModel.create({
      orderId: order_details?._id,
      courseId: courseData?._id.toString(),
      userId: studentId,
      productAmount:
        payment?.priceType === OfflineCoursePriceType.DISCOUNT_PRICE
          ? courseData.priceId?.totalPrice
          : courseData.priceId?.mrpPrice,
      totalAmount,
      totalAmtReceived: payment?.totalAmtReceived,
      outstandingAmount:
        courseData?.priceId?.totalPrice - payment?.totalAmtReceived > 0
          ? courseData?.priceId?.totalPrice - payment?.totalAmtReceived
          : 0,
      chequeOrTransNo: oldPayment?.chequeOrTransNo,
      nextPaymentDate:
        courseData?.priceId?.totalPrice - payment?.totalAmtReceived > 0
          ? nextPaymentDate
          : null,
      paymentStatus: PaymentStatus.PAID,
      paymentType: oldPayment?.paymentType,
    });
    return newOrder._id;
  }

  //ANCHOR -  update User Product Details for course change of full payment
  private async updateUserProductDetails(
    studentId: string,
    previousCourseId: string,
    courseData: any,
    payment: any,
    currentbatchId: string,
    orderId: string,
    newOrderId: string,
    staffId: string,
  ): Promise<string> {
    let validUptoDate = new Date();

    let startDate = new Date(payment?.createdAt);
    startDate.setHours(0, 0, 0, 0);
    if (currentbatchId && courseData.type === ModeTypes.OFFLINE) {
      const batchDetails = await this.batchModel.findById(currentbatchId);
      if (batchDetails?.batchDurationType === BatchDurationType.DAYS) {
        //NOTE - calculate the course validity for user
        const paymentDate = new Date(payment?.createdAt);

        //NOTE -  Add duration in  the payment date to calculate Valid Upto date
        paymentDate.setDate(paymentDate.getDate() + batchDetails?.duration);

        //NOTE - Set time to end of the day cause course is valid untill the end of the day
        paymentDate.setHours(23, 59, 59, 999);
        validUptoDate = paymentDate;
      } else {
        validUptoDate = batchDetails?.endDate;
      }
    } else if (!currentbatchId && courseData.type === ModeTypes.OFFLINE) {
      validUptoDate = null;
      startDate = null;
    } else {
      if (courseData?.batchId?.batchDurationType === BatchDurationType.DAYS) {
        //NOTE - calculate the course validity for user
        const paymentDate = new Date(payment?.createdAt);

        //NOTE -  Add duration in  the payment date to calculate Valid Upto date
        paymentDate.setDate(
          paymentDate.getDate() + courseData?.batchId?.duration,
        );

        //NOTE - Set time to end of the day cause course is valid untill the end of the day
        paymentDate.setHours(23, 59, 59, 999);
        validUptoDate = paymentDate;
      } else {
        validUptoDate = courseData?.batchId?.endDate;
      }
    }
    //NOTE - update the user product details
    await this.userProductDetailsModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentId),
        onlineCourseId: new mongoose.Types.ObjectId(previousCourseId),
        orderId: new mongoose.Types.ObjectId(orderId),
      },
      {
        $set: {
          productType:
            courseData?.type === ModeTypes.ONLINE
              ? ProductType.ONLINE_COURSE
              : ProductType.OFFLINE_COURSE,
          batchId: currentbatchId
            ? currentbatchId
            : courseData?.type === ModeTypes.ONLINE
            ? courseData?.batchId?._id.toString()
            : null,
          orderId: newOrderId,
          onlineCourseId: courseData?._id,
          languageId: courseData?.languageId,
          startDate,
          validUpto: validUptoDate,
          haveAccess: true,
          updatedBy: staffId,
        },
      },
    );

    return UPDATE_DATA;
  }

  //ANCHOR -  update User Batch Details for course change of full payment
  private async updateBatchDetails(
    studentId: string,
    previousCourseId: string,
    currentCourseId: string,
    previousbatchId?: string,
    currentbatchId?: string,
    orderId?: string,
    newOrderId?: string,
    staffId?: string,
  ): Promise<string> {
    const updateData: any = {
      $set: {
        courseId: currentCourseId,
        orderId: new mongoose.Types.ObjectId(newOrderId),
        updatedBy: staffId,
      },
    };

    if (currentbatchId !== null) {
      const generateRollNumber = await this.generateStudentRollNumber(
        currentCourseId,
        currentbatchId,
      );
      const { masterRollNumber, masterBatchId } =
        await this.generateMasterRollNumber(currentbatchId);

      updateData.$set.batchId = currentbatchId;
      updateData.$set.masterRollNumber = masterRollNumber;
      updateData.$set.masterBatchId = masterBatchId;
      updateData.$set.rollNumber = generateRollNumber;
    } else {
      updateData.$set.batchId = null;
      updateData.$set.masterRollNumber = null;
      updateData.$set.masterBatchId = null;
      updateData.$set.rollNumber = null;
    }

    await this.studentBatchModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentId),
        courseId: new mongoose.Types.ObjectId(previousCourseId),
        orderId: new mongoose.Types.ObjectId(orderId),
      },
      updateData,
    );

    // NOTE - match assignedBatch and currentbatch
    if (previousbatchId) {
      // NOTE - update the batchdetails of previouse batch
      const prevBatch = await this.batchModel.findById(previousbatchId);
      await this.batchModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(previousbatchId),
        {
          $set: {
            occupiedSeats: prevBatch?.occupiedSeats - 1,
            remaningSeat: prevBatch?.remaningSeat + 1,
            updatedBy: staffId,
          },
        },
        { new: true },
      );
    }

    if (currentbatchId !== null) {
      const currentBatch = await this.batchModel.findById(currentbatchId);
      // NOTE - update the batchdetails of previous batch
      await this.batchModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(currentbatchId),
        {
          $set: {
            occupiedSeats: currentBatch.occupiedSeats + 1, // Increment by 1
            remaningSeat:
              currentBatch.remaningSeat > 0 ? currentBatch.remaningSeat - 1 : 0, // Decrement by 1
            updatedBy: staffId,
          },
        },
        { new: true },
      );
    }

    return UPDATE_DATA;
  }

  //SECTION -  download Payment Details
  async downloadPaymentDetails(query: ParsedQs): Promise<any> {
    const { fromDate, toDate } = query as unknown as {
      fromDate: Date;
      toDate: Date;
    };

    //NOTE - date based filter
    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};
    //NOTE - find all event applied data
    const paymentDetails: any = await this.paymentModel
      .find({ ...dateFilter, paymentStatus: PaymentStatus.PAID })
      .populate([
        { path: 'userId', select: 'name' },
        {
          path: 'orderId',
          select:
            'mkcOrderId orderType onlineCourseDetails testSeriesDetails eventDetails totalPrice gst gstAmount cgstAmount sgstAmount totalAmount walletAmount paidAmount couponAmount',
          populate: [
            {
              path: 'onlineCourseDetails',
              select: 'onlineCourseId',
              populate: [{ path: 'onlineCourseId', select: 'title' }],
            },
            {
              path: 'bookDetails',
              select: 'bookId',
              populate: [{ path: 'bookId', select: 'bookName' }],
            },
            {
              path: 'testSeriesDetails',
              select: 'testId',
              populate: [{ path: 'testId', select: 'title' }],
            },
            {
              path: 'eventDetails',
              select: 'eventId',
              populate: [{ path: 'eventId', select: 'eventName' }],
            },
          ],
        },
        { path: 'courseId', select: 'title type' },
        {
          path: 'createdBy',
          select: 'name',
          options: { model: 'User' },
        },
      ])
      .sort({ receiptNumber: -1, paymentDate: -1 })
      .lean();

    // // Sorting function to sort based on paymentDate and receiptNumber
    // const sortByPaymentDateAndReceiptNumber = (a, b) => {
    //   // Convert paymentDate to Date objects
    //   const dateA = new Date(a.paymentDate);
    //   const dateB = new Date(b.paymentDate);

    //   // Sort by paymentDate first
    //   if (dateA < dateB) return -1;
    //   if (dateA > dateB) return 1;

    //   // If paymentDate is the same, compare receiptNumber numerically
    //   const receiptNumberA = parseInt(a.receiptNumber);
    //   const receiptNumberB = parseInt(b.receiptNumber);
    //   return receiptNumberB - receiptNumberA;
    // };

    // // Sort paymentDetails array
    // paymentDetails.sort(sortByPaymentDateAndReceiptNumber);

    //NOTE -  Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Details');

    //NOTE - Defining headers
    worksheet.columns = [
      { header: 'DATE', key: 'item.paymentDate', width: 10 },
      { header: 'ROLL NO', key: 'item.newEnrollmentNumber', width: 35 },
      { header: 'NAME', key: 'item.userId.name', width: 35 },
      { header: 'COURSE NAME', key: 'item.courseId.title', width: 35 },
      { header: 'ORDER TYPE', key: 'item.orderId.orderType', width: 10 },
      { header: 'PAY MODE', key: 'item.paymentType', width: 10 },
      { header: 'RECEIPT NO', key: 'item.receiptNumber', width: 20 },
      { header: 'DD/CHQ/TRN NO', key: 'item.chequeOrTransNo', width: 20 },
      { header: 'Product Amount', key: 'item.totalAmount', width: 10 },
      { header: 'WalletAmount', key: 'item.walletAmount', width: 10 },
      { header: 'CouponAmount', key: 'item.couponAmount', width: 10 },
      { header: 'Non Taxable', key: 'item.totalPrice', width: 10 },
      { header: 'Taxable', key: 'item.discountedPrice', width: 10 },
      { header: 'CGST', key: 'item.cgstAmount', width: 10 },
      { header: 'SGST', key: 'item.sgstAmount', width: 10 },
      { header: 'Total', key: 'item.totalPrice', width: 10 },
      { header: 'Created By', key: 'item.createdBy', width: 10 },
    ];

    // NOTE - adding data as row
    await Promise.all(
      paymentDetails.map(async (item) => {
        //NOTE - get student batch
        const batch_details: any = await this.studentBatchModel.findOne({
          studentId: item.userId?._id,
          orderId: item.orderId?._id,
        });

        const productName = [];
        // Check if courseId is null
        if (item.courseId === null) {
          const onlineCourseDetails = item.orderId?.onlineCourseDetails;
          const bookDetails = item.orderId?.bookDetails;
          const testSeriesDetails = item.orderId?.testSeriesDetails;
          const eventDetails = item.orderId?.eventDetails;

          // Check if onlineCourseDetails exist
          if (onlineCourseDetails && onlineCourseDetails.length > 0) {
            productName.push(
              ...onlineCourseDetails.map(
                (detail: any) => detail.onlineCourseId?.title,
              ),
            );
          }
          // Check if bookDetails exist
          if (bookDetails && bookDetails.length > 0) {
            productName.push(
              ...bookDetails.map((detail: any) => detail.bookId?.bookName),
            );
          }
          // Check if testSeriesDetails exist
          if (testSeriesDetails && testSeriesDetails.length > 0) {
            productName.push(
              ...testSeriesDetails.map((detail: any) => detail.testId?.title),
            );
          }
          // Check if eventDetails exist
          if (eventDetails && eventDetails.length > 0) {
            productName.push(
              ...eventDetails.map((detail: any) => detail.eventId?.eventName),
            );
          }
        } else {
          // Use courseId.title as productName
          productName.push(item.courseId?.title);
        }

        let taxable = null;
        let cgst = null;
        let sgst = null;
        let notTaxable = null;
        let total = null;
        let walletAmount = null;
        let couponAmount = null;
        let productAmount = null;
        let createdBy = null;

        ///NOTE - taxable amount
        if (item.courseId === null) {
          productAmount = item.orderId?.totalAmount;
          walletAmount = item.orderId?.walletAmount;
          couponAmount = item.orderId?.couponAmount;

          const discountValue = walletAmount + couponAmount;

          createdBy =
            (item.orderId?.orderType === OrderTypes.AUTOMATION &&
              item.userId?.name) ||
            item?.createdBy[0]?.name ||
            null;

          if (discountValue > 0) {
            total = item.orderId?.paidAmount;

            const basePrice = total / (1 + item.orderId?.gst / 100);
            const gstAmount = total - basePrice;

            notTaxable = item.orderId?.gstAmount !== 0 ? '' : total - gstAmount; //NOTE - if gst is not 0
            taxable = item.orderId?.gstAmount === 0 ? '' : total - gstAmount; //NOTE - if gst is 0
            cgst = item.orderId?.gstAmount === 0 ? '' : gstAmount / 2;
            sgst = item.orderId?.gstAmount === 0 ? '' : gstAmount / 2;
          } else {
            total = item.orderId?.paidAmount;

            notTaxable =
              item.orderId?.gstAmount !== 0 ? '' : item.orderId?.totalPrice;
            taxable =
              item.orderId?.gstAmount === 0 ? '' : item.orderId?.totalPrice;
            cgst =
              item.orderId?.gstAmount === 0 ? '' : item.orderId?.cgstAmount;
            sgst =
              item.orderId?.gstAmount === 0 ? '' : item.orderId?.sgstAmount;
          }
        } else {
          //NOTE - get offline paymnet details
          const payment = await this.offlineCoursePaymentModel
            .findOne({
              receiptNumber: item.receiptNumber,
              userId: item.userId?._id.toString(),
            })
            .populate('createdBy', 'name');

          productAmount = payment?.productAmount;

          notTaxable = payment?.gstAmount !== 0 ? '' : payment?.totalPrice;
          taxable = payment?.gstAmount === 0 ? '' : payment?.discountedPrice;
          cgst = payment?.gstAmount === 0 ? '' : payment?.cgstAmount;
          sgst = payment?.gstAmount === 0 ? '' : payment?.sgstAmount;
          total = payment?.totalPrice;
          walletAmount = 0;
          couponAmount = 0;
          createdBy = payment?.createdBy?.name;
        }

        worksheet.addRow([
          item.paymentDate,
          batch_details?.newEnrollmentNumber,
          item.userId?.name,
          productName.join(', '), //TODO: Join product names with commas
          item.orderId?.orderType,
          item.paymentType,
          item.receiptNumber,
          item.chequeOrTransNo,
          productAmount,
          walletAmount,
          couponAmount,
          notTaxable,
          taxable,
          cgst,
          sgst,
          total,
          createdBy,
        ]);
      }),
    );

    //NOTE -  Save Excel workbook to a file (temporarily)
    const tempFilePath = path.join(__dirname, 'payment_details.xlsx');
    // NOTE - data is being transfer in a file
    await workbook.xlsx.writeFile(tempFilePath);
    return { data: tempFilePath };
  }

  //ANCHOR - create order in totalAmount is 0
  private async createOrderForZeroPayment(
    totalAmount: number,
    addressId: any,
    userId: string,
    parentId?: Types.ObjectId | null,
    type?: UserType,
  ): Promise<any> {
    //NOTE - get cart details based on the userId
    const cart_details: any = await this.cartModel
      .find({
        userId:
          type === UserType.PARENT ? parentId : new Types.ObjectId(userId),
      })
      .populate([
        { path: 'onlineCourseId', select: 'coins' },
        { path: 'bookId', select: 'coins' },
        { path: 'testId', select: 'coins' },
      ]);

    //NOTE - get paymnet summary details based on the userId
    const payment_summary: any = await this.paymentSummaryModel.findOne({
      userId: type === UserType.PARENT ? parentId : new Types.ObjectId(userId),
    });

    const checkCouponId = cart_details[0]?.couponId;

    if (checkCouponId !== null) {
      //NOTE - get currentdate to check expiry date is valide or not
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      //NOTE - push productType
      const productType = [
        ...new Set(cart_details.map((item) => item.productType)),
      ];

      const check_coupon = await this.couponModel.findOne({
        _id: checkCouponId,
        validFor: { $all: productType },
        minimumOrderPrice: { $lte: payment_summary?.amountToBePaid },
        expiryDate: { $gte: currentDate },
        availableCoupon: { $ne: 0 },
      });

      if (!check_coupon) {
        throw new HttpException(COUPON_APPLIED_FAILED, HttpStatus.BAD_REQUEST);
      }
    }

    //NOTE - course details
    const courseDetail = cart_details
      .filter(
        (item: any) =>
          item.productType === ProductType.ONLINE_COURSE ||
          item.productType === ProductType.OFFLINE_COURSE,
      )
      .map((item: any) => ({
        onlineCourseId: item.onlineCourseId._id,
        quantity: item.quantity,
        languageId: item.languageId,
        totalPrice: item.totalPrice,
        gst: item.gst,
        cgst: item.gst / 2,
        sgst: item.gst / 2,
        gstAmount: item.gstAmount,
        cgstAmount: item.gstAmount / 2,
        sgstAmount: item.gstAmount / 2,
        discountPercentage: item.discountPercentage,
        discountedPrice: item.discountedPrice,
        shippingCharge: item.shippingCharge,
        coins: item.onlineCourseId?.coins || 0,
        paymnetStatus: OfflineCoursePriceType.DISCOUNT_PRICE,
      }));

    //NOTE - book details
    const bookDetail = cart_details
      .filter((item: any) => item.productType === ProductType.BOOK)
      .map((item: any) => ({
        bookId: item.bookId._id,
        quantity: item.quantity,
        languageId: item.languageId,
        bookType: item.bookType,
        totalPrice: item.totalPrice,
        gst: item.gst,
        cgst: item.gst / 2,
        sgst: item.gst / 2,
        gstAmount: item.gstAmount,
        cgstAmount: item.gstAmount / 2,
        sgstAmount: item.gstAmount / 2,
        discountPercentage: item.discountPercentage,
        discountedPrice: item.discountedPrice,
        shippingCharge: item.shippingCharge,
        coins: item.bookId?.coins || 0,
        shippingStatus:
          item.bookType === BookType.PAPER_BACK
            ? ShippingStatusType.ORDERED
            : null,
      }));

    //NOTE - test details
    const testDetail = cart_details
      .filter((item: any) => item.productType === ProductType.TEST_SERIES)
      .map((item: any) => ({
        testId: item.testId._id,
        quantity: item.quantity,
        languageId: item.languageId,
        totalPrice: item.totalPrice,
        gst: item.gst,
        cgst: item.gst / 2,
        sgst: item.gst / 2,
        gstAmount: item.gstAmount,
        cgstAmount: item.gstAmount / 2,
        sgstAmount: item.gstAmount / 2,
        discountPercentage: item.discountPercentage,
        discountedPrice: item.discountedPrice,
        shippingCharge: item.shippingCharge,
        coins: item.testId?.coins || 0,
      }));

    //NOTE - payload for order
    const orderPayload = {
      userId,
      parentId,
      addressId,
      totalAmount: payment_summary.totalAmount,
      onlineCourseDetails: courseDetail,
      bookDetails: bookDetail,
      testSeriesDetails: testDetail,
      couponId: cart_details[0].couponId,
      couponAmount: payment_summary.discountedPrice,
      totalPrice: payment_summary.totalPrice,
      gst: payment_summary.gst,
      cgst: payment_summary.gst / 2,
      sgst: payment_summary.gst / 2,
      gstAmount: payment_summary.gstAmount,
      cgstAmount: payment_summary.gstAmount / 2,
      sgstAmount: payment_summary.gstAmount / 2,
      shippingCharge: payment_summary.shippingCharge,
      paidAmount: payment_summary.amountToBePaid,
      walletAmount: payment_summary.walletAmount,
      paymentStatus: PaymentStatus.PAID,
      paymentDate: new Date(),
      purchaseBy: type,
    };
    //NOTE - create order in db
    const order_details = new this.orderModel(orderPayload);
    order_details.mkcOrderId = await this.generateOrderUniqueID(
      OrderGenerateType.PRODUCT,
    );

    await order_details.save();

    const receipt = await this.generateReceiptNumber();

    //NOTE - enter payment details in payment table
    const payment_details = await this.paymentModel.create({
      orderId: order_details._id,
      orderNumber: order_details.id,
      userId,
      parentId,
      totalAmount,
      paymentStatus: PaymentStatus.PAID,
      paymentDate: new Date(),
      purchaseBy: type,
      receiptNumber: receipt,
    });

    //NOTE: Create a map to map product types to flags
    const productTypeToFlag = {
      [ProductType.BOOK]: 'isBookSold',
      [ProductType.TEST_SERIES]: 'isTestSeriesSold',
      [ProductType.ONLINE_COURSE]: 'isOnlineCourseSold',
      [ProductType.OFFLINE_COURSE]: 'isOfflineCourseSold',
    };

    //NOTE: Initialize flags
    const flags = {
      isBookSold: false,
      isTestSeriesSold: false,
      isOnlineCourseSold: false,
      isOfflineCourseSold: false,
    };

    //NOTE: Iterate through cart items and update flags
    for (const data of cart_details) {
      const flagName = productTypeToFlag[data.productType];
      if (flagName) {
        flags[flagName] = true;
      }
    }
    //NOTE - check if coins used or not
    let coinsUsed = 0;
    //NOTE: Fetch the current user data including the coins field
    const user = await this.userModel.findById(userId);
    if (order_details.walletAmount > 0) {
      coinsUsed = await this.calculateCoinsFromRupees(
        order_details.walletAmount,
      );

      //NOTE - if coins used then create a transaction
      await this.coinsTransactionModel.create({
        userId: user._id,
        orderId: order_details._id,
        debit: coinsUsed,
        transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
      });
    }

    //NOTE: Calculate the new coins value by subtracting coinsUsed from the existing coins
    const newCoins = user.coins - coinsUsed;

    //NOTE Define an object to hold the update data for the user table
    const userUpdateData: any = {
      isPurchased: true,
      isRegistered: true,
      registrationDate: new Date(),
      studentStatus: UserStatusTypes.ADMITTED,
      type: UserType.STUDENT,
      ...flags,
      coins: newCoins, // Update the coins field with the new value
    };

    //NOTE: Update the user table
    const update_user = await this.userModel.findOneAndUpdate(
      { _id: userId },
      userUpdateData,
      {
        new: true,
        runValidators: true,
        upsert: true,
      },
    );

    let couponId: null;
    //NOTE: Update user product deatils
    for (const data of cart_details) {
      const enrollment = await this.generateEnrollmentNumber();

      const userProductDetails: any = await this.userProductDetailsModel.create(
        {
          studentId: userId,
          productType: data.productType,
          bookId: data.productType === ProductType.BOOK ? data.bookId : null,
          onlineCourseId:
            data.productType === ProductType.ONLINE_COURSE ||
            data.productType === ProductType.OFFLINE_COURSE
              ? data.onlineCourseId
              : null,
          testId:
            data.productType === ProductType.TEST_SERIES ? data.testId : null,
          bookType:
            data.productType === ProductType.BOOK ? data.bookType : null,
          languageId: data.languageId,
          quantity: data.quantity,
          orderId: order_details._id,
          createdBy: userId,
        },
      );

      //NOTE - get course details
      const course_details = await this.onlineCourseModel.findById(
        data.onlineCourseId,
      );

      //NOTE - assign batch to student if online course buy
      if (data.productType === ProductType.ONLINE_COURSE) {
        const batchDetails = await this.batchModel.findById(
          course_details.batchId,
        );

        const generateRollNumber = await this.generateStudentRollNumber(
          data.onlineCourseId.toString(),
          course_details.batchId.toString(),
        );
        const { masterRollNumber, masterBatchId } =
          await this.generateMasterRollNumber(
            course_details.batchId.toString(),
          );
        await this.studentBatchModel.create({
          studentId: new mongoose.Types.ObjectId(userId),
          batchId: course_details.batchId,
          courseId: data.onlineCourseId,
          rollNumber: generateRollNumber,
          newEnrollmentNumber: enrollment,
          masterRollNumber: masterRollNumber,
          masterBatchId: masterBatchId,
          orderId: order_details._id,
          createdBy: userId,
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = today;

        let validUptoDate: Date;
        if (batchDetails?.batchDurationType === BatchDurationType.DAYS) {
          //NOTE -  Get the current date
          const currentDate = new Date();

          //NOTE -  Add duration in  the current date to calculate Valid Upto date
          currentDate.setDate(currentDate.getDate() + batchDetails?.duration);

          // NOTE - Set time to end of the day cause course is valid untill the end of the day
          currentDate.setHours(23, 59, 59, 999);
          validUptoDate = currentDate;
        } else {
          validUptoDate = batchDetails?.endDate;
        }

        //NOTE - update in user Product Details
        await this.userProductDetailsModel.findByIdAndUpdate(
          userProductDetails._id,
          {
            $set: {
              batchId: batchDetails._id,
              startDate,
              validUpto: validUptoDate,
            },
          },
        );

        await this.offlineCoursePaymentModel.create({
          userId,
          parentId: parentId,
          orderId: order_details?._id,
          parentOrderId: order_details?._id,
          courseId: data?.onlineCourseId,
          productAmount: data.onlineCourseId?.priceId?.totalPrice,
          totalPrice: data?.totalPrice,
          gst: data?.gst,
          cgst: data?.gst / 2,
          sgst: data?.gst / 2,
          gstAmount: data?.gstAmount,
          cgstAmount: data?.gstAmount / 2,
          sgstAmount: data?.gstAmount / 2,
          discountPercentage: data?.discountPercentage,
          discountedPrice: data?.discountedPrice,
          totalAmtReceived: order_details?.paidAmount,
          priceType: data?.payment_type,
          nextPaymentDate: data?.nextPaymentDate,
          receiptNumber: receipt,
          transactionStatus: TransactionStatus.FULL_PAYMENT,
          purchaseBy: type,
          productType: data.productType,
        });
      }

      //NOTE - if offline course payment
      if (data.productType === ProductType.OFFLINE_COURSE) {
        //NOTE - calculate the outstanding Amount
        const calculateOutstandingAmount =
          data.payment_type === OfflineCoursePriceType.PRE_BOOK
            ? data.onlineCourseId.priceId?.totalPrice - data.prebook_amount
            : 0;

        //NOTE - generate batch without  batchId
        await this.studentBatchModel.create({
          studentId: new mongoose.Types.ObjectId(userId),
          courseId: data.onlineCourseId,
          batchId: null,
          rollNumber: null,
          newEnrollmentNumber: enrollment,
          orderId: order_details._id,
          createdBy: userId,
        });

        await this.offlineCoursePaymentModel.create({
          userId,
          parentId,
          orderId: order_details?._id,
          parentOrderId: order_details?._id,
          courseId: data?.onlineCourseId,
          productAmount: data.onlineCourseId?.priceId?.totalPrice,
          totalPrice: data?.totalPrice,
          gst: data?.gst,
          cgst: data?.gst / 2,
          sgst: data?.gst / 2,
          gstAmount: data?.gstAmount,
          cgstAmount: data?.gstAmount / 2,
          sgstAmount: data?.gstAmount / 2,
          discountPercentage: data?.discountPercentage,
          discountedPrice: data?.discountedPrice,
          outstandingAmount: calculateOutstandingAmount,
          totalAmtReceived: order_details?.paidAmount,
          priceType: data?.payment_type,
          nextPaymentDate: data?.nextPaymentDate,
          receiptNumber: receipt,
          transactionStatus:
            data.payment_type === OfflineCoursePriceType.PRE_BOOK
              ? TransactionStatus.INSTALLMENT
              : TransactionStatus.FULL_PAYMENT,
          purchaseBy: type,
          productType: data.productType,
        });

        //NOTE - update the outstandingAmount amount
        await this.paymentModel.findOneAndUpdate(
          { orderId: order_details._id },
          {
            outstandingAmount:
              calculateOutstandingAmount + payment_details.outstandingAmount,
          },
          { new: true, runValidators: true, upsert: true },
        );
      }
      //NOTE - assign couponId
      couponId = data.couponId;

      if (
        ((data.productType === ProductType.ONLINE_COURSE ||
          data.productType === ProductType.OFFLINE_COURSE) &&
          data.onlineCourseId.coins !== 0) ||
        (data.productType === ProductType.BOOK && data.bookId.coins !== 0) ||
        (data.productType === ProductType.TEST_SERIES &&
          data.testId.coins !== 0)
      ) {
        //NOTE: Update coupon transaction
        await this.coinsTransactionModel.create({
          userId,
          orderId: order_details._id,
          credit:
            data.productType === ProductType.ONLINE_COURSE ||
            data.productType === ProductType.OFFLINE_COURSE
              ? data.onlineCourseId.coins
              : data.productType === ProductType.BOOK
              ? data.bookId.coins
              : data.testId.coins,
          transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
        });
        //NOTE: Update user coins
        await this.userModel.findOneAndUpdate(
          { _id: userId },
          {
            coins:
              data.productType === ProductType.ONLINE_COURSE ||
              data.productType === ProductType.OFFLINE_COURSE
                ? update_user.coins + data.onlineCourseId.coins
                : data.productType === ProductType.BOOK
                ? update_user.coins + data.bookId.coins
                : update_user.coins + data.testId.coins,
          },
          { new: true, runValidators: true, upsert: true },
        );
      }
    }

    if (couponId !== null) {
      const check_coupon = await this.couponModel.findById(couponId);
      //NOTE - update the coupon as applied
      const update_coupon = await this.couponModel.findOneAndUpdate(
        { _id: check_coupon._id },
        { appliedCoupon: check_coupon.appliedCoupon + 1 },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE -update availableCoupon
      await this.couponModel.findOneAndUpdate(
        { _id: check_coupon._id },
        {
          availableCoupon:
            update_coupon.numberOfIssued - update_coupon.appliedCoupon,
        },
        { new: true, runValidators: true, upsert: true },
      );

      //NOTE: update coupon transaction table
      await this.couponTransactionModel.create({
        userId,
        couponId: check_coupon._id,
        orderId: order_details._id,
        createdBy: userId,
      });
    }

    //NOTE: Remove all data from cart based on studentId
    await this.cartModel.deleteMany({
      userId: type === UserType.PARENT ? parentId : new Types.ObjectId(userId),
    });

    //NOTE - send order confirmation
    const orderData: any = await this.orderModel
      .findById(order_details._id)
      .populate([
        { path: 'userId', select: 'phone' },
        { path: 'parentId', select: 'phone' },
      ])
      .select('paidAmount mkcOrderId');

    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() + 5, createdAt.getMinutes() + 30);

    const phoneNumbers = [
      { phone: orderData.userId.phone, sendTo: NotificationSendType.USER },
    ];

    if (orderData?.parentId?.phone) {
      phoneNumbers.push({
        phone: orderData.parentId.phone,
        sendTo: NotificationSendType.PARENT,
      });
    }

    // NOTE - send message of order confirmation
    await Promise.all(
      phoneNumbers.map(async ({ phone, sendTo }) => {
        const variables = {
          amount: orderData.paidAmount,
          order: orderData.mkcOrderId,
          phone: '9696330033',
        };

        const message = await this.smsService.replaceMessagesContent({
          message: ORDER_CONFIRMATION_MESSAGE,
          variables,
        });

        //NOTE - entry on communication model
        await this.communicationModel.create({
          userId: new mongoose.Types.ObjectId(orderData?.userId._id),
          userModel: SchemaReferenceType.USER,
          mobile: phone,
          notificationType: NotificationTypes.SMS,
          sendTo: sendTo,
          message,
          createdAt,
        });

        // Send order confirmation message
        await this.smsService.messageOnOrderConfirmation({
          amount: orderData.paidAmount,
          orderId: orderData.mkcOrderId,
          phone: '9696330033',
          number: phone,
        });
      }),
    );

    //NOTE -check in token table user details
    const token = await this.tokenModel.findOne({ userId });

    if (
      update_user.type === UserType.STUDENT &&
      token.userType === UserType.ENQUIRY
    ) {
      //NOTE: check token , if exist then update the token
      await this.tokenModel.findByIdAndUpdate(
        { userId },
        { userType: UserType.STUDENT },
        { new: true, runValidators: true, upsert: true },
      );
    }
    return totalAmount;
  }

  //ANCHOR -generate receipt for user
  private async pdfGenerator(jsonData: any): Promise<string> {
    try {
      // NOTE - sending to a functionn to render the data and send back html
      const htmlString = await this.commonService.pdfGenerator(jsonData);

      const pdfOptions: any = {
        format: 'A4', //TODO: Set the paper size to A5
      };
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        pdf.create(htmlString, pdfOptions).toBuffer((err, buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(buffer);
          }
        });
      });

      const binaryData = pdfBuffer.reduce(
        (data, byte) => data + String.fromCharCode(byte),
        '',
      );

      const base64String = btoa(binaryData);
      const dataURI = `data:application/pdf;base64,${base64String}`;
      let uploadImage = null;
      if (dataURI && dataURI.includes('base64')) {
        uploadImage = await this.commonService.uploadFileInS3Bucket(
          dataURI,
          PAYMENT_RECEIPT,
        );
      }
      return uploadImage;
    } catch (error) {
      throw error;
    }
  }

  //ANCHOR - get student status based on the product added in cart
  private async getStudentStatusBasedOnCart(
    cart: any,
    studentId: string,
  ): Promise<string> {
    const user = await this.userModel.findById(studentId);

    //TODO: Check if the user's existing status is 'PreBook', 'conversation', or 'admitted'
    if ([UserStatusTypes.ADMITTED].includes(user.studentStatus)) {
      return user.studentStatus;
    }

    //NOTE: Initialize variables to keep track of product types
    let hasBook = false;
    let hasTest = false;

    // Check each item in the cart
    for (const item of cart) {
      if (item.productType === ProductType.ONLINE_COURSE) {
        return UserStatusTypes.ADMITTED;
      } else if (item.productType === ProductType.BOOK) {
        hasBook = true;
      } else if (item.productType === ProductType.TEST_SERIES) {
        hasTest = true;
      } else if (item.productType === ProductType.OFFLINE_COURSE) {
        if (item.payment_type === OfflineCoursePriceType.PRE_BOOK) {
          const course_details = await this.onlineCourseModel
            .findById(item.onlineCourseId._id)
            .populate([{ path: 'priceId', select: 'totalPrice' }]);

          const amountPercentage = course_details.priceId.totalPrice / 2;

          if (item.prebook_amount >= amountPercentage) {
            return UserStatusTypes.ADMITTED;
          } else {
            return UserStatusTypes.PRE_BOOK;
          }
        } else {
          return UserStatusTypes.ADMITTED;
        }
      }
    }

    //NOTE: If both product types are found, no need to check further
    if (hasBook && hasTest) {
      return UserStatusTypes.CONVERSION;
    }

    // Determine the status based on product types found
    if (hasBook) {
      return UserStatusTypes.BOOK_SOLD;
    } else if (hasTest) {
      return UserStatusTypes.TEST_SOLD;
    } else {
      return UserStatusTypes.ADMITTED; // Handle the case when the cart is empty or contains other product types
    }
  }

  //ANCHOR - get student status based on the product added in cart
  private async getStudentStatusForManualUpdate(
    cart: any,
    studentId: string,
  ): Promise<string> {
    const user = await this.userModel.findById(studentId);

    //TODO: Check if the user's existing status is 'PreBook', 'conversation', or 'admitted'
    if ([UserStatusTypes.ADMITTED].includes(user.studentStatus)) {
      return user.studentStatus;
    }

    //NOTE: Initialize variables to keep track of product types
    let hasBook = false;
    let hasTest = false;

    // Check each item in the cart
    for (const item of cart) {
      const productType =
        item.onlineCourseId !== undefined && item.type === ModeTypes.OFFLINE
          ? ProductType.OFFLINE_COURSE
          : item.onlineCourseId !== undefined && item.type === ModeTypes.ONLINE
          ? ProductType.ONLINE_COURSE
          : item.bookId !== undefined
          ? ProductType.BOOK
          : ProductType.TEST_SERIES;

      if (productType === ProductType.ONLINE_COURSE) {
        return UserStatusTypes.ADMITTED;
      } else if (productType === ProductType.BOOK) {
        hasBook = true;
      } else if (productType === ProductType.TEST_SERIES) {
        hasTest = true;
      } else if (productType === ProductType.OFFLINE_COURSE) {
        if (item.payment_type === OfflineCoursePriceType.PRE_BOOK) {
          const course_details = await this.onlineCourseModel
            .findById(item.onlineCourseId)
            .populate([{ path: 'priceId', select: 'totalPrice' }]);

          const amountPercentage = course_details.priceId.totalPrice / 2;

          if (item.prebook_amount >= amountPercentage) {
            return UserStatusTypes.ADMITTED;
          } else {
            return UserStatusTypes.PRE_BOOK;
          }
        } else {
          return UserStatusTypes.ADMITTED;
        }
      }
    }

    //NOTE: If both product types are found, no need to check further
    if (hasBook && hasTest) {
      return UserStatusTypes.CONVERSION;
    }

    // Determine the status based on product types found
    if (hasBook) {
      return UserStatusTypes.BOOK_SOLD;
    } else if (hasTest) {
      return UserStatusTypes.TEST_SOLD;
    } else {
      return UserStatusTypes.ADMITTED; // Handle the case when the cart is empty or contains other product types
    }
  }

  //ANCHOR - get student status based on the product added in cart
  private async getStudentForOfflinePayment(
    isPreBook: boolean,
    productAmount: number,
    amount: number,
    userId: string,
  ): Promise<UserStatusTypes> {
    //NOTE - if full payment
    if (isPreBook === false) {
      return UserStatusTypes.ADMITTED;
    } else {
      const user = await this.userModel.findById(userId);

      //TODO: Check if the user's existing status is admitted
      if ([UserStatusTypes.ADMITTED].includes(user.studentStatus)) {
        return user.studentStatus;
      }

      const amountPaidPercentage = productAmount / 2;

      if (amount >= amountPaidPercentage) {
        return UserStatusTypes.ADMITTED;
      } else {
        return UserStatusTypes.PRE_BOOK;
      }
    }
  }

  //ANCHOR - generate EnrollMent Number
  private async generateEnrollmentNumber(): Promise<string> {
    try {
      const currentYearLastTwoDigits = new Date()
        .getFullYear()
        .toString()
        .slice(-2);

      const lastStudent = await this.studentBatchModel.aggregate([
        {
          $match: { newEnrollmentNumber: { $exists: true, $ne: null } },
        },
        {
          $group: {
            _id: null,
            maxEnrollmentNumber: { $max: '$newEnrollmentNumber' },
          },
        },
        {
          $project: {
            _id: 0,
            maxEnrollmentNumber: 1,
          },
        },
      ]);

      const lastEnrollmentNumber =
        lastStudent.length > 0 ? lastStudent[0].maxEnrollmentNumber : null;

      let newCounter: number;
      let yearPart: string;

      if (
        !lastEnrollmentNumber ||
        !lastEnrollmentNumber.startsWith(currentYearLastTwoDigits)
      ) {
        yearPart = currentYearLastTwoDigits;
        newCounter = 1;
      } else {
        const counter = parseInt(lastEnrollmentNumber.slice(-4));
        if (counter >= 9999) {
          yearPart = (parseInt(currentYearLastTwoDigits) + 1).toString();
          newCounter = 1;
        } else {
          yearPart = currentYearLastTwoDigits;
          newCounter = counter + 1;
        }
      }

      const newEnrollmentNumber = `${yearPart}${newCounter
        .toString()
        .padStart(4, '0')}`;

      return newEnrollmentNumber;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

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

  //SECTION - update payment status
  async updatePaymentStatus(
    id: string,
    payload: UpdatePaymentStatusDto,
    staffId: string,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const { updateSource, paymentStatus, razorpay_payment_id } = payload;

    const productDetails = [];

    if (updateSource === PaymentUpdateSourceType.ORDER) {
      const order = await this.orderModel.findById(id);

      if (!order)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      const detailArrays = [
        order.onlineCourseDetails,
        order.testSeriesDetails,
        order.bookDetails,
      ];

      for (const detailArray of detailArrays) {
        if (detailArray.length > 0) {
          productDetails.push(...detailArray.map((data) => data));
        }
      }

      if (
        order?.paymentStatus === PaymentStatus.PAID &&
        paymentStatus === PaymentStatus.PAID
      )
        throw new HttpException(RECORD_ALREADY_PAID, HttpStatus.BAD_REQUEST);
    } else if (updateSource === PaymentUpdateSourceType.PAYMENT) {
      const payment = await this.paymentModel.findById(id);

      if (!payment)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      if (
        payment?.paymentStatus === PaymentStatus.PAID &&
        paymentStatus === PaymentStatus.PAID
      )
        throw new HttpException(RECORD_ALREADY_PAID, HttpStatus.BAD_REQUEST);
    }

    // NOTE - generate receipt
    const receipt = await this.generateReceiptNumber();

    // NOTE - update paymnet status in order table
    const orderDetails = await this.orderModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          'bookDetails.$[elem].shippingStatus': ShippingStatusType.ORDERED,
        },
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date(),
        updatedBy: staffId,
      },
      {
        new: true,
        upsert: true,
        arrayFilters: [
          {
            'elem.bookType': BookType.PAPER_BACK, // Filter to match only "paperback" book type
          },
        ],
      },
    );

    //NOTE - update paymnet status in payment table
    const paymentDetails = await this.paymentModel.findOneAndUpdate(
      { orderId: orderDetails._id, orderNumber: orderDetails.orderNumber },
      {
        receiptNumber: receipt,
        paymentId: razorpay_payment_id,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date(),
        updatedBy: staffId,
      },
      { new: true, runValidators: true, upsert: true },
    );

    //NOTE: check details in fine Trackers
    const fine = await this.fineTrackerModel.findOne({
      orderId: orderDetails._id,
      paymentId: paymentDetails._id,
    });

    //NOTE - if fine for attendance, tthen update accordingly
    if (fine) {
      if (fine.attendanceModel === SchemaReferenceType.ONLINE_ATTENDANCE) {
        await this.attendanceReportModel.updateMany(
          {
            batchId: fine.batchId,
            studentId: fine.userId,
            attendanceDate: fine.attendanceDate,
          },
          {
            $set: {
              attendance: LiveAttendanceType.PRESENT,
              isFinePaid: true,
              updatedBy: staffId,
            },
          },
        );
      } else {
        //NOTE - attendance Model update
        await this.studentAttdnceModel.findByIdAndUpdate(fine.attendanceId, {
          $set: {
            isFinePaid: true,
            isNotRusticated: true,
            isSuspended: false,
            attendance: AttendanceTypes.PRESENT,
          },
        });
      }

      await this.fineTrackerModel.findByIdAndUpdate(fine._id, {
        $set: {
          razorpay_payment_id: razorpay_payment_id,
          receiptNumber: receipt,
          orderType: OrderTypes.AUTOMATION,
          paymentType: OfflinePaymentType.UPI,
          paymentStatus: PaymentStatus.PAID,
          isActiveForPayment: false,
          updatedBy: staffId,
          updatedByModel: SchemaReferenceType.STAFF,
        },
      });
    }

    //NOTE - get user details
    const studentId = paymentDetails.userId;

    //NOTE - get parent details
    const parentId = paymentDetails.parentId;
    if (
      Array.isArray(orderDetails.eventDetails) &&
      orderDetails.eventDetails.length === 0
    ) {
      //NOTE: Create a map to map product types to flags
      const productTypeToFlag = {
        [ProductType.BOOK]: 'isBookSold',
        [ProductType.TEST_SERIES]: 'isTestSeriesSold',
        [ProductType.ONLINE_COURSE]: 'isOnlineCourseSold',
        [ProductType.OFFLINE_COURSE]: 'isOfflineCourseSold',
      };

      //NOTE: Initialize flags
      const flags = {
        isBookSold: false,
        isTestSeriesSold: false,
        isOnlineCourseSold: false,
        isOfflineCourseSold: false,
      };

      //NOTE: Iterate through cart items and update flags
      let flagName: string;
      for (const data of productDetails) {
        if (data.onlineCourseId !== undefined) {
          if (data.type === ModeTypes.OFFLINE) {
            flagName = productTypeToFlag[ProductType.OFFLINE_COURSE];
          } else {
            flagName = productTypeToFlag[ProductType.ONLINE_COURSE];
          }
        }

        if (data.bookId !== undefined) {
          flagName = productTypeToFlag[ProductType.BOOK];
        }

        if (data.testId !== undefined) {
          flagName = productTypeToFlag[ProductType.TEST_SERIES];
        }
        if (flagName) {
          flags[flagName] = true;
        }
      }

      // NOTE - Check if produck has a paperback book, if yes, then generate an invoice number and update the payment
      for (const data of productDetails) {
        if (data.bookId !== undefined && data.bookType == BookType.PAPER_BACK) {
          const invoiceNo = this.commonService.genereatInvoiceNumber();
          await this.paymentModel.findOneAndUpdate(
            { orderId: orderDetails._id },
            { $set: { invoiceNumber: invoiceNo } },
          );
          break;
        }
      }

      // NOTE - check if coins used or not
      let coinsUsed = 0;

      //NOTE: Fetch the current user data including the coins field
      const user = await this.userModel.findById(studentId);

      if (orderDetails.walletAmount > 0) {
        coinsUsed = await this.calculateCoinsFromRupees(
          orderDetails.walletAmount,
        );

        //NOTE - if coins used then create a transaction
        await this.coinsTransactionModel.create({
          userId: user._id,
          orderId: orderDetails._id,
          debit: coinsUsed,
          transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
        });
      }

      //NOTE: Calculate the new coins value by subtracting coinsUsed from the existing coins
      const newCoins = user.coins - coinsUsed;

      //NOTE - get user status
      const userUpdateStatus = await this.getStudentStatusForManualUpdate(
        productDetails,
        studentId.toString(),
      );

      //NOTE Define an object to hold the update data for the user table
      const userUpdateData: any = {
        isPurchased: true,
        isRegistered: true,
        registrationDate: new Date(),
        studentStatus: userUpdateStatus,
        type:
          userUpdateStatus === UserStatusTypes.ADMITTED
            ? UserType.STUDENT
            : UserType.ENQUIRY,
        ...flags,
        coins: newCoins, // Update the coins field with the new value
      };

      //NOTE: Update the user table
      const update_user = await this.userModel.findOneAndUpdate(
        { _id: studentId },
        userUpdateData,
        { new: true, runValidators: true, upsert: true },
      );

      // let couponId: any;
      //NOTE :Update user product deatils
      for (const data of productDetails) {
        const enrollment = await this.generateEnrollmentNumber();

        const productType =
          data.onlineCourseId !== undefined && data.type === ModeTypes.OFFLINE
            ? ProductType.OFFLINE_COURSE
            : data.onlineCourseId !== undefined &&
              data.type === ModeTypes.ONLINE
            ? ProductType.ONLINE_COURSE
            : data.bookId !== undefined
            ? ProductType.BOOK
            : ProductType.TEST_SERIES;

        const userProductDetails: any =
          await this.userProductDetailsModel.create({
            studentId,
            productType,
            orderId: orderDetails._id,
            bookId: productType === ProductType.BOOK ? data.bookId : null,
            onlineCourseId:
              productType === ProductType.ONLINE_COURSE ||
              productType === ProductType.OFFLINE_COURSE
                ? data.onlineCourseId
                : null,
            testId:
              productType === ProductType.TEST_SERIES ? data.testId : null,
            bookType: productType === ProductType.BOOK ? data.bookType : null,
            languageId: data.languageId,
            quantity: data.quantity,
            createdBy: studentId,
          });

        let course_details;
        if (data.onlineCourseId !== undefined) {
          //NOTE - get course details
          course_details = await this.onlineCourseModel.findById(
            data.onlineCourseId,
          );
        }

        //NOTE - assign batch to student if online course buy
        if (productType === ProductType.ONLINE_COURSE) {
          const generateRollNumber = await this.generateStudentRollNumber(
            data.onlineCourseId,
            course_details.batchId.toString(),
          );
          const { masterRollNumber, masterBatchId } =
            await this.generateMasterRollNumber(
              course_details.batchId.toString(),
            );
          await this.studentBatchModel.create({
            studentId: new mongoose.Types.ObjectId(studentId),
            batchId: course_details.batchId,
            courseId: data.onlineCourseId,
            rollNumber: generateRollNumber,
            masterRollNumber: masterRollNumber,
            masterBatchId: masterBatchId,
            newEnrollmentNumber: enrollment,
            orderId: orderDetails._id,
            createdBy: staffId,
          });

          const student: any = await this.studentBatchModel
            .findOne({
              studentId: new mongoose.Types.ObjectId(studentId),
              courseId: data.onlineCourseId,
            })
            .populate([
              { path: 'batchId', select: 'batchDurationType duration endDate' },
            ]);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = today;

          let validUptoDate: Date;
          if (student?.batchId?.batchDurationType === BatchDurationType.DAYS) {
            //NOTE -  Get the current date
            const currentDate = new Date();
            //NOTE -  Add duration in  the current date to calculate Valid Upto date
            currentDate.setDate(
              currentDate.getDate() + student?.batchId?.duration,
            );
            // NOTE - Set time to end of the day cause course is valid untill the end of the day
            currentDate.setHours(23, 59, 59, 999);
            validUptoDate = currentDate;
          } else {
            validUptoDate = student?.batchId?.endDate;
          }

          await this.userProductDetailsModel.findByIdAndUpdate(
            userProductDetails._id,
            {
              $set: {
                batchId: student?.batchId?._id,
                startDate: startDate,
                validUpto: validUptoDate,
              },
            },
          );

          await this.offlineCoursePaymentModel.create({
            userId: studentId,
            parentId: parentId,
            orderId: orderDetails?._id,
            parentOrderId: orderDetails?._id,
            courseId: data?.onlineCourseId,
            productType: ProductType.ONLINE_COURSE,
            productAmount: data.productAmount,
            totalPrice: data?.totalPrice,
            gst: data?.gst,
            cgst: data?.gst / 2,
            sgst: data?.gst / 2,
            gstAmount: data?.gstAmount,
            cgstAmount: data?.gstAmount / 2,
            sgstAmount: data?.gstAmount / 2,
            discountPercentage: data?.discountPercentage,
            discountedPrice: data?.discountedPrice,
            outstandingAmount: 0,
            totalAmtReceived: orderDetails?.paidAmount,
            priceType: OfflineCoursePriceType.DISCOUNT_PRICE,
            nextPaymentDate: null,
            receiptNumber: receipt,
            transactionStatus: TransactionStatus.FULL_PAYMENT,
            purchaseBy: paymentDetails.purchaseBy,
            createdBy: staffId,
          });
        }

        //NOTE - update the coins transaction if coins is not 0
        if (data.coins !== 0) {
          //NOTE: Update coupon transaction
          await this.coinsTransactionModel.create({
            userId: studentId,
            orderId: orderDetails._id,
            credit: data.coins,
            transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
          });
          //NOTE: Update user coins
          await this.userModel.findOneAndUpdate(
            { _id: studentId },
            {
              coins: update_user.coins + data.coins,
            },
            { new: true, runValidators: true, upsert: true },
          );
        }

        //NOTE - if offline course payment
        if (productType === ProductType.OFFLINE_COURSE) {
          //NOTE - calculate the outstanding Amount
          const calculateOutstandingAmount =
            data.paymnetStatus === OfflineCoursePriceType.PRE_BOOK
              ? data.productAmount - data.totalPrice
              : 0;

          //NOTE - generate batch without  batchId
          await this.studentBatchModel.create({
            studentId: new mongoose.Types.ObjectId(studentId),
            courseId: data.onlineCourseId,
            orderId: orderDetails._id,
            batchId: null,
            rollNumber: null,
            newEnrollmentNumber: enrollment,
            createdBy: staffId,
          });

          await this.offlineCoursePaymentModel.create({
            userId: studentId,
            parentId: parentId,
            orderId: orderDetails?._id,
            parentOrderId: orderDetails?._id,
            courseId: data?.onlineCourseId,
            productType: ProductType.OFFLINE_COURSE,
            productAmount: data.productAmount,
            totalPrice: data?.totalPrice,
            gst: data?.gst,
            cgst: data?.gst / 2,
            sgst: data?.gst / 2,
            gstAmount: data?.gstAmount,
            cgstAmount: data?.gstAmount / 2,
            sgstAmount: data?.gstAmount / 2,
            discountPercentage: data?.discountPercentage,
            discountedPrice: data?.discountedPrice,
            outstandingAmount: calculateOutstandingAmount,
            totalAmtReceived: orderDetails?.paidAmount,
            priceType:
              data.paymnetStatus === OfflineCoursePriceType.PRE_BOOK
                ? OfflineCoursePriceType.PRE_BOOK
                : OfflineCoursePriceType.DISCOUNT_PRICE,
            nextPaymentDate: null,
            receiptNumber: receipt,
            transactionStatus:
              data.paymnetStatus === OfflineCoursePriceType.PRE_BOOK
                ? TransactionStatus.INSTALLMENT
                : TransactionStatus.FULL_PAYMENT,
            purchaseBy: paymentDetails.purchaseBy,
            createdBy: staffId,
          });

          //NOTE - update the outstandingAmount amount
          await this.paymentModel.findOneAndUpdate(
            {
              orderId: orderDetails._id,
              orderNumber: orderDetails.orderNumber,
            },
            {
              outstandingAmount:
                calculateOutstandingAmount + paymentDetails.outstandingAmount,
            },
            { new: true, runValidators: true, upsert: true },
          );
        }
      }
    }

    //NOTE - send order confirmation
    const orderData: any = await this.orderModel
      .findById(id)
      .populate([
        { path: 'userId', select: 'phone' },
        { path: 'parentId', select: 'phone' },
      ])
      .select('paidAmount mkcOrderId');

    const phoneNumbers = [
      { phone: orderData.userId.phone, sendTo: NotificationSendType.USER },
    ];

    if (orderData?.parentId?.phone) {
      phoneNumbers.push({
        phone: orderData.parentId.phone,
        sendTo: NotificationSendType.PARENT,
      });
    }

    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() + 5, createdAt.getMinutes() + 30);

    // NOTE - send message of order confirmation
    for (const { phone, sendTo } of phoneNumbers) {
      const variables = {
        amount: orderData.paidAmount,
        order: orderData.mkcOrderId,
        phone: '9696330033',
      };

      const message = await this.smsService.replaceMessagesContent({
        message: ORDER_CONFIRMATION_MESSAGE,
        variables,
      });

      //NOTE - entry on communication model
      await this.communicationModel.create({
        userId: new mongoose.Types.ObjectId(orderData?.userId._id),
        userModel: SchemaReferenceType.USER,
        mobile: phone,
        notificationType: NotificationTypes.SMS,
        sendTo: sendTo,
        message,
        createdAt,
      });

      await this.smsService.messageOnOrderConfirmation({
        amount: orderData.paidAmount,
        orderId: orderData.mkcOrderId,
        phone: '9696330033',
        number: phone,
      });
    }

    return PAYMENT_SUCCESS;
  }

  //SECTION - get Users Have Installment
  async getUsersHaveInstallment(): Promise<{ data: any[] }> {
    //NOTE - get all user whose installment is not completed
    const users = await this.offlineCoursePaymentModel.aggregate([
      {
        $match: {
          transactionStatus: {
            $nin: [TransactionStatus.FULL_PAYMENT],
          },
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $group: {
          _id: { userId: '$userId', parentOrderId: '$parentOrderId' },
          latestDocument: { $first: '$$ROOT' },
        },
      },
      {
        $match: {
          'latestDocument.transactionStatus': {
            $nin: [
              TransactionStatus.INSTALLMENT_COMPLETE,
              TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE,
            ],
          },
        },
      },
      { $replaceRoot: { newRoot: '$latestDocument' } },
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
          as: 'userData',
        },
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { 'userData._id': { $exists: true } } },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 1,
          userId: '$userData._id',
          name: '$userData.name',
          phone: '$userData.phone',
        },
      },
    ]);

    return { data: users };
  }

  //SECTION - get Purchased Course By User
  async getPurchasedCourseByUser(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get student by id
    const student = await this.userModel.findById(id);
    if (!student)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE - get all the courses which are purchased by the student
    const products: any = await this.userProductDetailsModel
      .find({
        $or: [
          {
            productType: ProductType.ONLINE_COURSE,
            batchId: { $ne: null },
          },
          {
            productType: ProductType.OFFLINE_COURSE,
            batchId: { $eq: null },
          },
        ],
        studentId: new mongoose.Types.ObjectId(id),
      })
      .populate([{ path: 'onlineCourseId', select: 'title type' }]);

    const data = products?.map((product: any) => {
      return {
        _id: product?.onlineCourseId?._id,
        title: product?.onlineCourseId?.title,
        type: product?.onlineCourseId?.type,
        orderId: product?.orderId,
      };
    });

    return data;
  }

  //SECTION - convert into student to prebook
  async studentConvertor(
    payload: ConvertStudentDto,
    staffId: string,
  ): Promise<string> {
    const { orderId, studentId, courseId, batchId } = payload;

    // NOTE - check ids are valid or not
    if (
      !mongoose.isValidObjectId(orderId) ||
      !mongoose.isValidObjectId(studentId) ||
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(batchId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    //NOTE: check the payment details of the course
    const payment = await this.offlineCoursePaymentModel
      .findOne({
        userId: studentId,
        courseId: new mongoose.Types.ObjectId(courseId),
        parentOrderId: new mongoose.Types.ObjectId(orderId),
      })
      .sort({ createdAt: -1 });

    if (!payment) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    //NOTE: check batch details
    const batch_details = await this.batchModel.findOne({
      _id: new mongoose.Types.ObjectId(batchId),
      remaningSeat: { $ne: 0 },
    });

    if (!batch_details)
      throw new HttpException(BATCH_FULL_ERROR, HttpStatus.BAD_REQUEST);

    let validUptoDate: Date;
    if (batch_details?.batchDurationType === BatchDurationType.DAYS) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + batch_details?.duration);
      currentDate.setUTCHours(23, 59, 59, 999);
      validUptoDate = currentDate;
    } else {
      validUptoDate = batch_details?.endDate;
    }

    // Set time to the beginning of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = today;

    const { masterRollNumber, masterBatchId } =
      await this.generateMasterRollNumber(batchId);

    //NOTE: assign batch to the student
    await this.studentBatchModel.findOneAndUpdate(
      {
        orderId: new mongoose.Types.ObjectId(orderId),
        studentId: new mongoose.Types.ObjectId(studentId),
        courseId: new mongoose.Types.ObjectId(courseId),
      },
      {
        batchId,
        rollNumber: await this.generateStudentRollNumber(courseId, batchId),
        masterRollNumber: masterRollNumber,
        masterBatchId: masterBatchId,
        updatedBy: staffId,
      },
      { new: true, runValidators: true, upsert: true },
    );

    //NOTE: user product details to the student
    await this.userProductDetailsModel.findOneAndUpdate(
      {
        productType: payment.productType,
        studentId: studentId,
        onlineCourseId: courseId,
        orderId: orderId,
      },
      {
        batchId,
        startDate,
        validUpto: validUptoDate,
        haveAccess: true,
        updatedBy: staffId,
      },
      { new: true, runValidators: true, upsert: true },
    );
    await this.batchModel.findByIdAndUpdate(batch_details._id, {
      $set: {
        remaningSeat: batch_details?.remaningSeat - 1,
        occupiedSeats: batch_details?.occupiedSeats + 1,
        updatedBy: staffId,
      },
    });

    await this.userModel.findByIdAndUpdate(studentId, {
      $set: {
        studentStatus: UserStatusTypes.ADMITTED,
        type: UserType.STUDENT,
        updatedBy: staffId,
      },
    });
    // }
    return STUDENT_STATUS_UPDATE;
  }

  //SECTION - convert into student to prebook
  async preBookCourseChange(
    payload: PreBookStudentCourseChangeDto,
    staffId: string,
  ): Promise<any> {
    const { orderId, userId, previousCourseId, currentCourseId, productType } =
      payload;

    // NOTE - check ids are valid or not
    if (
      !mongoose.isValidObjectId(orderId) ||
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(previousCourseId) ||
      !mongoose.isValidObjectId(currentCourseId)
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get exsting order details
    const existingOrder: any = await this.orderModel.findById(orderId);

    //NOTE - get exsting course payment details
    const paymentDetails: any = await this.offlineCoursePaymentModel
      .findOne({
        userId,
        parentOrderId: existingOrder._id,
        courseId: new mongoose.Types.ObjectId(previousCourseId),
      })
      .sort({ createdAt: -1 });

    const isDiscountedPrice =
      paymentDetails.priceType === OfflineCoursePriceType.DISCOUNT_PRICE ||
      paymentDetails.priceType === OfflineCoursePriceType.PRE_BOOK;

    const isBasePrice =
      paymentDetails.priceType === OfflineCoursePriceType.BASE_PRICE;

    const isFullPayment =
      paymentDetails.transactionStatus === TransactionStatus.FULL_PAYMENT ||
      paymentDetails.transactionStatus ===
        TransactionStatus.INSTALLMENT_COMPLETE;

    //NOTE - get previous course details
    const previous_Course = await this.onlineCourseModel
      .findById(previousCourseId)
      .populate([
        {
          path: 'priceId',
          select: 'mrpPrice discountedPrice totalPrice discountPercentage gst',
        },
      ]);

    //NOTE - get course details
    const current_Course = await this.onlineCourseModel
      .findById(currentCourseId)
      .populate([
        {
          path: 'priceId',
          select: 'mrpPrice discountedPrice totalPrice discountPercentage gst',
        },
      ]);

    const previousCourseOrder = existingOrder.onlineCourseDetails
      .map((ele: any) => ele)
      .find(
        (ele: { onlineCourseId: any }) =>
          ele.onlineCourseId.toString() === previousCourseId,
      );

    const { totalPrice, gstAmount, paidAmount, totalAmount, basePrice } =
      await this.calculatePriceDetails(
        isFullPayment,
        isDiscountedPrice,
        isBasePrice,
        current_Course.priceId,
        paymentDetails.totalAmtReceived,
        previous_Course.priceId,
      );

    const { orderId: newOrderId } = await this.createOrderAndPaymentForPreBook(
      totalPrice,
      gstAmount,
      paidAmount,
      totalAmount,
      basePrice,
      userId,
      currentCourseId,
      productType,
      isBasePrice,
      isFullPayment,
      isDiscountedPrice,
      existingOrder,
      previousCourseOrder,
      current_Course,
      previous_Course,
      staffId,
      paymentDetails,
    );

    //NOTE Update the user document and increment the coins by current_Course.coins
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: {
        coins: current_Course.coins,
      },
    });

    //NOTE - create the coin transaction table
    await this.coinsTransactionModel.create({
      userId,
      orderId: newOrderId,
      credit: current_Course.coins,
      transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
    });

    const {
      rollNumber,
      masterRollNumber,
      masterBatchId,
      validUptoDate,
      startDate,
    } = await this.generateRollNumberAndValidUptoDate(
      currentCourseId,
      current_Course?.batchId?.toString(),
      current_Course.type,
    );
    //NOTE - update user product details table
    await this.userProductDetailsModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(userId),
        onlineCourseId: new mongoose.Types.ObjectId(previousCourseId),
        orderId: new mongoose.Types.ObjectId(orderId),
      },
      {
        $set: {
          productType:
            current_Course?.type === ModeTypes.ONLINE
              ? ProductType.ONLINE_COURSE
              : ProductType.OFFLINE_COURSE,
          batchId:
            current_Course?.type === ModeTypes.ONLINE
              ? current_Course.batchId
              : null,
          orderId: newOrderId,
          onlineCourseId: current_Course?._id,
          languageId: current_Course?.languageId,
          startDate,
          validUpto: validUptoDate,
          haveAccess: true,
          updatedBy: staffId,
        },
      },
    );

    //NOTE - update user product details table
    await this.studentBatchModel.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(previousCourseId),
        orderId: new mongoose.Types.ObjectId(orderId),
      },
      {
        $set: {
          batchId:
            current_Course?.type === ModeTypes.ONLINE
              ? current_Course.batchId
              : null,
          masterBatchId,
          orderId: newOrderId,
          courseId: current_Course?._id,
          rollNumber,
          masterRollNumber,
          updatedBy: staffId,
        },
      },
    );

    //NOTE - update user if online course
    if (current_Course.type === ModeTypes.ONLINE) {
      await this.userModel.findByIdAndUpdate(paymentDetails._id, {
        $set: {
          isRegistered: true,
          registrationDate: new Date(),
          isPurchased: true,
          studentStatus: UserStatusTypes.ADMITTED,
          type: UserType.STUDENT,
          isOnlineCourseSold: true,
          updatedBy: staffId,
        },
      });
    }

    // NOTE - create timeline
    await this.timelineModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      section: 'course change',
      reason: `${previous_Course?.title} to ${current_Course?.title}`,
      createdBy: staffId,
    });

    // NOTE - storing log
    await this.previousCourseHistoryModel.create({
      studentId: new mongoose.Types.ObjectId(userId),
      previousCourseId,
      currentCourseId,
      createdBy: staffId,
    });

    return PURCHASE_COURSE_UPDATED;
  }

  //SECTION - update Receipt Number
  async updateReceiptNumber(payload: UpdateReceiptNumberDto): Promise<any> {
    const { startDate, endDate } = payload;

    //NOTE - date based filter
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              $gte: new Date(startDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(endDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    //NOTE - find all payment data
    const paymentDetails: any[] = await this.paymentModel
      .find({
        ...dateFilter,
        paymentStatus: PaymentStatus.PAID,
      })
      .populate('orderId', 'orderType')
      .sort({ createdAt: 1 });

    let currentReceiptNumber = 2400000001;

    for (const data of paymentDetails) {
      const { _id, courseId, userId, totalAmount, paymentType, orderId } = data;

      if (orderId) {
        const { orderType } = orderId;

        if (
          paymentType !== OfflinePaymentType.COURSE_CHANGE ||
          (orderType !== OrderTypes.MANUAL &&
            paymentType !== OfflinePaymentType.UPI)
        ) {
          data.receiptNumber = currentReceiptNumber;
          await data.save();

          currentReceiptNumber++; // Increment receipt number for next iteration

          if (courseId !== null) {
            //NOTE - check offline course payment model
            const installmentDetails =
              await this.offlineCoursePaymentModel.findOne({
                userId,
                courseId: new mongoose.Types.ObjectId(courseId),
                totalPrice: totalAmount,
              });

            if (installmentDetails) {
              installmentDetails.receiptNumber = data.receiptNumber;
              await installmentDetails.save();
            }
          }
        } else {
          // Handle paymentType === OfflinePaymentType.COURSE_CHANGE if necessary
        }
      } else {
        console.log('orderId is null for payment id:', _id); //TODO - need this for check error
      }
    }

    return paymentDetails;
  }

  //SECTION - update Payment Details
  async updatePaymentDetails(payload: UpdatePaymentDetailsDto): Promise<any> {
    const { paymentId, amount, paymentType, chequeOrTransNo } = payload;

    //NOTE - check offlin payment details
    const history: any = await this.offlineCoursePaymentModel
      .findById(paymentId)
      .populate([{ path: 'orderId', select: 'orderType' }]);

    //NOTE: Find the previous payment if the amount is same
    const previousPayment: any =
      amount === history.totalPrice
        ? await this.offlineCoursePaymentModel
            .findOne({
              userId: history.userId,
              courseId: history.courseId,
              _id: { $lt: history._id },
            })

            .sort({ _id: -1 })
        : null;

    if (!history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (
      history.priceType === OfflineCoursePriceType.PRE_BOOK ||
      (history.transactionStatus === TransactionStatus.FULL_PAYMENT &&
        history?.orderId?.orderType === OrderTypes.AUTOMATION)
    )
      throw new HttpException(PAYMENT_EDIT_ERROR, HttpStatus.BAD_REQUEST);

    //NOTE - check payment details from payment table
    const payment = await this.paymentModel.findOne({
      orderId: history.parentOrderId,
      userId: history.userId,
      courseId: history.courseId.toString(),
      totalAmount: history.totalPrice,
    });

    let offlineCoursePayload: any;
    let paymentPayload: any;
    if (amount) {
      //NOTE -calculate the amount details based on the amount coming
      const basePrice = Math.ceil(amount / (1 + history?.gst / 100));
      const totalPrice = amount;
      const gstAmount = Math.ceil(amount - basePrice);

      const amountDetails = await this.calculateAmountsForUpdatePayment(
        amount,
        history,
        previousPayment !== null ? previousPayment : history,
      );

      // NOTE - calculate next payment date
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() + 6);
      paymentDate.setHours(23, 59, 59, 999);

      offlineCoursePayload = {
        totalPrice,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        discountedPrice: basePrice,
        outstandingAmount: amountDetails.outstandingAmount,
        totalAmtReceived: amountDetails.totalAmtReceived,
        nextPaymentDate:
          history.nextPaymentDate === null &&
          amountDetails.outstandingAmount > 0
            ? paymentDate
            : history.nextPaymentDate,
        paymentType: paymentType ? paymentType : history.paymentType,
        chequeOrTransNo:
          paymentType === OfflinePaymentType.CASH
            ? null
            : chequeOrTransNo
            ? chequeOrTransNo
            : history.chequeOrTransNo,
        isPaymentUpdated: true,
        transactionStatus:
          amountDetails.outstandingAmount > 0
            ? TransactionStatus.INSTALLMENT
            : TransactionStatus.INSTALLMENT_COMPLETE,
      };
      paymentPayload = {
        totalAmount: totalPrice,
        outstandingAmount: amountDetails.outstandingAmount,
        totalAmtReceived: amountDetails.totalAmtReceived,
        nextPaymentDate:
          history.nextPaymentDate === null &&
          amountDetails.outstandingAmount > 0
            ? paymentDate
            : history.nextPaymentDate,
        paymentType: paymentType ? paymentType : history.paymentType,
        chequeOrTransNo: chequeOrTransNo
          ? chequeOrTransNo
          : payment.chequeOrTransNo,
        isPaymentUpdated: true,
      };
    } else {
      offlineCoursePayload = {
        paymentType: paymentType ? paymentType : history.paymentType,
        chequeOrTransNo: chequeOrTransNo
          ? chequeOrTransNo
          : history.chequeOrTransNo,
        isPaymentUpdated: true,
      };
      paymentPayload = {
        paymentType: paymentType ? paymentType : history.paymentType,
        chequeOrTransNo: chequeOrTransNo
          ? chequeOrTransNo
          : payment.chequeOrTransNo,
        isPaymentUpdated: true,
      };
    }

    //NOTE: Update offline payment model
    await this.offlineCoursePaymentModel.findByIdAndUpdate(history._id, {
      $set: { ...offlineCoursePayload },
    });

    //NOTE: Update paymnet model
    await this.paymentModel.findByIdAndUpdate(payment._id, {
      $set: { ...paymentPayload },
    });

    return UPDATE_DATA;
  }

  //SECTION - get Manual Order Report Pdf
  async generateManualOrderReportPdf(query: ParsedQs): Promise<any> {
    const { fromDate, toDate } = query as {
      fromDate: string;
      toDate: string;
    };

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date(fromDate);
    // Get the start of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(toDate);
    nextDate.setUTCHours(23, 59, 59, 999);

    //NOTE - date based filter
    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    //NOTE - get all manual book order details
    const orders: any = await this.orderModel
      .find({
        ...dateFilter,
        orderType: OrderTypes.BOOK_PURCHASE,
        paymentStatus: PaymentStatus.PAID,
      })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'createdBy', select: 'name' },

        {
          path: 'bookDetails',
          select: 'bookId totalPrice quantity languageId bookType',
          populate: [
            {
              path: 'bookId',
              select: 'bookName',
            },
            { path: 'languageId', select: 'language' },
          ],
        },
      ]);

    // NOTE: send response
    const data = await Promise.all(
      orders.map(
        async (order: {
          _id: any;
          bookDetails: any[];
          mkcOrderId: string;
          orderType: OrderTypes;
          userId: { name: string; phone: string };
          paymentDate: Date;
          createdBy: { name: string }[];
        }) => {
          //NOTE - get payment detail
          const payment = await this.paymentModel
            .findOne({ orderId: order._id })
            .select('paymentType receiptNumber')
            .lean();
          return order.bookDetails.map((item) => {
            return {
              _id: order._id,
              orderId: order?.mkcOrderId ?? null,
              orderType: order?.orderType ?? null,
              user: order.userId?.name ?? null,
              phone: order.userId?.phone ?? null,
              paymentDate: order.paymentDate,
              productName: item?.bookId?.bookName ?? 'N/A',
              price: item?.totalPrice ?? null,
              quantity: item?.quantity ?? null,
              language: item?.languageId?.language ?? null,
              paymentMode: payment?.paymentType ?? null,
              receiptNumber: payment?.receiptNumber ?? null,
              createdBy: order.createdBy[0]?.name ?? null,
            };
          });
        },
      ),
    );

    const flattenedData = data.flat();

    const jsonData = {
      path: process.env.MANUAL_ORDER_REPORT_EJS_URL,
      data: flattenedData,
      date: moment(today).format('DD-MM-YYYY'),
    };
    const pdf = await this.commonService.generatePdfForReports(jsonData);
    return pdf;
  }

  //SECTION - get Manual Order Report details
  async generateManualOrderReport(
    payload: ManualOrderReportDto,
  ): Promise<{ data: any[] }> {
    const { fromDate, toDate } = payload;

    const currentDate = new Date(fromDate);
    // Get the start of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(toDate);
    nextDate.setUTCHours(23, 59, 59, 999);

    //NOTE - date based filter
    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    //NOTE - get all manual book order details
    const orders: any = await this.orderModel
      .find({
        ...dateFilter,
        orderType: OrderTypes.BOOK_PURCHASE,
        paymentStatus: PaymentStatus.PAID,
      })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'createdBy', select: 'name' },

        {
          path: 'bookDetails',
          select: 'bookId totalPrice quantity languageId bookType',
          populate: [
            {
              path: 'bookId',
              select: 'bookName',
            },
            { path: 'languageId', select: 'language' },
          ],
        },
      ]);

    // NOTE: send response
    const data = await Promise.all(
      orders.map(
        async (order: {
          _id: any;
          bookDetails: any[];
          mkcOrderId: string;
          orderType: OrderTypes;
          userId: { name: string; phone: string };
          paymentDate: Date;
          createdBy: { name: string }[];
        }) => {
          //NOTE - get payment detail
          const payment = await this.paymentModel
            .findOne({ orderId: order._id })
            .select('paymentType receiptNumber')
            .lean();
          return order.bookDetails.map((item) => {
            return {
              _id: order._id,
              orderId: order.mkcOrderId ?? null,
              orderType: order.orderType ?? null,
              user: order.userId?.name ?? null,
              phone: order.userId?.phone ?? null,
              paymentDate: order.paymentDate,
              productName: item?.bookId?.bookName ?? 'N/A',
              price: item?.totalPrice ?? null,
              quantity: item?.quantity ?? null,
              language: item?.languageId?.language ?? null,
              paymentMode: payment?.paymentType ?? null,
              receiptNumber: payment?.receiptNumber ?? null,
              createdBy: order.createdBy[0]?.name ?? null,
            };
          });
        },
      ),
    );

    const flattenedData = data.flat();

    return { data: flattenedData };
  }

  //ANCHOR - calculate totalAmtReceived and outstandingAmount For Update Payment
  private async calculateAmountsForUpdatePayment(
    amount: number,
    history: {
      productAmount: number;
      totalPrice: number;
      totalAmtReceived: number;
      outstandingAmount: number;
    },
    previousPayment: {
      productAmount: number;
      totalAmtReceived: number;
      outstandingAmount: number;
    },
  ): Promise<{ totalAmtReceived: number; outstandingAmount: number }> {
    let totalAmtReceived: number, outstandingAmount: number;

    if (amount > history?.totalPrice) {
      const difference = amount - history?.totalPrice;
      totalAmtReceived = history?.totalAmtReceived + difference;
      outstandingAmount = history?.outstandingAmount - difference;
    } else if (amount < history?.totalPrice) {
      const difference = history?.totalPrice - amount;
      totalAmtReceived = history?.totalAmtReceived - difference;
      outstandingAmount = history?.outstandingAmount + difference;
    } else {
      totalAmtReceived = previousPayment?.totalAmtReceived + amount;
      outstandingAmount = previousPayment?.productAmount - totalAmtReceived;
    }

    return { totalAmtReceived, outstandingAmount };
  }

  //ANCHOR - create order for events
  private async createOrderForEvent(
    totalAmount: number,
    eventId: string,
    userId: string,
    parentId?: Types.ObjectId | null,
    type?: string,
  ): Promise<any> {
    //NOTE - payload for create order in razorpay
    const orderDetails = {
      amount: Math.ceil(totalAmount * 100),
      currency: process.env.CURRENCY,
    };

    const order: any = await this.rzp.orders.create(orderDetails);

    //NOTE - create order in order table and payment table
    if (order) {
      const event_details: any = await this.eventModel
        .findById(eventId)
        .populate({
          path: 'priceId',
          select: 'mrpPrice discountedPrice totalPrice discountPercentage gst',
        });

      //NOTE - calculate gst amount from the price module
      const basePrice = Math.ceil(
        event_details.priceId?.totalPrice /
          (1 + event_details.priceId?.gst / 100),
      );
      const gstAmount = Math.ceil(
        event_details.priceId?.totalPrice - basePrice,
      );

      //NOTE - event details
      const eventDetails = {
        eventId: event_details._id,
        totalPrice: event_details.priceId?.totalPrice,
        gst: event_details.priceId?.gst,
        cgst: event_details.priceId?.gst / 2,
        sgst: event_details.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        discountPercentage: event_details.priceId?.discountPercentage,
        discountedPrice: event_details.priceId?.discountedPrice,
      };

      const orderPayload = {
        orderNumber: order.id,
        userId,
        parentId,
        eventDetails,
        totalPrice: event_details.priceId?.discountedPrice,
        gst: event_details.priceId?.gst,
        cgst: event_details.priceId?.gst / 2,
        sgst: event_details.priceId?.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        totalAmount: event_details.priceId?.totalPrice,
        paidAmount: event_details.priceId?.totalPrice,
        purchaseBy: type,
      };

      //NOTE - create order in db
      const order_details = new this.orderModel(orderPayload);
      order_details.mkcOrderId = await this.generateOrderUniqueID(
        OrderGenerateType.PRODUCT,
      );

      await order_details.save();

      //NOTE - enter payment details in payment table
      await this.paymentModel.create({
        orderId: order_details._id,
        orderNumber: order.id,
        userId,
        parentId,
        totalAmount,
        purchaseBy: type,
      });
    }

    return order;
  }

  //ANCHOR - generate Unique roll number for student based on batch and course
  private async generateStudentRollNumber(
    courseId: string,
    batchId: string,
  ): Promise<string> {
    try {
      //NOTE: Find the last student with a roll number in the specified course and batch
      const lastStudent = await this.studentBatchModel
        .findOne({
          courseId: new mongoose.Types.ObjectId(courseId),
          batchId: new mongoose.Types.ObjectId(batchId),
          rollNumber: { $ne: null },
        })
        .sort({ rollNumber: -1 });

      if (lastStudent) {
        //NOTE: If a student with a roll number exists, increment it by 1
        const lastRollNumber = parseInt(lastStudent.rollNumber, 10);
        const nextRollNumber = (lastRollNumber + 1).toString().padStart(3, '0');
        return nextRollNumber;
      } else {
        //NOTE: If no student with a roll number exists, return '001' as the first roll number
        return '001';
      }
    } catch (error) {
      //NOTE: Handle any errors that occur during database query
      throw new HttpException(
        FAILED_TO_GENERATE_ROLL_NUMBER,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  //ANCHOR - calculate Coins FromRupees
  private async calculateCoinsFromRupees(rupees: number): Promise<number> {
    //NOTE: 10 rupees = 100 coins
    const conversionRate = 10;

    //NOTE: Calculate the number of coins
    const coins = rupees * conversionRate;

    return coins;
  }

  //ANCHOR - generate master roll number
  private async generateMasterRollNumber(batchId: string): Promise<any> {
    // NOTE - assign master roll number to student if batch is mapped with any master batches
    const isMappedMasterBatch: any = await this.masterBatchModel.findOne({
      batchIds: { $in: [new mongoose.Types.ObjectId(batchId)] },
    });
    let masterRollNumber = null;
    if (!isMappedMasterBatch) {
      return { masterRollNumber: null, masterBatchId: null };
    }

    const lastStudent = await this.studentBatchModel
      .findOne({
        masterBatchId: isMappedMasterBatch._id,
        masterRollNumber: { $ne: null },
      })
      .sort({ masterRollNumber: -1 });

    // NOTE - if master batch roll no has not been assigned to anyone yet then this student will be first.
    masterRollNumber = lastStudent?.masterRollNumber
      ? lastStudent.masterRollNumber.length < 4 &&
        !lastStudent.masterRollNumber.includes('999')
        ? (parseInt(lastStudent.masterRollNumber) + 1)
            .toString()
            .padStart(3, '0')
        : (parseInt(lastStudent.masterRollNumber) + 1).toString()
      : '001';

    return {
      masterRollNumber: masterRollNumber,
      masterBatchId: isMappedMasterBatch._id,
    };
  }

  //ANCHOR - generate mkc Order UniqueID
  private async generateOrderUniqueID(
    orderFor: OrderGenerateType,
  ): Promise<string> {
    let prefix;
    let lastOrder;
    if (orderFor === OrderGenerateType.PRODUCT) {
      prefix = 'MKC_ORD_';
      lastOrder = await this.orderModel.findOne(
        {},
        {},
        { sort: { createdAt: -1 } },
      );
    }

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

  //ANCHOR - generate price amounts like total price , gst
  private async generatePriceAmounts(
    paymentData: any,
    courseData: any,
  ): Promise<{ gstAmount: number; totalPrice: number }> {
    //NOTE: Calculate the Price
    let totalPrice: number;
    let gstAmount: number;
    let basePrice: number;

    if (
      paymentData?.priceType === OfflineCoursePriceType.DISCOUNT_PRICE ||
      paymentData?.priceType === OfflineCoursePriceType.PRE_BOOK
    ) {
      totalPrice = courseData?.priceId?.discountedPrice;
      basePrice = Math.ceil(totalPrice / (1 + courseData?.priceId?.gst / 100));
      gstAmount = Math.ceil(totalPrice - basePrice);
    } else if (paymentData?.priceType === OfflineCoursePriceType.BASE_PRICE) {
      basePrice = Math.ceil(
        courseData?.priceId?.mrpPrice / (1 + courseData?.priceId?.gst / 100),
      );
      totalPrice = basePrice;
      gstAmount = Math.ceil(courseData?.priceId?.mrpPrice - basePrice);
    }

    // Separate assignment for totalPrice based on your condition
    totalPrice =
      (paymentData?.priceType === OfflineCoursePriceType.DISCOUNT_PRICE ||
        paymentData?.priceType === OfflineCoursePriceType.PRE_BOOK) &&
      courseData?.priceId?.totalPrice
        ? courseData?.priceId?.totalPrice
        : paymentData?.priceType === OfflineCoursePriceType.BASE_PRICE &&
          courseData?.priceId?.mrpPrice;

    return { gstAmount, totalPrice };
  }

  //ANCHOR : calculate Price Details for pre book student course change
  private async calculatePriceDetails(
    isFullPayment: boolean,
    isDiscountedPrice: boolean,
    isBasePrice: boolean,
    priceId: {
      totalPrice: number;
      gst?: number;
      discountedPrice?: number;
      mrpPrice?: number;
    },
    totalAmtReceived: number,
    previousPriceId: {
      totalPrice: number;
      gst?: number;
      discountedPrice?: number;
      mrpPrice?: number;
    },
  ): Promise<{
    totalPrice: number;
    gstAmount: number;
    paidAmount: number;
    totalAmount: number;
    basePrice: number;
  }> {
    let totalPrice = 0;
    let gstAmount = 0;
    let paidAmount = 0;
    let totalAmount = 0;
    let basePrice = 0;

    const gstPercentage = priceId?.gst;

    const gstFactor = 1 + gstPercentage / 100;

    if (isFullPayment) {
      if (isDiscountedPrice) {
        if (previousPriceId.totalPrice === priceId.totalPrice) {
          totalPrice = priceId.totalPrice;
          basePrice = Math.ceil(totalPrice / (1 + priceId?.gst / 100));
          gstAmount = Math.ceil(totalPrice - basePrice);
          totalAmount = priceId.totalPrice;
          paidAmount = priceId.totalPrice;
        } else {
          basePrice = Math.ceil(totalAmtReceived / gstFactor);
          totalPrice = totalAmtReceived;
          gstAmount = Math.ceil(totalAmtReceived - basePrice);
          totalAmount = totalAmtReceived;
          paidAmount = totalAmtReceived;
        }
      } else {
        if (previousPriceId.mrpPrice === priceId.mrpPrice) {
          basePrice = Math.ceil(priceId.mrpPrice / (1 + priceId?.gst / 100));
          totalPrice = basePrice;
          gstAmount = Math.ceil(priceId.mrpPrice - basePrice);
          totalAmount = priceId.mrpPrice;
          paidAmount = priceId.mrpPrice;
        } else {
          basePrice = Math.ceil(totalAmtReceived / gstFactor);
          totalPrice = totalAmtReceived;
          gstAmount = Math.ceil(totalAmtReceived - basePrice);
          totalAmount = totalAmtReceived;
          paidAmount = totalAmtReceived;
        }
      }
    } else {
      basePrice = Math.ceil(totalAmtReceived / gstFactor);
      totalPrice = totalAmtReceived;
      gstAmount = Math.ceil(totalAmtReceived - basePrice);
      totalAmount = totalAmtReceived;
      paidAmount = totalAmtReceived;
    }

    return { totalPrice, gstAmount, paidAmount, totalAmount, basePrice };
  }

  //ANCHOR: create Order And Payment For PreBook
  private async createOrderAndPaymentForPreBook(
    totalPrice: number,
    gstAmount: number,
    paidAmount: number,
    totalAmount: number,
    basePrice: number,
    userId: string,
    currentCourseId: string,
    productType: string,
    isBasePrice: boolean,
    isFullPayment: boolean,
    isDiscountedPrice: boolean,
    existingOrder: any,
    previousCourseOrder: any,
    current_Course: any,
    previous_Course: any,
    staffId: string,
    paymentDetails: any,
  ): Promise<{ orderId: any }> {
    let orderPayload: any;

    const { priceId: currentPrice } = current_Course;
    const { priceId: previousPrice } = previous_Course;

    // Check conditions and create order payload accordingly
    if (
      (isBasePrice && isFullPayment) ||
      (isDiscountedPrice && isFullPayment)
    ) {
      if (
        previousPrice.mrpPrice === currentPrice.mrpPrice ||
        (isDiscountedPrice &&
          previousPrice.totalPrice === currentPrice.totalPrice)
      ) {
        orderPayload = {
          userId,
          paymentStatus: PaymentStatus.PAID,
          onlineCourseDetails: [
            {
              onlineCourseId: current_Course._id,
              type:
                productType === ProductType.OFFLINE_COURSE
                  ? ModeTypes.OFFLINE
                  : ModeTypes.ONLINE,
              languageId: current_Course?.languageId,
              quantity: 1,
              productAmount: previousCourseOrder.productAmount,
              totalPrice: previousCourseOrder.totalPrice,
              gst: previousCourseOrder.gst,
              cgst: previousCourseOrder.cgst,
              sgst: previousCourseOrder.sgst,
              gstAmount: previousCourseOrder.gstAmount,
              cgstAmount: gstAmount / 2,
              sgstAmount: previousCourseOrder.sgstAmount,
              discountPercentage: previousCourseOrder.discountPercentage,
              discountedPrice: previousCourseOrder.discountedPrice,
              coins: current_Course?.coins,
              paymentStatus: previousCourseOrder.paymentStatus,
            },
          ],
          totalPrice: isDiscountedPrice
            ? currentPrice.totalPrice
            : currentPrice.mrpPrice,
          gst: currentPrice.gst,
          cgst: currentPrice.gst / 2,
          sgst: currentPrice.gst / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          shippingCharge: 0,
          totalAmount,
          paidAmount,
          priceType: existingOrder.priceType,
          orderType: OrderTypes.COURSE_CHANGE,
          createdBy: staffId,
        };
      } else if (
        previousPrice.mrpPrice !== currentPrice.mrpPrice ||
        (isDiscountedPrice &&
          previousPrice.totalPrice !== currentPrice.totalPrice)
      ) {
        orderPayload = {
          userId,
          paymentStatus: PaymentStatus.PAID,
          onlineCourseDetails: [
            {
              onlineCourseId: current_Course._id,
              type:
                productType === ProductType.OFFLINE_COURSE
                  ? ModeTypes.OFFLINE
                  : ModeTypes.ONLINE,
              languageId: current_Course?.languageId,
              quantity: 1,
              productAmount: isBasePrice
                ? currentPrice.mrpPrice
                : currentPrice.totalPrice,
              totalPrice,
              gst: currentPrice.gst,
              cgst: currentPrice.gst / 2,
              sgst: currentPrice.gst / 2,
              gstAmount: gstAmount,
              cgstAmount: gstAmount / 2,
              sgstAmount: gstAmount / 2,
              discountPercentage: currentPrice.discountPercentage,
              discountedPrice: basePrice,
              coins: current_Course?.coins,
              paymentStatus: previousCourseOrder.paymentStatus,
            },
          ],
          totalPrice,
          gst: currentPrice.gst,
          cgst: currentPrice.gst / 2,
          sgst: currentPrice.gst / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          shippingCharge: 0,
          totalAmount,
          paidAmount,
          priceType: existingOrder.priceType,
          orderType: OrderTypes.COURSE_CHANGE,
          createdBy: staffId,
        };
      }
    } else {
      orderPayload = {
        userId,
        paymentStatus: PaymentStatus.PAID,
        onlineCourseDetails: [
          {
            onlineCourseId: current_Course._id,
            type:
              productType === ProductType.OFFLINE_COURSE
                ? ModeTypes.OFFLINE
                : ModeTypes.ONLINE,
            languageId: current_Course?.languageId,
            quantity: 1,
            productAmount: isBasePrice
              ? currentPrice.mrpPrice
              : currentPrice.totalPrice,
            totalPrice,
            gst: currentPrice.gst,
            cgst: currentPrice.gst / 2,
            sgst: currentPrice.gst / 2,
            gstAmount: gstAmount,
            cgstAmount: gstAmount / 2,
            sgstAmount: gstAmount / 2,
            discountPercentage: currentPrice.discountPercentage,
            discountedPrice: basePrice,
            coins: current_Course?.coins,
            paymentStatus: previousCourseOrder.paymentStatus,
          },
        ],
        totalPrice,
        gst: currentPrice.gst,
        cgst: currentPrice.gst / 2,
        sgst: currentPrice.gst / 2,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        shippingCharge: 0,
        totalAmount,
        paidAmount,
        priceType: existingOrder.priceType,
        orderType: OrderTypes.COURSE_CHANGE,
        createdBy: staffId,
      };
    }

    //NOTE: Create order
    const orderDetails = new this.orderModel(orderPayload);
    orderDetails.mkcOrderId = await this.generateOrderUniqueID(
      OrderGenerateType.PRODUCT,
    );
    await orderDetails.save();

    //NOTE: Update parent order ID
    await this.orderModel.findOneAndUpdate(
      { _id: orderDetails?._id },
      { parentOrderId: orderDetails?._id },
    );

    //NOTE: Generate receipt number
    const receipt = await this.generateReceiptNumber();

    //NOTE - calculate outstandingAmount
    const outstandingAmount = !isFullPayment
      ? isDiscountedPrice &&
        paymentDetails.totalAmtReceived > currentPrice.totalPrice
        ? 0
        : isDiscountedPrice &&
          paymentDetails.totalAmtReceived < currentPrice.totalPrice
        ? currentPrice.totalPrice - totalPrice
        : isBasePrice && paymentDetails.totalAmtReceived > currentPrice.mrpPrice
        ? 0
        : isBasePrice && paymentDetails.totalAmtReceived < currentPrice.mrpPrice
        ? currentPrice.mrpPrice - totalPrice
        : 0
      : 0;

    //NOTE: Create payment
    await this.paymentModel.create({
      orderId: orderDetails?._id,
      courseId: currentCourseId,
      userId,
      productAmount: isDiscountedPrice
        ? currentPrice?.totalPrice
        : currentPrice?.mrpPrice,
      totalAmount,
      totalAmtReceived: totalAmount,
      outstandingAmount,
      nextPaymentDate:
        previousPrice.mrpPrice !== currentPrice.mrpPrice ||
        previousPrice.totalPrice !== currentPrice.totalPrice
          ? new Date()
          : null,
      paymentStatus: PaymentStatus.PAID,
      paymentType: OfflinePaymentType.COURSE_CHANGE,
      receiptNumber: receipt,
    });

    //NOTE - update the previous paymnet details
    if (paymentDetails.transactionStatus === TransactionStatus.INSTALLMENT) {
      await this.offlineCoursePaymentModel.findByIdAndUpdate(
        paymentDetails._id,
        {
          $set: {
            transactionStatus:
              TransactionStatus.INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE,
          },
        },
      );
    }

    // NOTE - calculate next payment date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 6);
    currentDate.setHours(23, 59, 59, 999);

    //NOTE - calculate the next paymnet date
    const paymentDate = outstandingAmount === 0 ? null : currentDate;

    //NOTE - Create offline course payment details
    await this.offlineCoursePaymentModel.create({
      userId,
      orderId: orderDetails?._id,
      parentOrderId: orderDetails?._id,
      courseId: new mongoose.Types.ObjectId(currentCourseId),
      productAmount: isDiscountedPrice
        ? currentPrice?.totalPrice
        : currentPrice?.mrpPrice,
      totalPrice: totalAmount,
      gst: currentPrice?.gst,
      cgst: currentPrice?.gst / 2,
      sgst: currentPrice?.gst / 2,
      gstAmount,
      cgstAmount: gstAmount / 2,
      sgstAmount: gstAmount / 2,
      discountPercentage: currentPrice?.discountPercentage,
      discountedPrice: basePrice,
      outstandingAmount,
      totalAmtReceived: paymentDetails.totalAmtReceived,
      nextPaymentDate: paymentDate,
      priceType: isDiscountedPrice
        ? OfflineCoursePriceType.DISCOUNT_PRICE
        : isBasePrice
        ? OfflineCoursePriceType.BASE_PRICE
        : OfflineCoursePriceType.PRE_BOOK,
      transactionStatus:
        (isDiscountedPrice && outstandingAmount === 0) ||
        (isBasePrice && outstandingAmount === 0)
          ? TransactionStatus.FULL_PAYMENT
          : TransactionStatus.INSTALLMENT,
      paymentType: OfflinePaymentType.COURSE_CHANGE,
      receiptNumber: receipt,
      productType:
        current_Course.type === ModeTypes.ONLINE
          ? ProductType.ONLINE_COURSE
          : ProductType.OFFLINE_COURSE,
      createdBy: staffId,
    });

    return { orderId: orderDetails?._id };
  }

  //ANCHOR - generate RollNumber And ValidUptoDatefor pre book
  private async generateRollNumberAndValidUptoDate(
    courseId: string,
    batchId: string,
    type: ModeTypes,
  ): Promise<{
    rollNumber: string | null;
    masterRollNumber: string | null;
    masterBatchId: string | null;
    validUptoDate: Date | null;
    startDate: Date | null;
  }> {
    if (type === ModeTypes.OFFLINE)
      return {
        rollNumber: null,
        masterRollNumber: null,
        masterBatchId: null,
        validUptoDate: null,
        startDate: null,
      };

    const batch: any = await this.batchModel.findById(batchId);

    //NOTE: Generate student roll number
    const rollNumber = await this.generateStudentRollNumber(courseId, batchId);

    //NOTE: Generate master roll number and master batch ID
    const { masterRollNumber, masterBatchId } =
      await this.generateMasterRollNumber(batchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let endDate: Date;
    if (batch?.batchDurationType === BatchDurationType.DAYS) {
      //NOTE: Calculate valid upto date
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + batch?.duration);
      currentDate.setHours(23, 59, 59, 999);
      endDate = currentDate;
    } else {
      endDate = batch?.endDate;
    }

    return {
      rollNumber,
      masterRollNumber,
      masterBatchId,
      validUptoDate: endDate,
      startDate: today,
    };
  }

  //SECTION - create order for products
  async salesPayment(
    payload: SalesPaymentDto,
    userId: string,
  ): Promise<string> {
    try {
      const {
        studentId,
        items,
        discountedAmount,
        paymentType,
        chequeOrTransNo,
        addressId,
      } = payload;

      const check_user_type = await this.userModel
        .findById(studentId)
        .select('type');

      if (!check_user_type)
        throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

      const warehouse = await this.warehouseRepository.findOne({
        isShop: true,
      });

      if (!warehouse)
        throw new HttpException(WAREHOUSE_IS_NOT_FOUND, HttpStatus.BAD_REQUEST);

      //NOTE - check if book stock is there in warehouse or not
      await Promise.all(
        items?.map(async (item) => {
          const inventoryItemTransaction = await this.itemTransactionRepository
            .findOne({
              wareHouseId: warehouse.id,
              itemId: item?.itemId,
              currentBalance: { $gt: item.quantity },
            })
            .sort({ createdAt: -1 });

          if (!inventoryItemTransaction) {
            throw new HttpException(
              WAREHOUSE_IN_PRODUCT_STOCK,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (item.quantity > inventoryItemTransaction?.currentBalance) {
            throw new HttpException(
              WAREHOUSE_IN_PRODUCT_STOCK,
              HttpStatus.BAD_REQUEST,
            );
          }
        }),
      );

      let calculateTotalPrice = 0;
      let calculateDiscountPrice = 0;
      let calculateGstAmount = 0;
      let calculateGst = 0;

      //NOTE - create a payload for book details
      const bookDetailPromises = items?.map(async (ele) => {
        //NOTE - get book details
        const [details] = await this.bookModal.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(ele.bookId) } },
          { $unwind: '$bookTypeDetails' },
          { $match: { 'bookTypeDetails.bookType': BookType.PAPER_BACK } },
          {
            $lookup: {
              from: 'prices',
              localField: 'bookTypeDetails.priceId',
              foreignField: '_id',
              as: 'bookTypeDetails.priceId',
            },
          },
          {
            $unwind: {
              path: '$bookTypeDetails.priceId',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              bookTypeDetails: {
                $push: {
                  _id: '$bookTypeDetails._id',
                  shippingCharge: '$bookTypeDetails.shippingCharge',
                  bookType: '$bookTypeDetails.bookType',
                  priceId: {
                    _id: '$bookTypeDetails.priceId._id',
                    mrpPrice: '$bookTypeDetails.priceId.mrpPrice',
                    discountedPrice: '$bookTypeDetails.priceId.discountedPrice',
                    discountPercentage:
                      '$bookTypeDetails.priceId.discountPercentage',
                    gst: '$bookTypeDetails.priceId.gst',
                    totalPrice: '$bookTypeDetails.priceId.totalPrice',
                  },
                },
              },
            },
          },
          {
            $addFields: {
              bookTypeDetails: { $arrayElemAt: ['$bookTypeDetails', 0] },
            },
          },
        ]);

        const gstAmount =
          details?.bookTypeDetails?.priceId?.totalPrice -
          details?.bookTypeDetails?.priceId?.discountedPrice;

        calculateGstAmount += gstAmount; // Correct GST calculation
        calculateTotalPrice += details?.bookTypeDetails?.priceId?.totalPrice;
        calculateDiscountPrice +=
          details?.bookTypeDetails?.priceId?.discountedPrice;

        calculateGst += details?.bookTypeDetails?.priceId?.gst;

        return {
          bookId: ele.bookId,
          quantity: ele.quantity,
          languageId: ele.languageId,
          bookType: BookType.PAPER_BACK,
          shippingStatus: ShippingStatusType.DELIVERED,
          totalPrice: details?.bookTypeDetails?.priceId?.totalPrice,
          gst: details?.bookTypeDetails?.priceId?.gst,
          cgst: details?.bookTypeDetails?.priceId?.gst / 2,
          sgst: details?.bookTypeDetails?.priceId?.gst / 2,
          gstAmount: gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          discountPercentage:
            details?.bookTypeDetails?.priceId?.discountPercentage,
          discountedPrice: details?.bookTypeDetails?.priceId?.discountedPrice,
        };
      });

      const bookDetail = await Promise.all(bookDetailPromises);

      const orderPayload = {
        userId: studentId,
        addressId,
        paymentStatus: PaymentStatus.PAID,
        bookDetails: bookDetail,
        manualDiscountAmount: discountedAmount,
        totalPrice: calculateDiscountPrice,
        gst: calculateGst,
        cgst: calculateGst / 2,
        sgst: calculateGst / 2,
        gstAmount: calculateGstAmount,
        cgstAmount: calculateGstAmount / 2,
        sgstAmount: calculateGstAmount / 2,
        totalAmount: calculateTotalPrice,
        paidAmount: calculateTotalPrice - discountedAmount,
        priceType: OfflineCoursePriceType.DISCOUNT_PRICE,
        purchaseBy: check_user_type.type,
        orderType: OrderTypes.BOOK_PURCHASE,
        createdBy: userId,
      };

      //NOTE - create order in db
      const order_details = new this.orderModel(orderPayload);
      order_details.mkcOrderId = await this.generateOrderUniqueID(
        OrderGenerateType.PRODUCT,
      );

      await order_details.save();

      // NOTE: Update the parentOrderId
      await this.orderModel.findOneAndUpdate(order_details?._id, {
        parentOrderId: order_details?._id,
      });

      const receipt = await this.generateReceiptNumber();

      // NOTE - enter payment details in payment table
      await this.paymentModel.create({
        orderId: order_details._id,
        userId: studentId,
        productAmount: calculateTotalPrice,
        totalAmount: calculateTotalPrice - discountedAmount,
        totalAmtReceived: calculateTotalPrice - discountedAmount,
        paymentStatus: PaymentStatus.PAID,
        purchaseBy: check_user_type.type,
        paymentType: paymentType,
        chequeOrTransNo,
        receiptNumber: receipt,
        createdBy: userId,
      });

      //NOTE - update item transaction table
      await Promise.all(
        items?.map(async (item) => {
          const inventoryItemTransaction = await this.itemTransactionRepository
            .findOne({
              wareHouseId: warehouse.id,
              itemId: item?.itemId,
              currentBalance: { $gt: item.quantity },
            })
            .sort({ createdAt: -1 });

          //NOTE: Create a new transaction record
          await this.itemTransactionRepository.create({
            studentId: new mongoose.Types.ObjectId(studentId),
            wareHouseId: warehouse._id,
            itemId: item?.itemId,
            openingStock: inventoryItemTransaction.openingStock,
            stockRate: inventoryItemTransaction.stockRate,
            credit: 0,
            debit: item?.quantity,
            currentBalance:
              inventoryItemTransaction.currentBalance - item?.quantity,
            createdBy: userId,
          });
        }),
      );

      //NOTE: update the user table
      await this.userModel.findByIdAndUpdate(studentId, {
        $set: {
          isBookSold: true,
          studentStatus:
            check_user_type.studentStatus !== UserStatusTypes.ADMITTED &&
            check_user_type.studentStatus !== UserStatusTypes.PRE_BOOK &&
            check_user_type.studentStatus !== UserStatusTypes.CONVERSION &&
            check_user_type.studentStatus !== UserStatusTypes.PREFER_ADMISSION
              ? UserStatusTypes.BOOK_SOLD
              : check_user_type.studentStatus,
        },
      });

      return PAYMENT_SUCCESS;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
