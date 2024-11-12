import { ParsedQs } from 'qs';
import * as pdf from 'html-pdf';
import mongoose, { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HealthcareUser } from 'src/schema/health-care-user.schema';
import { HospitalOrder } from 'src/schema/hospital-order-schema';
import { UserOrderHistoryDto } from './dto/user-order-history.dto';
import { OrderDetailsDto } from './dto/order-history.dto';
import { CommonService } from 'src/utills/commonService';
import { INVALID_ID, RECORD_NOT_FOUND } from 'src/utills/messages';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { Setting } from 'src/schema/site-setting.schema';
import {
  HealthCarePurchaseType,
  OfflineCoursePriceType,
} from 'src/utills/enum';

@Injectable()
export class HealthcareOrderService {
  constructor(
    @InjectModel(HospitalOrder.name)
    private hospitalOrderModel: Model<HospitalOrder>,
    @InjectModel(HealthcareUser.name)
    private healthcareUserModel: Model<HealthcareUser>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    @InjectModel(Setting.name)
    private settingModel: Model<Setting>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - get all order
  async allhealthCareOrders(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
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

    //NOTE - status based filter
    const statusFilter = status ? { paymentStatus: status } : {};

    // NOTE - name , phone and mkc orderId based filter
    const nameFilter = search
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
            { mkcOrderId: { $regex: new RegExp(`^(${search})`, 'i') } },
          ],
        }
      : {};

    //NOTE - user based filter
    const user = userId ? { userId: userId } : {};

