import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';
import { SchedulerRegistry } from '@nestjs/schedule';
import mongoose, { Model } from 'mongoose';
import { LiveConsulting } from 'src/schema/live-consulting.schema';
import { CreateLiveConsultingDto } from './dto/create-live-consulting.dto';
import {
  LiveClassStatus,
  LiveClassType,
  TransactionStatus,
} from 'src/utills/enum';
import {
  CREATE_DATA,
  DELETE_DATA,
  INVALID_ID,
  LIVE_CONSULTATION_DUPLICATE,
  LIVE_CONSULTATION_EDIT_ERROR,
  RECORD_NOT_FOUND,
  START_TIME_ERROR,
  UPDATE_DATA,
  ZOOM_DETAILS_ERROR,
} from 'src/utills/messages';
import { ParsedQs } from 'qs';
import { UpdateLiveConsultingDto } from './dto/update-live-consulting.dto';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { UpdateLiveConsultingStatusDto } from './dto/update-live-status.dto';

@Injectable()
export class LiveConsultingService {
  constructor(
    @InjectModel(LiveConsulting.name)
    private liveConsultingModel: Model<LiveConsulting>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  //SECTION - create Live Consulting
  async createLiveConsulting(
    payload: CreateLiveConsultingDto,
    createdById: string,
  ): Promise<any> {
    const {
      doctorId,
      patientId,
      orderId,
      startTime,
      duration,
      liveConsultingType,
      meetingNumber,
      password,
      paymentId,
    } = payload;

    //NOTE: Check meetingNumber and password for Zoom
    if (
      liveConsultingType === LiveClassType.ZOOM_CLASS &&
      (!meetingNumber || !password?.trim())
    ) {
      throw new HttpException(ZOOM_DETAILS_ERROR, HttpStatus.BAD_REQUEST);
    }

    //NOTE: Check if live consulting already exists
    const isExisting = await this.liveConsultingModel.exists({
      patientId: new mongoose.Types.ObjectId(patientId),
      orderId: new mongoose.Types.ObjectId(orderId),
    });

    if (isExisting) {
      throw new HttpException(
        LIVE_CONSULTATION_DUPLICATE,
        HttpStatus.BAD_REQUEST,
      );
    }

    //NOTE: Parse the start time string
    const startDateTime = new Date(startTime);
    startDateTime.setHours(
      startDateTime.getHours() + 5,
      startDateTime.getMinutes() + 30,
    );

    //NOTE: Calculate endTime of live class
    const endTime = new Date(startDateTime.getTime() + duration * 60000);

    //NOTE: Create live consulting
    await this.liveConsultingModel.create({
      patientId,
      orderId,
      paymentId,
      doctorId,
      startTime: startDateTime,
      duration,
      endTime,
      liveConsultingType,
      meetingNumber,
      password,
      createdBy: createdById,
    });

    //NOTE - update the finance model
    await this.healthCareFinanceModel.findByIdAndUpdate(paymentId, {
      $set: { isLiveConsulting: true },
    });
    return CREATE_DATA;
  }

  //SECTION - Create live class
  async updateLiveConsultation(
    id: string,
    payload: UpdateLiveConsultingDto,
    updatedById: string,
  ): Promise<any> {
    const {
      doctorId,
      patientId,
      paymentId,
      orderId,
      startTime,
      duration,
      liveConsultingType,
      meetingNumber,
      password,
      status,
    } = payload;

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const consultationData = await this.liveConsultingModel.findById(id);

    if (!consultationData) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (
      consultationData.liveConsultingStatus === LiveClassStatus.COMPLETED ||
      consultationData.liveConsultingStatus === LiveClassStatus.ONGOING
    ) {
      throw new HttpException(
        LIVE_CONSULTATION_EDIT_ERROR,
        HttpStatus.NOT_FOUND,
      );
    }

    const currentDate = new Date();
    const startDateTime = new Date(startTime);

    if (currentDate.getTime() > startDateTime.getTime()) {
      throw new HttpException(START_TIME_ERROR, HttpStatus.BAD_REQUEST);
    }

    startDateTime.setHours(
      startDateTime.getHours() + 5,
      startDateTime.getMinutes() + 30,
    );

    const endTime = new Date(startDateTime.getTime() + duration * 60000);

    const isExisting = await this.liveConsultingModel.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      patientId: new mongoose.Types.ObjectId(patientId),
      orderId: new mongoose.Types.ObjectId(orderId),
    });

