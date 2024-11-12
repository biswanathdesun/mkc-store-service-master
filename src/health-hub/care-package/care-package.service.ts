import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import {
  CREATE_DATA,
  DELETE_DATA,
  DUPLICATE_NAME,
  INVALID_ID,
  PACKAGE_DELETE_ERROR,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
  CANNOT_ADD_PREE_BOOk_AMOUNT,
  INVALID_PREE_BOOK_AMOUNT,
  DUPLICATE_SLUG_URL,
  TEST_PACKAGE_EMPTY,
  FIELD_BLANK_ERROR,
} from 'src/utills/messages';
import { CreateCarePackageDto } from './dto/create-care-package.dto';
import { UpdateCarePackageDto } from './dto/update.care-package.dto';
import { CarePackage } from 'src/schema/care-package.schema';
import { CareService } from 'src/schema/care-service.schema';
import {
  CarePackagesForWebAndMobile,
  GetAllCarePackages,
  GetAllEnquiry,
  GetCarePackageById,
} from './interface/care-package.interface';
import { CarePackageEnquiry } from 'src/schema/care-package-enquiry.schema';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { CheckCarePackageDto } from './dto/check-package-name.dto';
import { CommonService } from 'src/utills/commonService';
import { HEALTH_CARE_PACKAGE } from 'src/utills/s3BucketFolder';
import { Cart } from 'src/schema/cart.schema';
import { HospitalOrder } from 'src/schema/hospital-order-schema';
import { GetPackagesSeoTagDto } from './dto/get-package-tags.dto';
import { AddPackageSeoTagDto } from './dto/care-package-seo-tags.dto';
import {
  PaymentModuleType,
  PaymentStatus,
  ProductType,
  TransactionStatus,
} from 'src/utills/enum';
import { GetPackageBasedOnUserDto } from './dto/get-package-for-payment.dto';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { FavouriteProduct } from 'src/schema/favourite-product.schema';

