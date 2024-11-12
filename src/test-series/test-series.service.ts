import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import { CreateTestSeriesDto } from './dto/create-test-series.dto';
import { TestSeries } from 'src/schema/test-series.schema';
import {
  ALREDY_EXIST_DATA_WITH_SAME_NAME,
  INVALID_ID,
  RECORD_NOT_FOUND,
  IMAGE_UPLOAD_ERROR,
  DUPLICATE_NAME,
  DUPLICATE_SLUG_URL,
  PRODUCT_DELETE_ERROR,
  FIELD_BLANK_ERROR,
  UPDATE_DATA,
} from 'src/utills/messages';
import { CommonService } from 'src/utills/commonService';
import { TEST_SERIES_THUMBNAIL } from 'src/utills/s3BucketFolder';
import { UpdateTestSeriesDto } from './dto/update-test-series.dto';
import { AssignTestMasterDto } from './dto/assign-test-master.dto';
import { ModeTypes } from 'src/utills/enum';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { AddTestSeriesSeoTagDto } from './dto/add-test-seo-tags.dto';
import { GetTestSeoTagDto } from './dto/get-test-tags.dto';

@Injectable()
export class TestSeriesService {
  constructor(
    @InjectModel(TestSeries.name) private testSeriesModal: Model<TestSeries>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - create test series
  async createTestSeries(
    payload: CreateTestSeriesDto,
    createdById: string,
  ): Promise<any> {
    const {
      mode,
      title,
      categoryId,
      courseIds,
      shortDescription,
      longDescription,
      overview,
      languageIds,
      priceId,
      slugUrl,
      noOfQuestionPaper,
      noOfQuestions,
      image,
      coins,
      productCode,
      topSeller,
    } = payload;

    // NOTE - check slugUrl is already exist or not with the same name
    const isUniqueUrl = await this.testSeriesModal.findOne({
      slugUrl: slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    //NOTE - query for match
    const query: any = {
      $and: [
        {
          $or: [
            { title: { $regex: new RegExp(`^${title}$`, 'i') } }, //TODO: Match exact name
            { title: { $regex: new RegExp(`^.*${title}\\d.*$`, 'i') } }, //TODO: Match name with numbers
          ],
        },
        { categoryId }, //TODO: Add categoryId condition
        { courseIds }, //TODO: Add courseIds condition
      ],
    };

    //NOTE - Check the course with same name is exist or not
    const existingTestSeries = await this.testSeriesModal.findOne(query);

    if (existingTestSeries)
      throw new HttpException(
        ALREDY_EXIST_DATA_WITH_SAME_NAME,
        HttpStatus.BAD_REQUEST,
      );
    //NOTE: payload for create category
    let params: {
      mode: ModeTypes;
      categoryId: string;
      courseIds: string[];
      title: string;
      slugUrl: string;
      shortDescription: string;
      longDescription: string;
      overview: string[];
      languageIds: string[];
      priceId: string;
      noOfQuestions: number;
      noOfQuestionPaper: number;
      image?: string;
      createdBy: string;
      coins?: number;
      productCode?: number;
      topSeller?: boolean;
    } = {
      mode,
      categoryId,
      courseIds,
      title: title.replace(/\s+/g, ' ').trim(),
      slugUrl,
      shortDescription,
      longDescription,
      overview,
      languageIds,
      priceId,
      noOfQuestions,
      noOfQuestionPaper,
      createdBy: createdById,
    };

    if (topSeller) params = { ...params, topSeller };

    //NOTE - if coins then update it
    if (coins) params = { ...params, coins };

    //NOTE - if productCode then update it
    if (productCode) params = { ...params, productCode };

    if (image && image.includes('base64')) {
      const uploadImage = await this.commonService.uploadFileInS3Bucket(
        image,
        TEST_SERIES_THUMBNAIL,
      );
      if (uploadImage !== false) {
        params = { ...params, image: uploadImage.Key };
      } else {
        throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
      }
    }

    //NOTE - if same live class is not exist create it
    await this.testSeriesModal.create(params);
  }

  //SECTION - get all test series
  async getAllTestSeries(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - serach based on test series title
    const searchParams = search
      ? {
          $or: [
            { title: { $regex: new RegExp(`^${search}$`, 'i') } }, //TODO: Match exact title
            { title: { $regex: new RegExp(`^.*${search}\\d.*$`, 'i') } }, //TODO: Match title with numbers
          ],
        }
      : {};

    //NOTE - get test series count
    const count = await this.testSeriesModal.countDocuments({
      ...searchParams,
    });

    //NOTE - find all subject data
    const all_test_series_Details: any = await this.testSeriesModal
      .find({ ...searchParams })
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'languageIds', select: 'language' },
        { path: 'priceId', select: 'totalPrice' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-categoryId')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      all_test_series_Details.map(async (item) => {
        //NOTE: get all course name in array
        const courseNames = item.courseIds.map((ele) => {
          return ele.name;
        });
        //NOTE: get all language name in array
        const languageNames = item.languageIds.map((ele) => {
          return ele.language;
        });
        //NOTE: Process the imageUrl
        const updatedImageUrl = await this.commonService.getSignedUrl(
          item.image,
        );

        return {
          _id: item._id,
          title: item.title,
          slugUrl: item.slugUrl || null,
          mode: item.mode || null,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
          overview: item.overview,
          noOfQuestions: item.noOfQuestions,
          noOfQuestionPaper: item.noOfQuestionPaper,
          image: updatedImageUrl,
          categoryId: item.categoryId?._id,
          categoryName: item.categoryId?.name,
          courseNames: courseNames,
          languageNames: languageNames,
          totalPrice: item.priceId?.totalPrice,
          topSeller: item?.topSeller || false,
          status: item.status,
          isAssignTest: item.isAssignTest,
          coins: item.coins || 0,
          createdByName: item.createdBy === null ? null : item.createdBy.name,
          updatedByName: item.updatedBy === null ? null : item.updatedBy.name,
        };
      }),
    );

    return { data, count };
  }

