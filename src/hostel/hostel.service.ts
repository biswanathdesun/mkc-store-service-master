import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import { Hostel } from 'src/schema/hostel.schema';
import {
  CREATE_DATA,
  DELETE_DATA,
  DUPLICATE_BED_TYPE,
  DUPLICATE_SLUG_URL,
  HOSTEL_DELETE_ERROR,
  IMAGE_UPLOAD_ERROR,
  INVALID_ID,
  INVALID_TYPE,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { CommonService } from 'src/utills/commonService';
import { HOSTEL_IMAGES } from 'src/utills/s3BucketFolder';
import {
  BedTypes,
  HostelPaymentType,
  HostelTransactionStatus,
  PaymentModuleType,
  PaymentStatus,
} from 'src/utills/enum';
import { Setting } from 'src/schema/site-setting.schema';
import { RoomMappingDto } from './dto/room-mapping.dto';
import { GetMappedRoomForHostelDto } from './dto/get-room-details.dto';
import { GetMappedRoomNumberDto } from './dto/get-room-number.dto';
import { GetVacantRoomDto } from './dto/vacant.room.dto';
import { GetPaymentDetailsDto } from './dto/get-payment-details.dto';
import { HostelOrder } from 'src/schema/hostel-order.schema';
import { HostelRentalPay } from 'src/schema/hostel-rental-pay.schema';
import { UserHostelValidity } from 'src/schema/user.hostel.validity.schema';
import { BedTypesByFloorNumberDto } from './dto/bedtype-by-floor';
import { GetMulipleMappedRoomNumberDto } from './dto/muliple-mapped-room.dto';

@Injectable()
export class HostelService {
  constructor(
    @InjectModel(Hostel.name) private hostelModel: Model<Hostel>,
    @InjectModel(HostelRentalPay.name)
    private hostelRentalPayModel: Model<HostelRentalPay>,
    @InjectModel(HostelOrder.name) private orderModel: Model<HostelOrder>,
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
    @InjectModel(UserHostelValidity.name)
    private hostelValidityModel: Model<UserHostelValidity>,
    private commonService: CommonService,
  ) {}

  //SECTION - to get all hostels
  async getAllHostels(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
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
    const count = await this.hostelModel.countDocuments(searchQuery);

    const hostels: any[] = await this.hostelModel
      .find({ ...searchQuery, status: true })
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select(
        '-createdAt -updatedAt -bedDetails.createdAt -bedDetails.updatedAt',
      );

    //NOTE - get hostel Enquiry Number
    const siteSetting = await this.settingModel
      .findOne()
      .select('hostelEnquiryNumber');

    //NOTE - final object to send
    const result = await Promise.all(
      hostels.map(async (ele: any) => {
        let hostelImage: string;
        if (ele.image[0] && ele.image[0].url) {
          const signedUrl = await this.commonService.getSignedUrl(
            ele.image[0].url,
          );
          hostelImage = signedUrl;
        }

        return {
          _id: ele._id,
          name: ele?.name,
          address: ele?.address,
          slugUrl: ele?.slugUrl ?? null,
          image: hostelImage ?? null,
          isRoomMapped:
            (ele?.roomMapping && ele?.roomMapping.length > 0) ?? false,
          enquiryNumber:
            (siteSetting && siteSetting?.hostelEnquiryNumber) ?? null,
          createdBy: ele.createdBy?.name ?? null,
          updatedBy: ele.updatedBy?.name ?? null,
        };
      }),
    );

    return { data: result, count };
  }

  //SECTION - to get all hostels for mobile
  async getAllHostelsForWebMobile(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const searchQuery = search
      ? { $or: [{ address: { $regex: search, $options: 'i' } }] }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await this.hostelModel.countDocuments(searchQuery);
    const hostels: any[] = await this.hostelModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select(
        '-createdAt -updatedAt -bedDetails.createdAt -bedDetails.updatedAt -createdBy -updatedBy',
      );

    //NOTE - final object to send
    const result = await Promise.all(
      hostels.map(async (ele: any) => {
        let hostelImage: any;
        if (ele.image[0] && ele.image[0].url) {
          const signedUrl = await this.commonService.getSignedUrl(
            ele.image[0].url,
          );
          hostelImage = { _id: ele.image[0]._id, url: signedUrl };
        }
        return {
          _id: ele._id,
          name: ele.name,
          address: ele.address,
          slugUrl: ele?.slugUrl ?? null,
          image: hostelImage?.url ?? null,
        };
      }),
    );

    return { data: result, count };
  }

  //SECTION - to get bedTypes by hostel id
  async bedTypesByHostelId(id: string): Promise<any[]> {
    const searchQuery: any = {};

    if (!mongoose.isValidObjectId(id)) {
      searchQuery.slugUrl = { $regex: id, $options: 'i' };
    } else {
      searchQuery._id = new mongoose.Types.ObjectId(id);
    }

    const data: any = await this.hostelModel
      .findOne(searchQuery)
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!data) return [];

    const transformedData = data.bedDetails.map((ele: any) => ({
      _id: ele._id,
      bedType: ele.bedType ?? null,
      numberOfRooms: ele?.numberOfRooms ?? null,
      totalPriceToPay: ele.totalPriceToPay ?? null,
    }));

    return transformedData;
  }

  //SECTION - to get hostel by id for web or mobile
  async hostelByIdForWebMobile(id: string): Promise<any> {
    const searchQuery: any = {};

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    // NOTE - id is valid mongoose id or not
    if (!objectIdPattern.test(id)) {
      searchQuery.slugUrl = { $regex: id, $options: 'i' };
    } else {
      searchQuery._id = new mongoose.Types.ObjectId(id);
    }

    const data: any = await this.hostelModel
      .findOne(searchQuery)
      .select(
        '-createdAt -updatedAt -createdBy -updatedBy -__v -bedDetails.createdAt -bedDetails.updatedAt -bedDetails.numberOfRooms -bedDetails.hostelCharge -bedDetails.accommodationCost -bedDetails.mealCost -bedDetails.gst -bedDetails.totalBeds',
      );

    if (!data) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const hostelImages = await Promise.all(
      data.image.map(async (imageUrl: { url: string; _id: string }) => {
        if (imageUrl.url) {
          const signedUrl = await this.commonService.getSignedUrl(imageUrl.url);
          return { _id: imageUrl._id, url: signedUrl };
        }
      }),
    );

    const siteSetting = await this.settingModel.findOne();

    // Process bedDetails to extract the highest security fee
    const bedData = data.bedDetails.map((bedDetail: any) => {
      const highestSecurityFee = bedDetail.securityFee.reduce(
        (maxFee: any, currentFee: any) =>
          currentFee.fees > (maxFee?.fees || 0) ? currentFee : maxFee,
        {},
      );
      return {
        bedType: bedDetail.bedType,
        hostelGst: bedDetail.hostelGst,
        hostelChargeWithGst: bedDetail.hostelChargeWithGst,
        accommodationGst: bedDetail.accommodationGst,
        accommodationCostWithGst: bedDetail.accommodationCostWithGst,
        mealGst: bedDetail.mealGst,
        mealCostWithGst: bedDetail.mealCostWithGst,
        totalGst: bedDetail.totalGst,
        totalAmount: bedDetail.totalAmount,
        totalPriceToPay: bedDetail.totalPriceToPay,
        perDayCost: bedDetail.perDayCost,
        securityFee: highestSecurityFee?.fees,
      };
    });

    return {
      _id: data._id,
      name: data.name,
      address: data.address,
      slugUrl: data?.slugUrl ?? null,
      image: hostelImages,
      facilities: data.facilities,
      enquiryNumber: (siteSetting && siteSetting?.hostelEnquiryNumber) ?? null,
      bedDetails: bedData,
    };
  }

  //SECTION - to get hostel by id
  async hostelById(id: string): Promise<any> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const data: any = await this.hostelModel
      .findById({ _id: id })
      .select(
        '-createdAt -updatedAt -createdBy -updatedBy -__v -bedDetails.createdAt -bedDetails.updatedAt',
      );

    if (!data) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const hostelImages = await Promise.all(
      data.image.map(async (imageUrl: { url: string; _id: any }) => {
        if (imageUrl?.url) {
          const signedUrl = await this.commonService.getSignedUrl(imageUrl.url);
          return { _id: imageUrl._id, url: signedUrl };
        }
      }),
    );

    return {
      _id: data._id,
      name: data.name,
      address: data.address,
      slugUrl: data?.slugUrl || null,
      image: hostelImages,
      facilities: data.facilities,
      bedDetails: data.bedDetails,
      totalAmount: data.totalAmount,
      totalPriceToPay: data.totalPriceToPay,
    };
  }

  //SECTION - create a new hostel
  async createHostel(
    payload: CreateHostelDto,
    createdById: string,
  ): Promise<string> {
    const { slugUrl, bedDetails, image } = payload;

    const existingHostel = await this.hostelModel.findOne({ slugUrl });
    if (existingHostel)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.BAD_REQUEST);

    //NOTE: Check for duplicate bedTypes
    const uniqueBedTypes = new Set<BedTypes>();
    for (const bedDetail of bedDetails) {
      if (uniqueBedTypes.has(bedDetail.bedType))
        throw new HttpException(DUPLICATE_BED_TYPE, HttpStatus.BAD_REQUEST);
      uniqueBedTypes.add(bedDetail.bedType);

      //NOTE: Calculate GST for each bed
      bedDetail.hostelChargeWithGst = Math.round(
        (bedDetail.hostelCharge * bedDetail.hostelGst) / 100 +
          bedDetail.hostelCharge,
      );
      bedDetail.accommodationCostWithGst = Math.round(
        (bedDetail.accommodationCost * bedDetail.accommodationGst) / 100 +
          bedDetail.accommodationCost,
      );
      bedDetail.mealCostWithGst = Math.round(
        (bedDetail.mealCost * bedDetail.mealGst) / 100 + bedDetail.mealCost,
      );
    }

    //NOTE: Upload hostel images
    const hostelImages = await Promise.all(
      image.map(async (imageUrl) => {
        if (imageUrl?.url && imageUrl?.url.includes('base64')) {
          const uploadImage = await this.commonService.uploadFileInS3Bucket(
            imageUrl.url,
            HOSTEL_IMAGES,
          );
          if (uploadImage !== false) return { url: uploadImage.Key };
          else
            throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
        }
      }),
    );

    // Create the hostel
    await this.hostelModel.create({
      ...payload,
      image: hostelImages,
      bedDetails,
      createdBy: createdById,
    });

    return CREATE_DATA;
  }

  //SECTION - update hostel by id
  async updateHostel(
    id: string,
    payload: UpdateHostelDto,
    updatedById: string,
  ): Promise<string> {
    const { slugUrl } = payload;
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - Check if the hostel with the specified ID exists
    const existingHostel = await this.hostelModel.findById(id);
    if (!existingHostel) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    const isUniqueUrl = await this.hostelModel.findOne({
      _id: { $ne: existingHostel._id },
      slugUrl,
    });

    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    //NOTE -  Check the duplicate bedType
    const uniqueBedTypes = new Set<BedTypes>();
    for (const bedDetail of payload.bedDetails) {
      if (uniqueBedTypes.has(bedDetail.bedType)) {
        throw new HttpException(DUPLICATE_BED_TYPE, HttpStatus.BAD_REQUEST);
      }
      uniqueBedTypes.add(bedDetail.bedType);
    }
    const image: any = payload.image;
    const updateImageUrl: any[] = [];
    if (image) {
      for (const data of image) {
        // Check if the imageUrl exists in the existingHostel's image
        const existImage = (existingHostel.image as any[]).find((item: any) =>
          item._id.equals(data._id),
        );

        if (existImage) {
          if (data && data.url.includes('base64')) {
            // If the image exists and there is base64 data, upload and update the image
            const uploadImage = await this.commonService.uploadFileInS3Bucket(
              data.url,
              HOSTEL_IMAGES,
            );

            if (uploadImage !== false) {
              data.url = uploadImage.Key;
              updateImageUrl.push(data);
            } else {
              throw new HttpException(
                IMAGE_UPLOAD_ERROR,
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            // If there is no base64 data, keep the existing image
            updateImageUrl.push(existImage);
          }
        } else {
          // If the image does not exist, upload and add the new image
          if (data && data.url.includes('base64')) {
            const uploadImage = await this.commonService.uploadFileInS3Bucket(
              data.url,
              HOSTEL_IMAGES,
            );

            if (uploadImage !== false) {
              data.url = uploadImage.Key;
              updateImageUrl.push(data);
            } else {
              throw new HttpException(
                IMAGE_UPLOAD_ERROR,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }
      }
    }
    const bedDetails: any = payload.bedDetails;
    const updateBedDetails: any[] = [];
    if (payload.bedDetails) {
      for (const data of bedDetails) {
        //NOTE -  Check if the bedDetail exists in the existingHostel's bedDetails

        const existBedDetail = (existingHostel.bedDetails as any[]).find(
          (item: any) => item._id.equals(data._id),
        );
        if (existBedDetail) {
          existBedDetail.hostelChargeWithGst = Math.round(
            (data.hostelCharge * data.hostelGst) / 100 + data.hostelCharge,
          );

          existBedDetail.accommodationCostWithGst = Math.round(
            (data.accommodationCost * data.accommodationGst) / 100 +
              data.accommodationCost,
          );
          existBedDetail.mealCostWithGst = Math.round(
            (data.mealCost * data.mealGst) / 100 + data.mealCost,
          );

          existBedDetail.bedType = data.bedType;
          existBedDetail.numberOfRooms = data.numberOfRooms;
          existBedDetail.totalBeds = data.totalBeds;
          existBedDetail.vacant = data.totalBeds - data.purchasedBed;
          existBedDetail.hostelCharge = data.hostelCharge;
          existBedDetail.accommodationCost = data.accommodationCost;
          existBedDetail.mealCost = data.mealCost;
          existBedDetail.hostelGst = data.hostelGst;
          existBedDetail.accommodationGst = data.accommodationGst;
          existBedDetail.mealGst = data.mealGst;
          existBedDetail.totalGst = data.totalGst;
          existBedDetail.totalAmount = data.totalAmount;
          existBedDetail.totalPriceToPay = data.totalPriceToPay;
          existBedDetail.securityFee = data.securityFee;
          existBedDetail.perDayCost = data.perDayCost;

          //NOTE - push updated data
          updateBedDetails.push(existBedDetail);
        } else {
          data.hostelChargeWithGst = Math.round(
            (data.hostelCharge * data.hostelGst) / 100 + data.hostelCharge,
          );

          data.accommodationCostWithGst = Math.round(
            (data.accommodationCost * data.accommodationGst) / 100 +
              data.accommodationCost,
          );
          data.mealCostWithGst = Math.round(
            (data.mealCost * data.mealGst) / 100 + data.mealCost,
          );
          //NOTE - If the bedDetail does not exist
          updateBedDetails.push(data);
        }
      }
    }

    //NOTE -  Update the hostel
    await this.hostelModel.findByIdAndUpdate(id, {
      $set: {
        ...payload,
        image: updateImageUrl,
        bedDetails: updateBedDetails,
        updatedBy: updatedById,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION - delete hostel by id
  async deleteHostel(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this package or not
    const order_details = await this.orderModel.findOne({
      'hostelData.0.hostelId': new mongoose.Types.ObjectId(id),
    });

    if (order_details)
      throw new HttpException(HOSTEL_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    const deletData = await this.hostelModel.findByIdAndDelete(id);

    if (!deletData)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return DELETE_DATA;
  }

  //SECTION - update Hostel Room Details
  async updateRoomMappingDetails(
    payload: RoomMappingDto,
    staffId: string,
  ): Promise<string> {
    const { hostelId, roomDetails } = payload;

    //NOTE - check hhhosstel details
    const hostel = await this.hostelModel.findById(hostelId);

    if (!hostel)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const roomDetailsData = roomDetails.map((ele) => ({
      roomNumber: ele?.roomNumber,
      floorNumber: ele?.floorNumber,
      bedType: ele?.bedType,
      totalBeds: ele?.bedType,
      vacant: ele?.purchasedBed
        ? ele?.bedType - ele?.purchasedBed
        : ele?.bedType - 0,
      purchasedBed: ele?.purchasedBed ?? 0,
    }));

    //NOTE - update th room details
    await this.hostelModel.findByIdAndUpdate(hostelId, {
      $set: { roomMapping: roomDetailsData, updatedBy: staffId },
    });

    return UPDATE_DATA;
  }

  //SECTION - fetch mapped Room Details for hostel
  async fetchMapppedRoomDetails(
    payload: GetMappedRoomForHostelDto,
  ): Promise<{ data: any[] }> {
    const { hostelId } = payload;

    //NOTE - check hhhosstel details
    const hostel = await this.hostelModel
      .findById(hostelId)
      .select('roomMapping');

    if (!hostel)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const result =
      (hostel &&
        hostel?.roomMapping.map((ele) => ({
          roomNumber: ele.roomNumber ?? null,
          floorNumber: ele.floorNumber ?? null,
          bedType: ele.bedType ?? null,
          totalBeds: ele.totalBeds ?? null,
          vacant: ele.vacant ?? null,
          purchasedBed: ele.purchasedBed ?? null,
        }))) ||
      [];

    return { data: result };
  }

  //SECTION - fetch mapped Room number based on hostel and bed type
  async getRoomsByBedType(
    payload: GetMappedRoomNumberDto,
  ): Promise<{ data: any }> {
    const { hostelId, bedType } = payload;

    // Aggregation pipeline to filter rooms based on bedType
    const result = await this.hostelModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
      {
        $project: {
          roomMapping: {
            $filter: {
              input: '$roomMapping',
              as: 'room',
              cond: { $eq: ['$$room.bedType', bedType] },
            },
          },
        },
      },
      {
        $project: {
          'roomMapping.roomNumber': 1,
          'roomMapping.floorNumber': 1,
          'roomMapping.bedType': 1,
          'roomMapping.totalBeds': 1,
          'roomMapping.vacant': 1,
          'roomMapping.purchasedBed': 1,
        },
      },
    ]);

    if (!result || !result.length)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return { data: result[0].roomMapping };
  }

  //SECTION - fetch Vacant Rooms By Bed Type
  async getVacantRoomsByBedType(
    payload: GetVacantRoomDto,
  ): Promise<{ data: any }> {
    const { hostelId, bedType, roomNumber } = payload;

    const [result] = await this.hostelModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
      {
        $project: {
          roomMapping: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$roomMapping',
                  as: 'room',
                  cond: {
                    $and: [
                      { $eq: ['$$room.bedType', bedType] },
                      { $eq: ['$$room.roomNumber', roomNumber] },
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          vacant: {
            $concat: [
              { $toString: '$roomMapping.vacant' },
              '/',
              { $toString: '$roomMapping.totalBeds' },
            ],
          },
        },
      },
    ]);

    if (!result)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return { data: result };
  }

  //SECTION - fetch Vacant Rooms By Bed Type
  async fetchRoomDetailsForPayment(
    payload: GetPaymentDetailsDto,
  ): Promise<{ data: any }> {
    const { userId, hostelId, bedType, status } = payload;

    if (
      (userId && !mongoose.isValidObjectId(userId)) ||
      (hostelId && !mongoose.isValidObjectId(hostelId))
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    let result: any = [];
    switch (status) {
      case PaymentModuleType.NEW:
        result = await this.hostelModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
          {
            $project: {
              roomMapping: {
                $filter: {
                  input: '$roomMapping',
                  as: 'room',
                  cond: { $eq: ['$$room.bedType', bedType] },
                },
              },
            },
          },
          {
            $project: {
              'roomMapping.roomNumber': 1,
              'roomMapping.floorNumber': 1,
              'roomMapping.bedType': 1,
              'roomMapping.totalBeds': 1,
              'roomMapping.vacant': 1,
              'roomMapping.purchasedBed': 1,
            },
          },
        ]);
        break;
      case PaymentModuleType.EXISTING:
        result = await this.hostelRentalPayModel.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              paymentStatus: PaymentStatus.PAID,
              bedType,
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
                  HostelTransactionStatus.INSTALLMENT_COMPLETE,
                  HostelTransactionStatus.INSTALLMENT_TERMINATED,
                  HostelTransactionStatus.SECURITY_REFUND,
                ],
              },
            },
          },
          { $replaceRoot: { newRoot: '$latestDocument' } },
          {
            $lookup: {
              from: 'hostels',
              localField: 'hostelId',
              foreignField: '_id',
              as: 'hostelData',
            },
          },
          { $unwind: '$hostelData' },
          { $project: { _id: '$hostelData._id', roomNumber: '$roomNumber' } },
        ]);
        break;
      default:
        throw new HttpException(INVALID_TYPE, HttpStatus.BAD_REQUEST);
    }

    if (!result || !result.length) return { data: [] };

    return {
      data: status === PaymentModuleType.NEW ? result[0].roomMapping : result,
    };
  }

  //SECTION - fetch payment details for hostel payment
  async getPaymentDetails(
    payload: GetPaymentDetailsDto,
  ): Promise<{ data: any }> {
    const {
      userId,
      hostelId,
      bedType,
      monthCount,
      daysCount,
      joiningDate,
      status,
    } = payload;

    if (
      (userId && !mongoose.isValidObjectId(userId)) ||
      (hostelId && !mongoose.isValidObjectId(hostelId))
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { totalDaysInMonth } = await this.getMonthInfo(joiningDate ?? today);

    let result: any = [];
    switch (status) {
      case PaymentModuleType.NEW:
        result = await this.hostelModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
          {
            $project: {
              bedDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$bedDetails',
                      as: 'bed',
                      cond: {
                        $and: [{ $eq: ['$$bed.bedType', bedType] }],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              // hostelChargeWithGst logic updated with daysCount
              hostelChargeWithGst: {
                $cond: {
                  if: { $gt: [daysCount, 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          '$bedDetails.hostelChargeWithGst',
                          totalDaysInMonth,
                        ],
                      },
                      daysCount,
                    ],
                  },
                  else: {
                    $multiply: ['$bedDetails.hostelChargeWithGst', monthCount],
                  },
                },
              },
              // accommodationCostWithGst logic updated with daysCount
              accommodationCostWithGst: {
                $cond: {
                  if: { $gt: [daysCount, 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          '$bedDetails.accommodationCostWithGst',
                          totalDaysInMonth,
                        ],
                      },
                      daysCount,
                    ],
                  },
                  else: {
                    $multiply: [
                      '$bedDetails.accommodationCostWithGst',
                      monthCount,
                    ],
                  },
                },
              },
              // mealCostWithGst logic updated with daysCount
              mealCostWithGst: {
                $cond: {
                  if: { $gt: [daysCount, 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          '$bedDetails.mealCostWithGst',
                          totalDaysInMonth,
                        ],
                      },
                      daysCount,
                    ],
                  },
                  else: {
                    $multiply: ['$bedDetails.mealCostWithGst', monthCount],
                  },
                },
              },
              // totalAmount logic updated with daysCount
              totalAmount: {
                $cond: {
                  if: { $gt: [daysCount, 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: ['$bedDetails.totalAmount', totalDaysInMonth],
                      },
                      daysCount,
                    ],
                  },
                  else: { $multiply: ['$bedDetails.totalAmount', monthCount] },
                },
              },
              // totalPriceToPay logic updated with daysCount
              totalPriceToPay: {
                $cond: {
                  if: { $gt: [daysCount, 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          '$bedDetails.totalPriceToPay',
                          totalDaysInMonth,
                        ],
                      },
                      daysCount,
                    ],
                  },
                  else: {
                    $multiply: ['$bedDetails.totalPriceToPay', monthCount],
                  },
                },
              },

              securityFee: '$bedDetails.securityFee',
              perDayCost: '$bedDetails.perDayCost',
            },
          },
        ]);

        break;
      case PaymentModuleType.EXISTING:
        result = await this.hostelRentalPayModel.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              paymentStatus: PaymentStatus.PAID,
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
                  HostelTransactionStatus.INSTALLMENT_COMPLETE,
                  HostelTransactionStatus.INSTALLMENT_TERMINATED,
                  HostelTransactionStatus.SECURITY_REFUND,
                ],
              },
            },
          },
          { $replaceRoot: { newRoot: '$latestDocument' } },
          {
            $lookup: {
              from: 'hostels',
              localField: 'hostelId',
              foreignField: '_id',
              as: 'hostelData',
            },
          },
          { $unwind: '$hostelData' },
          {
            $addFields: {
              bedDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$hostelData.bedDetails',
                      as: 'bed',
                      cond: { $eq: ['$$bed.bedType', '$bedType'] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $addFields: {
              isMonthChange: {
                $cond: [{ $eq: ['$outstandingAmount', 0] }, true, false],
              },
            },
          },
          {
            $project: {
              _id: 1,
              type: 1,
              hostelId: '$hostelData._id',
              hostelName: '$hostelData.name',
              bedType: '$bedType',
              roomNumber: 1,
              monthCount: {
                $cond: [
                  { $eq: ['$outstandingAmount', 0] },
                  monthCount,
                  '$monthCount',
                ],
              },
              actualSecurityFee: '$securityFee',
              securityFee: '$securityFeeOutStanding',
              accommodationCostWithGst: {
                $cond: {
                  if: { $eq: ['$outstandingAmount', 0] },
                  then: {
                    $cond: {
                      if: { $gt: [daysCount, 0] },
                      then: {
                        $multiply: [
                          {
                            $divide: [
                              '$bedDetails.accommodationCostWithGst',
                              totalDaysInMonth,
                            ],
                          },
                          daysCount,
                        ],
                      },
                      else: {
                        $multiply: [
                          '$bedDetails.accommodationCostWithGst',
                          monthCount,
                        ],
                      },
                    },
                  },
                  else: '$accommodationOutstanding',
                },
              },
              hostelChargeWithGst: {
                $cond: {
                  if: { $eq: ['$outstandingAmount', 0] },
                  then: {
                    $cond: {
                      if: { $gt: [daysCount, 0] },
                      then: {
                        $multiply: [
                          {
                            $divide: [
                              '$bedDetails.hostelChargeWithGst',
                              totalDaysInMonth,
                            ],
                          },
                          daysCount,
                        ],
                      },
                      else: {
                        $multiply: [
                          '$bedDetails.hostelChargeWithGst',
                          monthCount,
                        ],
                      },
                    },
                  },
                  else: '$hostelOutstanding',
                },
              },
              mealCostWithGst: {
                $cond: {
                  if: { $eq: ['$outstandingAmount', 0] },
                  then: {
                    $cond: {
                      if: { $gt: [daysCount, 0] },
                      then: {
                        $multiply: [
                          {
                            $divide: [
                              '$bedDetails.mealCostWithGst',
                              totalDaysInMonth,
                            ],
                          },
                          daysCount,
                        ],
                      },
                      else: {
                        $multiply: ['$bedDetails.mealCostWithGst', monthCount],
                      },
                    },
                  },
                  else: '$mealOutstanding',
                },
              },
              perDayCost: '$perDayCost',
              totalDays: {
                $cond: [
                  { $eq: ['$type', HostelPaymentType.MONTH_WISE] }, // Check if type is monthly
                  {
                    $cond: [
                      { $gt: ['$outstandingAmount', 0] }, // Check if there is outstanding amount
                      '$daysCount', // If there is outstanding, return daysCount
                      {
                        $cond: [
                          { $gt: [daysCount, 0] }, // Check if daysCount is greater than 0
                          daysCount, // Return daysCount if it's greater than 0
                          { $multiply: [30, monthCount] }, // Otherwise, return 30 * monthCount
                        ],
                      },
                    ],
                  },
                  {
                    $cond: [
                      { $eq: ['$type', HostelPaymentType.DAY_WISE] }, // Check if type is daily
                      {
                        $cond: [
                          { $gt: ['$outstandingAmount', 0] }, // Check if there is outstanding amount
                          '$totalDays', // If there is outstanding, return totalDays
                          0, // If no outstanding, return 0
                        ],
                      },
                      '$totalDays', // Fallback for any other type or unspecified type
                    ],
                  },
                ],
              },
              totalAmountWithSecurity: '$totalAmountWithSecurity',
              totalAmountWithOutSecurity: '$totalAmountWithOutSecurity',
              outstandingAmount: '$outstandingAmount',
              isMonthChange: 1,
              daywiseOutstanding: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', HostelPaymentType.DAY_WISE] },
                      { $gt: ['$outstandingAmount', 0] },
                    ],
                  },
                  {
                    $subtract: [
                      '$outstandingAmount',
                      '$securityFeeOutStanding',
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ]);

        break;
      default:
        throw new HttpException(INVALID_TYPE, HttpStatus.BAD_REQUEST);
    }

    if (!result || !result.length) return { data: {} };

    return { data: result[0] };
  }

  //SECTION - fetch hostel for hostel payment
  async getHostelForPayment(
    payload: GetPaymentDetailsDto,
  ): Promise<{ data: any }> {
    const { userId, status } = payload;

    if (userId && !mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    let result: any = [];

    switch (status) {
      case PaymentModuleType.NEW:
        //NOTE: Retrieve all hostels with only _id and name fields
        result = await this.hostelModel.find().select('_id name').lean();
        break;

      case PaymentModuleType.EXISTING:
        result = await this.hostelRentalPayModel.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              paymentStatus: PaymentStatus.PAID,
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
                  HostelTransactionStatus.INSTALLMENT_COMPLETE,
                  HostelTransactionStatus.INSTALLMENT_TERMINATED,
                  HostelTransactionStatus.SECURITY_REFUND,
                ],
              },
            },
          },
          { $replaceRoot: { newRoot: '$latestDocument' } },
          {
            $lookup: {
              from: 'hostels',
              localField: 'hostelId',
              foreignField: '_id',
              as: 'hostelData',
            },
          },
          { $unwind: '$hostelData' },
          { $project: { _id: '$hostelData._id', name: '$hostelData.name' } },
        ]);
        break;

      default:
        throw new HttpException(INVALID_TYPE, HttpStatus.BAD_REQUEST);
    }

    if (!result || !result.length)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return { data: result };
  }

  //SECTION - fetch hostel bedType for hostel payment
  async fetchHostelBedTypeForPayment(
    payload: GetPaymentDetailsDto,
  ): Promise<{ data: any }> {
    const { userId, hostelId, status } = payload;

    if (
      (userId && !mongoose.isValidObjectId(userId)) ||
      (hostelId && !mongoose.isValidObjectId(hostelId))
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    let result: any = [];

    switch (status) {
      case PaymentModuleType.NEW:
        result = await this.hostelModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
          {
            $project: {
              bedDetails: {
                $map: {
                  input: '$bedDetails',
                  as: 'bed',
                  in: {
                    _id: '$$bed._id',
                    bedType: { $ifNull: ['$$bed.bedType', null] },
                  },
                },
              },
            },
          },
          { $project: { bedDetails: 1 } },
          { $unwind: '$bedDetails' },
          { $replaceRoot: { newRoot: '$bedDetails' } },
        ]);
        break;
      case PaymentModuleType.EXISTING:
        result = await this.hostelRentalPayModel.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              paymentStatus: PaymentStatus.PAID,
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
                  HostelTransactionStatus.INSTALLMENT_COMPLETE,
                  HostelTransactionStatus.INSTALLMENT_TERMINATED,
                  HostelTransactionStatus.SECURITY_REFUND,
                ],
              },
            },
          },
          { $replaceRoot: { newRoot: '$latestDocument' } },
          {
            $lookup: {
              from: 'hostels',
              localField: 'hostelId',
              foreignField: '_id',
              as: 'hostelData',
            },
          },
          { $unwind: '$hostelData' },
          { $project: { _id: '$hostelData._id', bedType: '$bedType' } },
        ]);
        break;

      default:
        throw new HttpException(INVALID_TYPE, HttpStatus.BAD_REQUEST);
    }

    if (!result || !result.length) return { data: [] };

    return { data: result };
  }

  //SECTION - update floor number
  async updateFloorNumber(): Promise<string> {
    const records = await this.hostelValidityModel.find();

    // Array to hold bulk update operations
    const bulkOperations = [];

    for (const ele of records) {
      const { _id, hostelId, bedType, roomNumber } = ele;

      const [hostelDetails] = await this.hostelModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
        {
          $project: {
            roomMapping: {
              $filter: {
                input: '$roomMapping',
                as: 'room',
                cond: {
                  $and: [
                    { $eq: ['$$room.bedType', bedType] },
                    { $eq: ['$$room.roomNumber', roomNumber] },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            roomMapping: { $arrayElemAt: ['$roomMapping', 0] },
          },
        },
        {
          $project: {
            'roomMapping.floorNumber': 1,
          },
        },
      ]);

      // Prepare bulk update operation
      bulkOperations.push({
        updateOne: {
          filter: { _id }, // Filter by _id of hostelValidity document
          update: {
            $set: { floorNumber: hostelDetails?.roomMapping?.floorNumber },
          },
        },
      });
    }

    // Execute bulk update if there are operations
    if (bulkOperations.length > 0) {
      await this.hostelValidityModel.bulkWrite(bulkOperations);
    }

    return UPDATE_DATA;
  }

  //SECTION - bedTypes By HostelId And floorNumber
  async bedTypesByHostelIdAndfloorNumber(
    payload: BedTypesByFloorNumberDto,
  ): Promise<{ data: any[] }> {
    const { hostelId, floorNumber } = payload;

    // Base match stage
    const matchStage: any = { _id: new mongoose.Types.ObjectId(hostelId) };

    // Initialize the aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          bedDetails: 1, // Include bedDetails for the case where floorNumber is not provided
          roomMapping: floorNumber
            ? {
                $filter: {
                  input: '$roomMapping',
                  as: 'room',
                  cond: { $eq: ['$$room.floorNumber', floorNumber] },
                },
              }
            : '$roomMapping', // Include roomMapping directly if no floorNumber
        },
      },
    ];

    const hostelDetails = await this.hostelModel.aggregate(pipeline);

    if (!hostelDetails || hostelDetails.length === 0) {
      return { data: [] }; // Return empty data if no records found
    }

    // Transform the retrieved data based on whether floorNumber is provided
    const transformedData = (
      floorNumber ? hostelDetails[0].roomMapping : hostelDetails[0].bedDetails
    ).map((item: any) => ({
      _id: item._id,
      bedType: item.bedType ?? null,
    }));

    // Filter for unique bedType
    const uniqueBedTypes: { [key: string]: any } = {};
    const uniqueTransformedData = transformedData.filter((item) => {
      if (!uniqueBedTypes[item.bedType]) {
        uniqueBedTypes[item.bedType] = true; // Mark this bedType as seen
        return true; // Include this item
      }
      return false; // Exclude this item
    });

    return { data: uniqueTransformedData };
  }

  //SECTION - fetch mapped Room number based on hostel and muliple bed type
  async getRoomsByMulipleBedType(
    payload: GetMulipleMappedRoomNumberDto,
  ): Promise<{ data: any }> {
    const { hostelId, bedType, floorNumber } = payload;

    // Aggregation pipeline to filter rooms based on bedType array and optional floorNumber
    const matchStage: any = {
      _id: new mongoose.Types.ObjectId(hostelId),
    };

    // Project stage to filter rooms by bedType array
    const projectStage: any = {
      roomMapping: {
        $filter: {
          input: '$roomMapping',
          as: 'room',
          cond: {
            $and: [
              { $in: ['$$room.bedType', bedType] }, // Match multiple bed types
              ...(floorNumber
                ? [{ $eq: ['$$room.floorNumber', floorNumber] }]
                : []), // Optional floorNumber match
            ],
          },
        },
      },
    };

    const result = await this.hostelModel.aggregate([
      { $match: matchStage },
      { $project: projectStage },
      {
        $project: {
          'roomMapping.roomNumber': 1,
          'roomMapping.floorNumber': 1,
          'roomMapping.bedType': 1,
          'roomMapping.totalBeds': 1,
          'roomMapping.vacant': 1,
          'roomMapping.purchasedBed': 1,
        },
      },
    ]);

    if (!result || !result.length || !result[0].roomMapping.length) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    return { data: result[0].roomMapping };
  }

  //ANCHOR - get months end date and days left based on the current date
  private async getMonthInfo(joiningDate: Date): Promise<any> {
    //NOTE: Get current date
    const currentDate = new Date(joiningDate);

    //NOTE: Get the last day of the current month
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    // lastDayOfMonth.setHours(
    //   lastDayOfMonth.getHours() + 5,
    //   lastDayOfMonth.getMinutes() + 30,
    // );

    //NOTE: Calculate total days in the month
    const totalDaysInMonth = lastDayOfMonth.getDate();

    return { totalDaysInMonth };
  }
}
