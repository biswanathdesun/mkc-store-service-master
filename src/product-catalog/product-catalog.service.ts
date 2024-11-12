import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import { ProductCatalog } from 'src/schema/product-catalog.schema';
import {
  CREATE_DATA,
  DELETE_DATA,
  INVALID_ID,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { CreateProductCatalogDto } from './dto/create-product-catalog.dto';
import { UpdateProductCatalogDto } from './dto/update-product-catalog.dto';
import { GetAllProductCatalogInterface } from './interface/product-catalog.interface';
@Injectable()
export class ProductCatalogService {
  constructor(
    @InjectModel(ProductCatalog.name)
    private productCatalogModel: Model<ProductCatalog>,
  ) {}

  //SECTION - get all Products
  async getAllProductsCatalog(
    query: ParsedQs,
  ): Promise<{ data: GetAllProductCatalogInterface[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const searchQuery = search
      ? { $or: [{ title: { $regex: search, $options: 'i' } }] }
      : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await this.productCatalogModel.countDocuments(searchQuery);
    const productsData: any[] = await this.productCatalogModel
      .find(searchQuery)
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'updatedBy', select: 'name' },
        { path: 'inventoryCategoryId', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const result = await Promise.all(
      productsData.map(async (ele: any) => {
        return {
          _id: ele?._id,
          title: ele?.title,
          unit: ele?.unit,
          inventoryCategory:
            ele.inventoryCategoryId && ele.inventoryCategoryId?.name,
          varients: ele?.varients,
          createdBy: ele.createdBy?.name,
          updatedBy: ele.updatedBy?.name,
          status: ele?.status,
        };
      }),
    );

    return { data: result, count };
  }

  //SECTION - get product by id
  async getProductCatalogById(id: string): Promise<any> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    const data = await this.productCatalogModel
      .findById({ _id: id })
      .populate([{ path: 'inventoryCategoryId', select: 'name' }])
      .select('-createdAt -updatedAt -createdBy -updatedBy -__v');

    if (!data) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const responseData = {
      _id: data?._id,
      title: data?.title,
      unit: data?.unit,
      inventoryCategory: data?.inventoryCategoryId,
      varients: data?.varients,
    };
    return responseData;
  }

  //SECTION - create a new product
  async createProductCatalog(
    payload: CreateProductCatalogDto,
    createdById: string,
  ): Promise<string> {
    // NOTE - create a product
    await this.productCatalogModel.create({
      ...payload,
      createdBy: createdById,
    });

    return CREATE_DATA;
  }

  //SECTION - update to a existing Product
  async updateProductCatalog(
    id: string,
    payload: UpdateProductCatalogDto,
    updatedById: string,
  ): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    // NOTE - Check if the warehouse with the specified ID exists
    const existingProduct = await this.productCatalogModel.findById(id);

    if (!existingProduct) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    //NOTE -  Update the warehouse
    await this.productCatalogModel.findByIdAndUpdate(id, {
      ...payload,
      updatedBy: updatedById,
    });

    return UPDATE_DATA;
  }

  //SECTION - delete to a existing Product Catalog
  async deleteProductCatalog(id: string): Promise<string> {
    // NOTE - id is valid mongoose id or not
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    //NOTE - get catalog Id
    const catalog = await this.productCatalogModel.findById(id);

    if (!catalog)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    await this.productCatalogModel.findByIdAndDelete({
      _id: id,
    });
    return DELETE_DATA;
  }
}