@Injectable()
export class CarePackageService {
  constructor(
    @InjectModel(CarePackage.name)
    private carePackageModel: Model<CarePackage>,
    @InjectModel(CareService.name)
    private careServiceModel: Model<CareService>,
    @InjectModel(CarePackageEnquiry.name)
    private carePackageEnquiryModel: Model<CarePackageEnquiry>,
    @InjectModel(HospitalOrder.name)
    private hospitalOrderModel: Model<HospitalOrder>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    @InjectModel(FavouriteProduct.name)
    private favouriteProductModel: Model<FavouriteProduct>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - to get all care packages in admin
  async getAllCarePackages(
    query: ParsedQs,
  ): Promise<{ data: GetAllCarePackages[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search, serviceId } = query as {
      page: string;
      limit: string;
      search: string;
      serviceId: string;
    };

    const searchQuery = search
      ? { $or: [{ title: { $regex: search, $options: 'i' } }] }
      : {};
    //NOTE - service based filter
    const serviceFilter = serviceId
      ? { healthCareId: new mongoose.Types.ObjectId(serviceId) }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const count = await this.carePackageModel.countDocuments({
      ...searchQuery,
      ...serviceFilter,
    });

    const carePackages: any[] = await this.carePackageModel
      .find({ ...searchQuery, ...serviceFilter })
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
        { path: 'healthCareId', select: 'name' },
        { path: 'priceId', select: 'name' },
        { path: 'testPackagesId', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const resData = await Promise.all(
      carePackages.map(async (ele: any) => {
        const {
          _id,
          healthCareId,
          title,
          features,
          priceId,
          testPackagesId,
          prebookAmount,
          slugUrl,
          coins,
          status,
          image,
          createdBy,
          updatedBy,
          showOnWebsite,
        } = ele;
        //NOTE - convert image url
        const url =
          image && image.trim() !== ''
            ? await this.commonService.getSignedUrl(ele.image)
            : null;

        return {
          _id,
          healthCare: healthCareId?.name ?? null,
          title,
          features,
          price: priceId?.name ?? null,
          testPackages:
            (testPackagesId &&
              testPackagesId.map((item: { name: string }) => item.name)) ??
            [],
          image: url,
          prebookAmount,
          slugUrl,
          coins: coins ?? 0,
          status,
          createdBy: createdBy?.name ?? null,
          updatedBy: updatedBy?.name ?? null,
          showOnWebsite: showOnWebsite ?? false,
        };
      }),
    );

    return { data: resData, count };
  }
  //SECTION - to get all enquires
  async getAllEnquires(
    query: ParsedQs,
  ): Promise<{ data: GetAllEnquiry[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const searchQuery = search
      ? { $or: [{ UserType: { $regex: search, $options: 'i' } }] }
      : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await this.carePackageEnquiryModel.countDocuments(
      searchQuery,
    );
    const carePackagesEnquiries: any[] = await this.carePackageEnquiryModel
      .find(searchQuery)
      .populate([
        { path: 'createdBy', select: 'type name' },
        {
          path: 'carePackageId',
          select: 'title healthCareId',
          populate: [{ path: 'healthCareId', select: 'name' }],
        },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const resData = await Promise.all(
      carePackagesEnquiries.map(async (ele: any) => {
        return {
          _id: ele._id,
          healthCare: ele?.carePackageId?.healthCareId?.name || null,
          carePackage: ele?.carePackageId?.title || null,
          name: ele.name || null,
          email: ele?.email || null,
          phone: ele?.phone || null,
          queries: ele.query,
          appointmentDate: ele.appointmentDate,
          userType:
            ele?.createdBy?.map((staff: any) => staff?.type).join(', ') || null,
          enquiryStatus: ele?.enquiryStatus || null,
          leadSource: ele?.leadSource || null,
          updatedBy:
            ele?.updatedBy?.map((staff: any) => staff?.name).join(', ') || null,
          createdBy:
            ele?.createdBy?.map((staff: any) => staff?.name).join(', ') || null,
          status: ele?.status,
        };
      }),
    );

    return { data: resData, count };
  }

  // SECTION - get hospital package by service Id for student
  async packageByServiceIdForStudent(
    id: string,
    userId?: string,
  ): Promise<CarePackagesForWebAndMobile[]> {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    const searchQuery: any = {};
    // NOTE - id is valid mongoose id or not
    if (!objectIdPattern.test(id)) {
      searchQuery.slugUrl = id;
    } else {
      searchQuery._id = new mongoose.Types.ObjectId(id);
    }
    //NOTE - check service details
    const serviceDetails: any = await this.careServiceModel
      .findOne(searchQuery)
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!serviceDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const carePackages: any[] = await this.carePackageModel
      .find({ healthCareId: serviceDetails._id, showOnWebsite: true })
      .populate([
        { path: 'healthCareId', select: 'name' },
        {
          path: 'priceId',
          select: 'totalPrice discountPercentage mrpPrice discountedPrice',
        },
      ]);

    //NOTE - final object to send
    const resData: any[] = await Promise.all(
      carePackages.map(async (ele: any) => {
        //NOTE: Define query criteria
        const query = {
          userId,
          carePackageId: ele._id,
        };

        //NOTE: Fetch product details from cart
        const productDetails = userId
          ? await this.cartModel.findOne(query)
          : null;

        //NOTE: Fetch product details from cart
        const isFavourite = userId
          ? await this.favouriteProductModel.findOne({
              userId: new mongoose.Types.ObjectId(userId),
              productType: ProductType.HEALTH_CARE,
              carePackageId: ele._id,
            })
          : false;

        //NOTE: Return formatted response
        return {
          _id: ele._id,
          healthCare: ele.healthCareId?.name || null,
          title: ele?.title || null,
          slugUrl: ele?.slugUrl ?? null,
          image:
            ele?.image !== null
              ? await this.commonService.getSignedUrl(ele?.image)
              : null,
          isPreeBook: !!ele?.prebookAmount,
          features: ele.features,
          mrpPrice: ele.priceId?.mrpPrice || null,
          discountedPrice: ele.priceId?.discountedPrice || null,
          discountPercentage: ele.priceId?.discountPercentage || null,
          totalPrice: ele.priceId?.totalPrice || null,
          prebookAmount: ele?.prebookAmount ?? null,
          isExistOnCart: !!productDetails,
          isFavourite: !!isFavourite,
        };
      }),
    );

    return resData;
  }

  // SECTION - to get care packages by id
  async carePackageById(id: string): Promise<GetCarePackageById> {
    // NOTE - id is valid mongoose id or not

    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const data: any = await this.carePackageModel
      .findById({ _id: id, status: true })
      .populate([
        { path: 'healthCareId', select: 'name isPreeBook' },
        { path: 'testPackagesId', select: 'name' },

        { path: 'priceId', select: 'name' },
      ])
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!data) throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    return {
      _id: data._id,
      healthCareId: data.healthCareId,
      title: data?.title || null,
      slugUrl: data?.slugUrl ?? null,
      features: data.features,
      priceId: data.priceId,
      image:
        data.image !== null
          ? await this.commonService.getSignedUrl(data.image)
          : null,
      testPackagesId: data?.testPackagesId ?? null,
      prebookAmount: data?.prebookAmount,
      coins: data?.coins ?? 0,
      showOnWebsite: data?.showOnWebsite ?? false,
    };
  }

  //SECTION - create a new care packages
  async createCarePackage(
    payload: CreateCarePackageDto,
    createdById: string,
  ): Promise<string> {
    const {
      title,
      healthCareId,
      priceId,
      image,
      prebookAmount,
      slugUrl,
      testPackagesId,
    } = payload;

    // NOTE - check slugUrl is already exist or not with the same name
    const escapedSlugUrl = slugUrl.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const isUniqueUrl = await this.carePackageModel.findOne({
      slugUrl: { $regex: new RegExp(escapedSlugUrl, 'i') },
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    // NOTE - Check health care details and validate prebookAmount
    const healthCare = await this.careServiceModel.findById(healthCareId);

    if (!healthCare) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    if (
      (healthCare.isPreeBook && prebookAmount === 0) ||
      (!healthCare.isPreeBook && prebookAmount > 0)
    ) {
      throw new HttpException(
        healthCare.isPreeBook
          ? INVALID_PREE_BOOK_AMOUNT
          : CANNOT_ADD_PREE_BOOk_AMOUNT,
        HttpStatus.BAD_REQUEST,
      );
    }

    const escapedTitle = title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    //NOTE: check title is exist or not
    const carePackages: any = await this.carePackageModel.findOne({
      title: { $regex: new RegExp(escapedTitle, 'i') },
      healthCareId: new mongoose.Types.ObjectId(healthCareId),
    });

    if (carePackages)
      throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);

    //NOTE - thumbnail image url need to covert
    if (image) {
      //NOTE - upload thumbnail
      const uploadImageUrl = await this.commonService.handleImageUpload(
        image,
        HEALTH_CARE_PACKAGE,
      );
      payload.image = uploadImageUrl;
    }

    //NOTE: create care package
    let testPackageIds: any;
    if (Array.isArray(testPackagesId) && testPackagesId.length === 0) {
      throw new HttpException(TEST_PACKAGE_EMPTY, HttpStatus.BAD_REQUEST);
    }
    if (Array.isArray(testPackagesId) && testPackagesId.length > 0) {
      testPackageIds = testPackagesId?.map(
        (id: string) => new mongoose.Types.ObjectId(id),
      );
    }

    await this.carePackageModel.create({
      ...payload,
      testPackagesId: testPackageIds || null,
      priceId: new mongoose.Types.ObjectId(priceId),
      healthCareId: new mongoose.Types.ObjectId(healthCareId),
      createdBy: new mongoose.Types.ObjectId(createdById),
    });

    return CREATE_DATA;
  }

  //SECTION - update enquiry status
  async updateEnquiryStatus(
    id: string,
    payload: UpdateEnquiryStatusDto,
    createdById: string,
  ): Promise<string> {
    const { enquiryStatus } = payload;

    await this.carePackageEnquiryModel.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          enquiryStatus: enquiryStatus,
          updatedBy: new mongoose.Types.ObjectId(createdById),
        },
      },
      { new: true }, // To get the updated document as a result
    );

    return UPDATE_DATA;
  }

  //SECTION - update care packages by id
  async updateCarePackage(
    id: string,
    payload: UpdateCarePackageDto,
    updatedById: string,
  ): Promise<string> {
    const {
      title,
      healthCareId,
      priceId,
      image,
      features,
      prebookAmount,
      slugUrl,
      coins,
      testPackagesId,
      showOnWebsite,
    } = payload;

    //NOTE: Check if the hostel with the specified ID exists
    const existingPackage = await this.carePackageModel.findById(id);

    if (!existingPackage)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const escapedSlugUrl = slugUrl.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // NOTE - check slugUrl is already exist or not with the same name
    const isUniqueUrl = await this.carePackageModel.findOne({
      _id: { $ne: id },
      slugUrl: { $regex: new RegExp(escapedSlugUrl, 'i') },
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    //NOTE: Check for duplicate title
    if (title) {
      const escapedTitle = title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const duplicatePackage = await this.carePackageModel.findOne({
        title: { $regex: new RegExp(escapedTitle, 'i') },
        _id: { $ne: id },
      });
      if (duplicatePackage) {
        throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
      }
    }

    //NOTE: Define params for update
    const params: Record<string, any> = {
      title,
      features,
      prebookAmount: prebookAmount || 0,
      slugUrl,
      coins,
      showOnWebsite,
      updatedBy: new mongoose.Types.ObjectId(updatedById),
    };

    //NOTE: Cast healthCareId and priceId if provided
    params.healthCareId = healthCareId
      ? new mongoose.Types.ObjectId(healthCareId)
      : undefined;
    params.priceId = priceId ? new mongoose.Types.ObjectId(priceId) : undefined;

    //NOTE: Cast testPackagesId if provided
    params.testPackagesId = testPackagesId
      ? testPackagesId.map((id: string) => new mongoose.Types.ObjectId(id))
      : null;

    //NOTE: Upload image if provided
    if (image && image.includes('base64')) {
      //NOTE - upload thumbnail
      const uploadImageUrl = await this.commonService.handleImageUpload(
        image,
        HEALTH_CARE_PACKAGE,
      );
      payload.image = uploadImageUrl;
    }

    //NOTE: Update the care package
    await this.carePackageModel.findByIdAndUpdate(id, params);

    return UPDATE_DATA;
  }

  //SECTION - delete care packages by id
  async deleteCarePackage(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this package or not
    const order_details = await this.hospitalOrderModel.findOne({
      'productDetails.packageId': new mongoose.Types.ObjectId(id),
    });

    if (order_details)
      throw new HttpException(PACKAGE_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.carePackageModel.findByIdAndDelete({
      _id: id,
    });
    return DELETE_DATA;
  }

  //SECTION - check Package Name based on the service id
  async checkPackageName(payload: CheckCarePackageDto): Promise<string> {
    const { title, healthCareId } = payload;

    const escapedTitle = title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    //NOTE: check title is exist or not
    const carePackages = await this.carePackageModel.findOne({
      title: { $regex: new RegExp(escapedTitle, 'i') },
      healthCareId: new mongoose.Types.ObjectId(healthCareId),
    });

    if (carePackages) {
      throw new HttpException(DUPLICATE_NAME, HttpStatus.BAD_REQUEST);
    } else {
      return RECORD_NOT_FOUND;
    }
  }

  // SECTION - to get hospital package by service Id for admin
  async packageByServiceIdForAdmin(
    id: string,
  ): Promise<CarePackagesForWebAndMobile[]> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - check service details
    const serviceDetails: any = await this.careServiceModel.findById(id);

    if (!serviceDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const carePackages: any[] = await this.carePackageModel
      .find({ healthCareId: serviceDetails._id })
      .populate([
        {
          path: 'priceId',
          select: 'mrpPrice discountedPrice totalPrice discountPercentage ',
        },
      ]);

    //NOTE - final object to send
    const resData: any[] = await Promise.all(
      carePackages.map(async (ele: any) => {
        //NOTE: Return formatted response
        return {
          _id: ele._id,
          title: ele?.title ?? null,
          isPreeBook: !!ele?.prebookAmount,
          mrpPrice: ele.priceId?.mrpPrice ?? null,
          totalPrice: ele.priceId?.totalPrice ?? null,
          discountedPrice: ele.priceId?.discountedPrice ?? null,
          discountPercentage: ele.priceId?.discountPercentage ?? null,
          prebookAmount: ele?.prebookAmount ?? null,
        };
      }),
    );

    return resData;
  }

  //SECTION - get Seo Tags for care packages
  async getSeoTagDetails(
    payload: GetPackagesSeoTagDto,
  ): Promise<{ data: any }> {
    const { packageId } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(packageId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const checkDetails = await this.carePackageModel.findById(packageId);

    if (!checkDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const response = {
      metaTitle: checkDetails?.metaTitle,
      metaDescription: checkDetails?.metaDescription,
    };

    return { data: response };
  }

  //SECTION -Add Seo Tags in care packages
  async configureSeoTags(
    payload: AddPackageSeoTagDto,
    updateById: string,
  ): Promise<any> {
    const { packageId, metaTitle, metaDescription } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(packageId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    if (!metaTitle || !metaDescription)
      throw new HttpException(FIELD_BLANK_ERROR, HttpStatus.BAD_REQUEST);

    const checkDetails = await this.carePackageModel.findById(packageId);

    if (!checkDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    await this.carePackageModel.findByIdAndUpdate(packageId, {
      $set: {
        metaTitle,
        metaDescription,
        updatedBy: updateById,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION - get all health care package in admin payment
  async packageForPayment(
    payload: GetPackageBasedOnUserDto,
  ): Promise<{ data: any[] }> {
    const { serviceId, userId, status } = payload;

    //NOTE - check service details
    const serviceDetails: any = await this.careServiceModel.findById(serviceId);

    if (!serviceDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const healthCare: any[] =
      status === PaymentModuleType.NEW
        ? await this.carePackageModel
            .find({ healthCareId: serviceDetails._id })
            .populate([
              {
                path: 'priceId',
                select:
                  'mrpPrice discountedPrice totalPrice discountPercentage',
              },
            ])
        : await this.healthCareFinanceModel.aggregate([
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                paymentStatus: PaymentStatus.PAID,
                transactionStatus: { $nin: [TransactionStatus.FULL_PAYMENT] },
              },
            },
            { $sort: { createdAt: -1 } },
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
                from: 'carepackages',
                localField: 'packageId',
                foreignField: '_id',
                as: 'packageData',
              },
            },
            { $unwind: '$packageData' },
            {
              $lookup: {
                from: 'prices',
                localField: 'packageData.priceId',
                foreignField: '_id',
                as: 'priceId',
              },
            },
            {
              $unwind: {
                path: '$priceId',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                isPreBook: {
                  $cond: {
                    if: { $gt: ['$packageData.prebookAmount', 0] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: '$packageData._id',
                title: '$packageData.title',
                isPreBook: 1,
                mrpPrice: '$priceId.mrpPrice',
                totalPrice: '$priceId.totalPrice',
                discountedPrice: '$priceId.discountedPrice',
                discountPercentage: '$priceId.discountPercentage',
                prebookAmount: '$packageData.prebookAmount',
                productAmount: 1,
                outstandingAmount: 1,
                totalAmtReceived: 1,
                priceType: 1,
              },
            },
          ]);

    const resData = await Promise.all(
      healthCare.map(async (ele: any) => ({
        _id: ele._id,
        title: ele.title,
        isPreeBook: !!ele?.prebookAmount,

        mrpPrice:
          status === PaymentModuleType.NEW
            ? ele.priceId?.mrpPrice
            : ele?.mrpPrice,
        totalPrice:
          status === PaymentModuleType.NEW
            ? ele.priceId?.totalPrice
            : ele?.totalPrice,
        discountedPrice:
          status === PaymentModuleType.NEW
            ? ele.priceId?.discountedPrice
            : ele?.discountedPrice,
        discountPercentage:
          status === PaymentModuleType.NEW
            ? ele.priceId?.discountPercentage
            : ele?.discountPercentage,
        prebookAmount: ele?.prebookAmount,
        productAmount:
          status === PaymentModuleType.NEW ? null : ele?.productAmount,
        outstandingAmount:
          status === PaymentModuleType.NEW ? null : ele?.outstandingAmount,
        totalAmtReceived:
          status === PaymentModuleType.NEW ? null : ele?.totalAmtReceived,

        priceType: status === PaymentModuleType.NEW ? null : ele?.priceType,
      })),
    );

    return { data: resData };
  }
}
