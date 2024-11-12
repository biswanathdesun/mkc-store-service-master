/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Model, Types } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { ParsedQs } from 'qs';
import { User } from 'src/schema/user.schema';
import {
  ADDED_AS_FAVOURITE,
  ADDED_IN_SAVE_LIST,
  COUPON_APPLIED,
  COUPON_APPLIED_FAILED,
  COUPON_REMOVED,
  CREATE_DATA,
  INVALID_ID,
  INVALID_PRODUCT_TYPE,
  INVALID_PRODUCTS,
  PAYMENT_DATE_ERROR,
  PREBOOK_AMOUNT_NOT_VALID,
  PRODUCT_ALREADY_ADDED,
  RECORD_NOT_FOUND,
  REMOVE_FROM_FAVOURITE,
  REMOVE_FROM_SAVE_LIST,
  USER_NOT_FOUND,
} from 'src/utills/messages';
import {
  BookType,
  CouponType,
  CourseContentType,
  ModeTypes,
  OfflineCoursePriceType,
  PageSourceType,
  ProductType,
  SavedProductTypes,
  SchemaReferenceType,
  StudentSignUpType,
  UserType,
} from 'src/utills/enum';
import { Book } from 'src/schema/book.schema';
import { CommonService } from 'src/utills/commonService';
import { ProductByIdDto } from './dto/product-by-id.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Price } from 'src/schema/price.schema';
import { Cart } from 'src/schema/cart.schema';
import { UpdateToCartDto } from './dto/update-cart.dto';
import { TestSeries } from 'src/schema/test-series.schema';
import { AddToFavouriteDto } from './dto/add-favourite.dto';
import { FavouriteProduct } from 'src/schema/favourite-product.schema';
import { CheckProductInCartDto } from './dto/check-product-exist.dto';
import { CheckCouponDto } from './dto/check-coupon.dto';
import { Coupon } from 'src/schema/coupon.schema';
import { PaymentSummary } from 'src/schema/payment.summary.schema';
import { AddSaveDto } from './dto/save-product.dto';
import { SaveProduct } from 'src/schema/save-product.schema';
import { UpdateOfflineProductDto } from './dto/update-offline-product-in-cart';
import { GetProductDetailsDto } from './dto/get-product.dto';
import { Language } from 'src/schema/language.schema';
import { Course } from 'src/schema/course.schema';
import { async } from 'rxjs';
import { CarePackage } from 'src/schema/care-package.schema';
import { HealthcareUser } from 'src/schema/health-care-user.schema';
import { TestResult } from 'src/schema/test.result.schema';

