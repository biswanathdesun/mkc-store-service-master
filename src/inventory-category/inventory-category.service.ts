import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { InventoryCategory } from 'src/schema/inventory-category.schema';
import { ParsedQs } from 'qs';
import {
  CREATE_DATA,
  DELETE_DATA,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { GetAllInventroyCategoryInterface } from './interface/inventory-category.interface';
@Injectable()
export class InventoryCategoryService {
  constructor(
    @InjectModel(InventoryCategory.name)
    private inventoryCategoryModel: Model<InventoryCategory>,
  ) {}

  //SECTION - to get all inventroy category
  async getAllInventoryCategory(
    query: ParsedQs,
  ): Promise<{ data: GetAllInventroyCategoryInterface[]; count: number }> {
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };

    //NOTE: Build the search query
    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const [count, inventoryCategory] = await Promise.all([
      this.inventoryCategoryModel.countDocuments(searchQuery),
      this.inventoryCategoryModel
        .find(searchQuery)
        .populate([
          { path: 'createdBy', select: 'name' },
          { path: 'updatedBy', select: 'name' },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
        .select('-updatedAt'),
    ]);

    const result = inventoryCategory.map((ele: any) => ({
      _id: ele?._id,
      name: ele?.name,
      createdBy: ele.createdBy?.name ?? null,
      updatedBy: ele.updatedBy?.name ?? null,
      createdAt: ele.createdAt ?? null,
      status: ele?.status,
    }));

    return { data: result, count };
  }

  //SECTION - get inventory category by id
  async inventoryCategoryById(id: string): Promise<{ data: any }> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const category = await this.inventoryCategoryModel
      .findById(id)
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!category)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);

    return { data: category };
  }

  //SECTION - create a new inventory category
  async createInventoryCategory(
    payload: CreateInventoryCategoryDto,
    createdById: string,
  ): Promise<string> {
    // NOTE - create a warehouse
    await this.inventoryCategoryModel.create({
      ...payload,
      createdBy: createdById,
    });

    return CREATE_DATA;
  }

  //SECTION - update  inventory category by id
  async updateInventoryCategory(
    id: string,
    payload: UpdateInventoryCategoryDto,
    updatedById: string,
  ): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // NOTE - Check if the warehouse with the specified ID exists
    const existingInventoryCategory =
      await this.inventoryCategoryModel.findById(id);

    if (!existingInventoryCategory)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE -  Update the warehouse
    await this.inventoryCategoryModel.findByIdAndUpdate(id, {
      ...payload,
      updatedBy: updatedById,
    });

    return UPDATE_DATA;
  }

  //SECTION - delete inventory category by id
  async deleteInventoryCategory(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const deletedCategory = await this.inventoryCategoryModel.findByIdAndDelete(
      id,
    );

    if (!deletedCategory)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    return DELETE_DATA;
  }
}