    if (isExisting) {
      throw new HttpException(
        LIVE_CONSULTATION_DUPLICATE,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedConsultation = {
      doctorId,
      patientId,
      paymentId,
      orderId,
      startTime: startDateTime,
      duration,
      endTime,
      liveConsultingType,
      meetingNumber,
      password,
      status,
      updatedBy: updatedById,
    };

    await this.liveConsultingModel.findByIdAndUpdate(id, updatedConsultation);

    if (consultationData.paymentId.toString() !== paymentId) {
      await this.healthCareFinanceModel.findByIdAndUpdate(paymentId, {
        $set: { isLiveConsulting: true },
      });

      await this.healthCareFinanceModel.findByIdAndUpdate(
        consultationData.paymentId,
        { $set: { isLiveConsulting: false } },
      );
    }

    return UPDATE_DATA;
  }

  //SECTION - get All Live Consultation
  async getAllLiveConsultation(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, fromDate, toDate, doctorId } = query as unknown as {
      page: string;
      limit: string;
      fromDate: Date;
      toDate: Date;
      doctorId: string;
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - filter based on Live Consultation start time and end time
    const dateFilter =
      fromDate && toDate
        ? {
            $and: [
              {
                startTime: {
                  $gte: new Date(fromDate).setUTCHours(0, 0, 0, 0),
                },
              },
              {
                endTime: {
                  $lte: new Date(toDate).setUTCHours(23, 59, 59, 999),
                },
              },
            ],
          }
        : {};

    //NOTE - doctorId based filter
    const doctorIdFilter = doctorId ? { doctorId } : {};

    //NOTE - get live classes count
    const count = await this.liveConsultingModel.countDocuments({
      status: true,
      ...dateFilter,
      ...doctorIdFilter,
    });

    //NOTE - find all live class data
    const liveConsultation_details: any = await this.liveConsultingModel
      .find({ status: true, ...dateFilter, ...doctorIdFilter })
      .populate([
        { path: 'doctorId', select: 'name' },
        { path: 'patientId', select: 'name' },
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      liveConsultation_details?.map(async (ele: any) => {
        //NOTE - generate signature
        const signature = await this.zoomSignatureAdmin(ele?.meetingNumber);

        return {
          _id: ele._id,
          doctor: ele?.doctorId?.name ?? null,
          patient: ele?.patientId?.name ?? null,
          startTime: ele?.startTime ?? null,
          duration: ele?.duration ?? null,
          endTime: ele?.endTime ?? null,
          meetingNumber: ele?.meetingNumber ?? null,
          password: ele?.password ?? null,
          zoomKey: process.env.ZOOM_SDK_KEY,
          zoomSecret: process.env.ZOOM_SDK_SECRET,
          liveConsultationType: ele?.liveConsultingType ?? null,
          liveConsultationStatus: ele.liveConsultingStatus ?? null,
          signature: signature,
          createdBy: ele.createdBy?.name ?? null,
          updatedBy: ele.updatedBy?.name ?? null,
          createdAt: ele.createdAt ?? null,
        };
      }),
    );
    return { data, count };
  }

  //SECTION - live Consultation Of Patient for(web and mobile)
  async liveConsultationOfPatient(patientId: string): Promise<{ data: any[] }> {
    //NOTE - find all Consultation data
    const liveConsultation_details: any = await this.liveConsultingModel
      .find({
        patientId: new mongoose.Types.ObjectId(patientId),
        liveConsultingStatus: LiveClassStatus.UPCOMING,
      })
      .populate([
        { path: 'doctorId', select: 'name' },
        { path: 'patientId', select: 'name' },
      ])
      .sort({ startTime: 1 })
      .lean();

    //NOTE - push final data
    const data = await Promise.all(
      liveConsultation_details?.map(async (ele: any) => {
        //NOTE - generate signature
        const signature = await this.zoomSignatureAdmin(ele?.meetingNumber);

        return {
          _id: ele._id,
          doctor: ele?.doctorId?.name ?? null,
          startTime: ele.startTime ?? null,
          duration: ele.duration ?? null,
          endTime: ele.endTime ?? null,
          meetingNumber: ele?.meetingNumber ?? null,
          password: ele?.password ?? null,
          zoomKey: process.env.ZOOM_SDK_KEY,
          zoomSecret: process.env.ZOOM_SDK_SECRET,
          liveConsultationType: ele?.liveConsultingType,
          liveConsultationStatus: ele.liveConsultingStatus,
          signature,
        };
      }),
    );
    return { data };
  }

  //SECTION - find one live class  by id
  async getLiveConsultanceById(id: string): Promise<any> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE - get live class by id
    const liveConsultation: any = await this.liveConsultingModel
      .findById(id)
      .populate([
        { path: 'patientId', select: 'name' },
        { path: 'doctorId', select: 'name' },
      ]);

    if (!liveConsultation)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const data = {
      _id: liveConsultation?._id,
      patientId: liveConsultation?.patientId ?? null,
      doctorId: liveConsultation?.doctorId ?? null,
      paymentId: liveConsultation?.paymentId ?? null,
      orderId: liveConsultation?.orderId ?? null,
      startTime: liveConsultation?.startTime ?? null,
      duration: liveConsultation?.duration ?? null,
      meetingNumber: liveConsultation?.meetingNumber ?? null,
      password: liveConsultation?.password ?? null,
      liveConsultingType: liveConsultation?.liveConsultingType ?? null,
      zoomKey: process.env.ZOOM_SDK_KEY,
      zoomSecret: process.env.ZOOM_SDK_SECRET,
      signature:
        (await this.zoomSignatureAdmin(liveConsultation?.meetingNumber)) ??
        null,
    };

    return data;
  }

  //SECTION - delete live class details
  async deleteLiveConsultation(id: string): Promise<string> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: Find the live consultation to delete
    const consulting = await this.liveConsultingModel.findOneAndDelete({
      _id: id,
      liveConsultingStatus: LiveClassStatus.UPCOMING,
    });

    //NOTE: If the consultation doesn't exist or is not upcoming, throw an error
    if (!consulting) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    //NOTE: Update the finance model
    await this.healthCareFinanceModel.findByIdAndUpdate(
      { _id: consulting.paymentId },
      { $set: { isLiveConsulting: false } },
    );

    return DELETE_DATA;
  }

