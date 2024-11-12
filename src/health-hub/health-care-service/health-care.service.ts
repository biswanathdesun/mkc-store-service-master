import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import {
  CREATE_DATA,
  DELETE_DATA,
  DUPLICATE_NAME,
  DUPLICATE_SLUG_URL,
  SERVICE_DELETE_ERROR,
  IMAGE_UPLOAD_ERROR,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
  USED_SERVICE_DELETE,
} from 'src/utills/messages';
import { CommonService } from 'src/utills/commonService';
import { Health_HUB } from 'src/utills/s3BucketFolder';
import { CreateHealthCareDto } from './dto/create-health-care.dto';
import { UpdateHealthCareDto } from './dto/update-health-care.dto';
import { CareService } from 'src/schema/care-service.schema';
import {
  GetAllHealthCare,
  GetHealthCareById,
  GetServiceForUser,
  HealthCareForWebAndMobile,
} from './interface/health-care.interface';
import { Order } from 'src/schema/order.schema';
import { CarePackage } from 'src/schema/care-package.schema';
import { GetServiceBasedOnUserDto } from './dto/get-service-for-payment.dto';
import {
  PaymentModuleType,
  PaymentStatus,
  TransactionStatus,
} from 'src/utills/enum';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';

@Injectable()
export class HealthCareService {
  constructor(
    @InjectModel(CareService.name)
    private healthCareModel: Model<CareService>,
    @InjectModel(CarePackage.name)
    private carePackageModel: Model<CarePackage>,
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    private commonService: CommonService,
  ) {}

  //SECTION - to get all health care in admin
  async getAllHealthCares(
    query: ParsedQs,
  ): Promise<{ data: GetAllHealthCare[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const searchQuery = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }] }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await this.healthCareModel.countDocuments({ ...searchQuery });

    const healthCare: any[] = await this.healthCareModel
      .find({ ...searchQuery })
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const resData = await Promise.all(
      healthCare.map(async (ele: any) => {
        if (ele.image) {
          const signedUrl = await this.commonService.getSignedUrl(ele.image);
          ele.image = signedUrl;
        }
        return {
          _id: ele._id,
          name: ele.name,
          description: ele.description,
          slugUrl: ele?.slugUrl || null,
          image: ele.image,
          isPreeBook: ele.isPreeBook,
          status: ele?.status,
          createdBy: ele.createdBy?.name || null,
          updatedBy: ele.updatedBy?.name || null,
        };
      }),
    );

    return { data: resData, count };
  }

  //SECTION - to get all health care for web and mobile
  async getAllHealthCaresStudent(): Promise<{
    data: HealthCareForWebAndMobile[];
  }> {
    const healthCares: any[] = await this.healthCareModel
      .find()
      .sort({ createdAt: -1 })
      .select('-createdAt -updatedAt  -createdBy -updatedBy');

    const resData = await Promise.all(
      healthCares.map(async (ele: any) => {
        if (ele.image) {
          const signedUrl = await this.commonService.getSignedUrl(ele.image);
          ele.image = signedUrl;
        }
        return {
          _id: ele._id,
          name: ele.name,
          description: ele.description,
          slugUrl: ele?.slugUrl || null,
          image: ele.image,
        };
      }),
    );

    return { data: resData };
  }

  //SECTION - to get health care by id
  async healthCareById(id: string): Promise<GetHealthCareById> {
    // NOTE - id is valid mongoose id or not

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const data: any = await this.healthCareModel
      .findById({ _id: id })
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!data) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (data.image) {
      const signedUrl = await this.commonService.getSignedUrl(data.image);
      data.image = signedUrl;
    }
    return data;
  }

  //SECTION - create a new health care
  async createHealthCare(
    payload: CreateHealthCareDto,
    createdById: string,
  ): Promise<string> {
    const { slugUrl, image, name } = payload;
    // Check if a health care entity already exists with the provided slug URL or name
    const existingHealthCare = await this.healthCareModel.findOne({
      $or: [
        { slugUrl: slugUrl },
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
      ],
    });

    if (existingHealthCare) {
      if (existingHealthCare.slugUrl === slugUrl) {
        throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
      }
    }

    if (image && image.includes('base64')) {
      const uploadImage = await this.commonService.uploadFileInS3Bucket(
        image,
        Health_HUB,
      );
      if (uploadImage !== false) {
        payload = { ...payload, image: uploadImage.Key };
      } else {
        throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
      }
    }

    await this.healthCareModel.create({
      ...payload,
      createdBy: new mongoose.Types.ObjectId(createdById),
    });

    return CREATE_DATA;
  }

  //SECTION - update health care by id
  async updateHealthCare(
    id: string,
    payload: UpdateHealthCareDto,
    updatedById: string,
  ): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const { slugUrl, image, name } = payload;

    // NOTE - Check if the hostel with the specified ID exists
    const existingHealthCare = await this.healthCareModel.findById(id);

    if (!existingHealthCare) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    // NOTE - check for duplicate slug url and name
    const isUniqueUrl = await this.healthCareModel.findOne({
      _id: { $ne: existingHealthCare._id },
      slugUrl: slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);
    if (name) {
      const healthCareExist = await this.healthCareModel.findOne({
        name: { $regex: name, $options: 'i' },
      });
      if (healthCareExist && id != healthCareExist._id.toString()) {
        throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
      }
    }
    if (image && image.includes('base64')) {
      const uploadImage = await this.commonService.uploadFileInS3Bucket(
        image,
        Health_HUB,
      );

      if (uploadImage !== false) {
        payload = { ...payload, image: uploadImage.Key };
      } else {
        throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
      }
    } else {
      payload = { ...payload, image: existingHealthCare.image };
    }

    //NOTE -  Update the health care
    await this.healthCareModel.findByIdAndUpdate(id, {
      ...payload,
      updatedBy: new mongoose.Types.ObjectId(updatedById),
    });

    return UPDATE_DATA;
  }

  //SECTION - delete health care by id
  async deleteHealthCare(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check package details
    const package_details = await this.carePackageModel.findOne({
      healthCareId: new mongoose.Types.ObjectId(id),
    });

    //NOTE - If any packages are linked with the service, then through error
    if (package_details)
      throw new HttpException(USED_SERVICE_DELETE, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this package or not
    const order_details = await this.orderModel.findOne({
      'hospitalPackage.0.serviceId': new mongoose.Types.ObjectId(id),
    });

    if (order_details)
      throw new HttpException(SERVICE_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.healthCareModel.findByIdAndDelete({
      _id: id,
    });
    return DELETE_DATA;
  }

  //SECTION - get all health care service in admin payment
  async serviceForPayment(
    payload: GetServiceBasedOnUserDto,
  ): Promise<{ data: GetServiceForUser[] }> {
    const { userId, status } = payload;

    const healthCare: any[] =
      status === PaymentModuleType.NEW
        ? await this.healthCareModel.find()
        : await this.healthCareFinanceModel.aggregate([
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                paymentStatus: PaymentStatus.PAID,
                transactionStatus: {
                  $nin: [TransactionStatus.FULL_PAYMENT],
                },
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
                from: 'careservices',
                localField: 'serviceId',
                foreignField: '_id',
                as: 'serviceData',
              },
            },
            { $unwind: '$serviceData' },
            {
              $project: {
                _id: '$serviceData._id',
                name: '$serviceData.name',
              },
            },
          ]);
    //NOTE - final response
    const resData = await Promise.all(
      healthCare.map(async (ele: any) => ({
        _id: ele._id,
        name: ele?.name ?? null,
      })),
    );

    return { data: resData };
  }
}
