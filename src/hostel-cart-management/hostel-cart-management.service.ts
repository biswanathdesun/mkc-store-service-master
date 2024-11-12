import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { HostelCart } from 'src/schema/hostel-cart.schema';
import { Hostel } from 'src/schema/hostel.schema';
import {
  DELETE_DATA,
  INVALID_ID,
  PRODUCT_ADD_IN_CART,
  RECORD_NOT_FOUND,
} from 'src/utills/messages';
import { AddToHostelCartDto } from './dto/add-hostel-cart.dto';
import { BedTypes, HostelPaymentType } from 'src/utills/enum';
import { HostelPaymentSummary } from 'src/schema/hostel.payment.summary';
import { CommonService } from 'src/utills/commonService';
import { CheckInHostelCartDto } from './dto/check-in-cart.dto';

@Injectable()
export class HostelCartManagementService {
  constructor(
    @InjectModel(Hostel.name) private hostelRepository: Model<Hostel>,
    @InjectModel(HostelCart.name)
    private hostelCartRepository: Model<HostelCart>,
    @InjectModel(HostelPaymentSummary.name)
    private hostelPaymentSummaryRepository: Model<HostelPaymentSummary>,
    private commonService: CommonService,
  ) {}

  //SECTION - add To Hostel cart
  async addToHostelCart(
    payload: AddToHostelCartDto,
    userId: string,
  ): Promise<string> {
    const {
      hostelId,
      type,
      roomNumber,
      floorNumber,
      bedType,
      couponId,
      count,
      joiningDate,
    } = payload;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(hostelId)
    )
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - get hostel details
    const hostel = await this.hostelRepository.findById(hostelId);

    if (!hostel)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: get amount based on the detail
    const { amount, totalGst, securityAmount } =
      await this.amountBasedOnTypeAndCount(hostelId, type, bedType, count);