  // SECTION - get test series by id details
  async getTestSeriesById(id: string): Promise<any> {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get test series details
    const test_series: any = await this.testSeriesModal
      .findById(id)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        { path: 'languageIds', select: 'language' },
        { path: 'priceId', select: 'name totalPrice' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .select('-categoryId')
      .lean();

    if (!test_series)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    //NOTE: Access the name
    const createdByName =
      test_series.createdBy === null ? null : test_series.createdBy.name;
    const updatedByName =
      test_series.updatedBy === null ? null : test_series.updatedBy.name;

    //NOTE : Exclude createdBy, updatedBy field from the test series object
    delete test_series.updatedBy;
    delete test_series.createdBy;

    //NOTE: Process the imageUrl
    const updatedImageUrl = await this.commonService.getSignedUrl(
      test_series.image,
    );

    //NOTE: Access the coins property with a default of 0 if it's missing or null
    const coins = test_series.coins ?? 0;

    const response = {
      ...test_series,
      image: updatedImageUrl,
      coins,
      createdByName,
      updatedByName,
    };

    return response;
  }

  //SECTION - update test series details
  async updateTestSeries(
    id: string,
    payload: UpdateTestSeriesDto,
    updateById: string,
  ): Promise<any> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const {
      mode,
      categoryId,
      courseIds,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      overview,
      languageIds,
      priceId,
      noOfQuestions,
      noOfQuestionPaper,
      image,
      coins,
      productCode,
      topSeller,
    } = payload;

    //NOTE - check if any test series exist with the id or not
    const existData: any = await this.testSeriesModal.findById(id);

    //NOTE -  if not throw error
    if (!existData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (title) {
      const query: any = {
        _id: { $ne: id },
        $and: [
          {
            $or: [
              { title: { $regex: new RegExp(`^${title}$`, 'i') } }, //TODO: Match exact name
              { title: { $regex: new RegExp(`^.*${title}\\d.*$`, 'i') } }, //TODO: Match name with numbers
            ],
          },
          { categoryId }, //TODO: Add categoryId condition
          { courseIds }, //TODO: Add courseIds condition
        ],
      };

      // NOTE - check if any other test series exists with the same title
      const duplicateTestSeries = await this.testSeriesModal.findOne(query);

      if (duplicateTestSeries?.title === title) {
        throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
      }
    }
    if (slugUrl) {
      // NOTE - check slugUrl is already exist or not with the same name
      const isUniqueUrl = await this.testSeriesModal.findOne({
        _id: { $ne: id },
        slugUrl: slugUrl,
      });

      if (isUniqueUrl)
        throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);
    }

    //NOTE: payload for create category
    let params: {
      mode: ModeTypes;
      categoryId: string;
      courseIds: string[];
      title: string;
      slugUrl: string;
      shortDescription: string;
      longDescription: string;
      overview: string[];
      languageIds: string[];
      priceId: string;
      noOfQuestions: number;
      noOfQuestionPaper: number;
      image?: string;
      updatedBy: string;
      coins?: number;
      productCode?: number;
      topSeller?: boolean;
    } = {
      mode,
      categoryId,
      courseIds,
      title,
      slugUrl,
      shortDescription,
      longDescription,
      overview,
      languageIds,
      priceId,
      noOfQuestions,
      noOfQuestionPaper,
      updatedBy: updateById,
    };

    if (topSeller) params = { ...params, topSeller };

    //NOTE - if coins then update it
    if (coins) params = { ...params, coins };

    //NOTE - if productCode then update it
    if (productCode) params = { ...params, productCode };

    //NOTE - image url need to covert
    if (image && image.includes('base64')) {
      const uploadImage = await this.commonService.uploadFileInS3Bucket(
        image,
        TEST_SERIES_THUMBNAIL,
      );

      if (uploadImage !== false) {
        params = { ...params, image: uploadImage.Key };
      } else {
        throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
      }
    }

    // NOTE - fianl return
    return await this.testSeriesModal.findOneAndUpdate({ _id: id }, params, {
      new: true,
      runValidators: true,
      upsert: true,
    });
  }