    //NOTE - get order count
    const count = await this.hospitalOrderModel.countDocuments({
      ...dateFilter,
      ...statusFilter,
      ...nameFilter,
      ...user,
    });
    // NOTE - find all order data
    const orderDetails: any[] = await this.hospitalOrderModel
      .find({
        ...dateFilter,
        ...statusFilter,
        ...nameFilter,
        ...user,
      })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'parentId', select: 'name' },
        { path: 'productDetails.packageId', select: '_id title' },
        { path: 'productDetails.serviceId', select: '_id name' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId -parentId')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      orderDetails.map(async (item) => {
        return {
          _id: item._id,
          mkcOrderId: item?.mkcOrderId ?? null,
          orderNumber: item?.orderNumber ?? null,
          paymentId: item?.paymentId ?? null,
          parentOrderId: item?.parentOrderId ?? null,
          userId: item.userId?._id,
          user: item.userId?.name,
          parent: item.parentId?.name ?? null,
          phone: item.userId?.phone,
          totalAmount: item?.totalAmount,
          paidAmount: item?.paidAmount,
          paymentStatus: item.paymentStatus,
          paymentDate: item?.paymentDate,
          packageId:
            (item?.productDetails &&
              item?.productDetails.map((ele) => ele.packageId._id)) ??
            null,
          packageName:
            (item?.productDetails &&
              item?.productDetails.map((ele) => ele.packageId.title)) ??
            null,
          serviceId:
            (item?.productDetails &&
              item?.productDetails.map((ele) => ele.serviceId._id)) ??
            null,
          serviceName:
            (item?.productDetails &&
              item?.productDetails.map((ele) => ele.serviceId.name)) ??
            null,

          purchaseBy: item?.purchaseBy ?? null,
          priceType: item?.priceType ?? null,
          orderType: item?.orderType ?? null,
          paymentType: item?.paymentType ?? null,
          receiptNumber: item?.receiptNumber ?? null,
          nextPaymentDate: item?.nextPaymentDate ?? null,
          createdBy: item?.createdBy ?? null,
          updatedBy: item?.updatedBy ?? null,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get all order
  async usersAllOrderhistory(
    payload: UserOrderHistoryDto,
    userId: string,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit } = payload;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - user based filter

    //NOTE - get order count
    const count = await this.hospitalOrderModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: true,
    });
    // NOTE - find all order data
    const orderDetails: any[] = await this.hospitalOrderModel
      .find({ userId: new mongoose.Types.ObjectId(userId), status: true })
      .populate([
        { path: 'productDetails.packageId', select: '_id title' },
        { path: 'productDetails.serviceId', select: '_id name' },
        { path: 'testDatabaseDetails.testDatabaseId', select: '_id name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      orderDetails.map(async (item) => {
        return {
          _id: item._id,
          mkcOrderId: item?.mkcOrderId ?? null,
          totalAmount: item?.totalAmount,
          paidAmount: item?.paidAmount,
          paymentStatus: item.paymentStatus,
          paymentDate: item?.paymentDate,
          packageId:
            (item?.productDetails &&
              item?.productDetails.map(
                (ele: { packageId: { _id: any } }) => ele.packageId._id,
              )) ??
            null,
          packageName:
            (item?.productDetails &&
              item?.productDetails.map(
                (ele: { packageId: { title: any } }) => ele.packageId.title,
              )) ??
            null,
          serviceId:
            (item?.productDetails &&
              item?.productDetails.map(
                (ele: { serviceId: { _id: any } }) => ele.serviceId._id,
              )) ??
            null,
          serviceName:
            (item?.productDetails &&
              item?.productDetails.map(
                (ele: { serviceId: { name: any } }) => ele.serviceId.name,
              )) ??
            null,
          testDatabaseId:
            (item?.testDatabaseDetails &&
              item?.testDatabaseDetails.map(
                (ele: { testDatabaseId: { _id: any } }) =>
                  ele.testDatabaseId._id,
              )) ??
            null,
          testDatabaseName:
            (item?.testDatabaseDetails &&
              item?.testDatabaseDetails.map(
                (ele: { testDatabaseId: { name: any } }) =>
                  ele.testDatabaseId.name,
              )) ??
            null,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get order details by id
  async hospitalOrderDetails(payload: OrderDetailsDto): Promise<any> {
    const { orderId } = payload;
    if (!mongoose.isValidObjectId(orderId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get order details
    const order_history: any = await this.hospitalOrderModel
      .findById(orderId)
      .populate([
        { path: 'userId', select: 'name image phone email' },
        { path: 'parentId', select: 'name' },

        {
          path: 'productDetails',
          select:
            'packageId serviceId quantity totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice',
          populate: [
            {
              path: 'packageId',
              select: 'title image',
            },
            { path: 'serviceId', select: 'name' },
          ],
        },
        {
          path: 'testDatabaseDetails',
          select:
            'testDatabaseId quantity totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice',
          populate: [
            {
              path: 'testDatabaseId',
              select: 'name',
            },
          ],
        },

        { path: 'couponId', select: 'name code' },
      ])
      .select('-userId -parentId -couponId -productDetails')
      .lean();

    if (!order_history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - test details
    const productDetails = await Promise.all(
      (
        order_history?.productDetails ||
        order_history?.testDatabaseDetails ||
        []
      ).map(async (item: any) => {
        const signedImageUrl = item.packageId?.image
          ? await this.commonService.getSignedUrl(item.packageId.image)
          : null;

        return {
          _id: item.packageId?._id || item.testDatabaseId?._id,
          title: item.packageId?.title || item.testDatabaseId?.name,
          serviceId: item?.serviceId ?? null,
          serviceName: item?.serviceId?.name ?? null,
          thumbnail: signedImageUrl,
          totalPrice: item?.totalPrice,
          gst: item?.gst,
          cgst: item?.cgst ?? item?.gst / 2,
          sgst: item?.sgst ?? item?.gst / 2,
          gstAmount: item?.gstAmount,
          cgstAmount: item?.cgstAmount ?? item?.gstAmount / 2,
          sgstAmount: item?.sgstAmount ?? item?.gstAmount / 2,
          discountPercentage: item?.discountPercentage,
          discountedPrice: item?.discountedPrice,
          quantity: item.quantity,
        };
      }),
    );

    //NOTE - push final data
    const data = {
      _id: order_history?._id,
      user: order_history?.userId
        ? {
            ...order_history?.userId,
            thumbnail:
              order_history?.userId?.image !== null
                ? await this.commonService.getSignedUrl(
                    order_history?.userId?.image,
                  )
                : null,
          }
        : null,
      parentName: order_history?.parentId?.name ?? null,
      orderNumber: order_history?.mkcOrderId ?? null,
      paymentStatus: order_history?.paymentStatus,
      productDetails,
      couponName: order_history?.couponId?.name,
      couponCode: order_history?.couponId?.code,
      couponAmount: order_history?.couponAmount,
      totalPrice: order_history?.totalPrice,
      gst: order_history?.gst,
      cgst: order_history?.cgst,
      sgst: order_history?.sgst,
      gstAmount: order_history?.gstAmount,
      cgstAmount: order_history?.cgstAmount,
      sgstAmount: order_history?.sgstAmount,
      totalAmount: order_history?.totalAmount,
      paidAmount: order_history?.paidAmount,
      paymentDate: order_history?.paymentDate,
      walletAmount: order_history?.walletAmount ?? null,
      purchaseBy: order_history?.purchaseBy ?? null,
    };

    return data;
  }

  // SECTION - generate hospital receipt
  async generateHospitalRecipt(id: string): Promise<any> {
    // NOTE - check whether id is valid or not and if it is not then throw error
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const history: any = await this.healthCareFinanceModel
      .findById(id)
      .populate('packageId', 'title')
      .populate([
        {
          path: 'testDatabaseId',
          select: 'name priceId',
          populate: { path: 'priceId', select: 'mrpPrice totalPrice' },
        },
      ]);

    if (!history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const userDetails: any = await this.healthcareUserModel.findById(
      history.userId,
    );

    //NOTE - calculate age details
    const age =
      userDetails?.dob !== null
        ? await this.calculateAge(userDetails?.dob)
        : null;

    //NOTE - get logo url
    const getLogo = await this.settingModel.findOne();

    const product = [];

    //NOTE: get product details
    if (history.purchaseProductType === HealthCarePurchaseType.CARE_PACKAGE) {
      product.push({
        name: history?.packageId?.title,
        amount: history?.totalPrice,
      });
    } else {
      product.push(
        ...history.testDatabaseId.map(
          (data: {
            priceId: { mrpPrice: any; totalPrice: any };
            name: any;
          }) => {
            const amount =
              history.priceType === OfflineCoursePriceType.BASE_PRICE
                ? data.priceId.mrpPrice
                : data.priceId.totalPrice;
            return { name: data.name, amount };
          },
        ),
      );
    }

    // NOTE - Custom json to send to ejs file to replace the variables there
    const jsonData = {
      path: process.env.HEALTH_HUB_RECEIPT_EJS_URL,
      data: {
        logoLink: getLogo?.hospitalLogoLink
          ? await this.commonService.getSignedUrl(getLogo?.hospitalLogoLink)
          : null,
        phone: userDetails?.phone,
        userName: userDetails?.name,
        appointmentDate: await this.convertToShortDate(
          userDetails?.appointmentDate,
        ),
        gender: userDetails?.gender
          ? userDetails.gender.charAt(0).toUpperCase()
          : null,
        age,
        receiptNumber: history.receiptNumber,
        paymentDate: await this.convertToShortDate(history?.paymentDate),
        nextPaymentDate:
          history?.nextPaymentDate !== null
            ? await this.convertToShortDate(history?.nextPaymentDate)
            : null,
        productDetails: product,
        totalAmount: history.productAmount,
        amountPaid: history.totalPrice,
        outstandingAmount: history.outstandingAmount,
        amountPaidInWord: await this.numberToWords(history.totalPrice),
      },
    };

    const pdf = await this.commonService.generatePdfForReports(jsonData);
    return pdf;
  }

  // SECTION - generate hospital receipt
  async generateHospitalOrderRecipt(
    id: string,
  ): Promise<{ pdfBuffer: Buffer; orderId: string }> {
    // NOTE - check whether id is valid or not and if it is not then throw error
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const history: any = await this.hospitalOrderModel.findById(id);
    if (!history)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const userDetails: any = await this.healthcareUserModel.findById(
      history.userId,
    );

    const setting: any = await this.settingModel.findOne();
    // NOTE - Custom json to send to ejs file to replace the variables there
    const jsonData = {
      path: process.env.HEALTH_HUB_RECEIPT_EJS_URL,
      logoLink: setting?.logoLink,
      receiptNumber: history?.receiptNumber ?? '',
      patientName: userDetails?.name ?? '',
      gender: userDetails?.gender ?? '',
      Mode: history?.paymentType,
      dateTime: '',
      uhidNo: '',
      opdNo: '',
      consultantName: '',
      validUptoDate: '',
      serialNo: '',
      grosstotal: '',
      paymentMode: '',
      poweredBy: '',
      currentDate: '',
      netAmount: '',
    };

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

    return { pdfBuffer, orderId: `Receipt_${history?.orderId}` };
  }

  //ANCHOR - calculate Age based on DOB
  private async calculateAge(dob: string | number | Date): Promise<number> {
    const birthDate = new Date(dob);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if the current date has passed the birthday of the person this year
    if (
      currentDate.getMonth() < birthDate.getMonth() ||
      (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  //ANCHOR - convert To Short Date
  private async convertToShortDate(date: Date | null): Promise<string | null> {
    if (!date) return null;

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return formattedDate;
  }

  //ANCHOR - number To Words
  private async numberToWords(number: number): Promise<string> {
    // Array of units and tens
    const units = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
    ];
    const teens = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    // Function to convert a number less than 1000 into words
    function convertLessThanOneThousand(num: number) {
      if (num < 10) {
        return units[num];
      } else if (num < 20) {
        return teens[num - 10];
      } else if (num < 100) {
        return tens[Math.floor(num / 10)] + ' ' + units[num % 10];
      } else {
        return (
          units[Math.floor(num / 100)] +
          ' Hundred ' +
          convertLessThanOneThousand(num % 100)
        );
      }
    }

    if (number === 0) {
      return 'Zero rupees only';
    }

    // Split the number into parts (thousands, millions, etc.)
    const suffixes = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
    let words = '';
    let i = 0;

    while (number > 0) {
      if (number % 1000 !== 0) {
        words =
          convertLessThanOneThousand(number % 1000) +
          ' ' +
          suffixes[i] +
          ' ' +
          words;
      }
      number = Math.floor(number / 1000);
      i++;
    }

    return words.trim() + ' rupees only';
  }
}