    // NOTE - add or update the details in cart
    await this.hostelCartRepository.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        userId,
        hostelId,
        type,
        roomNumber,
        floorNumber,
        bedType,
        couponId,
        joiningDate,
        count,
        totalGst,
        amount,
        securityAmount,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        returnDocument: 'after',
      },
    );

    return PRODUCT_ADD_IN_CART;
  }

  //SECTION - get To product details from cart
  async getHostelCartDetails(userId: string): Promise<{ data: any[] }> {
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // Perform aggregation to fetch initial cart data
    const cartData = await this.hostelCartRepository.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'hostels',
          localField: 'hostelId',
          foreignField: '_id',
          as: 'hostelDetails',
        },
      },
      { $unwind: { path: '$hostelDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: 1,
          hostelId: 1,
          hostelName: '$hostelDetails.name',
          thumbnail: '$hostelDetails.image',
          roomNumber: 1,
          floorNumber: 1,
          bedType: 1,
          count: 1,
          amount: {
            $subtract: ['$amount', { $add: ['$totalGst', '$securityAmount'] }],
          },
          gstAmount: '$totalGst',
          totalAmount: '$amount',
          securityAmount: 1,
          joiningDate: 1,
        },
      },
    ]);

    if (!cartData || cartData.length === 0) {
      return { data: [] };
    }

    // Process the results to include signed URLs for images
    const cart = await Promise.all(
      cartData.map(async (item) => {
        if (item?.thumbnail && item.thumbnail.length > 0) {
          item.thumbnail = await this.commonService.getSignedUrl(
            item.thumbnail[0].url,
          );
        } else {
          item.thumbnail = null;
        }
        return item;
      }),
    );

    return { data: cart };
  }

  //SECTION - get hostel cart count based on the userId
  async getHostelCartCount(id: string): Promise<number> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - Aggregate to count the documents based on userId
    const [countResult] = await this.hostelCartRepository.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      { $count: 'totalDocuments' },
    ]);

    const count = countResult?.totalDocuments ?? 0;

    return count;
  }

  //SECTION - get user Payment Summary
  async userPaymentSummary(userId: string): Promise<{ data: any }> {
    if (!mongoose.isValidObjectId(userId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - get details using aggregation
    const [cart] = await this.hostelCartRepository.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          _id: 1,
          totalPrice: {
            $subtract: ['$amount', { $add: ['$totalGst', '$securityAmount'] }],
          },
          gstAmount: '$totalGst',
          totalAmount: '$amount',
          securityAmount: 1,
        },
      },
    ]);

    if (!cart) return { data: {} };

    // NOTE - add or update the details in cart
    const payment = await this.hostelPaymentSummaryRepository.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        userId,
        totalPrice: cart?.totalPrice,
        gstAmount: cart?.gstAmount,
        securityAmount: cart?.securityAmount,
        totalAmount: cart?.totalAmount,
        amountToBePaid: cart?.totalAmount,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        returnDocument: 'after',
      },
    );

    //NOTE - send the response
    const result = {
      _id: payment._id,
      totalPrice: payment?.totalPrice,
      gstAmount: payment?.gstAmount,
      securityAmount: payment?.securityAmount,
      totalAmount: payment?.totalAmount,
      amountToBePaid: payment?.totalAmount,
    };

    return { data: result };
  }

  //SECTION - check In hostel already exist in Hostel Cart
  async checkInHostelCart(
    payload: CheckInHostelCartDto,
    userId: string,
  ): Promise<boolean> {
    const { hostelId } = payload;

    if (!mongoose.isValidObjectId(hostelId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Check if a document exists with the given userId and hostelId
    const exists = await this.hostelCartRepository.exists({
      userId: new mongoose.Types.ObjectId(userId),
      hostelId: new mongoose.Types.ObjectId(hostelId),
    });

    //NOTE: Return true if exists, otherwise false
    return !!exists;
  }

  //SECTION - delete cart products
  async deleteHostelCartProducts(id: string, userId: string): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const delete_cart = await this.hostelCartRepository.findByIdAndDelete(id);

    if (!delete_cart)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - delete payment summary
    await this.hostelPaymentSummaryRepository.findByIdAndDelete(userId);

    return DELETE_DATA;
  }

  //ANCHOR - amount Based On Type And Count
  private async amountBasedOnTypeAndCount(
    hostelId: string,
    type: HostelPaymentType,
    bedType: BedTypes,
    count: number,
  ): Promise<{ amount: number; totalGst: number; securityAmount: number }> {
    // NOTE - get hostel details and calculate the amount based on type and count
    const [result] = await this.hostelRepository.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
      { $unwind: '$bedDetails' },
      { $match: { 'bedDetails.bedType': bedType } },
      {
        $addFields: {
          highestSecurityFee: {
            $reduce: {
              input: '$bedDetails.securityFee',
              initialValue: 0,
              in: { $max: ['$$value', '$$this.fees'] },
            },
          },
        },
      },
      {
        $addFields: {
          amount: {
            $cond: {
              if: { $eq: [type, 'monthly'] },
              then: {
                $add: [
                  { $multiply: ['$bedDetails.totalPriceToPay', count] },
                  '$highestSecurityFee',
                ],
              },
              else: { $multiply: ['$bedDetails.perDayCost', count] },
            },
          },
          totalGst: {
            $cond: {
              if: { $eq: [type, 'monthly'] },
              then: {
                $add: [{ $multiply: ['$bedDetails.totalGst', count] }],
              },
              else: 0,
            },
          },
          securityAmount: {
            $cond: {
              if: { $eq: [type, 'monthly'] },
              then: '$highestSecurityFee',
              else: 0,
            },
          },
        },
      },
      {
        $project: { _id: 0, amount: 1, totalGst: 1, securityAmount: 1 },
      },
    ]);

    if (!result)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return {
      amount: result.amount,
      totalGst: result.totalGst,
      securityAmount: result.securityAmount,
    };
  }
}
