import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { HostelEnquiry } from 'src/schema/hostel-enquiry.schema';
import { HostelOrder } from 'src/schema/hostel-order.schema';
import { HostelRentalPay } from 'src/schema/hostel-rental-pay.schema';
import { ParsedQs } from 'qs';
import {
  BankDetailsType,
  BedTypes,
  HostelPaymentType,
  HostelPriceType,
  MiscellaneousCostHostelType,
  OfflinePaymentType,
  OrderTypes,
  PaymentStatus,
  UserType,
} from 'src/utills/enum';
import { HostelOrderListDto } from './dto/hosetl-order-list.dto';
import { HostelOrderDetailsDto } from './dto/hostel-order-history.dto';
import { INVALID_ID, RECORD_NOT_FOUND } from 'src/utills/messages';
import { BillingHistoryDto } from './dto/billing-history.dto';
import { Setting } from 'src/schema/site-setting.schema';
import { CommonService } from 'src/utills/commonService';
import { StudentBatch } from 'src/schema/student-batch.schema';
import { UserHostelValidity } from 'src/schema/user.hostel.validity.schema';

@Injectable()
export class HostelOrderService {
  constructor(
    @InjectModel(Setting.name)
    private settingRepository: Model<Setting>,
    @InjectModel(HostelEnquiry.name)
    private hostelEnquiryRepository: Model<HostelEnquiry>,
    @InjectModel(HostelOrder.name)
    private hostelOrderRepository: Model<HostelOrder>,
    @InjectModel(HostelRentalPay.name)
    private hostelRentalPayRepository: Model<HostelRentalPay>,
    @InjectModel(StudentBatch.name)
    private studentBatchRepository: Model<StudentBatch>,
    @InjectModel(UserHostelValidity.name)
    private hostelValidityRepository: Model<UserHostelValidity>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - get Hostel Order List For Admin
  async getHostelOrderListForAdmin(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, fromDate, toDate, status, search, userId } =
      query as unknown as {
        page: string;
        limit: string;
        fromDate: Date;
        toDate: Date;
        status: string;
        search: string;
        userId: string;
      };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
              $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
            },
          }
        : {};

    const statusFilter = status ? { paymentStatus: status } : {};

    let nameFilter = {};
    if (search) {
      const userIds = await this.hostelEnquiryRepository
        .find({
          $or: [
            { name: { $regex: new RegExp(search, 'i') } },
            { phone: { $regex: new RegExp(search, 'i') } },
            { email: { $regex: new RegExp(search, 'i') } },
          ],
        })
        .select('_id')
        .lean();
      const userIdsArray = userIds.map((user) => user._id.toString());
      nameFilter = {
        $or: [
          { userId: { $in: userIdsArray } },
          { mkcOrderId: { $regex: new RegExp(search, 'i') } },
        ],
      };
    }

    //NOTE - user filter
    const userFilter = userId ? { userId } : {};

    const filters = {
      ...dateFilter,
      ...statusFilter,
      ...nameFilter,
      ...userFilter,
    };

    const countPromise = this.hostelOrderRepository.countDocuments(filters);
    const ordersPromise: any = this.hostelOrderRepository
      .find(filters)
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'hostelId', select: 'name' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId')
      .lean();

    const [count, orderDetails] = await Promise.all([
      countPromise,
      ordersPromise,
    ]);

    const data = orderDetails.map(
      (item: {
        _id: any;
        mkcOrderId: string;
        orderNumber: string;
        paymentId: string;
        parentOrderId: any;
        userId: { _id: string; name: string; phone: string };
        parentId: { name: string };
        hostelId: { name: string };
        roomNumber: number;
        floorNumber: number;
        bedType: BedTypes;
        paymentDate: Date;
        type: HostelPaymentType;
        paymentStatus: PaymentStatus;
        priceType: HostelPriceType;
        orderType: OrderTypes;
        purchaseBy: UserType;
        paymentType: OfflinePaymentType;
        paidAmount: number;
        receiptNumber: string;
        nextPaymentDate: Date;
        bankDetails: BankDetailsType;
        createdBy: { name: string };
        updatedBy: { name: string };
      }) => ({
        _id: item._id,
        mkcOrderId: item.mkcOrderId ?? null,
        orderNumber: item.orderNumber ?? null,
        paymentId: item.paymentId ?? null,
        parentOrderId: item.parentOrderId ?? null,
        userId: item.userId?._id ?? null,
        user: item.userId?.name ?? null,
        parent: item.parentId?.name ?? null,
        phone: item.userId?.phone ?? null,
        hostel: item.hostelId?.name ?? null,
        roomNumber: item.roomNumber ?? null,
        floorNumber: item.floorNumber ?? null,
        bedType: item.bedType ?? null,
        paymentDate: item.paymentDate ?? null,
        type: item.type ?? null,
        paymentStatus: item.paymentStatus ?? null,
        priceType: item.priceType ?? null,
        orderType: item.orderType ?? null,
        purchaseBy: item.purchaseBy ?? null,
        paymentType: item.paymentType ?? null,
        paidAmount: item.paidAmount,
        receiptNumber: item.receiptNumber ?? null,
        nextPaymentDate: item.nextPaymentDate ?? null,
        bankDetails: item?.bankDetails ?? null,
        createdBy: item.createdBy?.name ?? null,
        updatedBy: item.updatedBy?.name ?? null,
      }),
    );

    return { data, count };
  }

  //SECTION - retrieve Student Hostel Orders list (web and mobile)
  async retrieveStudentHostelOrders(
    payload: HostelOrderListDto,
    userId: string,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit } = payload;
    const skip = (page - 1) * limit;

    //NOTE - get order count
    const count = await this.hostelOrderRepository.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: true,
    });
    // NOTE - find all order data
    const orderDetails: any[] = await this.hostelOrderRepository
      .find({ userId: new mongoose.Types.ObjectId(userId), status: true })
      .populate([{ path: 'hostelId', select: 'name' }])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      orderDetails.map(async (item) => {
        return {
          _id: item._id,
          mkcOrderId: item?.mkcOrderId ?? null,
          hostelName: item?.hostelId?.name ?? null,
          roomNumber: item?.roomNumber ?? null,
          floorNumber: item?.floorNumber ?? null,
          bedType: item?.bedType ?? null,
          type: item?.type ?? null,
          paidAmount: item?.paidAmount ?? null,
          paymentStatus: item.paymentStatus ?? null,
          paymentDate: item?.paymentDate ?? null,
          joiningDate: item?.joiningDate ?? null,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get hostel order details by id
  async hostelOrderDetails(
    payload: HostelOrderDetailsDto,
  ): Promise<{ data: any }> {
    const { orderId } = payload;

    if (!mongoose.isValidObjectId(orderId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get order details
    const order_history: any = await this.hostelOrderRepository
      .findById(orderId)
      .populate([
        { path: 'userId', select: 'name phone email' },
        { path: 'parentId', select: 'name' },
        { path: 'hostelId', select: 'name' },
        { path: 'couponId', select: 'name code' },
      ])
      .select('-parentId -couponId -hostelId')
      .lean();

    if (!order_history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const monthWise = order_history.type === HostelPaymentType.MONTH_WISE;
    const dayWise = order_history.type === HostelPaymentType.DAY_WISE;

    //NOTE - paymnet details based on the type
    const paymentDetails = {
      securityFee: monthWise
        ? order_history.monthlyPaymentDetail?.securityFee
        : null,
      paidSecurityFee: monthWise
        ? order_history.monthlyPaymentDetail?.paidSecurityFee
        : null,
      hostelCharge: monthWise
        ? order_history.monthlyPaymentDetail?.hostelCharge
        : null,
      hostelGst: monthWise
        ? order_history.monthlyPaymentDetail?.hostelGst
        : null,
      hostelPaidAmount: monthWise
        ? order_history.monthlyPaymentDetail?.hostelPaidAmount
        : null,
      accommodationCost: monthWise
        ? order_history.monthlyPaymentDetail?.accommodationCost
        : null,
      accommodationGst: monthWise
        ? order_history.monthlyPaymentDetail?.accommodationGst
        : null,
      accommodationPaidAmount: monthWise
        ? order_history.monthlyPaymentDetail?.accommodationPaidAmount
        : null,
      mealCost: monthWise ? order_history.monthlyPaymentDetail?.mealCost : null,
      mealGst: monthWise ? order_history.monthlyPaymentDetail?.mealGst : null,
      mealPaidAmount: monthWise
        ? order_history.monthlyPaymentDetail?.mealPaidAmount
        : null,
      totalGst: monthWise ? order_history.monthlyPaymentDetail?.totalGst : null,

      perDayCost: dayWise
        ? order_history.daywisePaymentDetail?.perDayCost
        : null,
      totalDays: dayWise ? order_history.daywisePaymentDetail?.totalDays : null,
      totalAmount: monthWise
        ? order_history.monthlyPaymentDetail?.totalAmount
        : order_history.daywisePaymentDetail?.totalAmount,

      paidAmount: monthWise
        ? order_history.monthlyPaymentDetail?.paidAmount
        : order_history.daywisePaymentDetail?.paidAmount,
    };

    //NOTE - miscellaneousCost details
    const miscellaneousCost =
      order_history?.miscellaneousCost?.map(
        (ele: { reason: MiscellaneousCostHostelType; amount: number }) => ({
          reason: ele.reason ?? null,
          amount: ele.amount ?? null,
        }),
      ) ?? null;

    //NOTE - push final data
    const data = {
      _id: order_history?._id,
      user: order_history?.userId ? { ...order_history?.userId } : null,
      parentName: order_history?.parentId?.name ?? null,
      orderNumber: order_history?.mkcOrderId ?? null,
      couponName: order_history?.couponId?.name ?? null,
      couponCode: order_history?.couponId?.code ?? null,
      couponAmount: order_history?.couponAmount ?? null,
      hostelName: order_history?.hostelId?.name ?? null,
      roomNumber: order_history?.roomNumber ?? null,
      floorNumber: order_history?.floorNumber ?? null,
      bedType: order_history?.bedType ?? null,
      walletAmount: order_history?.walletAmount ?? null,
      paymentDate: order_history?.paymentDate ?? null,
      type: order_history?.type ?? null,
      paymentDetails,
      miscellaneousCost,
      purchaseBy: order_history?.purchaseBy ?? null,
      paymentStatus: order_history?.paymentStatus,
      priceType: order_history?.priceType ?? null,
      orderType: order_history?.orderType ?? null,
      joiningDate: order_history?.joiningDate ?? null,
      receiptNumber: order_history?.receiptNumber ?? null,
      bankDetails: order_history?.bankDetails ?? null,
    };

    return { data };
  }

  //SECTION - user Billing History
  async userBillingHistory(
    payload: BillingHistoryDto,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, userId } = payload;
    const skip = (page - 1) * limit;

    //NOTE - user filter
    const userFilter = userId ? { userId } : {};

    const filters = { ...userFilter };

    const countPromise = this.hostelRentalPayRepository.countDocuments(filters);
    const paymentPromise: any = this.hostelRentalPayRepository
      .find(filters)
      .populate('hostelId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-hostelId -createdBy')
      .lean();

    const [count, paymentDetails] = await Promise.all([
      countPromise,
      paymentPromise,
    ]);
    //NOTE: Utility function to handle default values
    const getValueOrNull = (value: any) => value ?? null;

    const getMiscellaneousValueOrNull = (value: any) =>
      value && value.length > 0
        ? value.reduce(
            (total: number, ele: { amount: number }) => total + ele.amount,
            0,
          )
        : 0;

    //NOTE - send the final response
    const data = paymentDetails.map(
      (ele: {
        _id: string;
        orderId: string;
        parentOrderId: string;
        hostelId: { _id: string; name: string };
        createdBy: { _id: string; name: string };
        priceType: HostelPriceType;
        type: HostelPaymentType;
        monthCount: number;
        daysCount: number;
        roomNumber: number;
        floorNumber: number;
        discountedAmount: number;
        bedType: BedTypes;
        totalAmountWithSecurity: number;
        totalAmountWithOutSecurity: number;
        paidAmount: number;
        outstandingAmount: number;
        totalAmtReceived: number;
        paidSecurityFee: number;
        nextPaymentDate: Date;
        paymentDate: Date;
        paymentType: OfflinePaymentType;
        chequeOrTransNo: string;
        bankDetails: BankDetailsType;
        miscellaneousCost: any;
        settledAmount: number;
        adjustedAmount: number;
        securityReason: string;
        perDayCost: number;
        totalDays: number;
      }) => ({
        _id: ele._id,
        orderId: getValueOrNull(ele?.orderId),
        parentOrderId: getValueOrNull(ele?.parentOrderId),
        hostelId: getValueOrNull(ele?.hostelId?._id),
        hostelName: getValueOrNull(ele?.hostelId?.name),
        type:
          ele?.priceType === HostelPriceType.BED_TYPE_CHANGE
            ? getValueOrNull(ele?.priceType)
            : getValueOrNull(ele?.type),
        roomNumber: getValueOrNull(ele?.roomNumber),
        floorNumber: getValueOrNull(ele?.floorNumber),
        bedType: getValueOrNull(ele?.bedType),
        monthCount: ele?.monthCount ?? 1,
        daysCount: ele?.daysCount ?? 0,
        discountedAmount: ele?.discountedAmount ?? 0,
        totalAmountWithSecurity: getValueOrNull(ele?.totalAmountWithSecurity),
        totalAmountWithOutSecurity: getValueOrNull(
          ele?.totalAmountWithOutSecurity,
        ),
        miscellaneousCost: getMiscellaneousValueOrNull(ele?.miscellaneousCost),
        paidAmount: getValueOrNull(ele?.paidAmount),
        paidSecurityFee: getValueOrNull(ele?.paidSecurityFee),
        outstandingAmount: getValueOrNull(ele?.outstandingAmount),
        totalAmtReceived: getValueOrNull(ele?.totalAmtReceived),
        nextPaymentDate: getValueOrNull(ele?.nextPaymentDate),
        paymentDate: getValueOrNull(ele?.paymentDate),
        paymentType: getValueOrNull(ele?.paymentType),
        chequeOrTransNo: getValueOrNull(ele?.chequeOrTransNo),
        bankDetails: getValueOrNull(ele?.bankDetails),
        settledAmount: getValueOrNull(ele?.settledAmount),
        adjustedAmount: getValueOrNull(ele?.adjustedAmount),
        totalDays: getValueOrNull(ele?.totalDays),
        perDayCost: getValueOrNull(ele?.perDayCost),
        securityReason: getValueOrNull(ele?.securityReason),
        isDownloadReceiptA:
          ele.type !== HostelPaymentType.SUCURITY_REFUND &&
          ele?.priceType !== HostelPriceType.BED_TYPE_CHANGE,
        isDownloadReceiptB:
          ele.type !== HostelPaymentType.SUCURITY_REFUND &&
          ele.type !== HostelPaymentType.DAY_WISE &&
          ele?.priceType !== HostelPriceType.BED_TYPE_CHANGE,
        createdBy: getValueOrNull(ele?.createdBy?.name),
      }),
    );

    return { data, count };
  }

  // SECTION - generate hospital receipt a
  async generateHostelReceiptA(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const history: any = await this.hostelRentalPayRepository
      .findById(id)
      .populate('userId', 'name enrollmentNumber parentName studentId')
      .populate('hostelId', 'name address')
      .lean();

    if (!history) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    //NOTE: Define payment details based on history type
    const paymentDetails =
      history.type === HostelPaymentType.MONTH_WISE
        ? [
            {
              name: 'Hostel Security Dep.',
              code: null,
              mode: history.paymentType,
              amount: history.paidSecurityFee,
              bankDetails:
                (history?.bankDetails ?? null)?.toUpperCase() ?? null,
            },
            history?.hostelPaidAmount > 0 ||
            history?.accommodationPaidAmount > 0 ||
            history?.mealPaidAmount > 0
              ? {
                  name: 'Hostel Monthly Fee',
                  code: null,
                  mode: history.paymentType,
                  amount: history.paidAmount,
                  bankDetails:
                    (history?.bankDetails ?? null)?.toUpperCase() ?? null,
                }
              : null,
            history?.miscellaneousCost && history.miscellaneousCost.length > 0
              ? {
                  name: 'Miscellaneous Cost',
                  code: null,
                  mode: history.paymentType,
                  amount: history.miscellaneousCost.reduce(
                    (total: number, ele: { amount: number }) =>
                      total + Number(ele.amount),
                    0,
                  ),
                  bankDetails:
                    (history?.bankDetails ?? null)?.toUpperCase() ?? null,
                }
              : null,
          ].filter(Boolean) // Remove any null values from the array
        : [
            {
              name: 'Hostel Daily Fee',
              code: null,
              mode: history.paymentType,
              amount: history.paidAmount,
              bankDetails:
                (history?.bankDetails ?? null)?.toUpperCase() ?? null,
            },
            history?.paidSecurityFee > 0
              ? {
                  name: 'Hostel Security Dep.',
                  code: null,
                  mode: history.paymentType,
                  amount: history.paidSecurityFee,
                  bankDetails:
                    (history?.bankDetails ?? null)?.toUpperCase() ?? null,
                }
              : null,
          ].filter(Boolean); // Remove any null values from the array

    // Remove objects with amount = 0
    const filteredPaymentDetails = paymentDetails.filter(
      (detail) => detail.amount !== 0,
    );

    //NOTE: Fetch batch and course details if enrollmentNumber exists
    const batchDetailsPromise = history.userId?.enrollmentNumber
      ? this.studentBatchRepository
          .findOne({
            studentId: history.userId.studentId,
            newEnrollmentNumber: history.userId.enrollmentNumber,
          })
          .populate('batchId', 'name')
          .populate('courseId', 'title')
          .lean()
      : Promise.resolve(null);

    //NOTE: Fetch hostel logo
    const logoPromise = this.settingRepository
      .findOne()
      .select('hostelLogoLink')
      .lean();

    //NOTE Await all promises in parallel
    const [batchDetails, logo] = await Promise.all([
      batchDetailsPromise,
      logoPromise,
    ]);

    //NOTE Generate signed URL for logo
    const logoLink = logo?.hostelLogoLink
      ? await this.commonService.getSignedUrl(logo.hostelLogoLink)
      : null;

    //NOTE Format payment dates
    const paymentDate = history.paymentDate
      ? await this.commonService.convertToShortDate(history.paymentDate)
      : null;
    const nextPaymentDate = history.nextPaymentDate
      ? await this.commonService.convertToShortDate(history.nextPaymentDate)
      : null;

    //NOTE - get user validate
    const validity = await this.hostelValidityRepository.findOne({
      paymentId: history._id,
    });

    const joiningDate = validity?.joiningDate
      ? await this.commonService.convertToShortDate(validity?.joiningDate)
      : null;

    const validityEndDate = validity?.validityEndDate
      ? await this.commonService.convertToShortDate(validity?.validityEndDate)
      : null;

    //NOTE: Construct JSON data for EJS template
    const jsonData = {
      path: process.env.HOSTEL_RECEIPT_EJS_URL,
      data: {
        receiptNumber: history?.receiptNumber ?? null,
        type: history?.type ?? null,
        logoLink,
        name: history?.userId?.name ?? null,
        enrollmentNumber: history?.userId?.enrollmentNumber ?? null,
        paymentDate,
        parentName: history?.userId?.parentName ?? null,
        batch: batchDetails?.batchId?.name ?? null,
        course: batchDetails?.courseId?.title ?? null,
        hostel: history?.hostelId?.name ?? null,
        roomDetails: `Type - ${history?.bedType} - ${history?.roomNumber}`,
        nextPaymentDate,
        outstandingAmount: history?.outstandingAmount ?? null,
        totalAmtReceived: history?.totalAmtReceived ?? null,
        joiningDate,
        validityEndDate,
        paymentDetails: filteredPaymentDetails,
      },
    };

    const pdf = await this.commonService.generatePdfForReports(jsonData);
    return pdf;
  }

  // SECTION - generate hospital receipt b
  async generateHostelReceiptB(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const history: any = await this.hostelRentalPayRepository
      .findById(id)
      .populate('userId', 'name enrollmentNumber parentName studentId')
      .populate('hostelId', 'name address bedDetails')
      .lean();

    if (!history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    const {
      bedType,
      paymentType,
      paidSecurityFee,
      hostelPaidAmount,
      hostelGst,
      accommodationPaidAmount,
      accommodationGst,
      mealPaidAmount,
      mealGst,
      paymentDate,
      nextPaymentDate,
      receiptNumber,
      type,
      totalAmtReceived,
      userId,
      hostelId,
      isGstApplicable,
      bankDetails,
      miscellaneousCost,
      hostelGstAmount,
      accommodationGstAmount,
      mealGstAmount,
      discountedAmount,
    } = history;

    const paymentDetails = [
      {
        name: 'Hostel Security Dep.',
        code: null,
        mode: paymentType,
        amount: paidSecurityFee,
        bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
      },
      {
        name: 'Hostel Charges Dep.',
        code: null,
        mode: paymentType,
        amount: (await this.calculatePrice(hostelPaidAmount, hostelGst)) ?? 0,
        bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
      },
      {
        name: 'Accommodation charges(Reimbursement).',
        code: null,
        mode: paymentType,
        amount:
          (await this.calculatePrice(
            accommodationPaidAmount,
            accommodationGst,
          )) ?? 0,
        bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
      },
      {
        name: 'Meal Charges(Reimbursement)',
        code: null,
        mode: paymentType,
        amount: (await this.calculatePrice(mealPaidAmount, mealGst)) ?? 0,
        bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
      },
      ...(miscellaneousCost && miscellaneousCost.length > 0
        ? [
            {
              name: 'Miscellaneous Cost',
              code: null,
              mode: paymentType,
              amount: miscellaneousCost.reduce(
                (total: number, ele: { amount: number }) =>
                  total + Number(ele.amount),
                0,
              ),
              bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
            },
          ]
        : []),
      ...(discountedAmount && discountedAmount > 0
        ? [
            {
              name: 'Discounted Amount',
              code: null,
              mode: paymentType,
              amount: discountedAmount ?? 0,
              bankDetails: (bankDetails ?? null)?.toUpperCase() ?? null,
            },
          ]
        : []),
    ];

    //NOTE: Remove objects with amount = 0
    const filteredPaymentDetails = paymentDetails.filter(
      (detail) => detail.amount !== 0,
    );

    const totalGst = hostelGstAmount + accommodationGstAmount + mealGstAmount;

    const batchDetailsPromise: any = userId?.enrollmentNumber
      ? this.studentBatchRepository
          .findOne({
            studentId: userId.studentId,
            newEnrollmentNumber: userId.enrollmentNumber,
          })
          .populate('batchId', 'name')
          .populate('courseId', 'title')
          .lean()
      : null;

    const logoPromise = this.settingRepository
      .findOne()
      .select('hostelLogoLink')
      .lean();

    const [batchDetails, logo] = await Promise.all([
      batchDetailsPromise,
      logoPromise,
    ]);

    const logoLink = logo?.hostelLogoLink
      ? await this.commonService.getSignedUrl(logo.hostelLogoLink)
      : null;

    const paymentDateFormatted = await this.commonService.convertToShortDate(
      paymentDate,
    );
    const nextPaymentDateFormatted =
      await this.commonService.convertToShortDate(nextPaymentDate);

    const jsonData = {
      path: process.env.HOSTEL_RECEIPT_B_EJS_URL,
      data: {
        receiptNumber,
        type,
        logoLink,
        name: userId?.name,
        enrollmentNumber: userId?.enrollmentNumber,
        paymentDate: paymentDateFormatted,
        parentName: userId?.parentName,
        batch: batchDetails?.batchId?.name,
        course: batchDetails?.courseId?.title,
        hostel: hostelId?.name,
        roomDetails: `Type - ${bedType} - ${history?.roomNumber}`,
        nextPaymentDate: nextPaymentDateFormatted,
        outstandingAmount: history?.outstandingAmount ?? null,
        totalAmtReceived,
        paymentDetails: filteredPaymentDetails,
        isGstApplicable,
        cgstAmount: totalGst / 2,
        sgstAmount: totalGst / 2,
        hostelGstAmount,
        accommodationGstAmount,
        mealGstAmount,
      },
    };

    return this.commonService.generatePdfForReports(jsonData);
  }

  //ANCHOR - calculate price based on gst
  private async calculatePrice(amount: number, gst: number): Promise<number> {
    const basePrice = amount / (1 + gst / 100);

    //NOTE: Round the base price to ensure it is a whole number
    const roundedBasePrice = Math.ceil(basePrice);

    return roundedBasePrice;
  }
}
