import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { StockEntry } from 'src/schema/stock-entry.schema';
import { ParsedQs } from 'qs';
import {
  StockEntryMemberType,
  StockEntryStatus,
  StockEntryType,
} from 'src/utills/enum';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import {
  CREATE_DATA,
  INSUFFICIENT_QUANTITY,
  INVALID_ID,
  RECORD_NOT_FOUND,
} from 'src/utills/messages';
import { CreateItemTransferDto } from './dto/create-item-transfer.dto';
import { ItemTransfer } from 'src/schema/item-transfer.schema';
@Injectable()
export class StockEntryService {
  constructor(
    @InjectModel(StockEntry.name)
    private stockEntryModel: Model<StockEntry>,
    @InjectModel(ItemTransfer.name)
    private itemTransferModel: Model<ItemTransfer>,
  ) {}

  //SECTION - to get all stock entries
  async getAllStockEntries(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
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
    const count = await this.stockEntryModel.countDocuments(searchQuery);
    const stockEntries: any[] = await this.stockEntryModel
      .find(searchQuery)
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'studentId', select: 'name' },
        { path: 'staffId', select: 'name' },
        { path: 'warehouseId', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const result = await Promise.all(
      stockEntries.map(async (ele: any) => {
        return {
          _id: ele._id,
          title: ele.title,
          stockEntryStatus: ele.stockEntryStatus,
          stockEntryType: ele.stockEntryType,
          memberType: ele.memberType,
          memberName:
            ele.memberType === StockEntryMemberType.STUDENT
              ? (ele.studentId && ele.studentId?.name) || null
              : (ele.staffId && ele.staffId?.name) || null,
          supplier: ele.supplier,
          rate: ele.rate,
          quantity: ele.quantity,
          amount: ele.amount,
          billNumber: ele.billNumber,
          reorderQuantity: ele.reorderQuantity,
          warehouseName: (ele.warehouseId && ele.warehouseId?.name) || null,
          buyDate: ele.buyDate,
          purchasedYear: ele.purchasedYear,
          createdBy: ele.createdBy?.name || null,
          status: ele?.status,
        };
      }),
    );

    return { data: result, count };
  }
  //SECTION - to get all stock item transfers
  async getAllItemTransfers(
    query: ParsedQs,
  ): Promise<{ data: any[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search } = query as {
      page: string;
      limit: string;
      search: string;
    };
    const searchQuery = search
      ? { $or: [{ stockId: { $regex: search, $options: 'i' } }] }
      : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const count = await this.stockEntryModel.countDocuments(searchQuery);
    const stockEntries: any[] = await this.itemTransferModel
      .find(searchQuery)
      .populate([
        { path: 'createdBy', select: 'name' },
        { path: 'stockId', select: 'title' },
        { path: 'transferTo', select: 'name' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .select('-createdAt -updatedAt');

    //NOTE - final object to send
    const result = await Promise.all(
      stockEntries.map(async (ele: any) => {
        return {
          _id: ele._id,
          stockTitle: (ele.stockId && ele.stockId?.title) || null,
          quantity: ele.quantity,
          transferTo: (ele.transferTo && ele.transferTo?.name) || null,
          createdBy: ele.createdBy?.name || null,
          status: ele?.status,
        };
      }),
    );

    return { data: result, count };
  }

  //SECTION - create a new stock entry
  async createStockentry(
    payload: CreateStockEntryDto,
    createdById: string,
  ): Promise<string> {
    // NOTE - Destructure payload to get properties needed for creating stock entry
    const {
      title,
      stockEntryStatus,
      stockEntryType,
      memberType,
      memberId,
      supplier,
      rate,
      quantity,
      amount,
      billNumber,
      reorderQuantity,
      warehouseId,
      buyDate,
      purchasedYear,
    } = payload;

    //NOTE -  Create the parameter object for stock entry
    let param: {
      title: string;
      stockEntryStatus: StockEntryStatus;
      stockEntryType: StockEntryType;
      memberType: StockEntryMemberType;
      supplier: string;
      rate: number;
      quantity: number;
      amount: number;
      billNumber: number;
      reorderQuantity: number;
      warehouseId: string;
      buyDate: Date;
      purchasedYear: number;
      studentId?: string;
      staffId?: string;
      createdBy: string;
    } = {
      title,
      stockEntryStatus,
      stockEntryType,
      memberType,
      supplier,
      rate,
      quantity,
      amount,
      billNumber,
      reorderQuantity,
      warehouseId,
      buyDate,
      purchasedYear,
      createdBy: createdById,
    };

    // NOTE - Check memberType and set the appropriate memberId
    if (memberType === StockEntryMemberType.STUDENT && memberId) {
      param = { ...param, studentId: memberId };
    } else if (memberType === StockEntryMemberType.STAFF && memberId) {
      param = { ...param, staffId: memberId };
    }

    // NOTE - Create the stock entry
    await this.stockEntryModel.create(param);

    return CREATE_DATA;
  }

  // SECTION - create a item transfer
  async createItemTransfer(
    payload: CreateItemTransferDto,
    createdById: string,
  ): Promise<string> {
    // NOTE - Destructure payload
    const { stockId, transferTo, quantity } = payload;
    // NOTE - check if stockId is valid id or not
    if (!mongoose.isValidObjectId(stockId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }
    // NOTE - check if stock entry exists or not by the requesting Id
    const itemStock = await this.stockEntryModel.findById({ _id: stockId });

    // NOTE - if does not exists then throw error
    if (!itemStock) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // NOTE - Create the parameter object
    const param: {
      stockId: string;
      transferTo: string;
      quantity: number;
      createdBy: string;
    } = {
      stockId,
      transferTo,
      quantity,
      createdBy: createdById,
    };

    // NOTE - check quantity is sufficient or not to transfer
    if (itemStock.quantity >= quantity) {
      //NOTE -  Update itemStock properties
      itemStock.quantity = itemStock.quantity - quantity;
      itemStock.amount = itemStock.rate * itemStock.quantity;
    } else {
      throw new HttpException(INSUFFICIENT_QUANTITY, HttpStatus.BAD_REQUEST);
    }

    //NOTE - Save the changes to itemStock
    await itemStock.save();

    // NOTE - Create the item transfer
    await this.itemTransferModel.create(param);

    return CREATE_DATA;
  }
}