  //SECTION - delete test series details
  async deleteTestSeries(id: string): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this test series or not
    const check_test_series = await this.userProductDetailsModel.findOne({
      testId: new mongoose.Types.ObjectId(id),
    });

    if (check_test_series)
      throw new HttpException(PRODUCT_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.testSeriesModal.findByIdAndDelete(id);

    return id;
  }

  //SECTION - map Test Master In Test Series
  async mapTestMasterInTestSeries(
    payload: AssignTestMasterDto,
    userId: string,
  ): Promise<any> {
    const { testId, testMaster } = payload;

    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check test series details
    const test_series = await this.testSeriesModal.findById(testId);

    if (!test_series)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - update test series
    await this.testSeriesModal.findByIdAndUpdate(testId, {
      $set: {
        assignedTest: testMaster,
        updatedBy: userId,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION - get all test series
  async assignedTestById(id: string): Promise<any> {
    //NOTE - find all subject data
    const test_series: any = await this.testSeriesModal
      .findById(id)
      .populate([
        {
          path: 'assignedTest',
          select: 'testMasterId',
          populate: [{ path: 'testMasterId', select: 'title' }],
        },
      ])
      .select('-testMasterId')
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      (test_series?.assignedTest || []).map(async (item: any) => {
        const _id = item?.testMasterId?._id;
        const title = item?.testMasterId?.title;

        // Filter out items where both _id and title are undefined
        if (_id !== undefined || title !== undefined) {
          return {
            _id,
            title,
          };
        }
      }),
    ).then((filteredData) => filteredData.filter(Boolean)); // Remove undefined entries

    return data;
  }

  //SECTION -Add Seo Tags in course
  async setTestSeriesSeoTags(
    payload: AddTestSeriesSeoTagDto,
    updateById: string,
  ): Promise<any> {
    const { testId, metaTitle, metaDescription } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    if (!metaTitle || !metaDescription)
      throw new HttpException(FIELD_BLANK_ERROR, HttpStatus.BAD_REQUEST);

    // NOTE - check slugUrl is already exist or not with the same name
    const checkCourse = await this.testSeriesModal.findById(testId);

    if (!checkCourse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.CONFLICT);

    await this.testSeriesModal.findByIdAndUpdate(testId, {
      $set: {
        metaTitle,
        metaDescription,
        updatedBy: updateById,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION - get Seo Tags for test
  async getTestTagDetails(payload: GetTestSeoTagDto): Promise<{ data: any }> {
    const { testId } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(testId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const checkDetails = await this.testSeriesModal.findById(testId);

    if (!checkDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const response = {
      metaTitle: checkDetails?.metaTitle,
      metaDescription: checkDetails?.metaDescription,
    };

    return { data: response };
  }
}
