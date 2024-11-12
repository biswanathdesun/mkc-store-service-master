import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UserHostelValidity } from 'src/schema/user.hostel.validity.schema';
import { RoomReportDto } from './dto/room-report.dto';
import { INVALID_ID } from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { CommonService } from 'src/utills/commonService';
import { Hostel } from 'src/schema/hostel.schema';
import { VacantReportDto } from './dto/vacant-reporyt.dto';

@Injectable()
export class HostelReportService {
  constructor(
    @InjectModel(UserHostelValidity.name)
    private hostelValidityRepository: Model<UserHostelValidity>,
    @InjectModel(Hostel.name) private hostelRepository: Model<Hostel>,
    private commonService: CommonService,
  ) {}

  //SECTION - retrieve hostel room report
  async hostelRoomReportDetails(
    payload: RoomReportDto,
  ): Promise<{ data: any[]; count: number }> {
    const { page, limit, hostelId, bedType, floorNumber, roomNumber } = payload;
    const skip = (page - 1) * limit;

    // Validate the provided hostelId
    if (!mongoose.isValidObjectId(hostelId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    // Base match stage
    const baseMatchStage: any = {
      hostelId: new mongoose.Types.ObjectId(hostelId),
      status: true,
    };

    // Add optional filters to the match stage
    if (Array.isArray(bedType) && bedType.length > 0) {
      baseMatchStage.bedType = { $in: bedType };
    }

    if (roomNumber) {
      baseMatchStage.roomNumber = roomNumber;
    }

    if (floorNumber) {
      baseMatchStage.floorNumber = floorNumber;
    }

    // Aggregation to get the total count of unique documents
    const uniqueCountAggregation =
      await this.hostelValidityRepository.aggregate([
        { $match: baseMatchStage },
        { $group: { _id: { userId: '$userId' } } },
        { $count: 'totalCount' },
      ]);

    const count =
      uniqueCountAggregation.length > 0
        ? uniqueCountAggregation[0].totalCount
        : 0;

    // Aggregation to get unique documents with pagination
    const report = await this.hostelValidityRepository.aggregate([
      { $match: baseMatchStage },
      {
        $group: {
          _id: { userId: '$userId' },
          userId: { $last: '$userId' },
          hostelId: { $last: '$hostelId' },
          roomNumber: { $last: '$roomNumber' },
          bedType: { $last: '$bedType' },
          validityEndDate: { $last: '$validityEndDate' },
        },
      },
      {
        $lookup: {
          from: 'hostels',
          localField: 'hostelId',
          foreignField: '_id',
          as: 'hostelDetails',
        },
      },
      {
        $unwind: { path: '$hostelDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'hostelenquiries',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'hostels',
          let: { roomNumber: '$roomNumber', hostelId: '$hostelId' },
          pipeline: [
            { $unwind: '$roomMapping' },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$roomMapping.roomNumber', '$$roomNumber'] },
                    { $eq: ['$_id', '$$hostelId'] },
                  ],
                },
              },
            },
            { $project: { floorNumber: '$roomMapping.floorNumber' } },
          ],
          as: 'roomMappingDetails',
        },
      },
      {
        $unwind: {
          path: '$roomMappingDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          hostelId: 1,
          hostelName: '$hostelDetails.name',
          userId: 1,
          userName: '$userDetails.name',
          phone: '$userDetails.phone',
          bedType: 1,
          roomNumber: { $ifNull: ['$roomNumber', 'N/A'] }, // Default if not found
          floorNumber: { $ifNull: ['$roomMappingDetails.floorNumber', 'N/A'] }, // Default if not found
          validityEndDate: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return { data: report, count };
  }

  //SECTION - retrieve hostel room pdf
  async hostelRoomReportPdf(@Query() query: ParsedQs): Promise<string> {
    const { hostelId, bedType, roomNumber, floorNumber } = query as unknown as {
      hostelId: string;
      bedType: string;
      roomNumber: string;
      floorNumber: string;
    };

    //NOTE: Validate the provided hostelId
    if (!mongoose.isValidObjectId(hostelId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    //NOTE: Base match stage
    const baseMatchStage: any = {
      hostelId: new mongoose.Types.ObjectId(hostelId),
      status: true,
    };

    //NOTE: Add optional filters to the match stage
    if (bedType) {
      // Split bedType by commas and convert to numbers, handling empty values
      const bedTypesArray = bedType
        .split(',')
        .map((b) => Number(b.trim()))
        .filter((b) => !isNaN(b));
      baseMatchStage.bedType =
        bedTypesArray.length > 1 ? { $in: bedTypesArray } : bedTypesArray[0]; // Use the single value if only one valid bedType is provided
    }

    if (roomNumber) {
      baseMatchStage.roomNumber = Number(roomNumber);
    }

    if (floorNumber) {
      baseMatchStage.floorNumber = Number(floorNumber);
    }

    //NOTE: Aggregation to get unique documents with pagination
    const report = await this.hostelValidityRepository.aggregate([
      { $match: baseMatchStage },
      {
        $group: {
          _id: { userId: '$userId' },
          userId: { $last: '$userId' },
          hostelId: { $last: '$hostelId' },
          roomNumber: { $last: '$roomNumber' },
          bedType: { $last: '$bedType' },
          validityEndDate: { $last: '$validityEndDate' },
        },
      },
      {
        $lookup: {
          from: 'hostels',
          localField: 'hostelId',
          foreignField: '_id',
          as: 'hostelDetails',
        },
      },
      {
        $unwind: { path: '$hostelDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'hostelenquiries',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'hostels',
          let: { roomNumber: '$roomNumber', hostelId: '$hostelId' },
          pipeline: [
            { $unwind: '$roomMapping' },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$roomMapping.roomNumber', '$$roomNumber'] },
                    { $eq: ['$_id', '$$hostelId'] },
                  ],
                },
              },
            },
            { $project: { floorNumber: '$roomMapping.floorNumber' } },
          ],
          as: 'roomMappingDetails',
        },
      },
      {
        $unwind: {
          path: '$roomMappingDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          hostelId: 1,
          hostelName: '$hostelDetails.name',
          userId: 1,
          userName: '$userDetails.name',
          phone: '$userDetails.phone',
          bedType: 1,
          roomNumber: 1,
          floorNumber: '$roomMappingDetails.floorNumber',
          validityEndDate: {
            $dateToString: {
              format: '%d-%m-%Y',
              date: '$validityEndDate',
              timezone: 'Asia/Kolkata',
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    console.log('report', report);
    const jsonData = {
      path: process.env.HOSTEL_ROOM_REPORT_EJS_URL,
      hostelName: report[0]?.hostelName ?? null,
      data: report,
      date: moment(currentDate).format('DD-MM-YYYY'),
    };

    const pdf = await this.commonService.generatePdfForReports(jsonData);

    return pdf;
  }

  //SECTION - retrieve room Vacant Report
  async roomVacantReportDetails(
    payload: VacantReportDto,
  ): Promise<{ data: any[] }> {
    const { hostelId } = payload;

    // Validate the provided hostelI
    if (!mongoose.isValidObjectId(hostelId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // Aggregation pipeline to filter rooms and include hostel name
    const result = await this.hostelRepository.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
      { $unwind: '$roomMapping' },
      {
        $project: {
          name: 1,
          'roomMapping.roomNumber': 1,
          'roomMapping.floorNumber': 1,
          'roomMapping.bedType': 1,
          'roomMapping.totalBeds': 1,
          'roomMapping.vacant': 1,
          'roomMapping.purchasedBed': 1,
        },
      },
    ]);

    // Flatten the result to get individual room details
    const flattenedResult = result.map((item) => ({
      name: item.name,
      ...item.roomMapping,
    }));

    if (!flattenedResult || !flattenedResult.length) {
      return { data: [] };
    }

    return { data: flattenedResult };
  }

  //SECTION - retrieve room Vacant Report pdf
  async roomVacantReportDetailsPdf(@Query() query: ParsedQs): Promise<string> {
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    const { hostelId } = query as unknown as {
      hostelId: string;
    };

    // Validate the provided hostelI
    if (!mongoose.isValidObjectId(hostelId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // Aggregation pipeline to filter rooms and include hostel name
    const result = await this.hostelRepository.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(hostelId) } },
      { $unwind: '$roomMapping' },
      {
        $project: {
          name: 1,
          'roomMapping.roomNumber': 1,
          'roomMapping.floorNumber': 1,
          'roomMapping.bedType': 1,
          'roomMapping.totalBeds': 1,
          'roomMapping.vacant': 1,
          'roomMapping.purchasedBed': 1,
        },
      },
    ]);

    // Flatten the result to get individual room details
    const flattenedResult = result.map((item) => ({
      name: item.name,
      ...item.roomMapping,
    }));

    const jsonData = {
      path: process.env.HOSTEL_ROOM_VACANT_REPORT_EJS_URL,
      hostelName: flattenedResult[0]?.name ?? null,
      data: flattenedResult ?? [],
      date: moment(currentDate).format('DD-MM-YYYY'),
    };

    const pdf = await this.commonService.generatePdfForReports(jsonData);

    return pdf;
  }
}