  //SECTION - get all Patient List
  async getPatientList(): Promise<{ data: any[] }> {
    //NOTE - find all live class data

    const patient_list: any = await this.healthCareFinanceModel.aggregate([
      {
        $match: {
          transactionStatus: {
            $in: [
              TransactionStatus.FULL_PAYMENT,
              TransactionStatus.INSTALLMENT_COMPLETE,
            ],
          },
          isLiveConsulting: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'healthcareusers',
          localField: 'userId',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'hospitalorders',
          localField: 'parentOrderId',
          foreignField: '_id',
          as: 'orderData',
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          parentOrderId: 1,
          name: {
            $cond: {
              if: { $isArray: '$userData' },
              then: { $arrayElemAt: ['$userData.name', 0] },
              else: null,
            },
          },
          order: {
            $cond: {
              if: { $isArray: '$orderData' },
              then: { $arrayElemAt: ['$orderData.mkcOrderId', 0] },
              else: null,
            },
          },
        },
      },
    ]);

    return { data: patient_list };
  }

  //SECTION - update Live Consulting Status
  async updateLiveConsultingStatus(
    payload: UpdateLiveConsultingStatusDto,
    staffId: string,
  ): Promise<string> {
    const { liveConsultingId, status } = payload;
    if (
      !mongoose.isValidObjectId(staffId) ||
      !mongoose.isValidObjectId(liveConsultingId)
    ) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    //NOTE: Find the live consultation to update
    const consulting = await this.liveConsultingModel.findById(
      liveConsultingId,
    );
    if (!consulting) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    if (consulting.liveConsultingStatus === LiveClassStatus.UPCOMING) {
      //NOTE: Update the live consulting status
      await this.liveConsultingModel.findByIdAndUpdate(liveConsultingId, {
        $set: { liveConsultingStatus: status, updatedBy: staffId },
      });

      //NOTE: Schedule the task to update the consulting status after its duration
      const timeoutId = `consulting_${consulting._id}`;

      //NOTE: Clear existing timeout if it exists
      if (this.schedulerRegistry.doesExist('timeout', timeoutId)) {
        this.schedulerRegistry.deleteTimeout(timeoutId);
      }

      const timeout = setTimeout(() => {
        this.updateConsultingAfterDuration(consulting._id);
      }, consulting.duration * 60000);

      this.schedulerRegistry.addTimeout(timeoutId, timeout);
    }

    return UPDATE_DATA;
  }

  //ANCHOR - zoom Signature Admin
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

  //ANCHOR - update consulting After Duration
  private async updateConsultingAfterDuration(id: string): Promise<string> {
    await this.liveConsultingModel.findByIdAndUpdate(id, {
      $set: { liveConsultingStatus: LiveClassStatus.COMPLETED },
    });

    return UPDATE_DATA;
  }
}
