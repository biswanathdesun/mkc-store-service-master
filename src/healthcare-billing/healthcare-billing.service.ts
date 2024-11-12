import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { ParsedQs } from 'qs';
import {
  HOSPITAL_PAYMENT_SUCCESS,
  MKC_ORDER_ID_DUPLICATE,
  ORDER_NOT_FOUND,
  PAYMENT_FAILED,
  PAYMENT_SUCCESS,
  RECORD_NOT_FOUND,
} from 'src/utills/messages';
import { Cart } from 'src/schema/cart.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentSummary } from 'src/schema/payment.summary.schema';
import { HospitalOrder } from 'src/schema/hospital-order-schema';
import { CarePackage } from 'src/schema/care-package.schema';
import {
  CoinTransactionReasonTypes,
  FollowUpStatus,
  HdfcPaymentStatus,
  HealthCarePurchaseType,
  OfflineCoursePriceType,
  OrderTypes,
  PaymentStatus,
  ProductType,
  SchemaReferenceType,
  TransactionStatus,
  UserStatusTypes,
  UserType,
} from 'src/utills/enum';
import { HealthcareUser } from 'src/schema/health-care-user.schema';
import { HospitalWalkInPaymentDto } from './dto/hospital-walkin-payment.dto';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { VerifyHospitalPaymentDto } from './dto/verify-payment.dto';
import { CoinsTransaction } from 'src/schema/coins.transaction.schema';
import { Token } from 'src/schema/token.schema';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { PaymentHistoryDto } from './dto/payment-history.dto';
import { CouponTransaction } from 'src/schema/coupon.transaction.schema';
import { Coupon } from 'src/schema/coupon.schema';
import { FollowUp } from 'src/schema/followup.schema';
import { HealthCareTestDatabase } from 'src/schema/healthcare-test-database.schema';

