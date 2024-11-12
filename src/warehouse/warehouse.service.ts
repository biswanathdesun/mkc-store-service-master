import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Warehouse } from 'src/schema/warehouse.schema';
import { ParsedQs } from 'qs';
import {
  CREATE_DATA,
  DELETE_DATA,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import {
  GetAllWarehouseInterface,
  WarehouseInterface,
} from './interface/warehouse.interface';
@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(Warehouse.name)
    private warehouseModel: Model<Warehouse>,
  ) {}

  //SECTION - get all warehouse
  async getAllWarehouse(
    query: ParsedQs,
  ): Promise<{ data: GetAllWarehouseInterface[]; count: number }> {
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };

    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const [count, warehouseData] = await Promise.all([
      this.warehouseModel.countDocuments(searchQuery),
      this.warehouseModel
        .find(searchQuery)
        .populate([
          { path: 'createdBy', select: 'name' },
          { path: 'updatedBy', select: 'name' },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
        .select('-createdAt -updatedAt'),
    ]);

    const result = warehouseData.map((ele: any) => ({
      _id: ele?._id,
      name: ele?.name ?? null,
      address: ele?.address ?? null,
      state: ele.state?.name ?? null,
      city: ele.city?.name ?? null,
      pincode: ele?.pincode ?? null,
      createdBy: ele.createdBy?.name ?? null,
      updatedBy: ele.updatedBy?.name ?? null,
      isPrimary: ele?.isPrimary ?? false,
      isShop: ele?.isShop ?? false,
      status: ele?.status,
    }));

    return { data: result, count };
  }

  //SECTION - get warehouse by id
  async getWarehouseById(id: string): Promise<{ data: WarehouseInterface }> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const warehouse = await this.warehouseModel
      .findById(id)
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!warehouse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    return { data: warehouse };
  }

  //SECTION - create a new warehouse
  async createWarehouse(
    payload: CreateWarehouseDto,
    staffId: string,
  ): Promise<string> {
    const { isPrimary, isShop } = payload;
    const updates = [];
    if (isPrimary) {
      updates.push(
        this.warehouseModel.findOneAndUpdate(
          { isPrimary: true },
          { isPrimary: false, updatedBy: staffId },
          { new: true },
        ),
      );
    }
    if (isShop) {
      updates.push(
        this.warehouseModel.findOneAndUpdate(
          { isShop: true },
          { isShop: false, updatedBy: staffId },
          { new: true },
        ),
      );
    }
    await Promise.all(updates);
    await this.warehouseModel.create({
      ...payload,
      createdBy: staffId,
    });

    return CREATE_DATA;
  }

  //SECTION - update to a existing warehouse
  async updateWarehouse(
    id: string,
    payload: UpdateWarehouseDto,
    staffId: string,
  ): Promise<string> {
    //NOTE: Validate the mongoose ID
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    //NOTE: Check if the warehouse with the specified ID exists
    const existingWarehouse = await this.warehouseModel.findById(id);
    if (!existingWarehouse) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    const updates = [];
    if (payload?.isPrimary) {
      updates.push(
        this.warehouseModel.findOneAndUpdate(
          { isPrimary: true, _id: { $ne: id } },
          { isPrimary: false, updatedBy: staffId },
          { new: true },
        ),
      );
    }
    if (payload?.isShop) {
      updates.push(
        this.warehouseModel.findOneAndUpdate(
          { isShop: true, _id: { $ne: id } },
          { isShop: false, updatedBy: staffId },
          { new: true },
        ),
      );
    }
    await Promise.all(updates);
    //NOTE: Update the warehouse
    await this.warehouseModel.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: staffId },
      { new: true },
    );

    return UPDATE_DATA;
  }

  //SECTION - delete to a existing warehouse
  async deleteWarehouse(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const deletedWareHouse = await this.warehouseModel.findByIdAndDelete({
      _id: id,
    });

    if (!deletedWareHouse)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return DELETE_DATA;
  }
}
