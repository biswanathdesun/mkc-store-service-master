/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Model, Types } from 'mongoose';
import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { CommonService } from 'src/utills/commonService';
import { CreateOnlineCourseDto } from './dto/create-online-course.dto';
import {
  CourseContentType,
  ModeTypes,
  OfflineCoursePriceType,
  PaymentStatus,
  ProductType,
  TransactionStatus,
} from 'src/utills/enum';
import {
  ONLINE_COURSE_PDF,
  ONLINE_COURSE_THUMBNAIL,
} from 'src/utills/s3BucketFolder';
import {
  CREATE_DATA,
  DUPLICATE_SLUG_URL,
  FIELD_BLANK_ERROR,
  IMAGE_UPLOAD_ERROR,
  INVALID_ID,
  PRODUCT_DELETE_ERROR,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { Staff } from 'src/schema/staff.schema';
import { UpdateOnlineCourseDto } from './dto/update-online-course.dto';
import { Order } from 'src/schema/order.schema';
import { StudentBatch } from 'src/schema/student-batch.schema';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import { LiveClass } from 'src/schema/liveClass.schema';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { User } from 'src/schema/user.schema';
import { OnlineCourseByUserId } from './dto/course-by-userId.dto';
import { AddSeoTagDto } from './dto/add-seo-tags.dto';
import { GetSeoTagDto } from './dto/get-tags.dto';
import { PreeBookUserCourseDetailsDto } from './dto/pree-book-user-course.dto';
import { Cart } from 'src/schema/cart.schema';
import { GetCourseBatchDto } from './dto/get-batch-by-course.dto';
import { AddItemInCourseDto } from './dto/add-inventory-item.dto';
import { GetCourseItemReportDto } from './dto/course-item-report.dto';
import { InventoryItemTransaction } from 'src/schema/inventory-item-transaction.schema';
@Injectable()
export class OnlineCourseService {
  constructor(
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(Staff.name) private staffModal: Model<Staff>,
    @InjectModel(Cart.name) private cartModal: Model<Cart>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(LiveClass.name) private liveClassModel: Model<LiveClass>,
    @InjectModel(StudentBatch.name)
    private studentBatchModel: Model<StudentBatch>,
    @InjectModel(OfflineCoursePayment.name)
    private offlineCoursePaymentModel: Model<OfflineCoursePayment>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
    @InjectModel(User.name) private userModal: Model<User>,
    private readonly commonService: CommonService,
    @InjectModel(InventoryItemTransaction.name)
    private itemTransactionRepository: Model<InventoryItemTransaction>,
  ) {}

  //SECTION - create online courses
  async createOnlineCourses(
    payload: CreateOnlineCourseDto,
    createdById: string,
  ): Promise<string> {
    const {
      categoryId,
      courseIds,
      batchId,
      type,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      features,
      registationDate,
      languageId,
      priceId,
      liveClassCount,
      mockTestCount,
      faqIds,
      thumbnail,
      courseContent,
      prebook_amount,
      admittedAmount,
      coins,
      productCode,
      topSeller,
      status,
    } = payload;

    //NOTE: Check if slugUrl is already taken
    const existingSlugUrl = await this.onlineCourseModel.findOne({ slugUrl });
    if (existingSlugUrl) {
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);
    }

    //NOTE: Handle image uploads for thumbnails
    const uploadThumbnailPromises = thumbnail.imageUrl.map(
      async (data: any) => {
        const uploadImageUrl = await this.commonService.handleImageUpload(
          data.url,
          ONLINE_COURSE_THUMBNAIL,
        );
        data.url = uploadImageUrl;
      },
    );

    await Promise.all(uploadThumbnailPromises);

    //NOTE: Handle PDF uploads for course content
    const uploadPdfPromises = courseContent
      .filter((data: any) => data.type === CourseContentType.PDF)
      .map(async (data: any) => {
        const uploadPdfUrl = await this.commonService.handleImageUpload(
          data.pdfUrl,
          ONLINE_COURSE_PDF,
        );
        data.pdfUrl = uploadPdfUrl;
      });

    await Promise.all(uploadPdfPromises);

    //NOTE: Prepare parameters for course creation
    const params: any = {
      categoryId,
      courseIds,
      type,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      features,
      registationDate,
      languageId,
      priceId,
      liveClassCount,
      mockTestCount,
      faqIds,
      thumbnail,
      courseContent,
      prebook_amount,
      admittedAmount,
      status,
      createdBy: createdById,
    };

    //NOTE: Add optional parameters if provided
    if (topSeller) params.topSeller = topSeller;
    if (coins) params.coins = coins;
    if (productCode) params.productCode = productCode;
    if (batchId) params.batchId = batchId;

    //NOTE: Handle top seller flag
    if (topSeller) {
      await this.onlineCourseModel.updateOne(
        { topSeller: true, type },
        { $set: { topSeller: false } },
      );
    }

    await this.onlineCourseModel.create(params);

    return CREATE_DATA;
  }

  //SECTION - get all online courses
  async getAllOnlineCourses(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search, type, course, category } = query as {
      page: string;
      limit: string;
      search: string;
      type: ModeTypes;
      course: string;
      category: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const escapedTitle = search?.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // NOTE - search based on title
    const searchParams = search
      ? { title: { $regex: new RegExp(escapedTitle, 'i') } }
      : {};

    // NOTE - search based on online course type
    const typeParams = type ? { type } : {};

    // NOTE - search based on product course
    let courseParams = {};
    if (course) {
      const courseIds = course.includes(',')
        ? { $in: course.split(',').map((id) => id.trim()) }
        : { $eq: course.trim() };
      courseParams = { courseIds };
    }

    // NOTE - search based on categoryId
    const categoryIdQuery = category
      ? { categoryId: new mongoose.Types.ObjectId(category) }
      : {};

    const filters = {
      $and: [searchParams, typeParams, courseParams, categoryIdQuery],
    };

    //NOTE - get category count
    const count = await this.onlineCourseModel.countDocuments(filters);

    //NOTE - find all online courses data
    const online_courses: any[] = await this.onlineCourseModel
      .find(filters)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'batchId', select: 'name' },
        { path: 'languageId', select: 'language' },
        { path: 'priceId', select: 'totalPrice' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-categoryId')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      online_courses.map(async (item) => {
        const createdBy = item.createdBy
          ? await this.getStaffName(item.createdBy)
          : null;

        const updatedBy = item.updatedBy
          ? await this.getStaffName(item.updatedBy)
          : null;

        return {
          _id: item._id,
          name: item.title,
          slugUrl: item?.slugUrl || null,
          type: item.type,
          registationDate: item?.registationDate,
          category: item.categoryId && item.categoryId?.name,
          batch: (item.batchId && item.batchId?.name) ?? null,
          courseIds:
            item.courseIds && item.courseIds.map((item: any) => item.name),
          liveClassCount: item?.liveClassCount,
          mockTestCount: item?.mockTestCount,
          languageId: item.languageId?.language,
          priceId: item.priceId?.totalPrice,
          prebook_amount: item.prebook_amount ?? 0,
          admittedAmount: item?.admittedAmount ?? 0,
          productCode: item?.productCode ?? null,
          topSeller: item?.topSeller ?? false,
          coins: item.coins,
          createdBy,
          updatedBy,
          status: item.status,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get all changable courses
  async getChangableCourses(query: ParsedQs): Promise<{ data: any[] }> {
    //NOTE - add paginanation
    const { type, course } = query as {
      type: ModeTypes;
      course: string;
    };
    // NOTE - search based on online course type
    const typeParams = type ? { type } : {};

    // NOTE - search based on product course
    const courseParams = course
      ? { _id: { $ne: new mongoose.Types.ObjectId(course) } }
      : {};

    //NOTE - find all online courses data
    const online_courses: any[] = await this.onlineCourseModel
      .find({ ...typeParams, ...courseParams })
      .sort({ createdAt: -1 });

    //NOTE - push final data
    const data = await Promise.all(
      online_courses.map(async (item) => {
        return {
          _id: item._id,
          name: item.title,
        };
      }),
    );

    return { data };
  }
  //SECTION - get online course by id details
  async getOnlineCourseById(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get online course details
    const online_courses: any = await this.onlineCourseModel
      .findById(id)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'batchId', select: 'name' },
        { path: 'languageId', select: 'language' },
        { path: 'priceId', select: 'name totalPrice' },
        { path: 'faqIds', select: 'question' },
      ])
      .select('-categoryId')
      .lean();

    if (!online_courses)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - delete keys from online_courses object
    const {
      createdAt,
      updatedAt,
      __v,
      thumbnail,
      courseContent,
      createdBy,
      updatedBy,
      ...restOnlineCourses
    } = online_courses;

    //NOTE: Process the imageUrl and videoUrl arrays asynchronously
    const updatedImageUrls = await Promise.all(
      thumbnail.imageUrl.map(async (image: any) => ({
        _id: image._id,
        url: await this.commonService.getSignedUrl(image.url),
      })),
    );

    const updatedVideoUrls = thumbnail.videoUrl.map((video: any) => ({
      _id: video._id,
      url: video.url,
    }));

    //NOTE: Construct the updatedThumbnail object
    const updatedThumbnail = {
      _id: thumbnail._id,
      imageUrl: updatedImageUrls,
      videoUrl: updatedVideoUrls,
    };

    //NOTE: Construct the CourseContent  object
    const updatedCourseContent = await Promise.all(
      courseContent.map(async (content: any) => {
        const { createdAt, updatedAt, status, ...restContent } = content;
        if (content.type === CourseContentType.PDF) {
          const { videoUrl, ...pdfContent } = restContent;
          return {
            ...pdfContent,
            pdfUrl: await this.commonService.getSignedUrl(content.pdfUrl),
          };
        } else if (content.type === CourseContentType.VIDEO) {
          const { pdfUrl, ...videoContent } = restContent;
          return videoContent;
        }
        return restContent;
      }),
    );
    //NOTE: Access the coins property with a default of 0 if it's missing or null
    const coins = online_courses.coins ?? 0;

    return {
      ...restOnlineCourses,
      coins,
      thumbnail: updatedThumbnail,
      courseContent: updatedCourseContent,
    };
  }

  //SECTION - update online course details
  async updateOnlineCourse(
    id: string,
    payload: UpdateOnlineCourseDto,
    updateById: string,
  ): Promise<any> {
    const {
      categoryId,
      courseIds,
      batchId,
      type,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      features,
      registationDate,
      languageId,
      priceId,
      liveClassCount,
      mockTestCount,
      faqIds,
      thumbnail,
      courseContent,
      prebook_amount,
      admittedAmount,
      coins,
      productCode,
      topSeller,
      status,
    } = payload;
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check if any book exist with the id or not
    const existData: any = await this.onlineCourseModel.findById(id);

    //NOTE -  if not throw error
    if (!existData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE - check slugUrl is already exist or not with the same name
    const isUniqueUrl = await this.onlineCourseModel.findOne({
      _id: { $ne: id },
      slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    //NOTE - update live class category and course ids if category and course has any changes
    if (existData.categoryId !== categoryId) {
      await this.liveClassModel.updateMany(
        { onlineCourseId: existData._id.toString() },
        { categoryId: new mongoose.Types.ObjectId(categoryId), courseIds },
        { runValidators: true },
      );
    }

    let param: {
      categoryId: string;
      courseIds: string[];
      batchId?: string;
      type: ModeTypes;
      title: string;
      slugUrl: string;
      shortDescription: string;
      longDescription: string;
      features: string[];
      registationDate: Date;
      languageId: string;
      priceId: string;
      liveClassCount: number;
      mockTestCount: number;
      faqIds: string[];
      thumbnail?: any;
      courseContent?: any;
      prebook_amount?: number;
      admittedAmount?: number;
      updatedBy: string;
      coins?: number;
      productCode?: number;
      topSeller?: boolean;
      status: boolean;
    } = {
      categoryId,
      courseIds,
      type,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      features,
      registationDate,
      languageId,
      priceId,
      liveClassCount,
      mockTestCount,
      faqIds,
      prebook_amount: type === ModeTypes.ONLINE ? 0 : prebook_amount,
      admittedAmount: type === ModeTypes.ONLINE ? 0 : admittedAmount,
      status,
      updatedBy: updateById,
      topSeller,
    };

    if (topSeller) param = { ...param, topSeller };

    //NOTE - if coins then update it
    if (coins) param = { ...param, coins };

    //NOTE - if productCode then update it
    if (productCode) param = { ...param, productCode };

    //NOTE - if batchId then update it
    if (batchId) param = { ...param, batchId };

    //NOTE - update imageurl and videourl inside the thumbnail
    const { imageUrl, videoUrl } = thumbnail;
    const updateImageUrl: any[] = [];
    for (const data of imageUrl) {
      //NOTE: Check if the imageUrl exists in the existData's thumbnail
      const existImage = (existData.thumbnail.imageUrl as unknown as any).find(
        (item: any) => item._id.equals(data._id),
      );

      //NOTE - check if base64 is coming or not
      const hasBase64Values = data && data.url.includes('base64');

      if (existImage && !hasBase64Values) {
        updateImageUrl.push(existImage);
      } else if (existImage && hasBase64Values) {
        const uploadImage = await this.commonService.uploadFileInS3Bucket(
          data.url,
          ONLINE_COURSE_THUMBNAIL,
        );

        if (uploadImage !== false) {
          data.url = uploadImage.Key;
        } else {
          throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
        }
        updateImageUrl.push(data);
      } else {
        const uploadImage = await this.commonService.uploadFileInS3Bucket(
          data.url,
          ONLINE_COURSE_THUMBNAIL,
        );

        if (uploadImage !== false) {
          data.url = uploadImage.Key;
        } else {
          throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
        }
        updateImageUrl.push(data);
      }
    }

    //NOTE - update Content Item
    const updateCourseContent: any[] = [];
    for (const item of courseContent) {
      if (item.type === CourseContentType.PDF) {
        //NOTE: Check if the pdfUrl exists in the existData's courseContent
        const existPdf = (existData.courseContent as unknown as any).find(
          (item: any) => item._id.equals(item._id),
        );

        //NOTE - check if base64 is coming or not
        const hasBase64Values = item.pdfUrl && item.pdfUrl.includes('base64');

        if (existPdf && !hasBase64Values) {
          updateCourseContent.push(existPdf);
        } else if (existPdf && hasBase64Values) {
          const uploadPdf = await this.commonService.uploadFileInS3Bucket(
            item.pdfUrl,
            ONLINE_COURSE_PDF,
          );
          if (uploadPdf !== false) {
            item.pdfUrl = uploadPdf.Key;
          } else {
            throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
          }
          updateCourseContent.push(item);
        } else {
          const uploadPdf = await this.commonService.uploadFileInS3Bucket(
            item.pdfUrl,
            ONLINE_COURSE_PDF,
          );
          if (uploadPdf !== false) {
            item.pdfUrl = uploadPdf.Key;
          } else {
            throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
          }
          updateCourseContent.push(item);
        }
      } else {
        updateCourseContent.push(item);
      }
    }
    param = {
      ...param,
      thumbnail: { imageUrl: updateImageUrl, videoUrl: videoUrl },
      courseContent: updateCourseContent,
    };

    const updatedCourse = await this.onlineCourseModel.findByIdAndUpdate(id, {
      $set: { ...param },
    });

    //NOTE: Delete from cart if priceId is different
    if (existData.priceId.toString() !== payload.priceId && updatedCourse) {
      await this.cartModal.deleteMany({ onlineCourseId: updatedCourse._id });
    }
    return UPDATE_DATA;
  }

  //SECTION - delete online course details
  async deleteOnlineCourse(id: string): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this course or not
    const check_course = await this.userProductDetailsModel.findOne({
      onlineCourseId: new mongoose.Types.ObjectId(id),
    });

    if (check_course)
      throw new HttpException(PRODUCT_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.onlineCourseModel.findByIdAndDelete(id);

    return id;
  }

  //SECTION - get course for offline paymnet of the user
  async courseForOfflinePayment(
    @Query() query: ParsedQs,
  ): Promise<{ data: any[] }> {
    const { categoryId, courseId, userId, type } = query;

    if (categoryId && courseId && type && userId) {
      const queryData = {
        categoryId: new Types.ObjectId(categoryId.toString()),
        courseIds: new Types.ObjectId(courseId.toString()),
        type: type,
      };

      //NOTE - get course details
      const data: any[] = await this.onlineCourseModel
        .find(queryData)
        .populate('priceId');

      let response: any[] = [];

      data?.map((item) => {
        response.push({
          _id: item?._id,
          title: item?.title || null,
          prebookAmount: item?.prebook_amount,
          admittedAmount:
            item?.admittedAmount === 0 ? null : item?.admittedAmount,
          mrpPrice: item?.priceId?.mrpPrice,
          discountedPrice: item?.priceId?.discountedPrice,
          totalPrice: item?.priceId?.totalPrice,
        });
      });

      const orderData: any[] = await this.orderModel.find({
        userId: userId,
        paymentStatus: PaymentStatus.PAID,
      });
      if (orderData.length != 0) {
        orderData?.map((order) => {
          order?.onlineCourseDetails?.map((onlineCourse) => {
            response = response?.filter(
              (res) => res?._id?.toString() != onlineCourse?.onlineCourseId,
            );
          });
        });
      }

      return { data: response };
    } else if (type && userId) {
      //NOTE - get course details
      const course_details = await this.offlineCoursePaymentModel.aggregate([
        {
          $match: {
            userId: userId,
            transactionStatus: {
              $nin: [TransactionStatus.FULL_PAYMENT],
            },
            productType:
              type === ModeTypes.ONLINE
                ? ProductType.ONLINE_COURSE
                : ProductType.OFFLINE_COURSE,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: '$parentOrderId',
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
      ]);

      //NOTE - push final response
      const response = await Promise.all(
        course_details.map(async (item) => {
          const batch: any = await this.studentBatchModel
            .findOne({
              studentId: new mongoose.Types.ObjectId(item.userId),
              courseId: item.courseId,
            })
            .populate([{ path: 'batchId', select: '_id name' }]);

          return {
            _id: item?.courseId?._id,
            title: item?.courseData[0]?.title ?? null,
            type,
            preBookAmount: item?.courseData[0]?.prebook_amount,
            admittedAmount:
              item?.courseData[0]?.admittedAmount === 0 ||
              item?.courseData[0]?.admittedAmount === undefined
                ? null
                : item?.courseData[0]?.admittedAmount,
            productAmount: item?.productAmount,
            outstandingAmount: item?.outstandingAmount,
            nextPaymentDate: item?.nextPaymentDate,
            previousPaidAmount: item?.totalAmtReceived,
            priceType:
              item?.priceType === OfflineCoursePriceType.PRE_BOOK
                ? OfflineCoursePriceType.DISCOUNT_PRICE
                : item?.priceType,
            batchId: batch?.batchId?._id ?? null,
            batchName: batch?.batchId?.name ?? null,
          };
        }),
      );

      return { data: response };
    }

    return { data: [] };
  }

  //SECTION - get course users category and course
  async courseByStudentId(
    payload: OnlineCourseByUserId,
  ): Promise<{ data: any[] }> {
    const { userId, type } = payload;

    //SECTION - get user details
    const user = await this.userModal.findById(userId);

    //NOTE - get onlineCouffse details
    const courses: any = await this.onlineCourseModel.find({
      type,
      status: true,
      categoryId: user.categoryId,
      courseIds: user.courseId,
    });

    if (!courses) {
      return { data: [] };
    }

    const finalData = courses.map((ele) => ({
      _id: ele._id,
      name: ele.title,
    }));

    return { data: finalData };
  }

  //SECTION - get all changable courses
  async updateProductDetails(): Promise<string> {
    // Aggregate documents to find duplicates
    const duplicates = await this.userProductDetailsModel
      .aggregate([
        {
          $group: {
            _id: {
              studentId: '$studentId',
              onlineCourseId: '$onlineCourseId',
              orderId: '$orderId',
            },
            count: { $sum: 1 },
            docs: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gt: 1 }, // Find documents with count greater than 1 (duplicates)
          },
        },
      ])
      .exec();

    // Delete duplicates except one
    await Promise.all(
      duplicates.map(async (duplicate: any) => {
        const docsToDelete = duplicate.docs.slice(1); // Keep only the first document, delete the rest

        await this.userProductDetailsModel.deleteMany({
          _id: { $in: docsToDelete },
        });
      }),
    );

    // Update product type logic
    const products: any = await this.userProductDetailsModel
      .find()
      .populate('onlineCourseId', 'type');

    for (const data of products) {
      if (
        data.productType === ProductType.OFFLINE_COURSE ||
        data.productType === ProductType.ONLINE_COURSE
      ) {
        // Update health care user
        await this.userProductDetailsModel.findByIdAndUpdate(data._id, {
          $set: {
            productType:
              data.onlineCourseId?.type === ModeTypes.OFFLINE
                ? ProductType.OFFLINE_COURSE
                : ProductType.ONLINE_COURSE,
          },
        });
      }
    }

    return UPDATE_DATA;
  }

  //SECTION -Add Seo Tags in course
  async addSeoTags(payload: AddSeoTagDto, updateById: string): Promise<any> {
    const { courseId, metaTitle, metaDescription, metaTag, bodyTag } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(courseId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    if (!metaTitle || !metaDescription)
      throw new HttpException(FIELD_BLANK_ERROR, HttpStatus.BAD_REQUEST);

    // NOTE - check slugUrl is already exist or not with the same name
    const checkCourse = await this.onlineCourseModel.findById(courseId);

    if (!checkCourse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.CONFLICT);

    await this.onlineCourseModel.findByIdAndUpdate(courseId, {
      $set: {
        metaTitle,
        metaDescription,
        metaTag,
        bodyTag,
        updatedBy: updateById,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION -get Seo Tags for course
  async getTagDetails(payload: GetSeoTagDto): Promise<{ data: any }> {
    const { courseId } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(courseId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - check slugUrl is already exist or not with the same name
    const checkCourse = await this.onlineCourseModel.findById(courseId);

    if (!checkCourse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const response = {
      metaTitle: checkCourse?.metaTitle,
      metaDescription: checkCourse?.metaDescription,
      metaTag: checkCourse?.metaTag,
      bodyTag: checkCourse?.bodyTag,
    };

    return { data: response };
  }

  //SECTION - get pr book user purchase course details
  async getPurchaseCourseDetails(
    payload: PreeBookUserCourseDetailsDto,
  ): Promise<{ data: any }> {
    const { userId } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get user offline course payment details
    const course_details = await this.offlineCoursePaymentModel.aggregate([
      {
        $match: {
          userId,
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
      { $replaceRoot: { newRoot: '$latestDocument' } },
      {
        $lookup: {
          from: 'onlinecourses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseData',
        },
      },
      { $addFields: { courseData: { $arrayElemAt: ['$courseData', 0] } } },
      {
        $project: {
          _id: 1,
          orderId: '$parentOrderId',
          'courseData._id': 1,
          'courseData.title': 1,
        },
      },
    ]);

    const resultPromises = course_details.map(async (data) => {
      // NOTE - get batch details
      const batchDetails = await this.studentBatchModel.findOne({
        studentId: new mongoose.Types.ObjectId(userId),
        orderId: data.orderId,
      });
      return {
        ...data,
        batchId: batchDetails?.batchId,
      };
    });

    const result = await Promise.all(resultPromises);

    return { data: result };
  }

  //SECTION - course Batch details ById
  async courseBatchDetailsById(
    payload: GetCourseBatchDto,
  ): Promise<{ data: any[] }> {
    //NOTE - add paginanation
    const { courseIds } = payload;

    const objectIdArray = courseIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    //NOTE - find all online courses data
    const online_courses: any = await this.onlineCourseModel
      .find({ _id: { $in: objectIdArray } })
      .populate('batchId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Push final data
    const data = await Promise.all(
      online_courses.map(
        (item: { _id: string; batchId: { _id: string; name: string } }) => ({
          _id: item._id,
          batchId: item.batchId?._id,
          batchName: item.batchId?.name,
        }),
      ) ?? [],
    );

    return { data };
  }

  //SECTION - add Inventory Items in course
  async updateInventoryItems(
    payload: AddItemInCourseDto,
    staffId: string,
  ): Promise<string> {
    const { courseId, items } = payload;
    if (!mongoose.isValidObjectId(courseId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    //NOTE: Check if the Course exists
    const checkCourse = await this.onlineCourseModel.exists({ _id: courseId });

    if (!checkCourse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Perform the update
    await this.onlineCourseModel.findByIdAndUpdate(courseId, {
      $set: { itemDetails: items, updatedBy: staffId },
    });

    return UPDATE_DATA;
  }

  //SECTION - fetch Inventory Items for course
  async fetchCourseInventoryItems(
    payload: GetSeoTagDto,
  ): Promise<{ data: any }> {
    const { courseId } = payload;

    //NOTE: Validate courseId
    if (!mongoose.isValidObjectId(courseId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Check if the course exists
    const checkCourse: any = await this.onlineCourseModel
      .findById(courseId)
      .populate([
        {
          path: 'itemDetails',
          select: 'itemId quantity',
          populate: [{ path: 'itemId', select: 'name' }],
          options: { lean: true },
        },
      ])
      .select('_id title type itemDetails')
      .lean();

    //NOTE: If the course is not found, throw an error
    if (!checkCourse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Fetch data based on item details
    const itemDetails =
      checkCourse?.itemDetails?.length > 0
        ? checkCourse.itemDetails.map(
            (ele: {
              itemId: { _id: string; name: string };
              quantity: number;
            }) => ({
              itemId: ele.itemId?._id ?? null,
              itemName: ele.itemId?.name ?? null,
              quantity: ele?.quantity ?? 0,
            }),
          )
        : [];

    //NOTE: Filter out items where itemId is null
    const filteredItemDetails = itemDetails.filter(
      (item: { itemId: string | null }) => item.itemId !== null,
    );

    const result = {
      _id: checkCourse._id,
      title: checkCourse?.title ?? null,
      type: checkCourse?.type ?? null,
      itemDetails: filteredItemDetails,
    };

    return { data: result };
  }

  //SECTION - fetch course Inventory Items for stock report
  async fetchCourseInventoryItemsStockreport(
    payload: GetCourseItemReportDto,
  ): Promise<{ data: any; count: number }> {
    const { page, limit, warehouseId } = payload;

    // NOTE: Check if the provided ID is a valid MongoDB object ID
    if (!mongoose.isValidObjectId(warehouseId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const skip = (page - 1) * limit;

    // Define the aggregation pipeline
    const aggregationPipeline = [
      { $match: { wareHouseId: new mongoose.Types.ObjectId(warehouseId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$itemId',
          currentBalance: { $last: '$currentBalance' },
          itemDetails: { $last: '$itemId' },
          wareHouseId: { $last: '$wareHouseId' },
        },
      },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'wareHouseId',
          foreignField: '_id',
          as: 'warehouseDetails',
        },
      },
      {
        $unwind: {
          path: '$warehouseDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'inventorycategories',
          localField: 'itemDetails.categoryId',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'onlinecourses',
          let: { itemId: '$_id', warehouseId: '$wareHouseId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$itemId', { $ifNull: ['$itemDetails.itemId', []] }],
                },
              },
            },
            {
              $project: {
                itemId: 1,
                title: 1,
                type: 1,
                categoryId: 1,
                courseIds: 1,
              },
            },
          ],
          as: 'onlineCourseDetails',
        },
      },
      {
        $unwind: {
          path: '$onlineCourseDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'onlineCourseDetails.categoryId',
          foreignField: '_id',
          as: 'onlineCategoryDetails',
        },
      },
      {
        $unwind: {
          path: '$onlineCategoryDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'onlineCourseDetails.courseIds',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          itemId: '$_id',
          wareHouseId: 1,
          warehouseName: { $ifNull: ['$warehouseDetails.name', null] },
          itemName: { $ifNull: ['$itemDetails.name', null] },
          itemType: { $ifNull: ['$itemDetails.type', null] },
          reorderPoint: { $ifNull: ['$itemDetails.reorderPoint', null] },
          currentBalance: 1,
          categoryName: { $ifNull: ['$categoryDetails.name', null] },
          onlineCourseTitle: { $ifNull: ['$onlineCourseDetails.title', null] },
          onlineCourseType: { $ifNull: ['$onlineCourseDetails.type', null] },
          courseCategoryName: {
            $ifNull: ['$onlineCategoryDetails.name', null],
          },
          courseName: {
            $ifNull: ['$courseDetails.name', null],
          },
        },
      },
      {
        $facet: {
          count: [{ $count: 'totalCount' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ] as any[];

    //NOTE: Run the aggregation pipeline
    const result = await this.itemTransactionRepository.aggregate(
      aggregationPipeline,
    );

    const count = result.length > 0 ? result[0].count[0]?.totalCount || 0 : 0;
    const data = result.length > 0 ? result[0].data : [];

    return { data, count };
  }

  //NOTE - get staff details for createdby and updatedby
  async getStaffName(id: Types.ObjectId): Promise<string> {
    const user = await this.staffModal.findById(id);
    return user?.name;
  }
}