@Injectable()
export class HealthcareBillingService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(HealthCareTestDatabase.name)
    private healthCareTestDatabaseModel: Model<HealthCareTestDatabase>,
    @InjectModel(PaymentSummary.name)
    private paymentSummaryModel: Model<PaymentSummary>,
    @InjectModel(HealthcareUser.name)
    private healthcareUserModel: Model<HealthcareUser>,
    @InjectModel(HospitalOrder.name)
    private hospitalOrderModel: Model<HospitalOrder>,
    @InjectModel(CarePackage.name) private carePackageModel: Model<CarePackage>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    @InjectModel(CoinsTransaction.name)
    private coinsTransactionModel: Model<CoinsTransaction>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(UserProductDetails.name)
    private productDeatilsModel: Model<UserProductDetails>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(CouponTransaction.name)
    private couponTransactionModel: Model<CouponTransaction>,
    @InjectModel(FollowUp.name) private followUpModel: Model<FollowUp>,
  ) {}

  //SECTION - create order for hospital
  async hospitalTransaction(userId: string): Promise<{ data: any }> {
    try {
      // NOTE - check the requested user details
      const user: any = await this.healthcareUserModel.findById(userId);

      if (!user) {
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      // NOTE - get cart details based on the userId
      const carts: any = await this.cartModel
        .find({
          userId: new mongoose.Types.ObjectId(userId),
        })
        .populate([
          {
            path: 'carePackageId',
            select: 'coins testPackagesId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountedPrice discountPercentage',
              },
              {
                path: 'testPackagesId',
                select: 'testIds',
              },
            ],
          },
        ]);

      // NOTE - get payment summary details based on the userId
      const payment_summary: any = await this.paymentSummaryModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const totalAmount = payment_summary?.amountToBePaid;

      const mkcOrderId = await this.generateOrderUniqueID();

      const order = await this.createHdfcHospitalOrder(
        mkcOrderId,
        totalAmount,
        user,
      );

      // NOTE - create order in order table and payment table
      if (order) {
        // NOTE - course details
        const productsPromise = carts.map(async (item: any) => {
          return {
            packageId: item.carePackageId._id,
            serviceId: item.careServiceId._id,
            quantity: item.quantity,
            productAmount: item.carePackageId.priceId?.totalPrice,
            totalPrice: item.totalPrice,
            gst: item.gst,
            cgst: item.gst / 2,
            sgst: item.gst / 2,
            gstAmount: item.gstAmount,
            cgstAmount: item.gstAmount / 2,
            sgstAmount: item.gstAmount / 2,
            discountPercentage: item.discountPercentage,
            discountedPrice: item.discountedPrice,
            coins: item.carePackageId?.coins ?? 0,
            paymentStatus:
              item.payment_type === OfflineCoursePriceType.PRE_BOOK
                ? TransactionStatus.INSTALLMENT
                : TransactionStatus.FULL_PAYMENT,
          };
        });

        const products = await Promise.all(productsPromise);

        try {
          // NOTE - create order in db
          const order_details = await this.hospitalOrderModel.create({
            mkcOrderId,
            orderNumber: order.id,
            userId: new mongoose.Types.ObjectId(userId),
            couponId: carts[0]?.couponId,
            couponAmount: payment_summary.discountedPrice,
            productDetails: products,
            totalPrice: payment_summary.totalPrice,
            gst: payment_summary.gst,
            cgst: payment_summary.gst / 2,
            sgst: payment_summary.gst / 2,
            gstAmount: payment_summary.gstAmount,
            cgstAmount: payment_summary.gstAmount / 2,
            sgstAmount: payment_summary.gstAmount / 2,
            totalAmount: payment_summary.totalAmount,
            paidAmount: payment_summary.amountToBePaid,
            walletAmount: payment_summary.walletAmount,
            purchaseBy: user && user?.type,
            createdBy: new mongoose.Types.ObjectId(userId),
            createdByModel: SchemaReferenceType.HEALTH_CARE_USER,
            updatedByModel: SchemaReferenceType.HEALTH_CARE_USER,
          });

          await this.hospitalOrderModel.findByIdAndUpdate(order_details._id, {
            $set: { parentOrderId: order_details._id },
          });
        } catch (error) {
          if (error.code === 11000) {
            throw new HttpException(
              MKC_ORDER_ID_DUPLICATE,
              HttpStatus.CONFLICT,
            );
          } else {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
          }
        }
      }

      return { data: order?.payment_links?.web };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - hospita payment for admin panel
  async hospitalBooking(
    payload: HospitalWalkInPaymentDto,
    staffId: string,
  ): Promise<{ message: any }> {
    try {
      const {
        userId,
        name,
        gender,
        dob,
        state,
        city,
        pincode,
        parentName,
        parentNumber,
        serviceId,
        packageId,
        priceType,
        isPreBook,
        amount,
        paymentType,
        chequeOrTransNo,
        nextPaymentDate,
        outstandingAmount,
        isAdmitted,
        purchaseProductType,
        testDatabaseIds,
      } = payload;

      //NOTE - check health care user
      const healthCareUser = await this.healthcareUserModel.findById(userId);

      //NOTE: Parse dob into a Date object
      let dobDate: Date | undefined;
      if (dob) {
        dobDate = new Date(dob);
        dobDate.setUTCHours(0, 0, 0, 0); // Set time to end of day
      }

      if (!healthCareUser)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
      //NOTE: get productHistory, packageDetails
      const { productHistory, packageDetails } = await this.getProductDetails(
        purchaseProductType,
        userId,
        packageId,
        serviceId,
        testDatabaseIds,
      );

      const newPayment =
        purchaseProductType === HealthCarePurchaseType.TEST_DATABASE ||
        productHistory?.transactionStatus ===
          TransactionStatus.INSTALLMENT_CLOSED ||
        productHistory?.transactionStatus ===
          TransactionStatus.INSTALLMENT_COMPLETE ||
        productHistory?.transactionStatus === TransactionStatus.FULL_PAYMENT;

      const existingPaymnet =
        productHistory?.transactionStatus === TransactionStatus.INSTALLMENT;

      const {
        totalPrice,
        gstAmount,
        totalAmount,
        paidAmount,
        basePrice,
        totalGst,
        discountPercentage,
      } = await this.calculateProductPriceDetails(
        purchaseProductType,
        productHistory,
        isPreBook,
        priceType,
        packageDetails,
        amount,
      );

      const newReceiptNumber = await this.generateHelathCareReceiptNumber();

      //NOTE: Get the current date and time
      const paymentDate = new Date();
      //NOTE: Add 5 hours and 30 minutes to the current date and time
      paymentDate.setHours(
        paymentDate.getHours() + 5,
        paymentDate.getMinutes() + 30,
      );

      //NOTE - if product details not there(new paymnet)
      if (!productHistory || newPayment) {
        //NOTE - if purchaseProductType is test database
        const dataBaseDetails =
          purchaseProductType === HealthCarePurchaseType.TEST_DATABASE &&
          packageDetails.map(
            (ele: {
              _id: any;
              priceId: {
                discountedPrice: any;
                mrpPrice: any;
                gst: any;
                discountPercentage: any;
              };
            }) => {
              const totalPrice =
                priceType === OfflineCoursePriceType.DISCOUNT_PRICE
                  ? ele.priceId?.discountedPrice
                  : ele.priceId?.mrpPrice;

              const basePrice = Math.ceil(
                totalPrice / (1 + (ele.priceId?.gst || 0) / 100),
              );
              const gstAmount = Math.ceil(totalPrice - basePrice);

              return {
                testDatabaseId: ele._id,
                quantity: 1,
                productAmount: totalPrice,
                totalPrice: totalPrice,
                gst: ele.priceId?.gst,
                cgst: (ele.priceId?.gst || 0) / 2,
                sgst: (ele.priceId?.gst || 0) / 2,
                gstAmount,
                cgstAmount: gstAmount / 2,
                sgstAmount: gstAmount / 2,
                discountPercentage: ele?.priceId?.discountPercentage,
                discountedPrice: basePrice,
                coins: 0,
              };
            },
          );

        //NOTE -  if purchaseProductType is care package
        const productDetails =
          purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE
            ? [
                {
                  packageId: new mongoose.Types.ObjectId(packageId),
                  serviceId: new mongoose.Types.ObjectId(serviceId),
                  quantity: 1,
                  productAmount:
                    priceType === OfflineCoursePriceType.DISCOUNT_PRICE
                      ? packageDetails.priceId.discountedPrice
                      : packageDetails.priceId.mrpPrice,
                  totalPrice: amount,
                  gst: packageDetails.priceId?.gst || 0,
                  cgst: (packageDetails.priceId?.gst || 0) / 2,
                  sgst: (packageDetails.priceId?.gst || 0) / 2,
                  gstAmount,
                  cgstAmount: gstAmount / 2,
                  sgstAmount: gstAmount / 2,
                  discountPercentage: packageDetails.priceId.discountPercentage,
                  discountedPrice: basePrice,
                  coins: packageDetails?.coins,
                  paymnetStatus: isPreBook
                    ? TransactionStatus.INSTALLMENT
                    : TransactionStatus.FULL_PAYMENT,
                },
              ]
            : null;

        //NOTE: create a order payload
        const payload = {
          userId,
          paymentStatus: PaymentStatus.PAID,
          productDetails,
          testDatabaseDetails:
            purchaseProductType === HealthCarePurchaseType.TEST_DATABASE
              ? dataBaseDetails
              : null,
          totalPrice,
          gst: totalGst,
          cgst: (totalGst || 0) / 2,
          sgst: (totalGst || 0) / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          totalAmount,
          paidAmount,
          priceType,
          orderType: OrderTypes.MANUAL,
          purchaseBy: healthCareUser?.type,
          paymentType,
          nextPaymentDate,
          receiptNumber: newReceiptNumber,
          purchaseProductType,
          createdBy: staffId,
          paymentDate,
          createdByModel: 'Staff',
          updatedByModel: 'Staff',
        };

        const order_details = new this.hospitalOrderModel(payload);
        order_details.mkcOrderId = await this.generateOrderUniqueID();
        await order_details.save();

        await this.hospitalOrderModel.findOneAndUpdate(
          { _id: order_details?._id },
          { parentOrderId: order_details?._id },
        );
        //NOTE: Update in health care finance model for installment
        await this.healthCareFinanceModel.create({
          userId,
          orderId: order_details._id,
          parentOrderId: order_details._id,
          packageId,
          serviceId,
          testDatabaseId: testDatabaseIds,
          productAmount:
            (purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE &&
              ((priceType === OfflineCoursePriceType.DISCOUNT_PRICE &&
                packageDetails?.priceId?.totalPrice) ||
                (priceType === OfflineCoursePriceType.BASE_PRICE &&
                  packageDetails?.priceId?.mrpPrice))) ||
            totalPrice,
          totalPrice,
          gst: totalGst || 0,
          cgst: (totalGst || 0) / 2,
          sgst: (totalGst || 0) / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          discountPercentage,
          discountedPrice: basePrice,
          outstandingAmount,
          totalAmtReceived: amount,
          nextPaymentDate,
          priceType,
          transactionStatus: isPreBook
            ? TransactionStatus.INSTALLMENT
            : TransactionStatus.FULL_PAYMENT,
          chequeOrTransNo,
          paymentStatus: PaymentStatus.PAID,
          receiptNumber: newReceiptNumber,
          paymentType,
          purchaseBy: healthCareUser?.type,
          purchaseProductType,
          createdBy: staffId,
          paymentDate,
          createdByModel: 'Staff',
          updatedByModel: 'Staff',
        });

        //NOTE - update coin
        const newCoin =
          purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE
            ? healthCareUser.coins + packageDetails.coins
            : 0;
        //NOTE - update health care user model
        await this.healthcareUserModel.findOneAndUpdate(
          { _id: healthCareUser._id },
          {
            $set: {
              name,
              gender,
              dob: dobDate,
              state,
              city,
              pincode,
              parentName,
              parentNumber,
              type: isAdmitted
                ? UserType.HOSPITAL_STUDENT
                : UserType.HOSPITAL_ENQUIRY,
              patientStatus: isAdmitted
                ? UserStatusTypes.ADMITTED
                : UserStatusTypes.PRE_BOOK,
              isRegistered: isAdmitted ? true : false,
              registationDate: isAdmitted ? new Date() : null,
              coins: newCoin,
            },
          },
        );
        if (isAdmitted) {
          //NOTE - close all existing follow up
          await this.followUpModel.updateMany(
            { patientId: healthCareUser._id },
            { $set: { followupStatus: FollowUpStatus.COMPLETED } },
          );
        }
        //NOTE: Check if coins were used and create coupon transaction
        if (newCoin > 0) {
          await this.coinsTransactionModel.create({
            patientId: healthCareUser._id,
            healthcareOrderId: order_details._id,
            credit: newCoin,
            transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
          });
        }
        //NOTE - update user product details
        await this.productDeatilsModel.create({
          healthcareUserId: healthCareUser._id,
          productType: ProductType.HEALTH_CARE,
          carePackageId: packageId,
          careServiceId: serviceId,
          healthcareOrderId: order_details._id,
          testDatabaseId: testDatabaseIds ?? null,
          quantity: 1,
          haveAccess: isAdmitted ? true : false,
        });
      } else if (productHistory && existingPaymnet) {
        //NOTE - if product details exist,(existing payment)

        //NOTE: Update in health care finance model for installment
        const installmentPayment = await this.healthCareFinanceModel.create({
          userId,
          orderId: productHistory.orderId,
          parentOrderId: productHistory.parentOrderId,
          packageId,
          serviceId,
          productAmount: productHistory.productAmount,
          totalPrice: amount,
          gst: packageDetails.priceId?.gst ?? 0,
          cgst: (packageDetails.priceId?.gst ?? 0) / 2,
          sgst: (packageDetails.priceId?.gst ?? 0) / 2,
          gstAmount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          discountPercentage: productHistory.discountPercentage,
          discountedPrice: basePrice,
          outstandingAmount,
          totalAmtReceived: Number(productHistory?.totalAmtReceived) + amount,
          nextPaymentDate,
          priceType,
          transactionStatus:
            outstandingAmount === 0
              ? TransactionStatus.INSTALLMENT_COMPLETE
              : TransactionStatus.INSTALLMENT,
          chequeOrTransNo,
          paymentDate,
          paymentStatus: PaymentStatus.PAID,
          receiptNumber: newReceiptNumber,
          paymentType,
          purchaseBy: healthCareUser?.type,
          createdBy: staffId,
          createdByModel: 'Staff',
          updatedByModel: 'Staff',
        });

        //NOTE - total amount paid percentage
        const amountPaidPercentage =
          (installmentPayment.totalAmtReceived /
            installmentPayment?.productAmount) *
          100;

        if (amountPaidPercentage >= 50) {
          //NOTE - update health care user model
          await this.healthcareUserModel.findOneAndUpdate(
            { _id: healthCareUser._id },
            {
              $set: {
                type: isAdmitted
                  ? UserType.HOSPITAL_STUDENT
                  : UserType.HOSPITAL_ENQUIRY,
                patientStatus: isAdmitted
                  ? UserStatusTypes.ADMITTED
                  : UserStatusTypes.PRE_BOOK,
                isRegistered: isAdmitted ? true : false,
                registationDate: isAdmitted ? new Date() : null,
              },
            },
          );

          if (isAdmitted) {
            //NOTE - close all existing follow up
            await this.followUpModel.updateMany(
              { patientId: healthCareUser._id },
              { $set: { followupStatus: FollowUpStatus.COMPLETED } },
            );
          }

          //NOTE - update user product details
          await this.productDeatilsModel.findOneAndUpdate(
            {
              healthcareUserId: healthCareUser._id,
              healthcareOrderId: productHistory.orderId,
            },
            { $set: { haveAccess: true } },
          );
        }
      }

      return { message: HOSPITAL_PAYMENT_SUCCESS };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - verify Payment for hospital  web and mobile
  async verifyHealthcareTransaction(
    payload: VerifyHospitalPaymentDto,
    userId: string,
  ): Promise<any> {
    try {
      const { order_id } = payload;

      const getOrder = await this.hospitalOrderModel.findOne({
        mkcOrderId: order_id,
      });

      //NOTE: Fetch the current user data including the coins field
      const user = await this.healthcareUserModel.findById(userId);

      const checkPayment = await this.verifyHdfcHospitalOrder(order_id);

      //NOTE: Check if the received amount matches the requested amount and if the signatures match
      if (
        getOrder.paidAmount === checkPayment.amount &&
        checkPayment.status === HdfcPaymentStatus.CHARGED
      ) {
        const receiptNumber = await this.generateHelathCareReceiptNumber();

        //NOTE - update health care order model
        const updateOrder = await this.hospitalOrderModel.findOneAndUpdate(
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

        //NOTE - find cart details
        const cartItems: any = await this.cartModel.find({ userId }).populate([
          {
            path: 'carePackageId',
            select: 'coins',
          },
          { path: 'priceId', select: 'totalPrice' },
        ]);

        //NOTE: Check if coins used or not
        let coinsUsed = 0;
        if (updateOrder.walletAmount > 0) {
          coinsUsed = await this.calculateCoinsFromRupees(
            updateOrder.walletAmount,
          );

          // If coins used, create a transaction
          if (coinsUsed > 0) {
            await this.coinsTransactionModel.create({
              patientId: user._id,
              healthcareOrderId: updateOrder._id,
              debit: coinsUsed,
              transactionReason: CoinTransactionReasonTypes.PRODUCT_PURCHASE,
            });
          }
        }

        //NOTE: Check if coupon used
        if (updateOrder.couponId && updateOrder.couponAmount) {
          const coupon = await this.couponModel.findById(updateOrder.couponId);

          //NOTE: Update the coupon as applied and calculate availableCoupon
          await this.couponModel.findByIdAndUpdate(
            coupon._id,
            {
              $inc: { appliedCoupon: 1 },
              $set: {
                availableCoupon:
                  coupon.numberOfIssued - (coupon.appliedCoupon + 1),
              },
            },
            { new: true, runValidators: true },
          );

          //NOTE: Update coupon transaction table
          await this.couponTransactionModel.create({
            healthcareUserId: user._id,
            couponId: coupon._id,
            healthcareOrderId: updateOrder._id,
            createdBy: user._id,
          });
        }

        // NOTE: Calculate the new coins value
        const newCoins = user.coins - coinsUsed;

        //NOTE Get user status
        const patientStatus = await this.getHealthCareUserStatus(
          cartItems,
          userId,
        );

        //NOTE Update health care user
        await this.healthcareUserModel.findByIdAndUpdate(user._id, {
          $set: {
            isRegistered: true,
            registrationDate: new Date(),
            patientStatus,
            coins: newCoins >= 0 ? newCoins : 0,
            type:
              patientStatus === UserStatusTypes.ADMITTED
                ? UserType.HOSPITAL_STUDENT
                : UserType.HOSPITAL_ENQUIRY,
          },
        });
        //NOTE - close all existing follow up
        await this.followUpModel.updateMany(
          { patientId: user._id },
          { $set: { followupStatus: FollowUpStatus.COMPLETED } },
        );

        let creditedCoins = 0;
        //NOTE - update all product details based on cart
        await Promise.all(
          cartItems.map(
            async (data: {
              userId: any;
              carePackageId: any;
              priceId: any;
              careServiceId: any;
              payment_type: any;
              totalPrice: any;
              gst?: 0;
              gstAmount: any;
              discountPercentage: any;
              discountedPrice: any;
              prebook_amount?: 0;
              nextPaymentDate: any;
            }) => {
              const {
                userId,
                carePackageId,
                priceId,
                careServiceId,
                payment_type,
                totalPrice,
                gst = 0,
                gstAmount,
                discountPercentage,
                discountedPrice,
                prebook_amount = 0,
                nextPaymentDate,
              } = data;

              const { coins = 0, _id: packageId } = carePackageId;
              const { totalPrice: total_price } = priceId;

              const calculateOutstandingAmount =
                payment_type === OfflineCoursePriceType.PRE_BOOK
                  ? total_price - prebook_amount
                  : 0;

              const totalAmtReceived =
                payment_type === OfflineCoursePriceType.PRE_BOOK
                  ? prebook_amount
                  : totalPrice;

              const transactionStatus =
                payment_type === OfflineCoursePriceType.PRE_BOOK
                  ? TransactionStatus.INSTALLMENT
                  : TransactionStatus.FULL_PAYMENT;

              await this.healthCareFinanceModel.create({
                userId,
                orderId: updateOrder._id,
                parentOrderId: updateOrder._id,
                packageId,
                serviceId: careServiceId,
                productAmount: total_price,
                totalPrice,
                gst,
                cgst: gst / 2,
                sgst: gst / 2,
                gstAmount,
                cgstAmount: gstAmount / 2,
                sgstAmount: gstAmount / 2,
                discountPercentage,
                discountedPrice,
                outstandingAmount: calculateOutstandingAmount,
                totalAmtReceived,
                nextPaymentDate,
                priceType: payment_type,
                transactionStatus,
                paymentStatus: PaymentStatus.PAID,
                receiptNumber: updateOrder.receiptNumber,
                purchaseBy: user?.type,
                createdBy: user._id,
                createdByModel: 'HealthcareUser',
                updatedByModel: 'HealthcareUser',
              });

              // Check if coins were used and create coupon transaction
              if (coins > 0) {
                await this.coinsTransactionModel.create({
                  patientId: user._id,
                  healthcareOrderId: updateOrder._id,
                  credit: coins,
                  transactionReason:
                    CoinTransactionReasonTypes.PRODUCT_PURCHASE,
                });

                creditedCoins = creditedCoins + coins;
              }

              //NOTE - update user product details
              await this.productDeatilsModel.create({
                healthcareUserId: userId,
                productType: ProductType.HEALTH_CARE,
                carePackageId: packageId,
                careServiceId: careServiceId,
                healthcareOrderId: updateOrder._id,
                quantity: 1,
                haveAccess: true,
              });
            },
          ),
        );

        //NOTE Update health care user
        await this.healthcareUserModel.findByIdAndUpdate(user._id, {
          $set: {
            coins: user.coins + creditedCoins,
          },
        });

        //NOTE: Remove all data from cart based on studentId
        await this.cartModel.deleteMany({ userId: user._id });

        //NOTE -check in token table user details
        const token = await this.tokenModel.findOne({
          userId: user._id.toString(),
        });

        if (
          user.type === UserType.HOSPITAL_ENQUIRY &&
          token.userType === UserType.HOSPITAL_STUDENT
        ) {
          //NOTE: check token , if exist then update the token
          await this.tokenModel.findByIdAndUpdate(
            { _id: token._id },
            { userType: UserType.HOSPITAL_STUDENT },
            { new: true, runValidators: true, upsert: true },
          );
        }

        return PAYMENT_SUCCESS;
      } else {
        //NOTE - update paymnet status in order table
        await this.hospitalOrderModel.findOneAndUpdate(
          { mkcOrderId: order_id },
          { paymentStatus: PaymentStatus.FAILED, paymentDate: new Date() },
        );

        //NOTE: Remove all data from cart based on studentId
        await this.cartModel.deleteMany({ userId: user._id });
        return PAYMENT_FAILED;
      }
    } catch (error) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
  }

  //SECTION - get user paymnet history
  async hospitalPaymenthistory(
    payload: PaymentHistoryDto,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, userId } = payload;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - get payment count
    const count = await this.healthCareFinanceModel.countDocuments({ userId });

    const paymnet_details: any[] = await this.healthCareFinanceModel
      .find({ userId })
      .populate([
        { path: 'packageId', select: 'title' },
        { path: 'serviceId', select: 'name' },
        { path: 'testDatabaseId', select: 'name' },
      ])
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const response = paymnet_details.map((item) => ({
      _id: item._id,
      orderId: item?.orderId,
      parentOrderId: item?.orderId,
      packageName: item.packageId?.title,
      serviceName: item.serviceId?.name,
      testDatabaseName:
        (item?.testDatabaseId &&
          item?.testDatabaseId.map((ele: { name: string }) => ele.name)) ??
        null,
      productAmount: item?.productAmount,
      totalPrice: item?.totalPrice,
      gst: item?.gst,
      cgst: item?.cgst,
      sgst: item?.sgst,
      gstAmount: item?.gstAmount,
      cgstAmount: item?.cgstAmount,
      sgstAmount: item?.sgstAmount,
      productType: ProductType.HEALTH_CARE,
      outstandingAmount: item?.outstandingAmount,
      totalAmtReceived: item?.totalAmtReceived,
      paymentDate: item?.paymentDate,
      nextPaymentDate: item?.nextPaymentDate,
      paymentType: item?.paymentType,
      transactionStatus: item?.transactionStatus,
      receiptNumber: item?.receiptNumber,
      isLabReportAdded: item?.isLabReportAdded,
      reportId: item?.reportId ?? null,
      purchaseProductType:
        item?.purchaseProductType ?? HealthCarePurchaseType.CARE_PACKAGE,
    }));

    return { data: response, count };
  }

  //SECTION - get Return Url
  async getReturnUrl(orderId: string): Promise<string> {
    //NOTE - get total paid amount
    const order = await this.hospitalOrderModel
      .findOne({
        mkcOrderId: orderId,
      })
      .select('paidAmount')
      .lean();

    //NOTE: Check if order is found
    if (!order) throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    const url = `${process.env.HOSPITAL_PAYMENT_RETURN_URL}?orderId=${orderId}&paidAmount=${order.paidAmount}`;
    return url;
  }

  //SECTION -get All Payment Details
  async getAllPaymentDetails(
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
                  await this.healthcareUserModel
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
                  await this.hospitalOrderModel
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
    const count = await this.healthCareFinanceModel.countDocuments({
      ...dateFilter,
      ...filters,
      ...paymentFilter,
    });

    //NOTE - find all payment data
    const paymentDetails: any[] = await this.healthCareFinanceModel
      .find({ ...dateFilter, ...filters, ...paymentFilter })
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
      .lean();

    //NOTE - push final data
    const data = paymentDetails.map((item) => {
      return {
        _id: item._id,
        orderId: item.orderId?._id ?? null,
        mkcOrderId: item.orderId?.mkcOrderId ?? null,
        orderType: item.orderId?.orderType ?? null,
        user: item.userId?.name ?? null,
        phone: item.userId?.phone ?? null,
        paymentId: item.orderId?.paymentId ?? null,
        productAmount: item?.productAmount ?? null,
        totalPrice: item?.totalPrice ?? null,
        totalAmtReceived: item?.totalAmtReceived ?? null,
        outstandingAmount: item?.outstandingAmount ?? 0,
        paymentType: item?.paymentType ?? null,
        paymentDate: item?.paymentDate ?? null,
        paymentStatus: item.paymentStatus ?? null,
        chequeOrTransNo: item?.chequeOrTransNo ?? null,
        nextPaymentDate: item?.nextPaymentDate ?? null,
        purchaseProductType: item?.purchaseProductType ?? null,
        purchaseBy: item?.purchaseBy ?? null,
        createdBy: item?.createdBy?.name ?? null,
      };
    });

    return { data, count };
  }

  //SECTION - export Payment List
  async exportPaymentList(query: ParsedQs): Promise<{ data: any }> {
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
    const paymentDetails: any = await this.healthCareFinanceModel
      .find({ ...dateFilter, paymentStatus: PaymentStatus.PAID })
      .populate([
        { path: 'userId', select: 'name' },
        {
          path: 'orderId',
          select: 'mkcOrderId orderType',
        },
        { path: 'packageId', select: 'title' },
        { path: 'testDatabaseId', select: 'name' },
        { path: 'createdBy', select: 'name' },
      ])
      .sort({ paymentDate: 1 })
      .lean();
    //NOTE -  Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Details');

    //NOTE - Defining headers
    worksheet.columns = [
      { header: 'DATE', key: 'paymentDate', width: 10 },
      { header: 'NAME', key: 'userName', width: 35 },
      {
        header: 'Purchase Product Type',
        key: 'purchaseProductType',
        width: 35,
      },
      { header: 'Product Name', key: 'productName', width: 10 },
      { header: 'PAY MODE', key: 'paymentType', width: 10 },
      { header: 'RECEIPT NO', key: 'receiptNumber', width: 20 },
      { header: 'DD/CHQ/TRN NO', key: 'chequeOrTransNo', width: 20 },
      { header: 'Product Amount', key: 'productAmount', width: 10 },
      { header: 'Non Taxable', key: 'totalPrice', width: 10 },
      { header: 'Taxable', key: 'discountedPrice', width: 10 },
      { header: 'CGST', key: 'cgstAmount', width: 10 },
      { header: 'SGST', key: 'sgstAmount', width: 10 },
      { header: 'Total', key: 'totalPrice', width: 10 },
      { header: 'Created By', key: 'createdByName', width: 10 },
    ];

    // NOTE - adding data as row
    await Promise.all(
      paymentDetails.map(async (item) => {
        // Concatenate names in testDatabaseId array
        const testDatabaseNames = item.testDatabaseId
          .map((db: any) => db.name)
          .join(', '); // Join names with comma and space

        worksheet.addRow([
          item.paymentDate,
          item.userId?.name,
          item?.purchaseProductType,
          item.packageId?.title ?? testDatabaseNames,
          item.paymentType,
          item.receiptNumber,
          item.chequeOrTransNo,
          item.productAmount,
          item.totalPrice,
          item.discountedPrice,
          item.cgstAmount,
          item.sgstAmount,
          item.totalPrice,
          item.createdBy?.name,
        ]);
      }),
    );

    //NOTE -  Save Excel workbook to a file (temporarily)
    const tempFilePath = path.join(
      __dirname,
      'helath_care_payment_report.xlsx',
    );
    // NOTE - data is being transferred to a file
    await workbook.xlsx.writeFile(tempFilePath);
    return { data: tempFilePath };
  }

  //ANCHOR - generate mkc Order UniqueID
  private async generateOrderUniqueID(): Promise<string> {
    const prefix = 'MKC_HOSP_ORD_';
    const lastOrder = await this.hospitalOrderModel.findOne(
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

  //ANCHOR -generate Receipt for hospital
  private async generateHelathCareReceiptNumber(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);

      const lastReceipt = await this.healthCareFinanceModel
        .findOne({
          paymentStatus: PaymentStatus.PAID,
          receiptNumber: { $regex: `^MKH-${currentYear}`, $options: 'i' },
        })
        .sort({ receiptNumber: -1 })
        .select('receiptNumber');

      let nextReceiptNumber: string;

      if (!lastReceipt) {
        // If there's no last receipt, start with the new format
        nextReceiptNumber = '0001';
      } else {
        // Get the numeric part of the last receipt number and increment it by 1
        const lastNumber = parseInt(lastReceipt.receiptNumber.slice(-4), 10);
        nextReceiptNumber = (lastNumber + 1).toString().padStart(4, '0');
      }

      // Construct the receipt number with the desired format
      const receiptNumber = `MKH-${currentYear}${nextReceiptNumber}`;

      return receiptNumber;
    } catch (error) {
      throw error;
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

  //ANCHOR - get student status based on the product added in cart
  private async getHealthCareUserStatus(
    cart: any[],
    userId: any,
  ): Promise<string> {
    const user = await this.healthcareUserModel.findById(userId);

    //NOTE: If the user's existing status is 'admitted', return the current status
    if ([UserStatusTypes.ADMITTED].includes(user.patientStatus)) {
      return user.patientStatus;
    }

    let hasNonPreBookedProduct = false;
    let hasPreBookedProductBelow50Percent = false;

    //NOTE: Check each product in the cart
    for (const item of cart) {
      //NOTE: If the payment type is not PRE_BOOK, consider it as non-pre-booked product
      if (item.payment_type !== OfflineCoursePriceType.PRE_BOOK) {
        hasNonPreBookedProduct = true;
        break;
      }

      //NOTE: For PRE_BOOK payment type, check if the pre-booked amount is less than 50% of the total price
      const productDetails = await this.carePackageModel
        .findById(item.carePackageId._id)
        .populate([{ path: 'priceId', select: 'totalPrice' }]);
      const amountPercentage = productDetails.priceId.totalPrice / 2;

      if (item.prebook_amount >= amountPercentage) {
        hasNonPreBookedProduct = true;
        break;
      }

      if (item.prebook_amount < amountPercentage) {
        hasPreBookedProductBelow50Percent = true;
      }
    }

    if (hasNonPreBookedProduct) {
      return UserStatusTypes.ADMITTED;
    } else if (hasPreBookedProductBelow50Percent) {
      return UserStatusTypes.PRE_BOOK;
    } else {
      return UserStatusTypes.ADMITTED;
    }
  }

  //ANCHOR - get all payment details based on purchase product type
  private async calculateProductPriceDetails(
    purchaseProductType: HealthCarePurchaseType,
    productHistory: any,
    isPreBook: any,
    priceType: OfflineCoursePriceType,
    packageDetails: any,
    amount: number,
  ): Promise<any> {
    let totalPrice = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    let basePrice = 0;
    let totalGst = 0;
    let discountPercentage = 0;

    if (purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE) {
      if (productHistory) {
        if (!isPreBook) {
          if (priceType === OfflineCoursePriceType.DISCOUNT_PRICE) {
            totalPrice = Math.ceil(packageDetails?.priceId?.totalPrice);
          } else {
            totalPrice = Math.ceil(packageDetails?.priceId?.mrpPrice);
          }
        } else {
          totalPrice = amount;
        }
      } else {
        totalPrice = amount;
      }

      totalGst = packageDetails.priceId?.gst;

      basePrice = Math.ceil(
        totalPrice / (1 + (packageDetails.priceId?.gst || 0) / 100),
      );
      gstAmount = Math.ceil(totalPrice - basePrice);
      totalAmount = amount;
      paidAmount = amount;
      discountPercentage = packageDetails.priceId.discountPercentage;
    } else {
      for (const data of packageDetails) {
        const itemTotalPrice =
          priceType === OfflineCoursePriceType.DISCOUNT_PRICE
            ? Math.ceil(data?.priceId?.totalPrice)
            : Math.ceil(data?.priceId?.mrpPrice);

        const itemGst = data?.priceId?.gst || 0;
        const itemDiscountPercentage = data?.priceId?.discountPercentage || 0;

        totalPrice += itemTotalPrice;
        totalGst += itemGst;

        const basePriceValue = Math.ceil(itemTotalPrice / (1 + itemGst / 100));
        const itemGstAmount = Math.ceil(itemTotalPrice - basePriceValue);

        basePrice += basePriceValue;
        gstAmount += itemGstAmount;
        totalAmount += itemTotalPrice;
        paidAmount += itemTotalPrice;
        discountPercentage += itemDiscountPercentage;
      }
    }

    return {
      totalPrice,
      gstAmount,
      totalAmount,
      paidAmount,
      basePrice,
      totalGst,
      discountPercentage,
    };
  }

  //ANCHOR - get productHistory and packageDetails based on purchase product type
  private async getProductDetails(
    purchaseProductType: HealthCarePurchaseType,
    userId: string,
    packageId: string,
    serviceId: string,
    testDatabaseIds: string[],
  ): Promise<{ productHistory: any; packageDetails: any }> {
    let productHistory;
    let packageDetails;

    if (purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE) {
      productHistory = await this.healthCareFinanceModel
        .findOne({
          userId: new mongoose.Types.ObjectId(userId),
          packageId: new mongoose.Types.ObjectId(packageId),
          serviceId: new mongoose.Types.ObjectId(serviceId),
          paymentStatus: PaymentStatus.PAID,
        })
        .sort({ createdAt: -1 });

      packageDetails = await this.carePackageModel
        .findById(packageId)
        .populate(
          'priceId',
          'mrpPrice discountedPrice totalPrice discountPercentage gst',
        );
    } else {
      packageDetails = await this.healthCareTestDatabaseModel
        .find({ _id: { $in: testDatabaseIds } })
        .populate(
          'priceId',
          'mrpPrice discountedPrice totalPrice discountPercentage gst',
        );
    }

    if (!packageDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return { productHistory, packageDetails };
  }

  //ANCHOR - create Hdfc Hospital Order
  private async createHdfcHospitalOrder(
    mkcOrderId: string,
    totalAmount: number,
    user: { uniqueId: string; email: string; phone: string; name: string },
  ): Promise<any> {
    try {
      //NOTE - ceate auth string by api key
      const username = '6B98AAE69444F83B012F65559C8103';
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
          return_url: process.env.HDFC_RETURN_URL,
          description: 'Complete your payment',
          first_name: user.name,
        },
        {
          headers: {
            Authorization: `Basic ${basicAuthString}`,
            'Content-Type': 'application/json',
            'x-merchantid': process.env.MERCHANT_ID,
            'x-customerid': process.env.HOSPITAL_CUSTOMER_ID,
          },
        },
      );

      return order.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  //ANCHOR - verify Hdfc Hospital Order
  private async verifyHdfcHospitalOrder(order_id: string): Promise<any> {
    try {
      const username = '6B98AAE69444F83B012F65559C8103';
      const password = '';
      const basicAuthString = Buffer.from(`${username}:${password}`).toString(
        'base64',
      );

      const response = await axios.post(
        `https://smartgatewayuat.hdfcbank.com/orders/${order_id}`,
        null, // No payload data needed for this request
        {
          headers: {
            Authorization: `Basic ${basicAuthString}`,
            version: '2023-06-30',
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-merchantid': 'SG235',
            'x-customerid': 'test123',
          },
        },
      );

      console.log('helath care response.data', response.data);

      return response.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
