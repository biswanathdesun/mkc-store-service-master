import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CourseLibrary } from 'src/schema/online-course-library.schema';
import mongoose, { Model, Types } from 'mongoose';
import { CreateCourseLibraryDto } from './dto/create-online-library.dto';
import { ParsedQs } from 'qs';
import { Staff } from 'src/schema/staff.schema';
import { CommonService } from 'src/utills/commonService';
import {
  CREATE_DATA,
  DELETE_DATA,
  DELETE_LIBRARY_ERROR,
  IMAGE_UPLOAD_ERROR,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { UpdateCourseLibraryDto } from './dto/update-online-library.dto';
import {
  VideoType,
  VideoQualities,
  ConverterStatus,
  CourseLibraryType,
  ModeTypes,
} from 'src/utills/enum';
import axios from 'axios';
import { UpdateConvertStatusDto } from './dto/update-convert-status.dto';
import { COURSE_LIBRARY_THUMBNAIL } from 'src/utills/s3BucketFolder';
import { RetryConversionDto } from './dto/retry-conversion.dto';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { GetCourseLibraryInterface } from './interface/library.interfaces';

@Injectable()
export class CourseLibraryService {
  constructor(
    @InjectModel(CourseLibrary.name)
    private courseLibraryModel: Model<CourseLibrary>,
    @InjectModel(Staff.name) private staffModal: Model<Staff>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModal: Model<UserProductDetails>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - create online Course Library
  async createLibrary(
    payload: CreateCourseLibraryDto,
    createdById: string,
  ): Promise<string> {
    const {
      title,
      onlineCourseId,
      subjectId,
      chapterId,
      topicId,
      type,
      pdfUrl,
      videoUrl,
      testMasterId,
      courseType,
      status,
    } = payload;

    //NOTE - convert video
    const convertedVideo = await Promise.all(
      videoUrl.map(async (data) => {
        const { videoType, url, thumbnail } = data;

        //NOTE - convert thumbnail file
        if (thumbnail && thumbnail.includes('base64')) {
          const uploadImage = await this.commonService.uploadFileInS3Bucket(
            thumbnail,
            COURSE_LIBRARY_THUMBNAIL,
          );

          if (uploadImage === false) {
            throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
          }

          data.thumbnail = uploadImage.Key;
        }

        if (videoType === VideoType.UPLOAD) {
          const payload = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.HLS_URL,
            headers: {
              'Content-Type': 'application/json',
            },
            data: JSON.stringify({ url: url }),
          };

          const response = await axios.request(payload);
          data.url = response?.data?.data;
        }

        return data;
      }),
    );

    //NOTE - convert PDF url
    if (pdfUrl && pdfUrl.length > 0) {
      for (const data of pdfUrl) {
        const { thumbnail } = data;
        //NOTE - convert thumbnail file
        if (thumbnail && thumbnail.includes('base64')) {
          const uploadImage = await this.commonService.uploadFileInS3Bucket(
            thumbnail,
            COURSE_LIBRARY_THUMBNAIL,
          );

          if (uploadImage === false) {
            throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
          }

          data.thumbnail = uploadImage.Key;
        }
      }
    }

    //NOTE - create new Library
    await this.courseLibraryModel.create({
      title,
      onlineCourseId,
      subjectId,
      chapterId,
      topicId,
      type,
      pdfUrl,
      videoUrl: convertedVideo,
      testMasterId,
      courseType,
      status,
      createdBy: createdById,
    });

    return CREATE_DATA;
  }

  //SECTION - get all online Course Library
  async getAllCourseLibraries(
    query: ParsedQs,
  ): Promise<{ data: GetCourseLibraryInterface[]; count: number }> {
    //NOTE - add pagination
    const {
      page,
      limit,
      search,
      course,
      subject,
      fromDate,
      toDate,
      chapter,
      type,
    } = query as {
      page: string;
      limit: string;
      search: string;
      course: string;
      subject: string;
      chapter: string;
      fromDate: string;
      toDate: string;
      type: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // NOTE - filter based on title , subject Id and multiple online course Id
    const dateFilter =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate),
              $lte: new Date(new Date(toDate).setUTCHours(23, 59, 59, 999)),
            },
          }
        : {};
    const titleQuery = search
      ? {
          title: {
            $regex: new RegExp(
              search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
              'i',
            ),
          },
        }
      : {};
    const subjectQuery = subject
      ? { subjectId: new mongoose.Types.ObjectId(subject) }
      : {};
    const courseQuery = course
      ? course.includes(',')
        ? {
            onlineCourseId: {
              $in: course
                .split(',')
                .map((item) =>
                  mongoose.isValidObjectId(item.trim())
                    ? new mongoose.Types.ObjectId(item.trim())
                    : null,
                )
                .filter(Boolean), // Remove null values
            },
          }
        : {
            onlineCourseId: mongoose.isValidObjectId(course)
              ? new mongoose.Types.ObjectId(course)
              : null,
          }
      : {};

    const chapterQuery = chapter
      ? { chapterId: new mongoose.Types.ObjectId(chapter) }
      : {};

    const typeQuery = type ? { type: type } : {};

    //NOTE - get category count
    const count = await this.courseLibraryModel.countDocuments({
      ...titleQuery,
      ...subjectQuery,
      ...courseQuery,
      ...dateFilter,
      ...chapterQuery,
      ...typeQuery,
    });

    const library_data: any = await this.courseLibraryModel
      .find({
        ...titleQuery,
        ...subjectQuery,
        ...courseQuery,
        ...dateFilter,
        ...chapterQuery,
        ...typeQuery,
      })
      .populate([
        { path: 'onlineCourseId', select: 'title' },
        { path: 'subjectId', select: 'name' },
        { path: 'chapterId', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-onlineCourseId -subjectId -chapterId -topicId');

    //NOTE - push final data
    const data = await Promise.all(
      library_data.map(async (item: any) => {
        const createdBy = item.createdBy
          ? await this.getStaffName(item.createdBy)
          : null;

        const updatedBy = item.updatedBy
          ? await this.getStaffName(item.updatedBy)
          : null;

        return {
          _id: item._id,
          title: item?.title || null,
          onlineCourse:
            item?.onlineCourseId && Array.isArray(item?.onlineCourseId)
              ? item?.onlineCourseId.map(
                  (course: { title: any }) => course.title,
                )
              : item.onlineCourseId?.title ?? null,
          subject:
            item.subjectId && item.subjectId?.name
              ? item.subjectId?.name
              : null,
          chapter:
            item.chapterId && item.chapterId?.name
              ? item.chapterId?.name
              : null,
          attachmentType: item?.type,
          rowId: item?.videoUrl[0]?._id,
          subType: item?.videoUrl[0]?.videoType ?? '',
          videoUrl:
            item?.videoUrl[0]?.videoType == VideoType.YOUTUBE
              ? item?.videoUrl[0]?.url
              : item?.videoUrl[0]?.videoType == VideoType.UPLOAD
              ? await this.commonService.getSignedUrlWithNoExpiry(
                  item?.videoUrl[0]?.url,
                )
              : null,
          status360p: item?.videoUrl[0]?.status360p,
          status720p: item?.videoUrl[0]?.status720p,
          status1080p: item?.videoUrl[0]?.status1080p,
          courseType: item?.courseType || null,
          libraryDataType: item?.libraryDataType || null,
          thumbnail:
            item?.type === CourseLibraryType.VIDEO
              ? item?.videoUrl[0]?.thumbnail
                ? await this.commonService.getSignedUrl(
                    item?.videoUrl[0]?.thumbnail,
                  )
                : null
              : item?.type === CourseLibraryType.NOTES &&
                item?.pdfUrl[0]?.thumbnail
              ? await this.commonService.getSignedUrl(
                  item?.pdfUrl[0]?.thumbnail,
                )
              : null,
          createdBy,
          updatedBy,
          createdAt: item?.createdAt,
          status: item.status,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get online Course Library by id
  async getCourseLibraryById(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get  online Course Library details
    const course_library: any = await this.courseLibraryModel
      .findById(id)
      .populate([
        { path: 'onlineCourseId', select: 'title' },
        { path: 'subjectId', select: 'name' },
        { path: 'chapterId', select: 'name' },
        { path: 'topicId', select: 'name' },
        { path: 'testMasterId', select: 'title' },
        {
          path: 'pdfUrl',
          select: 'languageId',
          populate: [{ path: 'languageId', select: 'language' }],
          options: { lean: true },
        },
      ])
      .select('-onlineCourseId')
      .lean();

    if (!course_library)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - delete keys from online_courses object
    const { pdfUrl, videoUrl } = course_library;

    //NOTE - push final data
    const data = {
      _id: course_library?._id,
      title: course_library?.title,
      onlineCourseId: course_library?.onlineCourseId,
      subjectId: course_library?.subjectId,
      chapterId: course_library?.chapterId,
      topicId: course_library?.topicId,
      testMasterId: course_library?.testMasterId,
      type: course_library.type,
      courseType: course_library.courseType,
      status: course_library?.status,
      pdfUrl: await Promise.all(
        pdfUrl.map(async (urlObj: any) => {
          let signedThumbnail = null;
          if (urlObj.thumbnail) {
            signedThumbnail = await this.commonService.getSignedUrl(
              urlObj.thumbnail,
            );
          }

          let signedUrl = null;
          if (urlObj.url && urlObj.url.trim() !== '') {
            signedUrl = await this.commonService.getSignedUrl(urlObj.url);
          }

          return {
            _id: urlObj._id,
            languageId: urlObj?.languageId._id || null,
            language: urlObj?.languageId.language || null,
            title: urlObj.title,
            url: signedUrl,
            thumbnail: signedThumbnail,
          };
        }),
      ),

      videoUrl: await Promise.all(
        videoUrl.map(async (urlObj: any) => {
          let signedThumbnail = null;
          if (urlObj.thumbnail) {
            signedThumbnail = await this.commonService.getSignedUrl(
              urlObj.thumbnail,
            );
          }

          let signedUrl = urlObj.url;
          if (
            urlObj.videoType === VideoType.UPLOAD &&
            urlObj.url &&
            urlObj.url.trim() !== ''
          ) {
            signedUrl = await this.commonService.getSignedUrl(urlObj.url);
          }

          return {
            _id: urlObj._id,
            title: urlObj.title,
            videoType: urlObj.videoType,
            url: signedUrl,
            thumbnail: signedThumbnail,
          };
        }),
      ),
    };

    return data;
  }

  //SECTION - update online Course Library
  async updateCourseLibrary(
    id: string,
    payload: UpdateCourseLibraryDto,
    updateById: string,
  ): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const {
      title,
      onlineCourseId,
      subjectId,
      chapterId,
      topicId,
      type,
      pdfUrl,
      videoUrl,
      testMasterId,
      courseType,
      status,
    } = payload;

    //NOTE - check if any data exist with the id or not
    const existData: any = await this.courseLibraryModel.findById(id);

    //NOTE -  if not throw error
    if (!existData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    let param: {
      title: string;
      onlineCourseId: string[];
      subjectId: string;
      chapterId: string;
      topicId: string[];
      type: CourseLibraryType;
      pdfUrl?: any[];
      videoUrl?: any[];
      testMasterId?: string[];
      status: boolean;
      updatedBy: string;
      courseType: ModeTypes;
    } = {
      title,
      onlineCourseId,
      subjectId,
      chapterId,
      topicId,
      type,
      status,
      courseType,
      updatedBy: updateById,
    };

    if (type === CourseLibraryType.TEST && testMasterId) {
      param = { ...param, testMasterId };
    } else {
      param = { ...param, testMasterId: [] };
    }

    //NOTE - update video Item
    let updateVideo: any[];
    if (videoUrl && videoUrl.length > 0) {
      updateVideo = await Promise.all(
        videoUrl.map(async (item: any) => {
          const existVideo = (existData.videoUrl as any[]).find(
            (existItem: any) => existItem._id.equals(item._id),
          );

          const hasExistUrl = item.url && item.url.includes('amazonaws');

          const hasExistThumbnail =
            item.thumbnail && item.thumbnail.includes('amazonaws');

          if (existVideo && hasExistUrl && hasExistThumbnail) {
            return existVideo;
          }

          const m3u8Links =
            item.videoType === VideoType.UPLOAD
              ? await this.commonService.convertToM3U8(item.url)
              : item.url;

          let thumbnailUrl: string;
          if (item.thumbnail && item.thumbnail.includes('base64')) {
            const uploadImage = await this.commonService.uploadFileInS3Bucket(
              item.thumbnail,
              COURSE_LIBRARY_THUMBNAIL,
            );
            if (uploadImage !== false) {
              thumbnailUrl = uploadImage.Key;
            } else {
              throw new HttpException(
                IMAGE_UPLOAD_ERROR,
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            thumbnailUrl = existVideo?.thumbnail;
          }

          return {
            title: item.title,
            videoType: item.videoType,
            url: m3u8Links,
            thumbnail: thumbnailUrl,
          };
        }),
      );
    }

    //NOTE - update pdf Item
    let updatePdf: any[];
    if (pdfUrl && pdfUrl.length > 0) {
      updatePdf = await Promise.all(
        pdfUrl.map(async (item: any) => {
          const existPdf = (existData.pdfUrl as any[]).find((existItem) =>
            existItem._id.equals(item._id),
          );
          const hasExistValue = item.url && item.url.includes('amazonaws');
          const hasExistImage =
            item.thumbnail && item.thumbnail.includes('amazonaws');

          if (existPdf && hasExistValue && hasExistImage) {
            return existPdf;
          }

          let thumbnailUrl;
          if (item.thumbnail && item.thumbnail.includes('base64')) {
            const uploadImage = await this.commonService.uploadFileInS3Bucket(
              item.thumbnail,
              COURSE_LIBRARY_THUMBNAIL,
            );
            if (uploadImage !== false) {
              thumbnailUrl = uploadImage.Key;
            } else {
              throw new HttpException(
                IMAGE_UPLOAD_ERROR,
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            thumbnailUrl = existPdf.thumbnail;
          }

          return {
            title: item.title,
            url: item.url,
            thumbnail: thumbnailUrl,
            languageId: item.languageId,
          };
        }),
      );
    }

    param = {
      ...param,
      pdfUrl: type !== CourseLibraryType.NOTES ? [] : updatePdf,
      videoUrl: type !== CourseLibraryType.VIDEO ? [] : updateVideo,
    };

    //NOTE - fianl return
    await this.courseLibraryModel.findOneAndUpdate({ _id: id }, param, {
      new: true,
      runValidators: true,
      upsert: true,
    });

    return UPDATE_DATA;
  }

  //SECTION - delete  Course Library details by id
  async deleteCourseLibrary(id: string): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get course Id
    const library = await this.courseLibraryModel.findById(id);

    if (!library)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE -Check if any user has purchased the product associated with this library
    const product = await this.userProductDetailsModal.findOne({
      onlineCourseId: library.onlineCourseId,
    });

    if (!product) {
      await this.courseLibraryModel.findByIdAndDelete(id);
      return DELETE_DATA;
    } else {
      return DELETE_LIBRARY_ERROR;
    }
  }

  //NOTE - get staff details for createdby and updatedby
  async getStaffName(id: Types.ObjectId): Promise<string> {
    const user = await this.staffModal.findById(id);
    return user?.name;
  }

  // NOTE - update the status of video's qualities after conversion
  async updateConvertedStatus(payload: UpdateConvertStatusDto): Promise<any> {
    const { filename, quality, status } = payload;

    // NOTE - update the data by matching quality and filename
    if (quality == VideoQualities.LOW_DEFINITION) {
      return await this.courseLibraryModel.findOneAndUpdate(
        { 'videoUrl.url': { $regex: filename, $options: 'i' } },
        { 'videoUrl.$.status360p': status },
      );
    }

    if (quality == VideoQualities.HIGH_DEFINITION) {
      return await this.courseLibraryModel.findOneAndUpdate(
        { 'videoUrl.url': { $regex: filename, $options: 'i' } },
        { 'videoUrl.$.status720p': status },
      );
    }

    if (quality == VideoQualities.FULL_HIGH_DEFINITION) {
      return await this.courseLibraryModel.findOneAndUpdate(
        { 'videoUrl.url': { $regex: filename, $options: 'i' } },
        { 'videoUrl.$.status1080p': status },
      );
    }
  }

  //NOTE - Retry file conversion if errored
  async retryConversion(
    id: string,
    rowId: string,
    payload: RetryConversionDto,
  ): Promise<any> {
    const { quality } = payload;

    const courseData = await this.courseLibraryModel.aggregate([
      {
        $unwind: {
          path: '$videoUrl',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          'videoUrl._id': new mongoose.Types.ObjectId(rowId),
        },
      },
      {
        $replaceRoot: {
          newRoot: '$videoUrl',
        },
      },
    ]);

    const params = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.RETRY_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ url: courseData[0]?.url, quality: quality }),
    };

    await axios.request(params).then(async (data) => {
      if (data.status == 200) {
        // NOTE: Updating data based on id and video qualities
        if (quality == VideoQualities.LOW_DEFINITION) {
          await this.courseLibraryModel.findOneAndUpdate(
            { 'videoUrl._id': new mongoose.Types.ObjectId(rowId) },
            { 'videoUrl.$.status360p': ConverterStatus.ONGOING },
          );
        }
        if (quality == VideoQualities.HIGH_DEFINITION) {
          await this.courseLibraryModel.findOneAndUpdate(
            { 'videoUrl._id': new mongoose.Types.ObjectId(rowId) },
            { 'videoUrl.$.status720p': ConverterStatus.ONGOING },
          );
        }
        if (quality == VideoQualities.FULL_HIGH_DEFINITION) {
          await this.courseLibraryModel.findOneAndUpdate(
            { 'videoUrl._id': new mongoose.Types.ObjectId(rowId) },
            { 'videoUrl.$.status1080p': ConverterStatus.ONGOING },
          );
        }
      }
    });
  }
}