@Injectable()
export class ProductDetailsService {
  constructor(
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResult>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Price.name) private priceModel: Model<Price>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(TestSeries.name) private testSeriesModel: Model<TestSeries>,
    @InjectModel(FavouriteProduct.name)
    private favouriteProductModel: Model<FavouriteProduct>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(PaymentSummary.name)
    private paymentSummaryModel: Model<PaymentSummary>,
    @InjectModel(SaveProduct.name) private saveProductModel: Model<SaveProduct>,
    @InjectModel(Language.name) private languageModel: Model<Language>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CarePackage.name) private carePackageModel: Model<CarePackage>,
    @InjectModel(HealthcareUser.name)
    private healthcareUserModel: Model<HealthcareUser>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - get all product details
  async getProductDetails(
    query: ParsedQs,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[] }> {
    let product_details: any[];
    let data: any[];
    //NOTE - add paginanation
    const { type } = query as { type: string };

    let studentDetails: any = {};
    if (userId && userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: studentId });
    } else if (userId && userType !== UserType.PARENT) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: userId });
    }

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      product_details = await this.onlineCourseModel
        .find({
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          type:
            type === ProductType.ONLINE_COURSE
              ? ModeTypes.ONLINE
              : ModeTypes.OFFLINE,
          status: true,
        })
        .populate([
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for course
      data = await Promise.all(
        product_details.map(async (item) => {
          const updatedThumbnail = {
            imageUrl: await Promise.all(
              item.thumbnail.imageUrl.map(async (image: any) => ({
                type: 'Image',
                url: await this.commonService.getSignedUrl(image.url),
              })),
            ),
            videoUrl: item.thumbnail.videoUrl.map((video: any) => ({
              type: 'Video',
              url: video.url,
            })),
          };
          const transformedThumbnail = [
            ...updatedThumbnail.imageUrl,
            ...updatedThumbnail.videoUrl,
          ];

          const favouriteProduct = await this.favouriteProductModel.findOne({
            userId: new mongoose.Types.ObjectId(studentDetails._id),
            productType: type,
            courseId: item._id,
          });

          return {
            _id: item._id,
            name: item.title,
            slugUrl: item?.slugUrl || null,
            shortDescription: item.shortDescription,
            mrpPrice: item.priceId?.mrpPrice,
            discountPercentage: item.priceId?.discountPercentage,
            totalPrice: item.priceId?.totalPrice,
            discountedPrice: item.priceId?.discountedPrice,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            thumbnail: transformedThumbnail,
            mode: item.type,
            prebook_amount: item.prebook_amount ?? 0,
            isFavourite: !!favouriteProduct,
          };
        }),
      );
    } else if (type === ProductType.BOOK) {
      product_details = await this.bookModel
        .find({
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          status: true,
        })
        .populate([
          {
            path: 'languageDetails',
            select: 'languageId thumbnail sampleDownload',
            populate: [{ path: 'languageId', select: 'language' }],
            options: { lean: true },
          },
          {
            path: 'bookTypeDetails',
            select: 'priceId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountPercentage discountedPrice',
              },
            ],
          },
          ,
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for book
      data = await Promise.all(
        product_details.map(async (item) => {
          //NOTE - delete keys from languageDetails object and convert urls
          const updatedLanguageDetails = Array.isArray(item.languageDetails)
            ? await Promise.all(
                item.languageDetails.map(
                  async ({
                    _id,
                    createdAt,
                    updatedAt,
                    thumbnail,
                    languageId,
                    sampleDownload,
                    ...rest
                  }) => ({
                    _id: languageId._id,
                    languageName: languageId.language,
                    thumbnail: thumbnail
                      ? await this.commonService.getSignedUrl(thumbnail)
                      : null,
                    ...rest,
                  }),
                ),
              )
            : [];

          //NOTE - delete keys from bookTypeDetails
          const updatedBookTypeDetails = Array.isArray(item.bookTypeDetails)
            ? item.bookTypeDetails.map(
                ({ _id, createdAt, updatedAt, priceId, ...rest }) => ({
                  totalPrice: priceId?.totalPrice,
                  mrpPrice: priceId?.mrpPrice,
                  discountPercentage: priceId?.discountPercentage,
                  discountedPrice: priceId?.discountedPrice,
                  ...rest,
                }),
              )
            : [];

          const favouriteProduct = await this.favouriteProductModel.findOne({
            userId: new mongoose.Types.ObjectId(studentDetails._id),
            productType: type,
            bookId: item._id,
          });

          return {
            _id: item._id,
            name: item.bookName,
            slugUrl: item?.slugUrl || null,
            shortDescription: item.shortDescription,
            publication: item.publication,
            totalPage: item.totalPage,
            languageDetails: updatedLanguageDetails,
            bookTypeDetails: updatedBookTypeDetails,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            isFavourite: !!favouriteProduct,
          };
        }),
      );
    } else if (type === ProductType.TEST_SERIES) {
      product_details = await this.testSeriesModel
        .find({
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          status: true,
        })
        .populate([
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (item.image && item.image.trim() !== '') {
            imageUrl = await this.commonService.getSignedUrl(item.image);
          }

          const favouriteProduct = await this.favouriteProductModel.findOne({
            userId: new mongoose.Types.ObjectId(studentDetails._id),
            productType: type,
            testId: item._id,
          });

          return {
            _id: item._id,
            name: item.title,
            slugUrl: item?.slugUrl || null,
            noOfQuestions: item.noOfQuestions,
            noOfQuestionPaper: item.noOfQuestionPaper,
            totalPrice: item.priceId?.totalPrice,
            discountPercentage: item.priceId?.discountPercentage,
            mrpPrice: item.priceId?.mrpPrice,
            discountedPrice: item.priceId?.discountedPrice,
            thumbnail: imageUrl,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            isFavourite: !!favouriteProduct,
          };
        }),
      );
    }

    return { data };
  }

  //SECTION : get product details by Id
  async productById(
    payload: ProductByIdDto,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<any> {
    const { type, productId } = payload;
    let product_details: any;
    let data: any;

    const searchQuery = { $or: [] }; //TODO: Initialize the search query

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(productId)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(productId) });
    } else {
      //NOTE: Regardless of whether params is an ID or slugUrl, also search by slugUrl
      searchQuery.$or.push({ slugUrl: productId });
    }

    let studentDetails: any = {};
    if (userId && userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: studentId });
    } else if (userId && userType !== UserType.PARENT) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: userId });
    }

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      const course_data = await this.onlineCourseModel
        .findOne({ ...searchQuery, status: true })
        .lean();

      if (!course_data)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      if (course_data.registationDate < new Date()) {
        //NOTE: Add 7 days to the registration date
        const updatedRegistrationDate = new Date(
          course_data.registationDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        //NOTE: Update the product details with the new registration date
        await this.onlineCourseModel.findByIdAndUpdate(
          course_data._id,
          { registationDate: updatedRegistrationDate },
          { new: true },
        );
      }

      product_details = await this.onlineCourseModel
        .findOne({ ...searchQuery, status: true })
        .populate([
          { path: 'languageId', select: 'language' },
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
          { path: 'faqIds', select: 'question answer' },
        ])
        .select('-languageId')
        .lean();

      //NOTE: Construct the CourseContent  object
      const updatedCourseContent = await Promise.all(
        product_details.courseContent.map(async (content: any) => {
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

      //NOTE: Process the imageUrl and videoUrl arrays asynchronously
      const updatedThumbnail = {
        imageUrl: await Promise.all(
          product_details.thumbnail.imageUrl.map(async (image: any) => ({
            type: 'Image',
            url: await this.commonService.getSignedUrl(image.url),
          })),
        ),
        videoUrl: product_details.thumbnail.videoUrl.map((video: any) => ({
          type: 'Video',
          url: video.url,
        })),
      };

      //NOTE: Combine the updated thumbnail arrays
      const transformedThumbnail = [
        ...updatedThumbnail.imageUrl,
        ...updatedThumbnail.videoUrl,
      ];

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          courseId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }

      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.title,
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        registationDate: product_details.registationDate,
        features: product_details.features,
        languageId: product_details.languageId._id,
        language: product_details.languageId.language,
        liveClassCount: product_details.liveClassCount,
        mockTestCount: product_details.mockTestCount,
        faq: product_details.faqIds,
        courseContent: updatedCourseContent,
        mrpPrice: product_details.priceId?.mrpPrice,
        totalPrice: product_details.priceId?.totalPrice,
        discountPercentage: product_details.priceId?.discountPercentage,
        discountedPrice: product_details.priceId?.discountedPrice,
        thumbnail: transformedThumbnail,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        prebook_amount: product_details?.prebook_amount ?? 0,
        isFavourite,
      };
    } else if (type === ProductType.BOOK) {
      product_details = await this.bookModel
        .findOne({ ...searchQuery, status: true })
        .populate([
          {
            path: 'languageDetails',
            select: 'languageId thumbnail sampleDownload',
            populate: [{ path: 'languageId', select: 'language' }],
            options: { lean: true },
          },
          {
            path: 'bookTypeDetails',
            select: 'priceId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountPercentage discountedPrice',
              },
            ],
          },
        ])
        .select('-categoryId')
        .lean();

      //NOTE - delete keys from languageDetails object and convert urls
      const updatedLanguageDetails = Array.isArray(
        product_details.languageDetails,
      )
        ? await Promise.all(
            product_details.languageDetails.map(
              async ({
                _id,
                createdAt,
                updatedAt,
                thumbnail,
                sampleDownload,
                languageId,
                ...rest
              }) => ({
                languageId: languageId._id,
                languageName: languageId.language,
                thumbnail: thumbnail
                  ? await this.commonService.getSignedUrl(thumbnail)
                  : null,
                sampleDownload: sampleDownload
                  ? await this.commonService.getSignedUrl(sampleDownload)
                  : null,
                ...rest,
              }),
            ),
          )
        : [];

      //NOTE - delete keys from bookTypeDetails
      const updatedBookTypeDetails = Array.isArray(
        product_details.bookTypeDetails,
      )
        ? product_details.bookTypeDetails.map(
            ({ _id, createdAt, updatedAt, priceId, ...rest }) => ({
              priceId: priceId._id,
              mrpPrice: priceId.mrpPrice,
              totalPrice: priceId.totalPrice,
              discountPercentage: priceId.discountPercentage,
              discountedPrice: priceId.discountedPrice,
              ...rest,
            }),
          )
        : [];

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          bookId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }
      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.bookName,
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        author: product_details.author,
        publication: product_details.publication,
        page: product_details.totalPage,
        language: updatedLanguageDetails,
        bookTypeDetails: updatedBookTypeDetails,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        isFavourite,
      };
    } else if (type === ProductType.TEST_SERIES) {
      product_details = await this.testSeriesModel
        .findOne({ ...searchQuery, status: true })
        .populate([
          { path: 'languageIds', select: 'language' },
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
          {
            path: 'assignedTest',
            populate: [
              { path: 'testMasterId', select: 'title duration noOfQuestions' },
            ],
            options: { lean: true },
          },
        ])
        .select('-languageId')
        .lean();

      //NOTE - assign test master details
      const tests =
        product_details.assignedTest &&
        product_details.assignedTest.map((item) => ({
          _id: item.testMasterId?._id,
          title: item.testMasterId?.title,
          duration: item.testMasterId?.duration,
          noOfQuestions: item.testMasterId?.noOfQuestions,
          noOfQuestionPaper: item.testMasterId?.noOfQuestionPaper,
        }));

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          bookId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }

      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.title,
        language: product_details.languageIds,
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        thumbnail: product_details?.image
          ? await this.commonService.getSignedUrl(product_details?.image)
          : null,
        overview: product_details.overview,
        languageId: product_details.languageId,
        tests: product_details.assignedTest ? tests : null,
        mrpPrice: product_details.priceId?.mrpPrice,
        totalPrice: product_details.priceId?.totalPrice,
        discountPercentage: product_details.priceId?.discountPercentage,
        discountedPrice: product_details.priceId?.discountedPrice,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        isFavourite,
      };
    }
    return data;
  }

  //SECTION - add product to cart
  async addProductTocart(
    payload: [AddToCartDto],
    createdById: string,
    userType: string,
  ): Promise<any> {
    let product: any;
    let priceId: string;
    let shippingCharge: number;
    let checkProduct: any;

    for (const productDetails of payload) {
      const { productType } = productDetails;
      if (
        userType === UserType.HOSPITAL_STUDENT ||
        userType === UserType.HOSPITAL_ENQUIRY
      ) {
        if (productType !== ProductType.HEALTH_CARE) {
          throw new HttpException(INVALID_PRODUCTS, HttpStatus.BAD_REQUEST);
        }
      } else if (
        userType !== UserType.HOSPITAL_STUDENT &&
        userType !== UserType.HOSPITAL_ENQUIRY
      ) {
        if (productType === ProductType.HEALTH_CARE) {
          throw new HttpException(INVALID_PRODUCTS, HttpStatus.BAD_REQUEST);
        }
      }
    }

    for (const productDetails of payload) {
      const {
        productType,
        productId,
        quantity,
        bookType,
        languageId,
        payment_type,
        prebook_amount,
        nextPaymentDate,
      } = productDetails;

      if (!mongoose.isValidObjectId(productId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

      // NOTE - find if product is already exist or not
      checkProduct = await this.cartModel.findOne({
        userId: new Types.ObjectId(createdById),
        bookId: productType === ProductType.BOOK ? productId : null,
        onlineCourseId:
          productType === ProductType.ONLINE_COURSE ||
          productType === ProductType.OFFLINE_COURSE
            ? productId
            : null,
        languageId: languageId || null,
        bookType: productType === ProductType.BOOK ? bookType : null,
        testId: productType === ProductType.TEST_SERIES ? productId : null,
        carePackageId:
          productType === ProductType.HEALTH_CARE ? productId : null,
        payment_type:
          productType === ProductType.OFFLINE_COURSE ? payment_type : null,
        prebook_amount:
          productType === ProductType.OFFLINE_COURSE ? prebook_amount : null,
        nextPaymentDate:
          productType === ProductType.OFFLINE_COURSE ? nextPaymentDate : null,
      });

      if (productType === ProductType.BOOK) {
        product = await this.bookModel.findById({ _id: productId });
        const priceArray = product.bookTypeDetails
          .map(
            (item: {
              bookType: BookType;
              priceId: any;
              shippingCharge: any;
            }) => {
              if (item.bookType === bookType) {
                return {
                  priceId: item.priceId,
                  shippingCharge: item.shippingCharge,
                };
              }
              return null;
            },
          )
          .filter((priceData) => priceData !== null);

        priceId = priceArray[0]?.priceId.toString();
        shippingCharge = priceArray[0].shippingCharge;
      } else if (
        productType === ProductType.ONLINE_COURSE ||
        productType === ProductType.OFFLINE_COURSE
      ) {
        product = await this.onlineCourseModel.findById({ _id: productId });

        if (product) {
          const isOfflineProductWithOnlineCourse =
            product.type === ModeTypes.OFFLINE &&
            productType === ProductType.ONLINE_COURSE;
          const isOnlineProductWithOfflineCourse =
            product.type === ModeTypes.ONLINE &&
            productType === ProductType.OFFLINE_COURSE;

          if (
            isOfflineProductWithOnlineCourse ||
            isOnlineProductWithOfflineCourse
          ) {
            throw new HttpException(
              INVALID_PRODUCT_TYPE,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (product.type === ModeTypes.OFFLINE) {
            if (prebook_amount < product.prebook_amount) {
              throw new HttpException(
                PREBOOK_AMOUNT_NOT_VALID,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }

        priceId = product.priceId;
      } else if (productType === ProductType.TEST_SERIES) {
        product = await this.testSeriesModel.findById({ _id: productId });

        priceId = product.priceId;
      } else if (productType === ProductType.HEALTH_CARE) {
        product = await this.carePackageModel.findById({ _id: productId });

        priceId = product.priceId;
      }

      //NOTE: check pice details
      const priceDetails = await this.priceModel.findById({ _id: priceId });

      //NOTE - if product is already there,then update it
      if (checkProduct && productType !== ProductType.OFFLINE_COURSE) {
        const payload = {
          quantity: checkProduct.quantity + 1,
          totalPrice: checkProduct.totalPrice + priceDetails.totalPrice,
          discountedPrice:
            checkProduct.discountedPrice + priceDetails.discountedPrice,
          shippingCharge:
            productType === ProductType.BOOK && bookType === BookType.PAPER_BACK
              ? shippingCharge
              : 0,
        };

        await this.cartModel.findOneAndUpdate(
          { _id: checkProduct._id },
          payload,
          { new: true, runValidators: true, upsert: true },
        );
      } else {
        let basePrice: any;
        let gstAmount: any;
        //NOTE - calculate gst amount
        if (
          (productType === ProductType.OFFLINE_COURSE &&
            payment_type === OfflineCoursePriceType.PRE_BOOK) ||
          (productType === ProductType.HEALTH_CARE &&
            payment_type === OfflineCoursePriceType.PRE_BOOK)
        ) {
          basePrice = Math.ceil(prebook_amount / (1 + priceDetails.gst / 100));
          gstAmount = Math.ceil(prebook_amount - basePrice);
        } else {
          basePrice = Math.ceil(
            priceDetails.totalPrice / (1 + priceDetails.gst / 100),
          );
          gstAmount = Math.ceil(priceDetails.totalPrice - basePrice);
        }

        const createdByModel =
          productType !== ProductType.HEALTH_CARE ? 'User' : 'HealthcareUser';
        const updatedByModel = createdByModel;

        //NOTE - if product is not there ,then create it
        const params = {
          userId: createdById,
          userByModel: createdByModel,
          productType,
          bookId: productType === ProductType.BOOK ? productId : null,
          bookType,
          onlineCourseId:
            productType === ProductType.ONLINE_COURSE ||
            productType === ProductType.OFFLINE_COURSE
              ? productId
              : null,
          testId: productType === ProductType.TEST_SERIES ? productId : null,
          carePackageId:
            productType === ProductType.HEALTH_CARE ? productId : null,
          careServiceId:
            productType === ProductType.HEALTH_CARE
              ? product?.healthCareId
              : null,
          totalPrice:
            (productType === ProductType.OFFLINE_COURSE &&
              payment_type === OfflineCoursePriceType.PRE_BOOK) ||
            (productType === ProductType.HEALTH_CARE &&
              payment_type === OfflineCoursePriceType.PRE_BOOK)
              ? prebook_amount
              : priceDetails.totalPrice,
          gst: priceDetails.gst,
          gstAmount: gstAmount,
          discountPercentage: priceDetails.discountPercentage,
          discountedPrice:
            productType === ProductType.OFFLINE_COURSE ||
            productType === ProductType.HEALTH_CARE
              ? basePrice
              : priceDetails.discountedPrice,
          quantity,
          languageId: languageId,
          shippingCharge:
            productType === ProductType.BOOK && bookType === BookType.PAPER_BACK
              ? shippingCharge
              : 0,
          priceId: priceDetails._id,
          payment_type: payment_type,
          nextPaymentDate: nextPaymentDate,
          prebook_amount: prebook_amount || 0,
          createdBy: new mongoose.Types.ObjectId(createdById),
          createdByModel,
          updatedByModel,
        };

        await this.cartModel.create(params);
      }
    }

    return checkProduct ? PRODUCT_ALREADY_ADDED : CREATE_DATA;
  }

  //SECTION - get cart count based on the userId
  async getCartCount(id: string): Promise<number> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get cart quantity based on the userId
    const quantitySumResult = await this.cartModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } },
    ]);

    const count = quantitySumResult[0]?.totalQuantity || 0;

    return count;
  }

  //SECTION - get cart count based on the userId
  async getCartProduct(userId: string): Promise<any> {
    // NOTE: Check if the id is valid or not
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get all product from cart based on the userId
    const cart_details: any = await this.cartModel
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate([
        {
          path: 'onlineCourseId',
          select: 'title thumbnail.imageUrl prebook_amount priceId',
          populate: [{ path: 'priceId', select: 'totalPrice' }],
        },
        {
          path: 'bookId',
          select: 'bookName languageDetails',
          populate: [{ path: 'languageDetails', select: 'thumbnail' }],
        },
        {
          path: 'testId',
          select: 'title image languageIds',
        },
        {
          path: 'carePackageId',
          select: 'title image priceId prebookAmount',
          populate: [{ path: 'priceId', select: 'totalPrice' }],
        },
        { path: 'careServiceId', select: 'isPreeBook' },
        { path: 'languageId', select: 'language' },
      ]);

    //NOTE - filter the cart_details of book section language and push final data
    const data = Promise.all(
      cart_details.map(async (cartItem: any) => {
        let thumbnail: string;
        if (cartItem.bookId && cartItem.languageId) {
          const matchingLanguageDetail = cartItem.bookId.languageDetails.find(
            (languageDetail) =>
              languageDetail.languageId.equals(cartItem.languageId._id),
          );
          if (matchingLanguageDetail) {
            // NOTE - the commented line was not working properly
            // cartItem.bookId.languageDetails = matchingLanguageDetail;
            thumbnail = matchingLanguageDetail?.thumbnail;
          }
        }

        if (cartItem.testId && cartItem.languageId) {
          const matchingLanguageDetail = cartItem.testId.languageIds.find(
            (languageDetail) =>
              languageDetail._id.equals(cartItem.languageId._id),
          );
          if (matchingLanguageDetail) {
            cartItem.testId.languageIds = matchingLanguageDetail;
          }
        }

        if (cartItem.onlineCourseId?.thumbnail?.imageUrl?.[0]?.url) {
          cartItem.onlineCourseId.thumbnail.imageUrl =
            cartItem.onlineCourseId.thumbnail.imageUrl[0].url;
        }

        if (cartItem.testId?.image) {
          cartItem.testId.image = cartItem.testId.image;
        }

        if (cartItem.carePackageId?.image) {
          cartItem.carePackageId.image = cartItem.carePackageId.image;
        }

        // Calculate GST amount
        const basePrice = Math.round(
          cartItem?.totalPrice / (1 + cartItem?.gst / 100),
        );
        const gstAmount = Math.round(cartItem?.totalPrice - basePrice);

        return {
          _id: cartItem._id,
          productId:
            cartItem.productType === ProductType.BOOK
              ? cartItem?.bookId?._id
              : cartItem.productType === ProductType.ONLINE_COURSE ||
                cartItem.productType === ProductType.OFFLINE_COURSE
              ? cartItem?.onlineCourseId?._id
              : cartItem.productType === ProductType.TEST_SERIES
              ? cartItem?.testId?._id
              : cartItem?.carePackageId?._id,
          productPreBookAmount:
            cartItem.productType === ProductType.ONLINE_COURSE ||
            cartItem.productType === ProductType.OFFLINE_COURSE
              ? cartItem?.onlineCourseId?.prebook_amount
              : cartItem.productType === ProductType.HEALTH_CARE
              ? cartItem?.carePackageId?.prebookAmount
              : null,
          productType: cartItem.productType,
          name:
            cartItem.productType === ProductType.BOOK
              ? cartItem?.bookId?.bookName
              : cartItem.productType === ProductType.ONLINE_COURSE ||
                cartItem.productType === ProductType.OFFLINE_COURSE
              ? cartItem?.onlineCourseId?.title
              : cartItem.productType === ProductType.TEST_SERIES
              ? cartItem?.testId?.title
              : cartItem?.carePackageId?.title,
          thumbnail:
            cartItem.productType === ProductType.BOOK && thumbnail
              ? await this.commonService.getSignedUrl(thumbnail)
              : (cartItem.productType === ProductType.ONLINE_COURSE ||
                  cartItem.productType === ProductType.OFFLINE_COURSE) &&
                cartItem?.onlineCourseId?.thumbnail?.imageUrl
              ? await this.commonService.getSignedUrl(
                  cartItem?.onlineCourseId?.thumbnail?.imageUrl[0]?.url,
                )
              : cartItem.productType === ProductType.TEST_SERIES &&
                cartItem?.testId?.image
              ? await this.commonService.getSignedUrl(cartItem.testId?.image)
              : cartItem?.productType === ProductType.HEALTH_CARE &&
                cartItem?.carePackageId?.image
              ? await this.commonService.getSignedUrl(
                  cartItem?.carePackageId?.image,
                )
              : null,
          prebook_amount: cartItem?.prebook_amount || 0,
          totalPrice: cartItem?.totalPrice,
          bookType: cartItem?.bookType,
          discountPercentage: cartItem?.discountPercentage,
          quantity: cartItem?.quantity,
          discountedPrice: cartItem?.discountedPrice,
          gstAmount,
          language: cartItem.languageId?.language || null,
          languageId: cartItem.languageId?._id || null,
          paymentStatus:
            cartItem.productType === ProductType.ONLINE_COURSE ||
            cartItem.productType === ProductType.OFFLINE_COURSE ||
            cartItem.productType === ProductType.HEALTH_CARE
              ? cartItem?.prebook_amount > 0
                ? 'pre_book'
                : 'full_payment'
              : null,
          nextPaymentDate: cartItem?.nextPaymentDate ?? null,
          productTotalPrice:
            cartItem?.onlineCourseId?.priceId?.totalPrice ??
            cartItem?.carePackageId?.priceId?.totalPrice ??
            null,
          isPreeBook:
            cartItem.productType === ProductType.HEALTH_CARE
              ? cartItem.careServiceId?.isPreeBook
              : null,
          status: cartItem?.status,
        };
      }),
    );

    return data;
  }

  //SECTION - update book details
  async updateCartProducts(
    id: string,
    payload: UpdateToCartDto,
    updateById: string,
  ): Promise<{ cartId: string }> {
    const { quantity } = payload;

    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check if any cart exists with the id or not
    const existCart: any = await this.cartModel.findById(id).populate([
      {
        path: 'bookId',
        select: 'bookTypeDetails',
      },
    ]);

    //NOTE -  if not throw an error
    if (!existCart)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    let shippingCharge: any;
    if (existCart && existCart.bookId && existCart.bookId.bookTypeDetails) {
      const bookType = BookType.PAPER_BACK; // Replace with the bookType you want to match

      const matchingBookType = existCart.bookId?.bookTypeDetails.find(
        (item: { bookType: BookType }) => item.bookType === bookType,
      );

      if (matchingBookType) {
        shippingCharge = matchingBookType?.shippingCharge;
      } else {
        shippingCharge = 0;
      }
    }

    //NOTE: check pice details
    const priceDetails = await this.priceModel.findById({
      _id: existCart.priceId,
    });

    const basePrice = Math.round(
      priceDetails.totalPrice / (1 + priceDetails.gst / 100),
    );
    const gstAmount = Math.round(priceDetails.totalPrice - basePrice);

    //NOTE - Now, we update the document with the modified data object
    const updateCart = await this.cartModel.findOneAndUpdate(
      { _id: id },
      {
        quantity,
        totalPrice: priceDetails.totalPrice * quantity,
        discountedPrice: priceDetails.discountedPrice * quantity,
        shippingCharge:
          existCart.productType === ProductType.BOOK &&
          existCart.bookType === BookType.PAPER_BACK
            ? shippingCharge * quantity
            : 0,
        gstAmount: gstAmount * quantity,
        updatedBy: updateById,
      },
      { new: true, runValidators: true, upsert: true },
    );

    //NOTE - Return the updated cart document id
    return updateCart._id;
  }

  //SECTION - delete cart products
  async deleteById(id: string): Promise<string> {
    //NOTE - check if the id is valid or not
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const delete_cart = await this.cartModel.findByIdAndDelete(id);

    return delete_cart.id;
  }

  //SECTION - get cart paymnet summary based on the userId
  async getPaymentSummary(
    query: ParsedQs,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - apply wallet amount
    const { wallet } = query as unknown as { wallet: string };

    let walletAmount = 0;
    if (wallet === 'true') {
      let get_user_deatils;
      if (
        userType !== UserType.HOSPITAL_ENQUIRY &&
        userType !== UserType.HOSPITAL_STUDENT
      ) {
        get_user_deatils = await this.userModel.findById(
          userType !== UserType.PARENT ? userId : studentId,
        );
      } else {
        get_user_deatils = await this.healthcareUserModel.findById(userId);
      }

      //NOTE - calculate wallet
      walletAmount = await this.calculateWalletAmount(get_user_deatils.coins);
    }

    //NOTE - get all product from cart based on the userId
    const cart_details = await this.cartModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          discountedPrice: { $sum: '$discountedPrice' },
          gst: { $sum: '$gst' },
          gstAmount: { $sum: '$gstAmount' },
          shippingCharge: { $sum: '$shippingCharge' },
          couponId: { $first: '$couponId' },
        },
      },
      {
        $addFields: {
          discountedPrice: '$discountedPrice',
          gstAmount: '$gstAmount',
          shippingCharge: '$shippingCharge',
          gst: '$gst',
        },
      },
      {
        $project: {
          _id: 0,
          discountedPrice: 1,
          gstAmount: 1,
          shippingCharge: 1,
          couponId: 1,
          gst: 1,
        },
      },
    ]);

    //NOTE - push final result
    const result = {
      totalPrice: cart_details[0]?.discountedPrice || 0,
      gstAmount: cart_details[0]?.gstAmount || 0,
      shippingCharge: cart_details[0]?.shippingCharge || 0,
      couponCode: null,
      discountedPrice: 0,
      totalAmount:
        cart_details[0]?.discountedPrice +
          cart_details[0]?.gstAmount +
          cart_details[0]?.shippingCharge || 0,
      walletAmount,
    };

    //NOTE - check coupon id
    const couponId = cart_details[0]?.couponId;

    let discountedPriceUpdate: number;
    //NOTE - if coupon then update the paymnet details
    if (couponId) {
      const coupon = await this.couponModel.findById(couponId);

      if (coupon) {
        if (coupon.couponType === CouponType.AMOUNT && coupon.amount) {
          //NOTE: Apply the coupon as an amount discount
          const couponAmount = coupon.amount;

          result.totalAmount -= couponAmount;

          discountedPriceUpdate = couponAmount;
        } else if (coupon.couponType === CouponType.PERCENT && coupon.amount) {
          //NOTE: Apply the coupon as a percentage discount
          const couponPercentage = coupon.amount;

          const maxDiscount = coupon.maxDiscount || 0;

          //NOTE: Calculate the discount based on the percentage
          const discountAmount = (couponPercentage / 100) * result.totalAmount;

          //NOTE: Apply the discount, considering the maxDiscount
          result.totalAmount -= Math.min(discountAmount, maxDiscount);

          discountedPriceUpdate = Math.min(discountAmount, maxDiscount);
        }

        result.couponCode = coupon.code;

        result.discountedPrice = discountedPriceUpdate;
      }
    }

    //NOTE - update totalAmount
    result.totalAmount = Math.max(result.totalAmount, 0);

    //NOTE - if wallet amount more than 0 then update paymnet details
    if (walletAmount > 0) {
      if (walletAmount > result.totalAmount) {
        result.totalAmount = 0;
      } else {
        result.totalAmount = result.totalAmount - walletAmount;
      }
    }

    const createdByModel =
      userType !== UserType.HOSPITAL_ENQUIRY &&
      userType !== UserType.HOSPITAL_STUDENT
        ? 'User'
        : 'HealthcareUser';
    const updatedByModel = createdByModel;

    const filter = { userId };
    const update: any = {
      userByModel: createdByModel,
      totalPrice: cart_details[0]?.discountedPrice || 0,
      gst: cart_details[0]?.gst,
      gstAmount: cart_details[0]?.gstAmount || 0,
      shippingCharge: cart_details[0]?.shippingCharge || 0,
      discountedPrice: discountedPriceUpdate || 0,
      totalAmount:
        cart_details[0]?.discountedPrice +
          cart_details[0]?.gstAmount +
          cart_details[0]?.shippingCharge || 0,
      amountToBePaid: result.totalAmount,
      walletAmount,
    };

    //NOTE: Check if the document with the given filter exists
    const existingSummary = await this.paymentSummaryModel.findOne(filter);
    if (!existingSummary) {
      //NOTE: Document doesn't exist, create it with createdBy
      update.createdBy = userId;
      update.createdByModel = createdByModel;
    } else {
      //NOTE: Document exists, update it with updatedBy
      update.createdBy = userId;
      update.updatedBy = userId;
      update.createdByModel = createdByModel;
      update.updatedByModel = updatedByModel;
    }
    const options = {
      upsert: true, //TODO: Create the document if it doesn't exist
      new: true, //TODO:  Return the updated document
      setDefaultsOnInsert: true, //TODO:  Set default values when creating a new document
    };
    //NOTE - push payment info in paymentSummaryModel
    await this.paymentSummaryModel.findOneAndUpdate(filter, update, options);

    return result;
  }

  //SECTION - get all similar Products details
  async similarProducts(
    payload: ProductByIdDto,
    userId?: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[] }> {
    const { type, productId, course, isTabChange } = payload;
    let product_details: any[];
    let data: any[];

    let studentDetails: any;
    if (userId && (userType === UserType.PARENT || !studentId)) {
      const idToCheck = studentId || userId;

      if (!mongoose.isValidObjectId(idToCheck))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

      studentDetails = await this.userModel.findOne({ _id: idToCheck });

      if (!studentDetails)
        throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    //TODO - as so many slug url check is breaking with mongoose.Types.ObjectId.isValid method
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    const searchQuery = [];
    if (!isTabChange)
      if (objectIdPattern.test(productId)) {
        //NOTE: Check if params is a valid MongoDB ObjectId
        searchQuery.push({
          _id: { $ne: new mongoose.Types.ObjectId(productId) },
        });
      } else {
        //NOTE: Regardless of whether params is an ID or slugUrl, also search by slugUrl
        searchQuery.push({ slugUrl: { $ne: productId } });
      }

    //NOTE: Query for product
    const query: any = {
      status: true,
    };

    if (!isTabChange) {
      query.$or = searchQuery;
    }

    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      query.type =
        type === ProductType.ONLINE_COURSE
          ? ModeTypes.ONLINE
          : ModeTypes.OFFLINE;
    }

    //NOTE - if user details is coming then send with student details
    if (studentDetails) {
      query.categoryId = studentDetails.categoryId;
      query.courseIds = studentDetails.courseId;
    } else {
      //NOTE - if user details not coming then send course details
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (objectIdPattern.test(course)) {
        query.courseIds = course;
      } else {
        query.courseIds = await (
          await this.courseModel.findOne({
            'validFor.url': course,
          })
        )?._id;
      }
    }

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      const course_details = await this.onlineCourseModel
        .find(query)
        .populate([
          { path: 'priceId', select: 'totalPrice mrpPrice discountPercentage' },
          {
            path: 'languageId',
            select: 'language',
          },
        ])
        .select('-priceId')
        .lean();

      product_details = await this.getRandomProducts(course_details, 12);

      //NOTE - push final data for course
      data = await Promise.all(
        product_details.map(async (item) => {
          const updatedThumbnail = {
            imageUrl: await Promise.all(
              item.thumbnail.imageUrl.map(async (image: any) => ({
                type: 'Image',
                url: await this.commonService.getSignedUrl(image.url),
              })),
            ),
            videoUrl: item.thumbnail.videoUrl.map((video: any) => ({
              type: 'Video',
              url: video.url,
            })),
          };

          const transformedThumbnail = [
            ...updatedThumbnail.imageUrl,
            ...updatedThumbnail.videoUrl,
          ];

          let isFavourite = false; //NOTE: Initialize isFavourite as false
          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: type,
              courseId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          return {
            _id: item._id,
            name: item.title,
            courseIds: item?.courseIds[0],
            slugUrl: item?.slugUrl || null,
            shortDescription: item.shortDescription,
            mrpPrice: item.priceId?.mrpPrice,
            discountPercentage: item.priceId?.discountPercentage,
            totalPrice: item.priceId?.totalPrice,
            thumbnail: transformedThumbnail,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            language: item.languageId?.language,
            liveClassCount: item?.liveClassCount,
            mockTestCount: item?.mockTestCount,
            isFavourite,
          };
        }),
      );
    } else if (type === ProductType.BOOK) {
      //NOTE - query for book

      const book_details = await this.bookModel
        .find(query)
        .populate([
          {
            path: 'languageDetails',
            select: 'languageId thumbnail sampleDownload',
            populate: [{ path: 'languageId', select: 'language' }],
            options: { lean: true },
          },
          {
            path: 'bookTypeDetails',
            select: 'priceId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountPercentage discountedPrice',
              },
            ],
          },
          ,
        ])
        .select('-priceId')
        .lean();

      product_details = await this.getRandomProducts(book_details, 12);

      //NOTE - push final data for book
      data = await Promise.all(
        product_details.map(async (item) => {
          //NOTE - delete keys from languageDetails object and convert urls
          const updatedLanguageDetails = Array.isArray(item.languageDetails)
            ? await Promise.all(
                item.languageDetails.map(
                  async ({
                    _id,
                    createdAt,
                    updatedAt,
                    thumbnail,
                    languageId,
                    sampleDownload,
                    ...rest
                  }) => ({
                    _id: languageId._id,
                    languageName: languageId.language,
                    thumbnail: thumbnail
                      ? await this.commonService.getSignedUrl(thumbnail)
                      : null,
                    ...rest,
                  }),
                ),
              )
            : [];

          //NOTE - delete keys from bookTypeDetails
          const updatedBookTypeDetails = Array.isArray(item.bookTypeDetails)
            ? item.bookTypeDetails.map(
                ({ _id, createdAt, updatedAt, priceId, ...rest }) => ({
                  totalPrice: priceId?.totalPrice,
                  mrpPrice: priceId?.mrpPrice,
                  discountPercentage: priceId?.discountPercentage,
                  discountedPrice: priceId?.discountedPrice,
                  ...rest,
                }),
              )
            : [];
          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: type,
              bookId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          return {
            _id: item._id,
            name: item.bookName,
            courseIds: item?.courseIds[0],
            slugUrl: item?.slugUrl || null,
            shortDescription: item.shortDescription,
            publication: item.publication,
            totalPage: item.totalPage,
            languageDetails: updatedLanguageDetails,
            bookTypeDetails: updatedBookTypeDetails,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            isFavourite,
          };
        }),
      );
    } else if (type === ProductType.TEST_SERIES) {
      const testDetails = await this.testSeriesModel
        .find(query)
        .populate([
          { path: 'priceId', select: 'totalPrice mrpPrice discountPercentage' },
        ])
        .select('-priceId')
        .lean();

      product_details = await this.getRandomProducts(testDetails, 12);

      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (item.image && item.image.trim() !== '') {
            imageUrl = await this.commonService.getSignedUrl(item.image);
          }

          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: type,
              testId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }
          return {
            _id: item._id,
            name: item.title,
            courseIds: item?.courseIds[0],
            slugUrl: item?.slugUrl || null,
            noOfQuestions: item.noOfQuestions,
            noOfQuestionPaper: item.noOfQuestionPaper,
            totalPrice: item.priceId?.totalPrice,
            discountPercentage: item.priceId?.discountPercentage,
            mrpPrice: item.priceId?.mrpPrice,
            thumbnail: imageUrl,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            isFavourite,
          };
        }),
      );
    }

    return { data };
  }

  //SECTION - get all products with Out Token and also in token. used in web
  async productsWithOutToken(
    payload: GetProductDetailsDto,
    userId?: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[]; count: number }> {
    let product_details: any[];
    let data: any[];
    let studentDetails: any = {};
    let count = 0;

    if (userId && userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: studentId });
    } else if (userId && userType !== UserType.PARENT) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: userId });
    }

    //NOTE - add paginanation
    const { type, course, page, limit, pageSource, bookType } = payload;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    //NOTE - serach based on course
    const courseParams = course
      ? objectIdPattern.test(course)
        ? { courseIds: new mongoose.Types.ObjectId(course) }
        : {
            courseIds: (
              await this.courseModel.findOne({
                'validFor.url': course,
              })
            )?._id,
          } //NOTE - to find courseId by slugUrl in courseModel
      : {};

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      //NOTE - get onlineCourse Model count
      count = await this.onlineCourseModel.countDocuments({
        categoryId:
          pageSource === PageSourceType.DASHBOARD
            ? studentDetails.categoryId
            : { $exists: true },
        courseIds:
          pageSource === PageSourceType.DASHBOARD
            ? studentDetails.courseId
            : { $exists: true },
        type:
          type === ProductType.ONLINE_COURSE
            ? ModeTypes.ONLINE
            : ModeTypes.OFFLINE,
        ...courseParams,
        status: true,
      });

      //NOTE - get onlineCourse Model product details
      product_details = await this.onlineCourseModel
        .find({
          categoryId:
            pageSource === PageSourceType.DASHBOARD
              ? studentDetails.categoryId
              : { $exists: true },
          courseIds:
            pageSource === PageSourceType.DASHBOARD
              ? studentDetails.courseId
              : { $exists: true },
          type:
            type === ProductType.ONLINE_COURSE
              ? ModeTypes.ONLINE
              : ModeTypes.OFFLINE,
          ...courseParams,
          status: true,
        })
        .populate([
          {
            path: 'priceId',
            select:
              'totalPrice mrpPrice discountedPrice discountPercentage gst',
          },
          {
            path: 'languageId',
            select: '_id language',
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId -languageId')
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      //NOTE - push final data for course
      data = await Promise.all(
        product_details.map(async (item) => {
          const updatedThumbnail = {
            imageUrl: await Promise.all(
              item.thumbnail.imageUrl.map(async (image: any) => ({
                type: 'Image',
                url: await this.commonService.getSignedUrl(image.url),
              })),
            ),
          };

          const transformedThumbnail = [...updatedThumbnail.imageUrl];

          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: type,
              courseId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          //NOTE - calculate the gst amount
          const basePrice = Math.round(
            item.priceId?.totalPrice / (1 + item.priceId?.gst / 100),
          );
          const gstAmount = Math.round(item.priceId?.totalPrice - basePrice);

          return {
            _id: item._id,
            name: item.title,
            courseIds: item?.courseIds[0],
            slugUrl: item?.slugUrl || null,
            mrpPrice: item.priceId?.mrpPrice,
            discountPercentage: item.priceId?.discountPercentage,
            totalPrice: item.priceId?.totalPrice,
            discountedPrice: item.priceId?.discountedPrice,
            averageRating: item.averageRating || null,
            userCountOfRating: item.userCountOfRating || null,
            thumbnail: transformedThumbnail,
            prebook_amount: item?.prebook_amount ?? 0,
            gstAmount: gstAmount,
            language: item.languageId?.language,
            languageId: item.languageId?._id,
            liveClassCount: item?.liveClassCount,
            mockTestCount: item?.mockTestCount,
            isFavourite,
          };
        }),
      );
    } else if (type === ProductType.BOOK) {
      //NOTE - book queries
      const aggregationPipeline: any = [
        {
          $match: {
            status: true,
            categoryId:
              pageSource === PageSourceType.DASHBOARD
                ? new mongoose.Types.ObjectId(studentDetails.categoryId)
                : { $exists: true },
            courseIds:
              pageSource === PageSourceType.DASHBOARD
                ? new mongoose.Types.ObjectId(studentDetails.courseId)
                : { $exists: true },
            ...courseParams, //TODO: Common filter criteria
          },
        },
        {
          $project: {
            _id: 1,
            bookName: 1,
            courseIds: 1,
            slugUrl: 1,
            publication: 1,
            totalPage: 1,
            averageRating: { $ifNull: ['$averageRating', null] },
            userCountOfRating: { $ifNull: ['$userCountOfRating', null] },
            bookTypeDetails: 1,
            languageDetails: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: parseInt(limit) }],
            count: [{ $count: 'count' }],
          },
        },
      ];

      if (bookType) {
        aggregationPipeline.unshift({
          $match: {
            'bookTypeDetails.bookType': bookType,
          },
        });
      }

      const result = await this.bookModel.aggregate(aggregationPipeline);

      let datas: any;
      let counts: any;
      if (result.length > 0) {
        datas = result[0].data;
        counts = result[0].count[0]?.count || 0; //TODO: Get the count
      }

      let final: any;
      if (datas)
        final = await Promise.all(
          datas.map(async (item: any) => {
            //NOTE - delete keys from languageDetails object and convert urls
            const updatedLanguageDetails = Array.isArray(item.languageDetails)
              ? await Promise.all(
                  item.languageDetails.map(
                    async ({
                      _id,
                      createdAt,
                      updatedAt,
                      thumbnail,
                      languageId,
                      ...rest
                    }) => {
                      const languages = await this.languageModel
                        .findOne({ _id: languageId })
                        .select('language _id');
                      return {
                        _id: languages._id,
                        languageName: languages.language,
                        thumbnail: thumbnail
                          ? await this.commonService.getSignedUrl(thumbnail)
                          : null,
                      };
                    },
                  ),
                )
              : [];

            //NOTE - delete keys from bookTypeDetails
            const updatedBookTypeDetails = Array.isArray(item.bookTypeDetails)
              ? await Promise.all(
                  item.bookTypeDetails.map(
                    async ({ _id, createdAt, updatedAt, priceId, ...rest }) => {
                      const prices = await this.priceModel
                        .findOne({ _id: priceId })
                        .select(
                          'totalPrice mrpPrice discountPercentage discountedPrice gst',
                        );

                      // NOTE: Calculate the GST amount
                      const basePrice = Math.round(
                        prices?.totalPrice / (1 + prices?.gst / 100),
                      );
                      const gstAmount = Math.round(
                        prices?.totalPrice - basePrice,
                      );

                      return {
                        totalPrice: prices?.totalPrice,
                        mrpPrice: prices?.mrpPrice,
                        discountPercentage: prices?.discountPercentage,
                        discountedPrice: prices?.discountedPrice,
                        gstAmount: gstAmount,
                        ...rest,
                      };
                    },
                  ),
                )
              : [];

            let isFavourite = false; //NOTE: Initialize isFavourite as false

            if (studentDetails) {
              //NOTE: Check if studentDetails is available
              const favouriteProduct = await this.favouriteProductModel.findOne(
                {
                  userId: new mongoose.Types.ObjectId(studentDetails._id),
                  productType: type,
                  bookId: item._id,
                },
              );

              isFavourite = !!favouriteProduct;
            }

            return {
              _id: item._id,
              name: item.bookName,
              courseIds: item?.courseIds[0],
              slugUrl: item?.slugUrl || null,
              publication: item.publication,
              totalPage: item.totalPage,
              averageRating: item.averageRating || null,
              userCountOfRating: item.userCountOfRating || null,
              languageDetails: updatedLanguageDetails,
              bookTypeDetails: updatedBookTypeDetails,
              isFavourite,
            };
          }),
        );

      (count = counts ? counts : 0), (data = final ? final : []);
    } else if (type === ProductType.TEST_SERIES) {
      //NOTE - get test series count
      let query: any;
      if (pageSource === PageSourceType.HOME) {
        query = {
          mode: ModeTypes.ONLINE,
          status: true,
          ...courseParams,
        };
      } else if (pageSource === PageSourceType.DASHBOARD) {
        query = {
          mode: ModeTypes.ONLINE,
          status: true,
          categoryId:
            pageSource === PageSourceType.DASHBOARD
              ? studentDetails.categoryId
              : { $exists: true },
          courseIds:
            pageSource === PageSourceType.DASHBOARD
              ? studentDetails.courseId
              : { $exists: true },
        };
      }

      count = await this.testSeriesModel.countDocuments(query);

      product_details = await this.testSeriesModel
        .find(query)
        .populate([
          {
            path: 'priceId',
            select:
              'totalPrice mrpPrice discountedPrice discountPercentage gst',
          },
          {
            path: 'languageIds',
            select: '_id language',
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId -languageIds')
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (item.image && item.image.trim() !== '') {
            imageUrl = await this.commonService.getSignedUrl(item.image);
          }

          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: type,
              testId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          //NOTE - calculate the gst amount
          const basePrice = Math.round(
            item.priceId?.totalPrice / (1 + item.priceId?.gst / 100),
          );
          const gstAmount = Math.round(item.priceId?.totalPrice - basePrice);
          return {
            _id: item._id,
            name: item.title,
            courseIds: item?.courseIds[0],
            slugUrl: item?.slugUrl || null,
            noOfQuestions: item.noOfQuestions,
            noOfQuestionPaper: item.noOfQuestionPaper,
            averageRating: item.averageRating || null,
            userCountOfRating: item.userCountOfRating || null,
            totalPrice: item.priceId?.totalPrice,
            discountPercentage: item.priceId?.discountPercentage,
            discountedPrice: item.priceId?.discountedPrice,
            mrpPrice: item.priceId?.mrpPrice,
            languageDetails: item.languageIds,
            thumbnail: imageUrl,
            gstAmount: gstAmount,
            isFavourite,
          };
        }),
      );
    }

    return { data, count };
  }

  //SECTION : get product details by Id with out token
  async productByIdWithOutToken(
    payload: ProductByIdDto,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<any> {
    const { type, productId } = payload;
    let product_details: any;
    let data: any;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    const searchQuery = { $or: [] }; //TODO: Initialize the search query

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (objectIdPattern.test(productId)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(productId) });
    } else {
      //NOTE: Regardless of whether params is an ID or slugUrl, also search by slugUrl
      searchQuery.$or.push({ slugUrl: productId });
    }

    let studentDetails: any = {};
    if (userId && userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: studentId });
    } else if (userId && userType !== UserType.PARENT) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: userId });
    }

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      const course_data = await this.onlineCourseModel
        .findOne({ ...searchQuery, status: true })
        .lean();

      if (!course_data)
        throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

      if (course_data.registationDate < new Date()) {
        //NOTE: Add 7 days to the registration date
        const updatedRegistrationDate = new Date(
          course_data.registationDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        //NOTE: Update the product details with the new registration date
        await this.onlineCourseModel.findOneAndUpdate(
          searchQuery,
          { registationDate: updatedRegistrationDate },
          { new: true },
        );
      }

      product_details = await this.onlineCourseModel
        .findOne(searchQuery)
        .populate([
          { path: 'languageId', select: 'language' },
          {
            path: 'priceId',
            select:
              'totalPrice mrpPrice discountedPrice discountPercentage gst',
          },
          { path: 'faqIds', select: 'question answer' },
        ])
        .select('-languageId')
        .lean();

      //NOTE: Construct the CourseContent  object
      const updatedCourseContent = await Promise.all(
        product_details.courseContent.map(async (content: any) => {
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

      //NOTE: Process the imageUrl and videoUrl arrays asynchronously
      const updatedThumbnail = {
        imageUrl: await Promise.all(
          product_details.thumbnail.imageUrl.map(async (image: any) => ({
            type: 'Image',
            url: await this.commonService.getSignedUrl(image.url),
          })),
        ),
        videoUrl: product_details.thumbnail.videoUrl.map((video: any) => ({
          type: 'Video',
          url: video.url,
        })),
      };

      //NOTE: Combine the updated thumbnail arrays
      const transformedThumbnail = [
        ...updatedThumbnail.imageUrl,
        ...updatedThumbnail.videoUrl,
      ];

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          courseId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }

      //NOTE - calculate the gst amount
      const basePrice = Math.round(
        product_details.priceId?.totalPrice /
          (1 + product_details.priceId?.gst / 100),
      );
      const gstAmount = Math.round(
        product_details.priceId?.totalPrice - basePrice,
      );

      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.title,
        courseIds: product_details?.courseIds[0],
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        registationDate: product_details.registationDate,
        features: product_details.features,
        languageId: product_details.languageId._id,
        language: product_details.languageId.language,
        liveClassCount: product_details.liveClassCount,
        mockTestCount: product_details.mockTestCount,
        faq: product_details.faqIds,
        courseContent: updatedCourseContent,
        mrpPrice: product_details.priceId?.mrpPrice,
        totalPrice: product_details.priceId?.totalPrice,
        gstAmount: gstAmount,
        discountPercentage: product_details.priceId?.discountPercentage,
        discountedPrice: product_details.priceId?.discountedPrice,
        thumbnail: transformedThumbnail,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        prebook_amount: product_details?.prebook_amount ?? 0,
        metaTitle: product_details?.metaTitle ?? null,
        metaDescription: product_details?.metaDescription ?? null,
        isFavourite,
      };
    } else if (type === ProductType.BOOK) {
      product_details = await this.bookModel
        .findOne({ ...searchQuery, status: true })
        .populate([
          {
            path: 'languageDetails',
            select: 'languageId thumbnail sampleDownload',
            populate: [{ path: 'languageId', select: 'language' }],
            options: { lean: true },
          },
          {
            path: 'bookTypeDetails',
            select: 'priceId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountPercentage discountedPrice gst',
              },
            ],
          },
        ])
        .select('-categoryId')
        .lean();

      //NOTE - delete keys from languageDetails object and convert urls
      const updatedLanguageDetails = Array.isArray(
        product_details?.languageDetails,
      )
        ? await Promise.all(
            product_details?.languageDetails.map(
              async ({
                _id,
                createdAt,
                updatedAt,
                thumbnail,
                sampleDownload,
                languageId,
                ...rest
              }) => ({
                languageId: languageId._id,
                languageName: languageId.language,
                thumbnail: thumbnail
                  ? await this.commonService.getSignedUrl(thumbnail)
                  : null,
                sampleDownload: sampleDownload
                  ? await this.commonService.getSignedUrl(sampleDownload)
                  : null,
                ...rest,
              }),
            ),
          )
        : [];

      //NOTE - delete keys from bookTypeDetails
      const updatedBookTypeDetails = Array.isArray(
        product_details?.bookTypeDetails,
      )
        ? product_details?.bookTypeDetails.map(
            ({ _id, createdAt, updatedAt, priceId, ...rest }) => {
              //NOTE: Calculate the GST amount
              const basePrice = Math.round(
                priceId?.totalPrice / (1 + priceId?.gst / 100),
              );
              const gstAmount = Math.round(priceId?.totalPrice - basePrice);

              return {
                priceId: priceId._id,
                mrpPrice: priceId?.mrpPrice,
                totalPrice: priceId?.totalPrice,
                discountPercentage: priceId?.discountPercentage,
                discountedPrice: priceId?.discountedPrice,
                gstAmount: gstAmount,
                ...rest,
              };
            },
          )
        : [];

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          bookId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }

      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.bookName,
        courseIds: product_details?.courseIds[0],
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        author: product_details.author,
        publication: product_details.publication,
        page: product_details.totalPage,
        language: updatedLanguageDetails,
        bookTypeDetails: updatedBookTypeDetails,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        isFavourite,
        metaTitle: product_details?.metaTitle ?? null,
        metaDescription: product_details?.metaDescription ?? null,
      };
    } else if (type === ProductType.TEST_SERIES) {
      product_details = await this.testSeriesModel
        .findOne({ ...searchQuery, status: true })
        .populate([
          { path: 'languageIds', select: 'language' },
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
          {
            path: 'assignedTest',
            populate: [
              { path: 'testMasterId', select: 'title duration noOfQuestions' },
            ],
            options: { lean: true },
          },
        ])
        .select('-languageId')
        .lean();

      //NOTE - assign test master details
      const tests =
        product_details.assignedTest &&
        product_details.assignedTest.map((item) => ({
          _id: item.testMasterId?._id,
          title: item.testMasterId?.title,
          duration: item.testMasterId?.duration,
          noOfQuestions: item.testMasterId?.noOfQuestions,
          noOfQuestionPaper: item.testMasterId?.noOfQuestionPaper,
        }));

      let isFavourite = false;
      if (studentDetails) {
        //NOTE: Check if studentDetails is available
        const favouriteProduct = await this.favouriteProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          bookId: product_details._id,
        });

        isFavourite = !!favouriteProduct;
      }

      const basePrice = Math.round(
        product_details.priceId?.totalPrice /
          (1 + product_details.priceId?.gst / 100),
      );
      const gstAmount = Math.round(
        product_details.priceId?.totalPrice - basePrice,
      );

      //NOTE - push final response
      data = {
        _id: product_details._id,
        name: product_details.title,
        courseIds: product_details?.courseIds[0],
        language: product_details.languageIds,
        shortDescription: product_details.shortDescription,
        longDescription: product_details.longDescription,
        thumbnail: product_details.image,
        overview: product_details.overview,
        languageId: product_details.languageId,
        tests: product_details.assignedTest ? tests : null,
        mrpPrice: product_details.priceId?.mrpPrice,
        totalPrice: product_details.priceId?.totalPrice,
        gstAmount,
        discountPercentage: product_details.priceId?.discountPercentage,
        discountedPrice: product_details.priceId?.discountedPrice,
        averageRating: product_details.averageRating,
        userCountOfRating: product_details.userCountOfRating,
        isFavourite,
        metaTitle: product_details?.metaTitle ?? null,
        metaDescription: product_details?.metaDescription ?? null,
      };
    }
    return data;
  }

  //SECTION - add product to favourite
  async favouriteProducts(
    payload: AddToFavouriteDto,
    userId: string,
    userType: UserType,
  ): Promise<any> {
    const { productType, productId, status } = payload;

    const modelType =
      userType === UserType.HOSPITAL_ENQUIRY ||
      userType === UserType.HOSPITAL_STUDENT
        ? SchemaReferenceType.HEALTH_CARE_USER
        : SchemaReferenceType.USER;

    if (status === true) {
      //NOTE - add products as favourite
      const update = {
        userId,
        userByModel: modelType,
        productType,
        bookId: productType === ProductType.BOOK ? productId : null,
        courseId:
          productType === ProductType.ONLINE_COURSE ||
          productType === ProductType.OFFLINE_COURSE
            ? productId
            : null,
        testId: productType === ProductType.TEST_SERIES ? productId : null,
        createdBy: userId,
        createdByModel: modelType,
        updatedBy: userId,
        updatedByModel: modelType,
      };

      await this.favouriteProductModel.findOneAndUpdate(
        {
          userId,
          productType,
          bookId: productType === ProductType.BOOK ? productId : null,
          courseId:
            productType === ProductType.ONLINE_COURSE ||
            productType === ProductType.OFFLINE_COURSE
              ? productId
              : null,
          testId: productType === ProductType.TEST_SERIES ? productId : null,
          carePackageId:
            productType === ProductType.HEALTH_CARE ? productId : null,
        },
        update,
        { new: true, upsert: true },
      );

      return ADDED_AS_FAVOURITE;
    } else {
      //NOTE - remove product from favourite
      await this.favouriteProductModel.findOneAndDelete({
        userId: userId,
        productType: productType,
        $or: [
          {
            productType: ProductType.BOOK,
            bookId: productId,
          },
          {
            productType: {
              $in: [ProductType.ONLINE_COURSE, ProductType.OFFLINE_COURSE],
            },
            courseId: productId,
          },
          {
            productType: ProductType.TEST_SERIES,
            testId: productId,
          },
          {
            productType: ProductType.HEALTH_CARE,
            carePackageId: productId,
          },
        ],
      });

      return REMOVE_FROM_FAVOURITE;
    }
  }

  //SECTION - get Favourite Products based on the userId
  async getFavouriteProducts(
    query: ParsedQs,
    userId: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any[] }> {
    let product_details: any[];
    let data: any[];

    //NOTE - add paginanation
    const { type } = query as { type: string };

    let studentDetails: any = {};
    if (
      userId &&
      (userType === UserType.HOSPITAL_ENQUIRY ||
        userType === UserType.HOSPITAL_STUDENT)
    ) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.healthcareUserModel.findById(userId);
    } else if (userId && userType === UserType.PARENT) {
      if (!mongoose.isValidObjectId(studentId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findById(studentId);
    } else if (userId && userType !== UserType.PARENT) {
      if (!mongoose.isValidObjectId(userId))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findById(userId);
    }

    //NOTE -  if not throw error
    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - find all online course products
    if (
      type === ProductType.ONLINE_COURSE ||
      type === ProductType.OFFLINE_COURSE
    ) {
      product_details = await this.favouriteProductModel
        .find({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          status: true,
        })
        .populate([
          {
            path: 'courseId',
            select:
              'title shortDescription averageRating userCountOfRating thumbnail courseIds',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountedPrice discountPercentage',
              },
            ],
            options: { lean: true },
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for course
      data = await Promise.all(
        product_details.map(async (item) => {
          const updatedThumbnail = {
            imageUrl: item.courseId?.thumbnail.imageUrl
              ? await Promise.all(
                  item.courseId.thumbnail.imageUrl.map(async (image: any) => ({
                    type: 'Image',
                    url: await this.commonService.getSignedUrl(image?.url),
                  })),
                )
              : [],
            videoUrl: item.courseId?.thumbnail.videoUrl
              ? item.courseId.thumbnail.videoUrl.map((video: any) => ({
                  type: 'Video',
                  url: video?.url,
                }))
              : [],
          };

          const transformedThumbnail = [
            ...updatedThumbnail.imageUrl,
            ...updatedThumbnail.videoUrl,
          ];
          return {
            _id: item.courseId?._id,
            name: item.courseId?.title,
            courseIds: item.courseId?.courseIds[0],
            shortDescription: item.courseId?.shortDescription,
            mrpPrice: item.courseId?.priceId?.mrpPrice,
            discountPercentage: item.courseId?.priceId?.discountPercentage,
            discountedPrice: item.courseId?.priceId?.discountedPrice,
            totalPrice: item.courseId?.priceId?.totalPrice,
            averageRating: item.courseId?.averageRating,
            userCountOfRating: item.courseId?.userCountOfRating,
            thumbnail: transformedThumbnail,
            isFavourite: true,
          };
        }),
      );
    } else if (type === ProductType.BOOK) {
      product_details = await this.favouriteProductModel
        .find({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          status: true,
        })
        .populate([
          {
            path: 'bookId',
            select:
              'bookName shortDescription publication totalPage averageRating userCountOfRating courseIds',
            populate: [
              {
                path: 'languageDetails',
                select: 'languageId thumbnail sampleDownload',
                populate: [{ path: 'languageId', select: 'language' }],
                options: { lean: true },
              },
              {
                path: 'bookTypeDetails',
                select: 'priceId',
                populate: [
                  {
                    path: 'priceId',
                    select:
                      'totalPrice mrpPrice discountPercentage discountedPrice',
                  },
                ],
              },
            ],
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for book
      data = await Promise.all(
        product_details.map(async (item) => {
          //NOTE - delete keys from languageDetails object and convert urls
          const updatedLanguageDetails = Array.isArray(
            item.bookId?.languageDetails,
          )
            ? await Promise.all(
                item.bookId?.languageDetails.map(
                  async ({
                    _id,
                    createdAt,
                    updatedAt,
                    thumbnail,
                    languageId,
                    sampleDownload,
                    ...rest
                  }) => ({
                    _id: languageId._id,
                    languageName: languageId.language,
                    thumbnail: thumbnail
                      ? await this.commonService.getSignedUrl(thumbnail)
                      : null,
                    ...rest,
                  }),
                ),
              )
            : [];

          //NOTE - delete keys from bookTypeDetails
          const updatedBookTypeDetails = Array.isArray(
            item.bookId?.bookTypeDetails,
          )
            ? item.bookId?.bookTypeDetails.map(
                ({ _id, createdAt, updatedAt, priceId, ...rest }) => ({
                  totalPrice: priceId?.totalPrice,
                  mrpPrice: priceId?.mrpPrice,
                  discountPercentage: priceId?.discountPercentage,
                  discountedPrice: priceId?.discountedPrice,
                  ...rest,
                }),
              )
            : [];

          return {
            _id: item.bookId?._id,
            name: item.bookId?.bookName,
            courseIds: item.bookId?.courseIds[0],
            shortDescription: item.bookId?.shortDescription,
            publication: item.bookId?.publication,
            totalPage: item.bookId?.totalPage,
            languageDetails: updatedLanguageDetails,
            bookTypeDetails: updatedBookTypeDetails,
            averageRating: item.bookId?.averageRating,
            userCountOfRating: item.bookId?.userCountOfRating,
            isFavourite: true,
          };
        }),
      );
    } else if (type === ProductType.TEST_SERIES) {
      product_details = await this.favouriteProductModel
        .find({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          status: true,
        })
        .populate([
          {
            path: 'testId',
            select:
              'title noOfQuestions noOfQuestionPaper image averageRating userCountOfRating courseIds',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountedPrice discountPercentage',
              },
            ],
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (item.testId?.image && item.testId?.image.trim() !== '') {
            imageUrl = await this.commonService.getSignedUrl(
              item.testId?.image,
            );
          }
          return {
            _id: item.testId?._id,
            name: item.testId?.title,
            courseIds: item.testId?.courseIds[0],
            noOfQuestions: item.testId?.noOfQuestions,
            noOfQuestionPaper: item.testId?.noOfQuestionPaper,
            totalPrice: item.testId?.priceId?.totalPrice,
            discountPercentage: item.testId?.priceId?.discountPercentage,
            discountedPrice: item.testId?.priceId?.discountedPrice,
            mrpPrice: item.testId?.priceId?.mrpPrice,
            thumbnail: imageUrl,
            averageRating: item.testId?.averageRating,
            userCountOfRating: item.testId?.userCountOfRating,
            isFavourite: true,
          };
        }),
      );
    } else if (type === ProductType.HEALTH_CARE) {
      product_details = await this.favouriteProductModel
        .find({
          userId: new mongoose.Types.ObjectId(studentDetails._id),
          productType: type,
          status: true,
        })
        .populate([
          {
            path: 'carePackageId',
            select: 'title image features priceId prebookAmount slugUrl',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountedPrice discountPercentage',
              },
            ],
          },
        ])
        .sort({ createdAt: -1 })
        .select('-priceId')
        .lean();

      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (
            item.carePackageId?.image &&
            item.carePackageId?.image.trim() !== ''
          ) {
            imageUrl = await this.commonService.getSignedUrl(
              item.carePackageId?.image,
            );
          }
          return {
            _id: item.carePackageId?._id,
            name: item.carePackageId?.title,
            features: item.carePackageId?.features,
            slugUrl: item.carePackageId?.slugUrl,
            totalPrice: item.carePackageId?.priceId?.totalPrice,
            discountPercentage: item.carePackageId?.priceId?.discountPercentage,
            discountedPrice: item.carePackageId?.priceId?.discountedPrice,
            mrpPrice: item.carePackageId?.priceId?.mrpPrice,
            thumbnail: imageUrl,
            isFavourite: true,
          };
        }),
      );
    }

    return { data };
  }

  //SECTION - check product is exist in cart for the user or not
  async checkInCart(
    productDetails: CheckProductInCartDto,
    userId: string,
  ): Promise<boolean> {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    const { productType, productId, bookType, languageId } = productDetails;

    const query: any = {
      userId: new Types.ObjectId(userId),
    };

    let productField: string;
    let slugField: string;

    //NOTE: Determine the product and slug fields based on the product type
    if (productType === ProductType.BOOK) {
      productField = 'bookId';
      slugField = 'slugUrl';
    } else if (
      productType === ProductType.ONLINE_COURSE ||
      productType === ProductType.OFFLINE_COURSE
    ) {
      productField = 'onlineCourseId';
      slugField = 'slugUrl';
    } else if (productType === ProductType.TEST_SERIES) {
      productField = 'testId';
      slugField = 'slugUrl';
    } else if (productType === ProductType.HEALTH_CARE) {
      productField = 'carePackageId';
      slugField = 'slugUrl';
    }

    //NOTE : Check if productId is a valid MongoDB ObjectId
    if (objectIdPattern.test(productId)) {
      query[productField] = new mongoose.Types.ObjectId(productId);
    } else {
      //NOTE : If productId is not a valid ObjectId, search by slugUrl
      if (
        productType === ProductType.ONLINE_COURSE ||
        productType === ProductType.OFFLINE_COURSE
      ) {
        query[productField] = (
          await this.onlineCourseModel.findOne({
            [slugField]: productId,
          })
        )._id;
      } else if (productType === ProductType.BOOK) {
        query[productField] = (
          await this.bookModel.findOne({
            [slugField]: productId,
          })
        )._id;
      } else if (productType === ProductType.TEST_SERIES) {
        query[productField] = (
          await this.testSeriesModel.findOne({
            [slugField]: productId,
          })
        )._id;
      } else if (productType === ProductType.HEALTH_CARE) {
        query[productField] = (
          await this.carePackageModel.findOne({
            [slugField]: productId,
          })
        )._id;
      }
    }

    //NOTE Set common fields based on product type
    query.productType = productType;
    query.languageId = new Types.ObjectId(languageId);

    //NOTE Set additional fields based on the product type
    if (productType === ProductType.BOOK) {
      query.bookType = bookType;
    }

    //NOTE - check product details
    const checkProduct = await this.cartModel.findOne(query);

    return !!checkProduct;
  }

  //SECTION - check coupon details and apply
  async checkCoupon(payload: CheckCouponDto, userId: string): Promise<any> {
    const { code } = payload;

    //NOTE - get cart all product details
    const get_cart_details: any[] = await this.cartModel.find({ userId });

    // NOTE - get amountToBePaid by userId
    const payment_summary: any = await this.paymentSummaryModel.findOne({
      userId,
    });

    //NOTE - push productType
    const productType = [
      ...new Set(get_cart_details.map((item) => item.productType)),
    ];

    //NOTE - get currentdate to check expiry date is valide or not
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    //NOTE - check coupon details
    const check_coupon = await this.couponModel.findOne({
      code,
      validFor: { $all: productType },
      minimumOrderPrice: { $lte: payment_summary?.amountToBePaid },
      expiryDate: { $gte: currentDate },
      availableCoupon: { $ne: 0 },
    });

    if (check_coupon) {
      //NOTE - update the cartModel with coupon id
      await this.cartModel.updateMany(
        { userId },
        { $set: { couponId: check_coupon._id } },
        { runValidators: true },
      );

      //NOTE - update the coupon as applied
      await this.couponModel.findOneAndUpdate(
        { _id: check_coupon._id },
        { isApplied: true },
        { new: true, runValidators: true, upsert: true },
      );
    }

    return check_coupon !== null ? COUPON_APPLIED : COUPON_APPLIED_FAILED;
  }

  //SECTION - remove coupon details and apply
  async removeCoupon(payload: CheckCouponDto, userId: string): Promise<any> {
    const { code } = payload;
    //NOTE - check coupon details
    const check_coupon = await this.couponModel.findOne({ code });

    if (check_coupon) {
      //NOTE - update the cartModel and remove the coupon
      await this.cartModel.updateMany(
        { userId },
        { $unset: { couponId: 1 } }, // 1 means to remove the field
        { runValidators: true },
      );
    }

    return COUPON_REMOVED;
  }

  //SECTION - add and remove from save list
  async saveProduct(payload: AddSaveDto, userId: string): Promise<any> {
    const { productType, productId, courseLibraryId, status } = payload;

    if (status === true) {
      //NOTE - add save list
      const update = {
        userId,
        productType,
        freecontentId:
          productType === SavedProductTypes.LEARNING ||
          productType === SavedProductTypes.NOTES
            ? productId
            : null,
        testId: productType === SavedProductTypes.TEST ? productId : null,
        courseLibraryId:
          productType === SavedProductTypes.COURSE_VIDEO ||
          productType === SavedProductTypes.COURSE_PDF
            ? courseLibraryId
            : null,
        videoId:
          productType === SavedProductTypes.COURSE_VIDEO ? productId : null,
        pdfId: productType === SavedProductTypes.COURSE_PDF ? productId : null,
        createdBy: userId,
        updatedBy: userId,
      };

      await this.saveProductModel.findOneAndUpdate(
        {
          userId,
          productType,
          testId: productType === SavedProductTypes.TEST ? productId : null,
          freecontentId:
            productType === SavedProductTypes.LEARNING ||
            productType === SavedProductTypes.NOTES
              ? productId
              : null,
          courseLibraryId:
            productType === SavedProductTypes.COURSE_VIDEO ||
            productType === SavedProductTypes.COURSE_PDF
              ? courseLibraryId
              : null,
          videoId:
            productType === SavedProductTypes.COURSE_VIDEO ? productId : null,
          pdfId:
            productType === SavedProductTypes.COURSE_PDF ? productId : null,
        },
        update,
        { new: true, upsert: true },
      );

      return ADDED_IN_SAVE_LIST;
    } else {
      //NOTE - remove from save list
      await this.saveProductModel.findOneAndDelete({
        userId: userId,
        // productType: productType,
        $or: [
          { productType: SavedProductTypes.TEST, testId: productId },
          {
            productType: {
              $in: [SavedProductTypes.LEARNING, SavedProductTypes.NOTES],
            },
            freecontentId: productId,
          },
          {
            productType: SavedProductTypes.COURSE_VIDEO,
            videoId: productId,
            courseLibraryId,
          },
          {
            productType: SavedProductTypes.COURSE_PDF,
            pdfId: productId,
            courseLibraryId,
          },
        ],
      });

      return REMOVE_FROM_SAVE_LIST;
    }
  }

  //SECTION - get save product list value
  async getSaveListProducts(
    query: ParsedQs,
    userId: string,
  ): Promise<{ data: any[] }> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(userId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    let product_details: any[];
    let response: any[];

    //NOTE - add paginanation
    const { type } = query as { type: string };

    const studentDetails = await this.userModel.findOne({ _id: userId });

    //NOTE -  if not throw error
    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    //NOTE - find all saved product details
    if (type === SavedProductTypes.LEARNING) {
      product_details = await this.saveProductModel
        .find({
          userId,
          productType: {
            $in: [SavedProductTypes.LEARNING, SavedProductTypes.COURSE_VIDEO],
          },
          status: true,
        })
        .populate([
          {
            path: 'freecontentId',
            select: 'subjectId thumbnail videoUrl slugUrl',
            populate: [{ path: 'subjectId', select: 'name' }],
          },
          {
            path: 'courseLibraryId',
            select: 'onlineCourseId subjectId videoUrl',
            populate: [
              { path: 'subjectId', select: 'name' },
              { path: 'onlineCourseId', select: 'slugUrl' },
            ],
          },
        ]);
      //NOTE - push result
      const result = await Promise.all(
        product_details.map(async (item) => {
          if (item.productType === SavedProductTypes.LEARNING) {
            let thumbnail = null;
            if (
              item.freecontentId?.thumbnail &&
              item.freecontentId?.thumbnail.trim() !== ''
            ) {
              thumbnail = await this.commonService.getSignedUrl(
                item.freecontentId.thumbnail,
              );
            }
            return {
              _id: item.freecontentId?._id,
              videoId: item.freecontentId?.videoUrl?._id,
              title: item.freecontentId?.videoUrl?.title,
              subject: item.freecontentId?.subjectId?.name,
              thumbnail: thumbnail ?? null,
              videoType: SavedProductTypes.LEARNING,
              slugUrl: item.freecontentId?.slugUrl || null,
              isSaved: true,
            };
          } else if (item.productType === SavedProductTypes.COURSE_VIDEO) {
            const videoIdToMatch = item.videoId.toString();
            const matchingVideo = item.courseLibraryId?.videoUrl.find(
              (video: any) => video._id.toString() === videoIdToMatch,
            );

            if (matchingVideo) {
              const thumbnail =
                matchingVideo.thumbnail && matchingVideo.thumbnail.trim() !== ''
                  ? await this.commonService.getSignedUrl(
                      matchingVideo.thumbnail,
                    )
                  : null;

              return {
                _id: matchingVideo._id,
                title: matchingVideo.title,
                subject: item.courseLibraryId?.subjectId?.name,
                thumbnail: thumbnail ?? null,
                videoType: SavedProductTypes.COURSE_VIDEO,
                slugUrl: item.courseLibraryId?.onlineCourseId?.slugUrl || null,
                isSaved: true,
              };
            }
          }
        }),
      );

      //NOTE : Filter out null entries from the result array
      response = result.filter((item) => item !== null);
    } else if (type === SavedProductTypes.NOTES) {
      product_details = await this.saveProductModel
        .find({
          userId,
          productType: {
            $in: [SavedProductTypes.NOTES, SavedProductTypes.COURSE_PDF],
          },
          status: true,
        })
        .populate([
          {
            path: 'freecontentId',
            select: 'subjectId thumbnail pdfUrl slugUrl',
            populate: [{ path: 'subjectId', select: 'name' }],
          },
          {
            path: 'courseLibraryId',
            select: 'onlineCourseId subjectId pdfUrl title',
            populate: [
              { path: 'subjectId', select: 'name' },
              { path: 'onlineCourseId', select: 'slugUrl' },
              {
                path: 'pdfUrl',
                select: 'title languageId thumbnail url',
                populate: [
                  {
                    path: 'languageId',
                    select: 'language',
                  },
                ],
              },
            ],
          },
        ]);
      //NOTE - push result
      const result = await Promise.all(
        product_details.map(async (item) => {
          if (item.productType === SavedProductTypes.NOTES) {
            let thumbnail = null;
            if (
              item.freecontentId?.thumbnail &&
              item.freecontentId?.thumbnail.trim() !== ''
            ) {
              thumbnail = await this.commonService.getSignedUrl(
                item.freecontentId.thumbnail,
              );
            }

            let notesUrl = null;
            if (
              item.freecontentId?.pdfUrl?.url &&
              item.freecontentId?.pdfUrl?.url.trim() !== ''
            ) {
              notesUrl = await this.commonService.getSignedUrl(
                item.freecontentId?.pdfUrl?.url,
              );
            }
            return {
              _id: item.freecontentId?._id,
              title: item.freecontentId?.pdfUrl?.title,
              subject: item.freecontentId?.subjectId?.name,
              slugUrl: item.freecontentId?.slugUrl,
              thumbnail: thumbnail ?? null,
              notesType: SavedProductTypes.NOTES,
              url: notesUrl,
              isSaved: true,
            };
          } else if (item.productType === SavedProductTypes.COURSE_PDF) {
            if (item.courseLibraryId?.pdfUrl) {
              for (const data of item.courseLibraryId?.pdfUrl) {
                if (data.thumbnail && data.thumbnail.trim() !== '') {
                  const imageUrl = await this.commonService.getSignedUrl(
                    data.thumbnail,
                  );
                  data.thumbnail = imageUrl;
                }

                if (data.url && data.url.trim() !== '') {
                  const url = await this.commonService.getSignedUrl(data.url);
                  data.url = url;
                }
              }
            }

            return {
              _id: item.courseLibraryId?._id,
              libraryId: item.courseLibraryId?._id,
              title: item.courseLibraryId?.title,
              subject: item.courseLibraryId?.subjectId?.name,
              slugUrl: item.courseLibraryId?.onlineCourseId?.slugUrl || null,
              notesType: SavedProductTypes.COURSE_PDF,
              url: item.courseLibraryId?.pdfUrl,
              isSaved: true,
            };
          }
        }),
      );

      //NOTE : Filter out null entries from the result array
      response = result.filter((item) => item !== null);
    } else if (type === SavedProductTypes.TEST) {
      product_details = await this.saveProductModel
        .find({
          userId,
          productType: {
            $in: [SavedProductTypes.TEST],
          },
          status: true,
        })
        .populate([
          {
            path: 'testId',
            select:
              'title duration noOfQuestions startAfter startBefore slugUrl offlineMode mode isFree attemptMode',
          },
        ]);

      //NOTE - push final data
      response = await Promise.all(
        product_details.map(async (item) => {
          // NOTE - check if test attempted by user or not
          const isAttempted = await this.testResultModel
            .findOne({
              testId: item.testId?._id,
              studentId: new mongoose.Types.ObjectId(userId),
            })
            .select('testId');

          return {
            _id: item.testId?._id,
            title: item.testId?.title,
            duration: item.testId?.duration,
            noOfQuestions: item.testId?.noOfQuestions,
            isSaved: true,
            isAttempted: !!isAttempted,
            currentTime: currentDate,
            isFree: item.testId?.isFree,
            slugUrl: item?.testId?.slugUrl ?? null,
            mode: item?.testId?.mode ?? null,
            attemptMode: item?.testId?.attemptMode ?? null,
            startAfter: item?.testId?.startAfter ?? null,
            startBefore: item?.testId?.startBefore ?? null,
            offlineMode: item?.testId?.offlineMode ?? null,
          };
        }),
      );
    }

    return { data: response };
  }
  //SECTION - get top seller product
  async getTopSellerProduct(
    userId?: string,
    userType?: UserType,
    studentId?: string,
  ): Promise<{ data: any }> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    let data: any[];
    let product_details: any[];
    let studentDetails: any;
    if (userId && (userType === UserType.PARENT || !studentId)) {
      const idToCheck = studentId || userId;
      if (!mongoose.isValidObjectId(idToCheck))
        throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
      studentDetails = await this.userModel.findOne({ _id: idToCheck });
      if (!studentDetails)
        throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    if (
      studentDetails?.mode === StudentSignUpType.ONLINE ||
      studentDetails?.mode === StudentSignUpType.OFFLINE
    ) {
      product_details = await this.onlineCourseModel
        .find({
          type: studentDetails.mode,
          topSeller: true,
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          status: true,
        })
        .populate([
          { path: 'languageId', select: '_id language' },
          {
            path: 'priceId',
            select:
              'totalPrice mrpPrice discountedPrice discountPercentage gst',
          },
          { path: 'faqIds', select: 'question answer' },
        ])
        .select('-languageId')
        .lean();

      //NOTE - push final data for course
      data = await Promise.all(
        product_details.map(async (item) => {
          const updatedThumbnail = {
            imageUrl: await Promise.all(
              item.thumbnail.imageUrl.map(async (image: any) => ({
                type: 'Image',
                url: await this.commonService.getSignedUrl(image.url),
              })),
            ),
            videoUrl: item.thumbnail.videoUrl.map((video: any) => ({
              type: 'Video',
              url: video.url,
            })),
          };

          const transformedThumbnail = [
            ...updatedThumbnail.imageUrl,
            ...updatedThumbnail.videoUrl,
          ];

          let isFavourite = false; //NOTE: Initialize isFavourite as false
          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType:
                item.type === ModeTypes.ONLINE
                  ? ProductType.ONLINE_COURSE
                  : ProductType.OFFLINE_COURSE,
              courseId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          return {
            _id: item._id,
            name: item.title,
            slugUrl: item?.slugUrl || null,
            courseIds: item?.courseIds[0],
            shortDescription: item.shortDescription,
            mrpPrice: item.priceId?.mrpPrice,
            discountPercentage: item.priceId?.discountPercentage,
            totalPrice: item.priceId?.totalPrice,
            thumbnail: transformedThumbnail,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            language: item.languageId?.language,
            languageId: item.languageId?._id,
            liveClassCount: item?.liveClassCount,
            mockTestCount: item?.mockTestCount,
            isFavourite,
            productType:
              item.type === ModeTypes.ONLINE
                ? ProductType.ONLINE_COURSE
                : ProductType.OFFLINE_COURSE,
          };
        }),
      );
    } else if (studentDetails?.mode === StudentSignUpType.BOOK) {
      product_details = await this.bookModel
        .find({
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          topSeller: true,
          status: true,
        })
        .populate([
          {
            path: 'languageDetails',
            select: 'languageId thumbnail sampleDownload',
            populate: [{ path: 'languageId', select: 'language' }],
            options: { lean: true },
          },
          {
            path: 'bookTypeDetails',
            select: 'priceId',
            populate: [
              {
                path: 'priceId',
                select:
                  'totalPrice mrpPrice discountPercentage discountedPrice gst',
              },
            ],
          },
        ])
        .select('-languageDetails -bookTypeDetails')
        .lean();

      //NOTE - push final data for book
      data = await Promise.all(
        product_details.map(async (item) => {
          //NOTE - delete keys from languageDetails object and convert urls
          const updatedLanguageDetails = Array.isArray(item.languageDetails)
            ? await Promise.all(
                item.languageDetails.map(
                  async ({
                    _id,
                    createdAt,
                    updatedAt,
                    thumbnail,
                    languageId,
                    sampleDownload,
                    ...rest
                  }) => ({
                    _id: languageId._id,
                    languageName: languageId.language,
                    thumbnail: thumbnail
                      ? await this.commonService.getSignedUrl(thumbnail)
                      : null,
                    ...rest,
                  }),
                ),
              )
            : [];

          //NOTE - delete keys from bookTypeDetails
          const updatedBookTypeDetails = Array.isArray(item.bookTypeDetails)
            ? item.bookTypeDetails.map(
                ({ _id, createdAt, updatedAt, priceId, ...rest }) => ({
                  totalPrice: priceId?.totalPrice,
                  mrpPrice: priceId?.mrpPrice,
                  discountPercentage: priceId?.discountPercentage,
                  discountedPrice: priceId?.discountedPrice,
                  ...rest,
                }),
              )
            : [];

          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: ProductType.BOOK,
              bookId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }

          return {
            _id: item._id,
            name: item.bookName,
            slugUrl: item?.slugUrl || null,
            courseIds: item?.courseIds[0],
            shortDescription: item.shortDescription,
            publication: item.publication,
            totalPage: item.totalPage,
            languageDetails: updatedLanguageDetails,
            bookTypeDetails: updatedBookTypeDetails,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            productType: ProductType.BOOK,
            isFavourite,
          };
        }),
      );
    } else if (studentDetails?.mode === StudentSignUpType.TEST_SERIES) {
      product_details = await this.testSeriesModel
        .find({
          categoryId: studentDetails.categoryId,
          courseIds: studentDetails.courseId,
          topSeller: true,
          status: true,
        })
        .populate([
          { path: 'languageIds', select: '_id language' },
          {
            path: 'priceId',
            select: 'totalPrice mrpPrice discountedPrice discountPercentage',
          },
          {
            path: 'assignedTest',
            populate: [
              { path: 'testMasterId', select: 'title duration noOfQuestions' },
            ],
            options: { lean: true },
          },
        ])
        .lean();
      //NOTE - push final data for Test series
      data = await Promise.all(
        product_details.map(async (item) => {
          let imageUrl: string;
          if (item.image && item.image.trim() !== '') {
            imageUrl = await this.commonService.getSignedUrl(item.image);
          }

          let isFavourite = false; //NOTE: Initialize isFavourite as false

          if (studentDetails) {
            //NOTE: Check if studentDetails is available
            const favouriteProduct = await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(studentDetails._id),
              productType: ProductType.TEST_SERIES,
              testId: item._id,
            });

            isFavourite = !!favouriteProduct;
          }
          return {
            _id: item._id,
            name: item.title,
            slugUrl: item?.slugUrl || null,
            courseIds: item?.courseIds[0],
            languageDetails: item?.languageIds,
            noOfQuestions: item.noOfQuestions,
            noOfQuestionPaper: item.noOfQuestionPaper,
            totalPrice: item.priceId?.totalPrice,
            discountPercentage: item.priceId?.discountPercentage,
            mrpPrice: item.priceId?.mrpPrice,
            thumbnail: imageUrl,
            averageRating: item.averageRating,
            userCountOfRating: item.userCountOfRating,
            productType: ProductType.TEST_SERIES,
            isFavourite,
          };
        }),
      );
    }

    return { data };
  }

  //SECTION - update offline product paymenet details in cart
  async updateOfflineProduct(
    id: string,
    payload: UpdateOfflineProductDto,
    userId: string,
    userType: UserType,
  ): Promise<any> {
    const { payment_type, prebook_amount, nextPaymentDate } = payload;

    const today = new Date();
    //NOTE: check if nextPaymentDate is lessthan current date
    if (new Date(nextPaymentDate) < today) {
      throw new HttpException(PAYMENT_DATE_ERROR, HttpStatus.BAD_REQUEST);
    }

    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const productTypes =
      userType !== UserType.HOSPITAL_STUDENT &&
      userType !== UserType.HOSPITAL_ENQUIRY
        ? ProductType.OFFLINE_COURSE
        : ProductType.HEALTH_CARE;

    //NOTE - check if any cart exists with the id or not
    const existCart: any = await this.cartModel
      .findOne({
        productType: productTypes,
        userId,
        onlineCourseId:
          userType !== UserType.HOSPITAL_STUDENT &&
          userType !== UserType.HOSPITAL_ENQUIRY
            ? id
            : null,
        carePackageId:
          userType === UserType.HOSPITAL_STUDENT ||
          userType === UserType.HOSPITAL_ENQUIRY
            ? id
            : null,
      })
      .populate('onlineCourseId', 'prebook_amount');
    //NOTE -  if not throw an error
    if (!existCart)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (existCart.productType === ProductType.OFFLINE_COURSE) {
      if (prebook_amount < existCart.onlineCourseId?.prebook_amount) {
        throw new HttpException(
          PREBOOK_AMOUNT_NOT_VALID,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    //NOTE: check pice details
    const priceDetails = await this.priceModel.findById({
      _id: existCart.priceId,
    });

    //NOTE - model details
    const modelDetails =
      userType !== UserType.HOSPITAL_STUDENT &&
      userType !== UserType.HOSPITAL_ENQUIRY
        ? 'User'
        : 'HealthcareUser';

    //NOTE - common property for update
    const commonUpdateData = {
      payment_type,
      gst: priceDetails.gst,
      discountPercentage: priceDetails.discountPercentage,
      updatedBy: userId,
      userByModel: modelDetails,
      createdByModel: modelDetails,
      updatedByModel: modelDetails,
    };
    //NOTE: if full payment
    if (payment_type === OfflineCoursePriceType.DISCOUNT_PRICE) {
      const basePrice = Math.round(
        priceDetails.totalPrice / (1 + priceDetails.gst / 100),
      );
      const gstAmount = Math.round(priceDetails.totalPrice - basePrice);

      const updateData = {
        ...commonUpdateData,
        totalPrice: priceDetails.totalPrice,
        gstAmount: gstAmount,
        discountedPrice: priceDetails.discountedPrice,
        prebook_amount: null,
        nextPaymentDate: null,
      };

      await this.cartModel.findOneAndUpdate(
        { _id: existCart._id },
        updateData,
        { new: true, runValidators: true, upsert: true },
      );
      //NOTE: if pre_book amount
    } else {
      const basePrice = Math.round(
        prebook_amount / (1 + priceDetails.gst / 100),
      );
      const gstAmount = Math.round(prebook_amount - basePrice);

      const updateData = {
        ...commonUpdateData,
        totalPrice: prebook_amount,
        gstAmount: gstAmount,
        discountedPrice: basePrice,
        prebook_amount: prebook_amount,
        nextPaymentDate: nextPaymentDate,
      };

      await this.cartModel.findOneAndUpdate(
        { _id: existCart._id },
        updateData,
        { new: true, runValidators: true, upsert: true },
      );
    }

    //NOTE - Return the updated cart document id
    return existCart._id;
  }

  //SECTION - get favourite product count based on the userId
  async favouriteCount(id: string): Promise<number> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get favourite product count based on the userId
    const quantitySumResult = await this.favouriteProductModel.countDocuments({
      userId: new mongoose.Types.ObjectId(id),
    });

    const count = quantitySumResult || 0;

    return count;
  }

  //ANCHOR - check two array is matched or not
  async doArraysContainCommonElement(
    array1: any,
    array2: any,
  ): Promise<boolean> {
    return array2.every((element) => array1.includes(element));
  }

  //ANCHOR: calculate wallet amount for student
  private async calculateWalletAmount(coins: number): Promise<number> {
    //NOTE: Define the conversion rate from coins to rupees
    const conversionRate = 0.1; // 100 coins = 10 rupees

    //NOTE: Define the usage limit as a percentage (50%)
    const usageLimit = 0.5;

    //NOTE Check if coins are greater than 0
    if (coins > 0) {
      //NOTE : Calculate the wallet amount based on coins, conversion rate, and usage limit
      const walletAmount: number = coins * conversionRate * usageLimit;

      return walletAmount;
    } else {
      //NOTE: If coins are 0 or negative, return 0 wallet amount
      return 0;
    }
  }

  //ANCHOR: Function to get a random sample from an array
  private async getRandomProducts(array: any[], size: number): Promise<any> {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
}
