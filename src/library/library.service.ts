import mongoose, { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import {
  CourseLibraryType,
  LibraryTypes,
  LiveClassStatus,
  LiveClassType,
  ProductType,
  SavedProductTypes,
  TransactionStatus,
  UserType,
  VideoType,
} from 'src/utills/enum';
import { CommonService } from 'src/utills/commonService';
import { CourseLibrary } from 'src/schema/online-course-library.schema';
import { INVALID_ID, USER_NOT_FOUND } from 'src/utills/messages';
import { TestSeries } from 'src/schema/test-series.schema';
import { ReviewAndRating } from 'src/schema/rating.schema';
import { Book } from 'src/schema/book.schema';
import { GetLibraryDto } from './dto/get-course.dto';
import { User } from 'src/schema/user.schema';
import { SaveProduct } from 'src/schema/save-product.schema';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { GetLiveClassForCalenderDto } from './dto/get-live-class-calender.dto';
import { LiveClass } from 'src/schema/liveClass.schema';
import { TestResult } from 'src/schema/test.result.schema';
import { Batch } from 'src/schema/batch.schema';
import { OfflineCoursePayment } from 'src/schema/offline-course-payment';
import { GetCourseSubjectsDto } from './dto/get-course-subjects.dto';
import { LessonPlanner } from 'src/schema/lesson-planner.schema';
import { GetSubjectChapterDto } from './dto/get-subjects-chapter.dto';
import { GetEbookLibraryDto } from './dto/get-ebbok-pdf.dto';
import { StudentBatch } from 'src/schema/student-batch.schema';
@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(UserProductDetails.name)
    private userProductModel: Model<UserProductDetails>,
    @InjectModel(CourseLibrary.name)
    private courseLibraryModel: Model<CourseLibrary>,
    @InjectModel(TestSeries.name) private testSeriesModel: Model<TestSeries>,
    @InjectModel(ReviewAndRating.name)
    private ratingModel: Model<ReviewAndRating>,
    @InjectModel(Book.name) private bookModal: Model<Book>,
    @InjectModel(OnlineCourse.name)
    private onlineCourseModel: Model<OnlineCourse>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SaveProduct.name)
    private saveProductModel: Model<SaveProduct>,
    @InjectModel(LiveClass.name) private liveClassModel: Model<LiveClass>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResult>,
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(OfflineCoursePayment.name)
    private offlinePaymentModel: Model<OfflineCoursePayment>,
    @InjectModel(LessonPlanner.name)
    private lessonPlannerModel: Model<LessonPlanner>,
    @InjectModel(StudentBatch.name)
    private studentBatchModal: Model<StudentBatch>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION: get all user online course details
  async onlineCourseDetails(
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const currentDate = new Date().toISOString();

    const searchQuery: any = {
      $and: [{ productType: ProductType.ONLINE_COURSE }],
    };
    if (userType === UserType.ENQUIRY || userType === UserType.STUDENT) {
      searchQuery.$and.push({ studentId: new mongoose.Types.ObjectId(userId) });
    }
    if (userType === UserType.PARENT) {
      searchQuery.$and.push({
        studentId: new mongoose.Types.ObjectId(childId),
      });
    }

    //NOTE - check if validUpto is null
    const product: any = await this.userProductModel.find({
      ...searchQuery,
      haveAccess: true,
    });

    await Promise.all(
      product.map(
        async (data: {
          validUpto: null;
          batchId: any;
          createdAt: string | number | Date;
          _id: any;
          orderId: any;
          onlineCourseId: any;
        }) => {
          //NOTE - check paymnet details
          const payment = await this.offlinePaymentModel
            .findOne({
              parentOrderId: data.orderId,
              courseId: data.onlineCourseId,
            })
            .sort({ createdAt: -1 });

          //NOTE - check nextPaymentDate and if it already gone then update the access as false
          if (
            payment &&
            payment.transactionStatus === TransactionStatus.INSTALLMENT &&
            payment?.nextPaymentDate
          ) {
            const todayDate =
              new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

            //NOTE Set the nextPaymentDate to the same format as todayDate
            const nextPaymentDate =
              payment.nextPaymentDate.toISOString().split('T')[0] +
              'T00:00:00.000Z';

            if (nextPaymentDate < todayDate) {
              //NOTE: if nextPaymentDate is less than todayDate update the access
              return this.userProductModel.updateOne(
                { _id: data._id },
                { $set: { haveAccess: false } },
              );
            }
          }

          //NOTE - check if validUpto is null then update it
          if (data.validUpto === null) {
            const batchDetails = await this.batchModel.findById(data.batchId);

            if (batchDetails) {
              const validUptoDate = new Date(data.createdAt);
              validUptoDate.setDate(
                validUptoDate.getDate() + batchDetails.duration,
              );
              validUptoDate.setHours(23, 59, 59, 999);

              return this.userProductModel.updateOne(
                { _id: data._id, validUpto: null },
                { $set: { validUpto: validUptoDate } },
              );
            }
          }
        },
      ),
    );

    //NOTE - get user product details
    const product_details: any = await this.userProductModel
      .find({
        ...searchQuery,
        validUpto: { $gte: currentDate },
        haveAccess: true,
      })
      .populate({
        path: 'onlineCourseId',
        select: 'title thumbnail slugUrl batchId',
      })
      .select('onlineCourseId validUpto haveAccess')
      .sort({ createdAt: -1 });

    //NOTE: check if any product validUpto is less than currentdate then update that one
    const product_need_update = await this.userProductModel.find({
      ...searchQuery,
      validUpto: { $lt: currentDate },
      haveAccess: true,
    });

    if (product_need_update.length > 0) {
      const todayDate = new Date();
      for (const data of product_need_update) {
        if (data?.validUpto) {
          const isValidTillNow = todayDate <= new Date(data?.validUpto);
          if (!isValidTillNow) {
            await this.userProductModel.findByIdAndUpdate(data._id, {
              $set: { haveAccess: false },
            });

            await this.studentBatchModal.findOneAndUpdate(
              {
                orderId: data.orderId,
                studentId: data.studentId,
                courseId: data.onlineCourseId,
              },
              { $set: { status: false } },
            );
          }
        }
      }
    }

    //NOTE: Extract imageUrl arrays from the populated documents
    const formattedProductDetails = await Promise.all(
      product_details.map(async (doc: any) => {
        const imageUrlArray = doc.onlineCourseId?.thumbnail?.imageUrl;
        const randomImageUrl =
          imageUrlArray && imageUrlArray.length > 0
            ? imageUrlArray[Math.floor(Math.random() * imageUrlArray.length)]
                .url
            : null;

        let signedImageUrl = null;
        if (randomImageUrl) {
          signedImageUrl = await this.commonService.getSignedUrl(
            randomImageUrl,
          );
        }

        //NOTE - get rating details
        const rating_details = await this.ratingModel.findOne({
          studentId: new mongoose.Types.ObjectId(userId),
          onlineCourseId: new mongoose.Types.ObjectId(doc.onlineCourseId?._id),
        });

        return {
          _id: doc.onlineCourseId?._id,
          title: doc.onlineCourseId?.title,
          slugUrl: doc.onlineCourseId?.slugUrl || null,
          thumbnail: signedImageUrl,
          batchId: doc.onlineCourseId?.batchId,
          validUpto: doc?.validUpto || null,
          haveAccess: doc?.haveAccess || false,
          rating: !!rating_details,
        };
      }),
    );

    const filteredProducts = formattedProductDetails.filter(
      (product) => product !== null,
    );
    return { response: filteredProducts };
  }

  //SECTION: get user offline course details
  async offlineCourseDetails(
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const currentDate = new Date().toISOString();
    const searchQuery: any = {
      $and: [{ productType: ProductType.OFFLINE_COURSE }],
    };

    if (userType === UserType.STUDENT || userType === UserType.ENQUIRY) {
      searchQuery.$and.push({ studentId: new mongoose.Types.ObjectId(userId) });
    }

    if (userType === UserType.PARENT) {
      searchQuery.$and.push({
        studentId: new mongoose.Types.ObjectId(childId),
      });
    }

    // Get products based on search query
    const products: any = await this.userProductModel.find({
      ...searchQuery,
      batchId: { $ne: null },
      haveAccess: true,
    });

    // Iterate over products and update haveAccess and validUpto if necessary
    await Promise.all(
      products?.map(async (data: any) => {
        const payment = await this.offlinePaymentModel
          .findOne({
            parentOrderId: data.orderId,
            courseId: data.onlineCourseId,
          })
          .sort({ createdAt: -1 });

        if (
          payment &&
          payment.transactionStatus === TransactionStatus.INSTALLMENT &&
          payment?.nextPaymentDate
        ) {
          const todayDate =
            new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
          const nextPaymentDate =
            payment.nextPaymentDate.toISOString().split('T')[0] +
            'T00:00:00.000Z';

          if (nextPaymentDate < todayDate) {
            await this.userProductModel.updateOne(
              { _id: data._id },
              { $set: { haveAccess: false } },
            );
          }
        }

        if (data.validUpto) {
          const validUptoDate = new Date(data.validUpto);
          const currentDate = new Date();
          currentDate.setUTCHours(23, 59, 59, 999);
          if (validUptoDate < currentDate) {
            await this.userProductModel.updateOne(
              { _id: data._id },
              { $set: { haveAccess: false } },
            );
          }
        } else {
          const batchDetails = await this.batchModel.findById(data.batchId);

          if (batchDetails) {
            const validUptoDate = new Date(data.createdAt);
            validUptoDate.setDate(
              validUptoDate.getDate() + batchDetails.duration,
            );
            validUptoDate.setHours(23, 59, 59, 999);

            await this.userProductModel.updateOne(
              { _id: data._id, validUpto: null },
              { $set: { validUpto: validUptoDate } },
            );
          }
        }
      }),
    );

    // Get product details with populated onlineCourseId
    const productDetails: any = await this.userProductModel
      .find({
        ...searchQuery,
        batchId: { $ne: null },
        haveAccess: true,
      })
      .populate({
        path: 'onlineCourseId',
        select: 'title thumbnail slugUrl batchId',
      })
      .select('onlineCourseId')
      .sort({ createdAt: -1 });

    //NOTE: check if any product validUpto is less than currentdate then update that one
    const product_need_update = await this.userProductModel.find({
      ...searchQuery,
      validUpto: { $lt: currentDate },
      haveAccess: true,
    });

    if (product_need_update.length > 0) {
      const todayDate = new Date();
      for (const data of product_need_update) {
        if (data?.validUpto) {
          const isValidTillNow = todayDate <= new Date(data?.validUpto);
          if (!isValidTillNow) {
            await this.userProductModel.findByIdAndUpdate(data._id, {
              $set: { haveAccess: false },
            });

            await this.studentBatchModal.findOneAndUpdate(
              {
                orderId: data.orderId,
                studentId: data.studentId,
                courseId: data.onlineCourseId,
              },
              { $set: { status: false } },
            );
          }
        }
      }
    }

    // Extract imageUrl arrays from the populated documents and format the response
    const formattedProductDetails = await Promise.all(
      productDetails?.map(async (doc: any) => {
        const imageUrlArray = doc.onlineCourseId?.thumbnail?.imageUrl;
        const randomImageUrl =
          imageUrlArray && imageUrlArray.length > 0
            ? imageUrlArray[Math.floor(Math.random() * imageUrlArray.length)]
                .url
            : null;
        const signedImageUrl = randomImageUrl
          ? await this.commonService.getSignedUrl(randomImageUrl)
          : null;

        const rating_details = await this.ratingModel.findOne({
          studentId: new mongoose.Types.ObjectId(userId),
          onlineCourseId: new mongoose.Types.ObjectId(doc.onlineCourseId?._id),
        });

        return {
          _id: doc.onlineCourseId?._id,
          title: doc.onlineCourseId?.title,
          slugUrl: doc.onlineCourseId?.slugUrl || null,
          thumbnail: signedImageUrl,
          batchId: doc.onlineCourseId?.batchId,
          rating: !!rating_details,
        };
      }),
    );

    return { response: formattedProductDetails || [] };
  }

  //SECTION: get user book details
  async bookDetails(
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const searchQuery: any = { $and: [{ productType: ProductType.BOOK }] };
    if (userType === UserType.STUDENT || userType === UserType.ENQUIRY) {
      searchQuery.$and.push({ studentId: new mongoose.Types.ObjectId(userId) });
    }
    if (userType === UserType.PARENT) {
      searchQuery.$and.push({
        studentId: new mongoose.Types.ObjectId(childId),
      });
    }
    //NOTE - get user product details
    const product_details: any = await this.userProductModel
      .find({ ...searchQuery })
      .populate([
        {
          path: 'bookId',
          select: 'bookName slugUrl',
          populate: [
            { path: 'languageDetails', select: 'languageId thumbnail' },
          ],
        },
        { path: 'languageId', select: 'language' },
      ])
      .select('bookId bookType languageId')
      .sort({ createdAt: -1 });

    //NOTE - filter book details based on language
    const formatedBook = await Promise.all(
      (product_details || []).map(async (item: any) => {
        let thumbnail: string;
        if (item.bookId && item.languageId) {
          const matchingLanguageDetail = item.bookId.languageDetails.find(
            (languageDetail: any) =>
              languageDetail.languageId.equals(item.languageId._id),
          );
          if (matchingLanguageDetail) {
            // item.bookId.languageDetails = matchingLanguageDetail;
            const thumbnailUrl = matchingLanguageDetail?.thumbnail;
            thumbnail =
              thumbnailUrl &&
              (await this.commonService.getSignedUrl(thumbnailUrl));
          }
        }
        //NOTE - get rating details
        const rating_details = await this.ratingModel.findOne({
          studentId: new mongoose.Types.ObjectId(userId),
          bookId: new mongoose.Types.ObjectId(item.bookId?._id),
        });

        return {
          _id: item.bookId?._id,
          title: item.bookId?.bookName,
          slugUrl: item.bookId?.slugUrl ?? null,
          thumbnail: thumbnail || null,
          bookType: item?.bookType,
          rating: !!rating_details,
          languageId: item?.languageId?._id ?? null,
          languageName: item?.languageId?.language ?? null,
        };
      }),
    );

    return { response: formatedBook };
  }

  //SECTION: get user test series  details
  async testSeriesDetails(
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const searchQuery: any = {
      productType: ProductType.TEST_SERIES,
    };

    if (userType === UserType.STUDENT || userType === UserType.ENQUIRY) {
      searchQuery.studentId = userId;
    }

    if (userType === UserType.PARENT) {
      searchQuery.studentId = childId;
    }

    try {
      const productDetails = await this.userProductModel
        .find({ ...searchQuery, status: true })
        .populate({ path: 'testId', select: 'title image slugUrl' })
        .select('testId')
        .sort({ createdAt: -1 });

      const formattedProductDetails = await Promise.all(
        productDetails.map(async (doc: any) => {
          let thumbnail: string | null = null;

          if (doc.testId?.image) {
            thumbnail = await this.commonService.getSignedUrl(doc.testId.image);
          }

          const rating = await this.ratingModel.exists({
            studentId: userId,
            testId: doc.testId?._id,
          });

          return {
            _id: doc.testId?._id,
            title: doc.testId?.title,
            slugUrl: doc.testId?.slugUrl ?? null,
            thumbnail,
            rating,
            testType: ProductType.TEST_SERIES,
          };
        }),
      );

      return { response: formattedProductDetails };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //SECTION: get user online course details by id
  async onlineCourseDetailsById(
    id: string,
    payload: GetLibraryDto,
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const { type, subjectId, chapterId, topicId, title } = payload;
    const param =
      userType === UserType.STUDENT || userType === UserType.ENQUIRY
        ? { _id: userId }
        : { _id: childId };
    //NOTE: get user details
    const studentDetails = await this.userModel.findOne(param);
    //NOTE -  if not throw error
    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //TODO - as so many slug url check is breaking with mongoose.Types.ObjectId.isValid method
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const searchQuery = { $or: [], $and: [] }; //TODO: Initialize the search query with $and
    //NOTE: Check if params is a valid MongoDB ObjectId
    if (objectIdPattern.test(id)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({
        onlineCourseId: new mongoose.Types.ObjectId(id),
      });
    } else {
      searchQuery.$or.push({
        onlineCourseId: (await this.onlineCourseModel.findOne({ slugUrl: id }))
          ._id,
      });
    }

    //NOTE: If user access have valid or not for course
    const product = await this.userProductModel.findOne({
      studentId: new mongoose.Types.ObjectId(param?._id),
      courseId: objectIdPattern.test(id)
        ? new mongoose.Types.ObjectId(id)
        : (
            await this.onlineCourseModel.findOne({ slugUrl: id })
          )._id,
    });

    if (product && product?.validUpto) {
      const currentDate = new Date();
      currentDate.setHours(23, 59, 59, 999);
      const isValidTillNow = currentDate <= product?.validUpto;
      if (!isValidTillNow) {
        await this.userProductModel.findByIdAndUpdate(product._id, {
          $set: { haveAccess: false },
        });
        return { response: [] };
      }
    }

    //NOTE: Add filter based on subjectId, chapterId, or topicId
    const addToSearchQuery = async (field, value) => {
      if (value !== undefined && value !== '') {
        searchQuery.$and.push({ [field]: new mongoose.Types.ObjectId(value) });
      }
    };
    addToSearchQuery('subjectId', subjectId);
    addToSearchQuery('chapterId', chapterId);
    addToSearchQuery('topicId', topicId);

    //NOTE - serach based on name
    if (title) {
      searchQuery.$and.push({ title: { $regex: title, $options: 'i' } });
    }

    //NOTE: Check if $and is empty, and if so, remove it from the searchQuery
    if (searchQuery.$and.length === 0) {
      delete searchQuery.$and;
    }

    //NOTE - get user online course details by id
    const library_details: any = await this.courseLibraryModel
      .find({ ...searchQuery, status: true })
      .populate([
        { path: 'subjectId', select: 'name' },
        { path: 'chapterId', select: 'name' },
      ]);

    //NOTE - get video and pdf data
    const processData = async (items: any[], contentType: string) => {
      const data = await Promise.all(
        items &&
          items?.map(async (item: any) => {
            const objects = await Promise.all(
              item[contentType].map(async (urlObj: any) => {
                let isSaved = false; //TODO: Initialize isSaved as false
                if (studentDetails) {
                  //TODO: Check if studentDetails is available
                  const savedProduct = await this.saveProductModel.findOne({
                    userId: new mongoose.Types.ObjectId(studentDetails._id),
                    productType:
                      contentType === LibraryTypes.PDFURL
                        ? SavedProductTypes.COURSE_PDF
                        : SavedProductTypes.COURSE_VIDEO,
                    pdfId:
                      contentType === LibraryTypes.PDFURL ? urlObj._id : null,
                    videoId:
                      contentType === LibraryTypes.VIDEOURL ? urlObj._id : null,
                  });

                  isSaved = !!savedProduct;
                }

                const title = item?.title ?? null;

                const url =
                  contentType === LibraryTypes.VIDEOURL &&
                  urlObj.videoType === VideoType.YOUTUBE
                    ? urlObj.url
                    : await this.commonService.getSignedUrl(urlObj.url);

                //NOTE - change image
                const thumbnail =
                  urlObj.thumbnail && urlObj.thumbnail.trim() !== ''
                    ? await this.commonService.getSignedUrl(urlObj.thumbnail)
                    : null;
                return {
                  _id: urlObj._id,
                  libraryId: item._id,
                  contentType,
                  title,
                  url,
                  thumbnail: thumbnail ?? null,
                  isSaved,
                  subject: item?.subjectId?.name,
                  chapter: item?.chapterId?.name,
                };
              }),
            );
            return objects;
          }),
      );

      return data.flat();
    };

    let filteredData: any;
    if (type === LibraryTypes.VIDEOURL) {
      filteredData = await processData(library_details, LibraryTypes.VIDEOURL);
    } else if (type === LibraryTypes.PDFURL) {
      filteredData = await processData(library_details, LibraryTypes.PDFURL);
    }

    return { response: filteredData };
  }

  //SECTION: get user online course content by id
  async onlineCourseContentById(
    id: string,
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any }> {
    // NOTE: Check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const param =
      userType === UserType.STUDENT || userType === UserType.ENQUIRY
        ? { _id: userId }
        : { _id: childId };

    const studentDetails = await this.userModel.findOne(param);

    //NOTE -  if not throw error
    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // NOTE: Find one document where pdfUrl or videoUrl array contains an object with _id matching the provided id
    const library_details: any[] = await this.courseLibraryModel
      .aggregate([
        {
          $match: {
            $or: [
              { 'pdfUrl._id': new mongoose.Types.ObjectId(id) },
              { 'videoUrl._id': new mongoose.Types.ObjectId(id) },
            ],
            status: true,
          },
        },
        {
          $project: {
            title: 1,
            pdfUrl: {
              $filter: {
                input: '$pdfUrl',
                as: 'pdf',
                cond: { $eq: ['$$pdf._id', new mongoose.Types.ObjectId(id)] },
              },
            },
            videoUrl: {
              $filter: {
                input: '$videoUrl',
                as: 'video',
                cond: { $eq: ['$$video._id', new mongoose.Types.ObjectId(id)] },
              },
            },
          },
        },
      ])
      .exec();

    let result: any = null;
    if (library_details.length > 0) {
      if (library_details[0].pdfUrl || library_details[0].videoUrl) {
        let isSaved = false; //TODO: Initialize isFavourite as false

        if (studentDetails) {
          const productType = library_details[0].pdfUrl
            ? SavedProductTypes.COURSE_PDF
            : SavedProductTypes.COURSE_VIDEO;

          //NOTE: product id based on the type
          const productId =
            library_details[0].pdfUrl.length > 0
              ? library_details[0].pdfUrl[0]?._id
              : library_details[0].videoUrl[0]?._id;

          //NOTE: savedProduct details
          const savedProduct = await this.saveProductModel.findOne({
            userId: new mongoose.Types.ObjectId(studentDetails._id),
            productType,
            [productType === SavedProductTypes.COURSE_PDF
              ? 'pdfId'
              : 'videoId']: productId,
          });

          isSaved = !!savedProduct;
        }

        const mediaUrl =
          (library_details[0]?.pdfUrl.length > 0 &&
            library_details[0]?.pdfUrl) ||
          (library_details[0]?.videoUrl.length > 0 &&
            library_details[0]?.videoUrl);

        if (library_details[0].pdfUrl.length > 0) {
          const signedUrl = await this.commonService.getSignedUrl(
            mediaUrl[0].url,
          );
          mediaUrl[0].url = signedUrl; //TODO: Modify URL only for PDFs
        } else if (library_details[0].videoUrl.length > 0) {
          if (library_details[0].videoUrl[0].videoType === VideoType.UPLOAD) {
            const signedUrl = await this.commonService.getSignedUrlWithNoExpiry(
              mediaUrl[0].url,
            );
            mediaUrl[0].url = signedUrl; //TODO: Modify URL only for Videos
          }
        }

        result = {
          ...mediaUrl[0],
          title: library_details[0].title,
          libraryId: library_details[0]._id,
          isSaved,
        };
      }
    }

    return { response: result };
  }

  //SECTION: get user test series  details by id
  async testSeriesDetailsById(
    id: string,
    studentId: string,
  ): Promise<{ response: any[] }> {
    const searchQuery = { $or: [] }; //TODO: Initialize the search query with $and

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(id) });
    } else {
      searchQuery.$or.push({ slugUrl: id });
    }

    //NOTE - get user product details
    const product_details: any = await this.testSeriesModel
      .findOne({ ...searchQuery, status: true })
      .populate([
        {
          path: 'assignedTest',
          select: 'testMasterId',
          populate: [
            {
              path: 'testMasterId',
              select:
                'title mode noOfQuestions duration isFree assignedQuestion slugUrl attemptMode offlineMode startAfter startBefore',
            },
          ],
        },
      ])
      .select('assignedTest')
      .sort({ createdAt: -1 });

    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    let isStudentImageExist = false;
    //NOTE: Extract imageUrl arrays from the populated documents
    const formattedProductDetails = await Promise.all(
      product_details.assignedTest.map(async (doc: any) => {
        //NOTE - check if test attempted by user or not
        const isAttempted = await this.testResultModel
          .findOne({
            testId: doc.testMasterId?._id,
            studentId: new mongoose.Types.ObjectId(studentId),
          })
          .select('testId');

        //NOTE - check if product is saved or not
        const isSaved = await this.saveProductModel.findOne({
          userId: new mongoose.Types.ObjectId(studentId),
          productType: SavedProductTypes.TEST,
          testId: new mongoose.Types.ObjectId(doc.testMasterId?._id),
        });

        // Check if student has an image
        const studentImage = await this.userModel
          .findById(studentId)
          .select('image');
        isStudentImageExist = !!studentImage?.image;
        return {
          _id: doc.testMasterId?._id,
          title: doc.testMasterId?.title,
          duration: doc.testMasterId?.duration,
          startAfter: doc.testMasterId?.startAfter,
          startBefore: doc.testMasterId?.startBefore,
          noOfQuestions: doc.testMasterId?.noOfQuestions,
          slugUrl: doc.testMasterId?.slugUrl || null,
          isFree: doc.testMasterId?.isFree,
          isAttempted: !!isAttempted,
          isSaved: !!isSaved,
          mode: doc.testMasterId?.mode ?? null,
          attemptMode: doc.testMasterId?.attemptMode,
          offlineMode: doc.testMasterId?.offlineMode ?? null,
          isStudentImageExist,
          currentTime: currentDate,
        };
      }),
    );

    return { response: formattedProductDetails };
  }

  //SECTION: get ebook pdf details by Id
  async bookDetailsById(
    id: string,
    payload: GetEbookLibraryDto,
  ): Promise<{ response: any[] }> {
    const { languageId } = payload;
    const searchQuery = { $or: [] }; //TODO: Initialize the search query with $and

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(id) });
    } else {
      searchQuery.$or.push({ slugUrl: id });
    }

    const book: any = await this.bookModal.aggregate([
      { $match: { ...searchQuery, status: true } },
      {
        $lookup: {
          from: 'languages',
          localField: 'languageDetails.languageId',
          foreignField: '_id',
          as: 'languageDetail',
        },
      },
      { $addFields: { languageId: { $toObjectId: languageId } } },
      {
        $project: {
          _id: 1,
          bookName: 1,
          slugUrl: 1,
          pdfDetails: {
            $map: {
              input: {
                $filter: {
                  input: '$languageDetails',
                  as: 'lang',
                  cond: { $eq: ['$$lang.languageId', '$languageId'] },
                },
              },
              as: 'item',
              in: {
                title: '$$item.actualbook.title',
                url: '$$item.actualbook.url',
                _id: '$$item.actualbook._id',
              },
            },
          },
        },
      },
    ]);

    //NOTE - push result
    const result = await Promise.all(
      book.map(async (item: any) => {
        return await Promise.all(
          item?.pdfDetails.map(async (ele: any) => {
            let signedUrl = null;
            if (ele?.url !== undefined) {
              signedUrl = await this.commonService.getSignedUrl(ele?.url);
            }
            return {
              _id: ele._id,
              title: ele?.title ?? null,
              url: signedUrl,
            };
          }),
        );
      }),
    );

    //TODO: Flatten the array of arrays into a single array
    const flattenedResult = result.flat();

    return { response: flattenedResult };
  }

  //SECTION : Get the list of live class for calender
  async getLiveClassForCalender(
    userId: string,
    payload: GetLiveClassForCalenderDto,
  ): Promise<{ response: any[] }> {
    const { date } = payload;
    const currentDate = new Date(date);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    //NOTE: Get the start of the month
    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    //NOTE: Move to the next month and subtract 1 day to get the end of the month
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setUTCHours(23, 59, 59, 999);

    // Get products based on search query
    const products: any = await this.userProductModel.find({
      studentId: new mongoose.Types.ObjectId(userId),
      batchId: { $ne: null },
      haveAccess: true,
    });

    // Iterate over products and update haveAccess and validUpto if necessary
    await Promise.all(
      products?.map(async (data: any) => {
        const payment = await this.offlinePaymentModel
          .findOne({
            parentOrderId: data.orderId,
            courseId: data.onlineCourseId,
          })
          .sort({ createdAt: -1 });

        if (
          payment &&
          payment.transactionStatus === TransactionStatus.INSTALLMENT &&
          payment?.nextPaymentDate
        ) {
          const todayDate =
            new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
          const nextPaymentDate =
            payment.nextPaymentDate.toISOString().split('T')[0] +
            'T00:00:00.000Z';

          if (nextPaymentDate < todayDate) {
            await this.userProductModel.updateOne(
              { _id: data._id },
              { $set: { haveAccess: false } },
            );
          }
        }

        const currentDate = new Date();
        currentDate.setUTCHours(23, 59, 59, 999);
        if (data.validUpto) {
          const validUptoDate = new Date(data.validUpto);
          if (validUptoDate < currentDate) {
            await this.userProductModel.updateOne(
              { _id: data._id },
              { $set: { haveAccess: false } },
            );
          }
        } else {
          const batchDetails = await this.batchModel.findById(data.batchId);

          if (batchDetails) {
            const validUptoDate = new Date(data.createdAt);
            validUptoDate.setDate(
              validUptoDate.getDate() + batchDetails.duration,
            );
            validUptoDate.setHours(23, 59, 59, 999);
            if (validUptoDate < currentDate) {
              await this.userProductModel.updateOne(
                { _id: data._id },
                { $set: { haveAccess: false } },
              );
            } else {
              await this.userProductModel.updateOne(
                { _id: data._id, validUpto: null },
                { $set: { validUpto: validUptoDate } },
              );
            }
          }
        }
      }),
    );

    //NOTE - get user library data
    const userCourseData = await this.userProductModel.find({
      studentId: new mongoose.Types.ObjectId(userId),
      $or: [
        { productType: ProductType.OFFLINE_COURSE },
        { productType: ProductType.ONLINE_COURSE },
      ],
      batchId: { $ne: null },
      haveAccess: true,
    });
    //NOTE - get course ids
    const userCourseIds = userCourseData.map((item) => item.onlineCourseId);
    // const batchIds = userCourseData.map((item) => item.batchId);

    //NOTE - get live class ids based the courseId
    const liveClassData = await this.liveClassModel
      .find({
        onlineCourseId: { $in: userCourseIds },
        startTime: { $gte: startOfMonth, $lte: endOfMonth },
        status: true,
      })
      .populate([
        { path: 'onlineCourseId' },
        { path: 'teacherId' },
        { path: 'topicId' },
        { path: 'subjectId' },
      ]);

    const todayDate = new Date();
    //NOTE: Assuming this code is inside an async function or an asynchronous context
    const response = await Promise.all(
      liveClassData.map(async (item: any) => {
        let backgroundColor = '';
        //NOTE - if zoom meeting
        if (item.liveClassType == LiveClassType.ZOOM_CLASS) {
          backgroundColor = '#0B5CFF';
          if (item.startTime < todayDate) {
            backgroundColor = '#808080';
          }
        }

        //NOTE - if live stream
        if (item.liveClassType == LiveClassType.LIVE_STREAM) {
          backgroundColor = '#003D32';
          if (item.startTime < todayDate) {
            backgroundColor = '#808080';
          }
        }

        return {
          id: item._id,
          backgroundColor: backgroundColor,
          start: item.startTime,
          end: item.endTime,
          title: item.title,
          courseName: item?.onlineCourseId?.title,
          subjectName: item?.subjectId?.name,
          topicName: item?.topicId?.name,
          teacherName: item?.teacherId?.name,
          liveClassType: item?.liveClassType,
          liveClassLink: item?.liveClassLink,
          meetingNumber: item?.meetingNumber,
          zoomKey:
            item?.liveClassType == LiveClassType.ZOOM_CLASS
              ? process.env.ZOOM_SDK_KEY
              : null,
          zoomSecret:
            item?.liveClassType == LiveClassType.ZOOM_CLASS
              ? process.env.ZOOM_SDK_SECRET
              : null,
          signature:
            item?.liveClassType == LiveClassType.ZOOM_CLASS &&
            item?.meetingNumber
              ? await this.zoomSignatureAdmin(item?.meetingNumber)
              : null,
          password: item?.password,
          status: await this.determineEventStatus(item),
          period: item?.period || null,
        };
      }),
    );

    return { response };
  }

  //SECTION: get user online course notes details by id
  async onlineCourseNotesById(
    id: string,
    payload: GetLibraryDto,
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    const { subjectId, chapterId, topicId, title } = payload;
    const param =
      userType === UserType.STUDENT || userType === UserType.ENQUIRY
        ? { _id: userId }
        : { _id: childId };
    const studentDetails = await this.userModel.findOne(param);
    //NOTE -  if not throw error
    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //TODO - as so many slug url check is breaking with mongoose.Types.ObjectId.isValid method
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const searchQuery = { $or: [], $and: [] }; //TODO: Initialize the search query with $and

    //NOTE: Check if params is a valid MongoDB ObjectId
    if (objectIdPattern.test(id)) {
      //NOTE: If params is a valid ObjectId, assume it's an ID and search by _id
      searchQuery.$or.push({
        onlineCourseId: new mongoose.Types.ObjectId(id),
      });
    } else {
      searchQuery.$or.push({
        onlineCourseId: (await this.onlineCourseModel.findOne({ slugUrl: id }))
          ._id,
      });
    }

    //NOTE: If user access have valid or not for course
    const product = await this.userProductModel.findOne({
      studentId: new mongoose.Types.ObjectId(param?._id),
      courseId: objectIdPattern.test(id)
        ? new mongoose.Types.ObjectId(id)
        : (
            await this.onlineCourseModel.findOne({ slugUrl: id })
          )._id,
    });

    if (product && product?.validUpto) {
      const currentDate = new Date();
      currentDate.setHours(23, 59, 59, 999);
      const isValidTillNow = currentDate <= product?.validUpto;
      if (!isValidTillNow) {
        await this.userProductModel.findByIdAndUpdate(product._id, {
          $set: { haveAccess: false },
        });
        return { response: [] };
      }
    }

    //NOTE: Add filter based on subjectId, chapterId, or topicId
    const addToSearchQuery = async (field, value) => {
      if (value !== undefined) {
        searchQuery.$and.push({ [field]: new mongoose.Types.ObjectId(value) });
      }
    };

    addToSearchQuery('subjectId', subjectId);
    addToSearchQuery('chapterId', chapterId);
    addToSearchQuery('topicId', topicId);

    //NOTE - serach based on name
    if (title) {
      searchQuery.$and.push({ title: { $regex: title, $options: 'i' } });
    }

    //NOTE: Check if $and is empty, and if so, remove it from the searchQuery
    if (searchQuery.$and.length === 0) {
      delete searchQuery.$and;
    }

    //NOTE - get user online course details by id
    const library_details: any[] = await this.courseLibraryModel
      .find({
        ...searchQuery,
        status: true,
        pdfUrl: { $exists: true, $ne: null, $not: { $eq: [] } },
      })
      .populate([
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
        { path: 'subjectId', select: 'name' },
        { path: 'chapterId', select: 'name' },
      ]);

    //NOTE - push final response
    const finalResponse = await Promise.all(
      library_details.map(async (ele) => {
        let isSaved = false; // Initialize isSaved as false
        if (studentDetails) {
          // Check if studentDetails is available
          const savedProduct = await this.saveProductModel.findOne({
            courseLibraryId: new mongoose.Types.ObjectId(ele._id),
            userId: new mongoose.Types.ObjectId(studentDetails._id),
            productType: SavedProductTypes.COURSE_PDF,
          });

          isSaved = !!savedProduct;
        }

        if (ele.pdfUrl) {
          for (const data of ele.pdfUrl) {
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
          _id: ele._id,
          libraryId: ele._id,
          contentType: LibraryTypes.PDFURL,
          title: ele.title,
          subject: ele?.subjectId?.name,
          chapter: ele?.chapterId?.name,
          url: ele?.pdfUrl,
          isSaved: isSaved,
        };
      }),
    );

    return { response: finalResponse };
  }

  //SECTION: get user online course test details by id
  async onlineCourseTestById(
    id: string,
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    //NOTE - user query for student
    const userQuery =
      userType === UserType.STUDENT || userType === UserType.ENQUIRY
        ? { _id: userId }
        : { _id: childId };
    const studentDetails = await this.userModel.findOne(userQuery);

    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    let searchQuery = {};
    if (mongoose.isValidObjectId(id)) {
      searchQuery = { onlineCourseId: new mongoose.Types.ObjectId(id) };
    } else {
      //NOTE - get online course details by slug url
      const onlineCourse = await this.onlineCourseModel.findOne({
        slugUrl: id,
      });
      searchQuery = { onlineCourseId: onlineCourse._id };
    }

    //NOTE - get all course Library for test
    const libraryDetails = await this.courseLibraryModel
      .find({ ...searchQuery, type: CourseLibraryType.TEST, status: true })
      .populate([
        {
          path: 'testMasterId',
          select:
            'title mode noOfQuestions duration slugUrl isFree offlineMode',
        },
      ]);

    //NOTE - push final response
    const data = await Promise.all(
      libraryDetails.flatMap((library) =>
        library.testMasterId.map(async (item) => {
          const savedProduct = await this.saveProductModel
            .findOne({ testId: item._id, userId: userQuery._id })
            .select('testId');

          const isAttempted = await this.testResultModel
            .findOne({
              testId: item._id,
              studentId: new mongoose.Types.ObjectId(userQuery._id),
            })
            .select('testId');

          return {
            _id: item._id,
            title: item.title,
            mode: item.mode || null,
            noOfQuestions: item.noOfQuestions,
            duration: item.duration,
            slugUrl: item?.slugUrl || null,
            isFree: item.isFree,
            isSaved: savedProduct !== null,
            isAttempted: !!isAttempted,
            offlineMode: item?.offlineMode ?? null,
          };
        }),
      ),
    );

    return { response: data };
  }

  //SECTION: get course's subjects and chapter
  async subjectDetailsByUserCourseId(
    payload: GetCourseSubjectsDto,
  ): Promise<{ response: any[] }> {
    const { batchId } = payload;
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const subjects = await this.lessonPlannerModel.aggregate([
      {
        $match: {
          batchId: batchId, //NOTE -  Match documents with the specified batchId
          status: true,
        },
      },
      {
        $addFields: {
          subject: { $toObjectId: '$subjectId' }, //NOTE - Convert subjectId to ObjectId
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjects',
        },
      },
      {
        $unwind: '$subjects', //NOTE -  Unwind the subjects array
      },
      {
        $group: {
          _id: {
            _id: '$subjects._id', // Group by subject _id
            name: '$subjects.name', // Group by subject name
          },
          chapterCount: { $sum: 1 }, // Count the chapters for each subject
          subject: {
            $push: '$subjects',
          },
        },
      },
      {
        $addFields: {
          subjectData: {
            $arrayElemAt: ['$subject', 0],
          },
        },
      },
      {
        $project: {
          _id: '$_id._id',
          name: '$_id.name',
          image: { $ifNull: ['$subjectData.image', null] },
          batchId: batchId,
          chapterCount: 1,
        },
      },
    ]);

    const subjectData = await Promise.all(
      subjects?.map(async (subject: any) => {
        if (subject?.image && subject.image.trim() !== '') {
          const imageUrl = await this.commonService.getSignedUrl(subject.image);
          subject.image = imageUrl;
        }
        return {
          ...subject,
        };
      }),
    );

    return { response: subjectData };
  }

  //SECTION: get subject's chapter by subjectID
  async chapterDetailsBySubjectId(
    payload: GetSubjectChapterDto,
  ): Promise<{ response: any[] }> {
    const { courseId, batchId, subjectId } = payload;

    if (
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    try {
      // Find all chapters for the given subjectId and batchId
      const chapters = await this.lessonPlannerModel
        .find({ subjectId, batchId, status: true })
        .populate({ path: 'chapterId', select: 'name' })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const chaptersWithDetails = await Promise.all(
        chapters.map(async (chapter: any) => {
          let pdfDataCount = 0;
          let videoDataCount = 0;

          // Find the corresponding course libraries for pdf and video data
          const pdfData = await this.courseLibraryModel.find({
            subjectId: new mongoose.Types.ObjectId(chapter?.subjectId),
            chapterId: new mongoose.Types.ObjectId(chapter?.chapterId?._id),
            onlineCourseId: new mongoose.Types.ObjectId(courseId),
            pdfUrl: { $ne: [] }, // Ensure pdfUrl is not empty
          });
          pdfData?.map((pdf) => {
            pdfDataCount += pdf?.pdfUrl?.length || 0;
          });
          const videoData = await this.courseLibraryModel.find({
            subjectId: new mongoose.Types.ObjectId(chapter.subjectId),
            chapterId: new mongoose.Types.ObjectId(chapter?.chapterId?._id),
            onlineCourseId: new mongoose.Types.ObjectId(courseId),
            videoUrl: { $ne: [] }, // Ensure videoUrl is not empty
          });
          videoData.map((video) => {
            videoDataCount += video?.videoUrl?.length || 0;
          });
          return {
            _id: chapter?.chapterId?._id,
            chapterName: chapter?.chapterId?.name,
            subjectId: chapter?.subjectId,
            courseId,
            notes: pdfDataCount || 0,
            videos: videoDataCount || 0,
          };
        }),
      );

      return { response: chaptersWithDetails };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //SECTION: get course's subjects chapter details by subject and courseId
  // async chapterDetailsBySubjectId(
  //   payload: GetSubjectChapterDto,
  // ): Promise<{ response: any[] }> {
  //   const { subjectId, courseId } = payload;

  //   if (
  //     !mongoose.Types.ObjectId.isValid(subjectId) ||
  //     !mongoose.Types.ObjectId.isValid(courseId)
  //   ) {
  //     throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
  //   }

  //   const subjects = await this.lessonPlannerModel.aggregate([
  //     {
  //       $match: {
  //         batchId: batchId, //NOTE -  Match documents with the specified batchId
  //       },
  //     },
  //     {
  //       $addFields: {
  //         subject: { $toObjectId: '$subjectId' }, //NOTE - Convert subjectId to ObjectId
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'subjects',
  //         localField: 'subject',
  //         foreignField: '_id',
  //         as: 'subjects',
  //       },
  //     },
  //     {
  //       $unwind: '$subjects', //NOTE -  Unwind the subjects array
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           _id: '$subjects._id', // Group by subject _id
  //           name: '$subjects.name', // Group by subject name
  //         },
  //         chapterCount: { $sum: 1 }, // Count the chapters for each subject
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: '$_id._id',
  //         name: '$_id.name',
  //         batchId: batchId,
  //         chapterCount: 1,
  //       },
  //     },
  //   ]);

  //   return { response: subjects };
  // }

  //SECTION: get user offline and online course test details
  async allTestBasedOnProductPurchase(
    userId: string,
    userType: string,
    childId: string,
  ): Promise<{ response: any[] }> {
    //NOTE - user query for student
    const userQuery =
      userType === UserType.STUDENT || userType === UserType.ENQUIRY
        ? { _id: userId }
        : { _id: childId };
    const studentDetails = await this.userModel.findOne(userQuery);

    if (!studentDetails)
      throw new HttpException(USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + 5,
      currentDate.getMinutes() + 30,
    );

    //NOTE - get all purchase online and offlie course details
    const courseDetails: any = await this.userProductModel.find({
      studentId: studentDetails._id,
      productType: {
        $in: [ProductType.ONLINE_COURSE, ProductType.OFFLINE_COURSE],
      },
      batchId: { $ne: null },
      haveAccess: true,
    });

    if (!courseDetails) {
      return { response: [] };
    }

    //NOTE - get all course data ased on the purchase course by user
    const libraryDetails = await this.courseLibraryModel
      .find({
        onlineCourseId: {
          $in: courseDetails.map((data: any) => data.onlineCourseId),
        },
        type: CourseLibraryType.TEST,
        status: true,
      })
      .populate(
        'testMasterId',
        'title mode noOfQuestions duration slugUrl isFree offlineMode attemptMode startAfter startBefore',
      );

    const data = await Promise.all(
      libraryDetails.flatMap((library) =>
        library.testMasterId.map(async (item) => {
          const savedProduct = await this.saveProductModel
            .findOne({ testId: item._id, userId: userQuery._id })
            .select('testId');

          const isAttempted = await this.testResultModel
            .findOne({
              testId: item._id,
              studentId: new mongoose.Types.ObjectId(userQuery._id),
            })
            .select('testId');

          return {
            _id: item._id,
            title: item.title,
            mode: item.mode ?? null,
            noOfQuestions: item.noOfQuestions,
            duration: item.duration,
            startAfter: item?.startAfter,
            startBefore: item?.startBefore,
            slugUrl: item?.slugUrl ?? null,
            isFree: item.isFree,
            isSaved: savedProduct !== null,
            isAttempted: !!isAttempted,
            offlineMode: item?.offlineMode ?? null,
            attemptMode: item?.attemptMode ?? null,
            isStudentImageExist: !!studentDetails?.image,
            testType: 'Test Master',
            currentTime: currentDate,
          };
        }),
      ),
    );

    return { response: data };
  }

  //ANCHOR - generate zoomSignature for zoom meeting
  private async zoomSignatureAdmin(meetingNumber: any): Promise<string> {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oPayload = {
      sdkKey: process.env.ZOOM_SDK_KEY,
      mn: meetingNumber,
      role: 1,
      iat: iat,
      exp: exp,
      tokenExp: iat + 60 * 60 * 2,
    };

    const signature = jwt.sign(oPayload, process.env.ZOOM_SDK_SECRET, {
      algorithm: 'HS256',
    });

    return signature;
  }

  //ANCHOR - calculate the status(ongoing , upcoming , completed) of live class
  private async determineEventStatus(ele: any): Promise<string> {
    const currenttime = new Date();
    const startTime = new Date(ele.startTime);
    const endTime = new Date(ele.endTime);

    if (startTime < currenttime && endTime > currenttime) {
      return LiveClassStatus.ONGOING;
    } else if (startTime > currenttime) {
      return LiveClassStatus.UPCOMING;
    } else {
      return LiveClassStatus.COMPLETED;
    }
  }
}
