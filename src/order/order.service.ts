import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from 'src/schema/order.schema';
import { ParsedQs } from 'qs';
import {
  INVALID_ID,
  NO_BOOK_NOT_FOUND,
  RECORD_NOT_FOUND,
  TRACKING_ADDED,
  TRACKING_UPDATE,
  WAREHOUSE_IN_PRODUCT_STOCK,
  WAREHOUSE_IS_NOT_FOUND,
} from 'src/utills/messages';
import { CommonService } from 'src/utills/commonService';
import { UpdateShippingStatus } from './dto/update-shipping-status.dto';
import {
  BookType,
  FeeTypes,
  ModeTypes,
  OrderTypes,
  ProductType,
  ShippingStatusType,
  UserType,
} from 'src/utills/enum';
import { AddTrackingDto } from './dto/add-tracking.dto';
import { ProductTracking } from 'src/schema/product-tracking.schema';
import { GetTackingInterface } from './interface/order.interfaces';
import { Setting } from 'src/schema/site-setting.schema';
import { Payment } from 'src/schema/payment.schema';
import * as pdf from 'html-pdf';
import { User } from 'src/schema/user.schema';
import { InventoryItemTransaction } from 'src/schema/inventory-item-transaction.schema';
import { Warehouse } from 'src/schema/warehouse.schema';
import { Book } from 'src/schema/book.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Warehouse.name) private warehouseRepository: Model<Warehouse>,
    @InjectModel(ProductTracking.name)
    private productTrackingModel: Model<ProductTracking>,
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(InventoryItemTransaction.name)
    private itemTransactionModel: Model<InventoryItemTransaction>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - get all order
  async getAllOrder(query: ParsedQs): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, fromDate, toDate, status, search, userId, type } =
      query as unknown as {
        page: string;
        limit: string;
        fromDate: Date;
        toDate: Date;
        status: string;
        search: string;
        userId: string;
        type: string;
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
            { mkcOrderId: { $regex: new RegExp(`^(${search})`, 'i') } },
          ],
        }
      : {};

    //NOTE - user based filter
    const user = userId ? { userId: userId } : {};

    // NOTE - filter based on product type query
    let productTypeQuery = {};
    if (type === ProductType.OFFLINE_COURSE) {
      productTypeQuery = {
        onlineCourseDetails: {
          $ne: [],
          $elemMatch: { type: ModeTypes.OFFLINE },
        },
      };
    }
    if (type === ProductType.ONLINE_COURSE) {
      productTypeQuery = {
        onlineCourseDetails: {
          $ne: [],
          $elemMatch: { type: ModeTypes.ONLINE },
        },
      };
    }
    if (type === ProductType.BOOK) {
      productTypeQuery = {
        bookDetails: { $ne: [] },
      };
    }
    if (type === ProductType.TEST_SERIES) {
      productTypeQuery = {
        testSeriesDetails: { $ne: [] },
      };
    }

    //NOTE - get order count
    const count = await this.orderModel.countDocuments({
      ...dateFilter,
      ...statusFilter,
      ...nameFilter,
      ...user,
      ...productTypeQuery,
    });
    // NOTE - find all order data
    const orderDetails: any[] = await this.orderModel
      .find({
        ...dateFilter,
        ...statusFilter,
        ...nameFilter,
        ...user,
        ...productTypeQuery,
      })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'parentId', select: 'name' },
        { path: 'onlineCourseDetails.onlineCourseId', select: '_id title' },
        { path: 'bookDetails', select: 'bookType shippingStatus' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId -parentId -bookDetails')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      orderDetails.map(async (item) => {
        const isTracking = await this.productTrackingModel.findOne({
          orderId: item._id,
        });
        return {
          _id: item._id,
          orderId: item.mkcOrderId || null,
          orderType: item.orderType ?? null,
          userId: item.userId?._id,
          user: item.userId?.name,
          parent: item.parentId?.name || null,
          phone: item.userId?.phone,
          totalAmount: item.totalAmount,
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate,
          status: item.status,
          courseId: item?.onlineCourseDetails
            ? item?.onlineCourseDetails[0]?.onlineCourseId?._id
            : 'N/A',
          courseName: item?.onlineCourseDetails
            ? item?.onlineCourseDetails[0]?.onlineCourseId?.title
            : 'N/A',
          //NOTE - if user has purchased only book
          isOnlyBook:
            item.bookDetails &&
            item.bookDetails.length > 0 &&
            item.onlineCourseDetails &&
            item.onlineCourseDetails.length === 0 &&
            item.testSeriesDetails &&
            item.testSeriesDetails.length === 0
              ? true
              : false,
          isBookAsPaperBack:
            item.bookDetails && item.bookDetails.length > 0
              ? item.bookDetails.some(
                  (ele: any) => ele.bookType === BookType.PAPER_BACK,
                )
              : false, //TODO - If user order any book as PaperBack

          shippingStatus:
            item.bookDetails &&
            item.bookDetails.length > 0 &&
            item.bookDetails.some(
              (ele: any) => ele.bookType === BookType.PAPER_BACK,
            )
              ? item.bookDetails[0].shippingStatus
              : null,
          isTrackingDetails: !!isTracking,
          purchaseBy: item?.purchaseBy || null,
          createdAt: item.createdAt,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get order by id details
  async getOrderById(id: string): Promise<any> {
    const searchQuery = { $or: [] }; //TODO: Initialize the search query

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    //NOTE: Regardless of whether params is an ID or mkcOrderId, also search by mkcOrderId
    searchQuery.$or.push({ mkcOrderId: id });
    //NOTE: get order details
    const order_details: any = await this.orderModel
      .findOne(searchQuery)
      .populate([
        { path: 'userId', select: 'name image phone email' },
        { path: 'parentId', select: 'name' },
        {
          path: 'addressId',
          select:
            'name mobile alternateMobile pincode address landmark state city ',
        },
        {
          path: 'onlineCourseDetails',
          select:
            'onlineCourseId quantity languageId totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice shippingCharge',
          populate: [
            {
              path: 'onlineCourseId',
              select: 'title thumbnail type',
            },
            { path: 'languageId', select: 'language' },
          ],
        },
        {
          path: 'bookDetails',
          select:
            'bookId totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice shippingCharge shippingStatus',
          populate: [
            {
              path: 'bookId',
              select: 'bookName bookTypeDetails languageDetails',
            },
            { path: 'languageId', select: 'language' },
          ],
        },
        {
          path: 'testSeriesDetails',
          select:
            'testId totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice shippingCharge',
          populate: [
            {
              path: 'testId',
              select: 'title image',
            },
            { path: 'languageId', select: 'language' },
          ],
        },
        {
          path: 'eventDetails',
          select:
            'eventId totalPrice gst cgst sgst gstAmount cgstAmount sgstAmount discountPercentage discountedPrice',
          populate: [
            {
              path: 'eventId',
              select: 'eventName image',
            },
          ],
        },

        { path: 'couponId', select: 'name code' },
      ])
      .select(
        '-userId -parentId -couponId -eventDetails -testSeriesDetails -bookDetails -onlineCourseDetails -addressId',
      )
      .lean();

    //NOTE - course details
    const formatedCourse = await Promise.all(
      (order_details?.onlineCourseDetails || []).map(async (item: any) => {
        const imageUrlArray = item.onlineCourseId?.thumbnail?.imageUrl;

        const randomImageUrl =
          imageUrlArray && imageUrlArray.length > 0
            ? imageUrlArray[Math.floor(Math.random() * imageUrlArray.length)]
                .url
            : null;

        const signedImageUrl = randomImageUrl
          ? await this.commonService.getSignedUrl(randomImageUrl)
          : null;

        return {
          _id: item.onlineCourseId?._id,
          title: item.onlineCourseId?.title,
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
          shippingCharge: item?.shippingCharge,
          quantity: item?.quantity,
          language: item.languageId?.language,
          productType:
            item.onlineCourseId?.type === ModeTypes.ONLINE
              ? ProductType.ONLINE_COURSE
              : ProductType.OFFLINE_COURSE,
        };
      }),
    );

    //NOTE - book details
    const formatedBook = await Promise.all(
      (order_details?.bookDetails || []).map(async (item: any) => {
        if (item.bookId && item.languageId) {
          const matchingLanguageDetail = item.bookId?.languageDetails.find(
            (languageDetail: any) =>
              languageDetail?.languageId.equals(item.languageId?._id),
          );
          if (matchingLanguageDetail) {
            item.bookId.languageDetails = matchingLanguageDetail;
          }
        }

        const thumbnailUrl = item.bookId?.languageDetails[0]?.thumbnail;
        const thumbnail =
          thumbnailUrl && (await this.commonService.getSignedUrl(thumbnailUrl));

        return {
          _id: item?._id,
          title: item?.bookId?.bookName,
          thumbnail,
          totalPrice: item?.totalPrice,
          gst: item?.gst,
          cgst: item?.cgst ?? item?.gst / 2,
          sgst: item?.sgst ?? item?.gst / 2,
          gstAmount: item?.gstAmount,
          cgstAmount: item?.cgstAmount ?? item?.gstAmount / 2,
          sgstAmount: item?.sgstAmount ?? item?.gstAmount / 2,
          discountPercentage: item?.discountPercentage,
          discountedPrice: item?.discountedPrice,
          shippingCharge: item?.shippingCharge,
          quantity: item.quantity,
          language: item.languageId?.language || '',
          bookType: item?.bookType,
          shippingStatus: item?.shippingStatus || null,
          productType: ProductType.BOOK,
        };
      }),
    );

    //NOTE - test details
    const formatedTest = await Promise.all(
      (order_details?.testSeriesDetails || []).map(async (item: any) => {
        const signedImageUrl = item.testId?.image
          ? await this.commonService.getSignedUrl(item.testId.image)
          : null;

        return {
          _id: item.testId?._id,
          title: item.testId?.title,
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
          shippingCharge: item?.shippingCharge,
          quantity: item.quantity,
          language: item.languageId?.language,
          productType: ProductType.TEST_SERIES,
        };
      }),
    );

    // NOTE - event details
    const formatedEvent =
      order_details?.eventDetails?.length > 0
        ? {
            _id: order_details?.eventDetails[0]?.eventId?._id,
            title: order_details?.eventDetails[0]?.eventId?.eventName,
            image: await this.commonService.getSignedUrl(
              order_details?.eventDetails[0]?.eventId?.image,
            ),
            totalPrice: order_details?.eventDetails[0]?.totalPrice,
            gst: order_details?.eventDetails[0]?.gst,
            cgst:
              order_details?.eventDetails[0]?.cgst ??
              order_details?.eventDetails[0]?.gst / 2,
            sgst:
              order_details?.eventDetails[0]?.sgst ??
              order_details?.eventDetails[0]?.gst / 2,
            gstAmount: order_details?.eventDetails[0]?.gstAmount,
            cgstAmount:
              order_details?.eventDetails[0]?.cgstAmount ??
              order_details?.eventDetails[0]?.gstAmount / 2,
            sgstAmount:
              order_details?.eventDetails[0]?.sgstAmount ??
              order_details?.eventDetails[0]?.gstAmount / 2,

            discountPercentage:
              order_details?.eventDetails[0]?.discountPercentage,
            discountedPrice: order_details?.eventDetails[0]?.discountedPrice,
          }
        : null;

    if (!order_details)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - concat the all product
    const productDetails = [
      ...formatedCourse,
      ...formatedBook,
      ...formatedTest,
      ...(formatedEvent ? [formatedEvent] : []), //TODO: Add formatedEvent only if it exists
    ];

    //NOTE: get Tracking details
    const tracking_deatils = await this.productTrackingModel.findOne({
      orderId: order_details?._id,
    });

    //NOTE - push final data
    const data = {
      _id: order_details?._id,
      user: order_details?.userId
        ? {
            ...order_details?.userId,
            thumbnail:
              order_details?.userId?.image !== null
                ? await this.commonService.getSignedUrl(
                    order_details?.userId?.image,
                  )
                : null,
          }
        : null,
      parentName: order_details?.parentId?.name || null,
      orderNumber: order_details?.mkcOrderId || null,
      address: order_details?.addressId || null,
      paymentStatus: order_details?.paymentStatus,
      productDetails,
      couponName: order_details?.couponId?.name,
      couponCode: order_details?.couponId?.code,
      couponAmount: order_details?.couponAmount,
      totalPrice: order_details?.totalPrice || 0,
      gst: order_details?.gst || 0,
      cgst: order_details?.cgst || order_details?.gst / 2,
      sgst: order_details?.sgst || order_details?.gst / 2,
      gstAmount: order_details?.gstAmount || 0,
      cgstAmount: order_details?.cgstAmount || order_details?.gstAmount / 2,
      sgstAmount: order_details?.sgstAmount || order_details?.gstAmount / 2,
      shippingCharge: order_details?.shippingCharge || 0,
      totalAmount: order_details?.totalAmount || 0,
      paidAmount: order_details?.paidAmount || 0,
      paymentDate: order_details?.paymentDate || null, //NOTE: Provide a default value if paymentDate is missing
      walletAmount: order_details?.walletAmount || 0,
      trackingId: (tracking_deatils && tracking_deatils.trackingId) || null,
      trackingUrl: (tracking_deatils && tracking_deatils.trackingUrl) || null,
      purchaseBy: order_details?.purchaseBy || null,
    };

    return data;
  }

  //SECTION - get order by id details
  async getUserOrder(
    userId: string,
    userType: UserType,
    studentId: string,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

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

    //NOTE: get order details
    const order_details: any = await this.orderModel
      .find({ userId: usersId, feeType: FeeTypes.PRODUCT_PURCHASE })
      .sort({ createdAt: -1 });
    if (!order_details)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - push final data
    const data = await Promise.all(
      order_details.map(async (item) => {
        return {
          _id: item._id,
          orderId: item.mkcOrderId,
          totalAmount: item.totalAmount,
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate,
        };
      }),
    );

    return data;
  }

  //SECTION - update Shipping Status for order
  async updateShippingStatus(
    id: string,
    payload: UpdateShippingStatus,
    userId: string,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const { shippingStatus } = payload;

    //NOTE: Find the order by ID
    const orderDetails = await this.orderModel.findById(id);
    if (!orderDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Get warehouse details
    const warehouse = await this.warehouseRepository.findOne({ isShop: true });
    if (!warehouse)
      throw new HttpException(WAREHOUSE_IS_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const bookTransactions = orderDetails.bookDetails.map(
      async (bookDetail) => {
        //NOTE: Fetch item details for each book
        const itemDetails: any = await this.bookModel.findById(
          bookDetail.bookId,
          {
            _id: 1,
            languageDetails: {
              $elemMatch: { languageId: bookDetail.languageId },
            },
          },
        );

        if (!itemDetails || !itemDetails.languageDetails.length) {
          throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
        }

        const itemId = itemDetails.languageDetails[0].itemId;

        //NOTE: Fetch transaction details from the warehouse
        const transaction = await this.itemTransactionModel
          .findOne({
            wareHouseId: warehouse._id,
            itemId,
          })
          .sort({ createdAt: -1 });

        if (!transaction || bookDetail.quantity > transaction.currentBalance) {
          throw new HttpException(
            WAREHOUSE_IN_PRODUCT_STOCK,
            HttpStatus.BAD_REQUEST,
          );
        }

        if (
          shippingStatus === ShippingStatusType.DISPATCHED ||
          shippingStatus === ShippingStatusType.RETURNED
        ) {
          let credit = 0;
          let debit = 0;
          if (shippingStatus === ShippingStatusType.DISPATCHED) {
            debit = bookDetail.quantity;
          } else if (shippingStatus === ShippingStatusType.RETURNED) {
            credit = bookDetail.quantity;
          }

          //NOTE: Create a new transaction record
          await this.itemTransactionModel.create({
            studentId: new mongoose.Types.ObjectId(orderDetails.userId),
            wareHouseId: warehouse._id,
            itemId: itemId,
            openingStock: transaction.openingStock,
            stockRate: transaction.stockRate,
            credit: credit,
            debit: debit,
            currentBalance: transaction.currentBalance + credit - debit,
            createdBy: userId,
          });
        }

        //NOTE: Update shipping status if the book type is PAPER_BACK
        if (bookDetail.bookType === BookType.PAPER_BACK) {
          bookDetail.shippingStatus = shippingStatus;
        }
      },
    );

    //NOTE: Wait for all book transactions to complete
    await Promise.all(bookTransactions);

    //NOTE: Save the updated order
    const updatedOrder = await orderDetails.save();

    return updatedOrder;
  }

  //SECTION - Add and update tracking details for order if book
  async addTrackingDetails(
    payload: AddTrackingDto,
    staffId: string,
  ): Promise<string> {
    const { userId, orderId, trackingId, trackingUrl } = payload;

    if (!mongoose.isValidObjectId(staffId) || !mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Find the order by ID
    const order_details: any = await this.orderModel.findOne({
      mkcOrderId: orderId,
    });

    if (!order_details)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (
      order_details.bookDetails &&
      order_details.bookDetails.length > 0 &&
      !order_details.bookDetails.some(
        (ele: any) => ele.bookType === BookType.PAPER_BACK,
      )
    ) {
      throw new HttpException(NO_BOOK_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    //NOTE - get book details
    const bookIds = order_details.bookDetails
      .filter((ele: any) => ele.bookType === BookType.PAPER_BACK)
      .map((ele: any) => ele.bookId);

    //NOTE - convert it to an array
    const bookIdArray = Array.isArray(bookIds) ? bookIds : [bookIds];

    //NOTE: Check if a tracking document with the same orderId exists
    const existingTracking = await this.productTrackingModel.findOne({
      orderId: order_details._id,
    });

    if (existingTracking) {
      //NOTE: Update the existing document
      await this.productTrackingModel.updateOne(
        { orderId: order_details._id },
        {
          $set: {
            userId: new mongoose.Types.ObjectId(userId),
            bookIds: bookIdArray,
            trackingId,
            trackingUrl,
            updatedBy: new mongoose.Types.ObjectId(staffId),
          },
        },
      );

      return TRACKING_UPDATE;
    } else {
      //NOTE: Create a new tracking document
      await this.productTrackingModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        orderId: order_details._id,
        bookIds: bookIdArray,
        trackingId,
        trackingUrl,
        createdBy: new mongoose.Types.ObjectId(staffId),
      });

      return TRACKING_ADDED;
    }
  }

  //SECTION - get order tacking details by id
  async getTrackingById(
    id: string,
  ): Promise<{ data: GetTackingInterface | object }> {
    //NOTE: Find the order by ID
    const order_details: any = await this.orderModel.findOne({
      mkcOrderId: id,
    });

    if (!order_details)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Get tracking details
    const tracking_deatils = await this.productTrackingModel.findOne({
      orderId: order_details._id,
    });

    if (!tracking_deatils) {
      return {
        data: {},
      };
    }

    //NOTE: Push final data
    const response = {
      _id: tracking_deatils._id,
      trackingId: tracking_deatils.trackingId,
      trackingUrl: tracking_deatils.trackingUrl,
      status: tracking_deatils.status,
    };

    return { data: response };
  }

  // SECTION - generate an invoice
  async generateInvoice(
    id: string,
  ): Promise<{ pdfBuffer: Buffer; invoiceNumber: string }> {
    // Find the data by mkc order id
    const order_details: any = await this.orderModel
      .findOne({ mkcOrderId: id })
      .populate('userId')
      .populate('addressId')
      .populate('onlineCourseDetails.onlineCourseId')
      .populate('bookDetails.bookId')
      .populate('bookDetails.languageId')
      .populate('testSeriesDetails.testId');

    if (!order_details) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    const setting: any = await this.settingModel.findOne();

    const paymentData = await this.paymentModel.findOne({
      orderId: order_details._id,
    });

    // Custom json to send to ejs file to replace the variables there
    const jsonData = {
      path: process.env.INVOICE_EJS_URL,
      logoLink: setting?.logoLink,
      invoiceNo: paymentData?.receiptNumber,
      orderDate: await this.formatDate(order_details.createdAt),
      customerName: order_details?.userId?.name,
      customerMobile: order_details?.userId?.phone,
      customerEmail: order_details?.userId?.email,
      address: order_details?.addressId?.address,
      cityName: order_details?.addressId?.city?.name,
      pincode: order_details?.addressId?.pincode,
      stateName: order_details?.addressId?.state?.name,
      tableData: [] as any[],
    };

    // Extracting data from all details
    order_details?.onlineCourseDetails?.forEach((item: any) => {
      const tableData = {
        name: item?.onlineCourseId?.title,
        skuCode: item?.onlineCourseId?.productCode,
        paymentMode: paymentData?.paymentType,
        bankDetails: paymentData?.chequeOrTransNo,
        amount: item?.totalPrice,
      };
      jsonData.tableData.push(tableData);
    });

    order_details?.bookDetails?.forEach((item: any) => {
      const tableData = {
        name: `${item?.bookId?.bookName}(${item?.languageId?.language})`,
        skuCode: '4901', // Assuming this is a placeholder value
        paymentMode: paymentData?.paymentType,
        bankDetails: paymentData?.chequeOrTransNo,
        amount: item?.totalPrice,
      };
      jsonData.tableData.push(tableData);
    });

    order_details?.testSeriesDetails?.forEach((item: any) => {
      const tableData = {
        name: item?.testId?.title,
        skuCode: item?.testId?.productCode,
        paymentMode: paymentData?.paymentType,
        bankDetails: paymentData?.chequeOrTransNo,
        amount: item?.totalPrice,
      };
      jsonData.tableData.push(tableData);
    });

    // Sending to a function to render the data and send back HTML
    const htmlString = await this.commonService.pdfGenerator(jsonData);

    const pdfOptions: any = {
      format: 'A4', // Set the paper size to A4
    };

    // Creating a PDF buffer from the HTML
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.create(htmlString, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    return { pdfBuffer, invoiceNumber: `Invoice_${order_details.mkcOrderId}` };
  }

  // SECTION - generate a packaging list document
  async generatePackagingList(
    id: string,
  ): Promise<{ pdfBuffer: Buffer; orderId: string }> {
    // Find the data by mkc order id
    const data: any = await this.orderModel
      .findOne({ mkcOrderId: id })
      .populate('userId')
      .populate('addressId')
      .populate('onlineCourseDetails.onlineCourseId')
      .populate('bookDetails.bookId')
      .populate('bookDetails.languageId')
      .populate('testSeriesDetails.testId');

    if (!data) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    const setting: any = await this.settingModel.findOne();

    // Custom JSON to send to EJS file to replace the variables there
    const jsonData = {
      path: process.env.PACKAGING_EJS_URL,
      orderNo: data?.mkcOrderId,
      logoLink: setting?.logoLink,
      orderDate: data.createdAt.toDateString(),
      customerName: data?.userId?.name,
      customerMobile: data?.userId?.phone,
      address: data?.addressId?.address,
      cityName: data?.addressId?.city?.name,
      pincode: data?.addressId?.pincode,
      stateName: data?.addressId?.state?.name,
      tableData: [],
      paymentMethod:
        data?.orderType === OrderTypes.AUTOMATION ? 'Online' : 'Offline',
    };

    // Extracting data from book details
    data.bookDetails?.forEach((item: any) => {
      if (item.bookType === BookType.PAPER_BACK) {
        const tableData = {
          name: `${item?.bookId?.bookName}(${item?.languageId?.language})`,
          quantity: `${item?.quantity}`,
        };
        jsonData.tableData.push(tableData);
      }
    });

    // Sending to a function to render the data and send back HTML
    const htmlString = await this.commonService.pdfGenerator(jsonData);

    const pdfOptions: any = {
      format: 'A4', // Set the paper size to A4
    };

    // Creating a PDF buffer from the HTML
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.create(htmlString, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    return { pdfBuffer, orderId: `Packaging_${data?.mkcOrderId}` };
  }

  //SECTION - update Receipt Number
  async updateReceiptNumber(query: ParsedQs): Promise<any> {
    //NOTE - add paginanation
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

    // NOTE - find all order data
    const paymentDetails: any[] = await this.paymentModel.find({
      ...dateFilter,
    });

    // //NOTE - get payment details from offline course payment modal
    // for (const data of paymentDetails) {
    //   const offlinePayment = await this.offlinePaymentModel.findOne({});
    // }

    return paymentDetails;
  }

  //ANCHOR : Function to format date
  private async formatDate(dateString: string | number | Date): Promise<any> {
    const dateOptions: any = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', dateOptions);
  }

  //SECTION - get all order
  async getAllOrderBook(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, studentId } = query as unknown as {
      page: string;
      limit: string;
      studentId: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - get order count
    const count = await this.orderModel.countDocuments({
      orderType: OrderTypes.BOOK_PURCHASE,
      userId: studentId,
    });

    // NOTE - find all order data
    const orderDetails: any[] = await this.orderModel
      .find({ orderType: OrderTypes.BOOK_PURCHASE, userId: studentId })
      .populate([
        { path: 'userId', select: 'name phone' },
        { path: 'parentId', select: 'name' },
        { path: 'onlineCourseDetails.onlineCourseId', select: '_id title' },
        { path: 'bookDetails', select: 'bookType shippingStatus' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId -parentId -bookDetails')
      .lean();

    // //NOTE - push final data
    const data = await Promise.all(
      orderDetails.map(async (item) => {
        const isTracking = await this.productTrackingModel.findOne({
          orderId: item._id,
        });
        return {
          _id: item._id,
          orderId: item.mkcOrderId || null,
          orderType: item.orderType ?? null,
          userId: item.userId?._id,
          user: item.userId?.name,
          parent: item.parentId?.name || null,
          phone: item.userId?.phone,
          totalAmount: item.totalAmount,
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate,
          status: item.status,
          courseId: item?.onlineCourseDetails
            ? item?.onlineCourseDetails[0]?.onlineCourseId?._id
            : 'N/A',
          courseName: item?.onlineCourseDetails
            ? item?.onlineCourseDetails[0]?.onlineCourseId?.title
            : 'N/A',
          //NOTE - if user has purchased only book
          isOnlyBook:
            item.bookDetails &&
            item.bookDetails.length > 0 &&
            item.onlineCourseDetails &&
            item.onlineCourseDetails.length === 0 &&
            item.testSeriesDetails &&
            item.testSeriesDetails.length === 0
              ? true
              : false,
          isBookAsPaperBack:
            item.bookDetails && item.bookDetails.length > 0
              ? item.bookDetails.some(
                  (ele: any) => ele.bookType === BookType.PAPER_BACK,
                )
              : false, //TODO - If user order any book as PaperBack

          shippingStatus:
            item.bookDetails &&
            item.bookDetails.length > 0 &&
            item.bookDetails.some(
              (ele: any) => ele.bookType === BookType.PAPER_BACK,
            )
              ? item.bookDetails[0].shippingStatus
              : null,
          isTrackingDetails: !!isTracking,
          purchaseBy: item?.purchaseBy || null,
          createdAt: item.createdAt,
        };
      }),
    );

    return { data, count };
  }
}
