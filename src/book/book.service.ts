import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { ParsedQs } from 'qs';
import {
  CREATE_DATA,
  DUPLICATE_SLUG_URL,
  FIELD_BLANK_ERROR,
  INVALID_ID,
  PRODUCT_DELETE_ERROR,
  RECORD_NOT_FOUND,
  UPDATE_DATA,
} from 'src/utills/messages';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from 'src/schema/book.schema';
import { CommonService } from 'src/utills/commonService';
import { CreateBookDto } from './dto/create.book.dto';
import { UpdateBookDto } from './dto/update.book.dto';
import {
  BookByIdInterface,
  BookTypeInterface,
  GetAllBookInterface,
} from './interface/book.interfaces';
import { UserProductDetails } from 'src/schema/user-product-details.schema';
import { GetBookSeoTagDto } from './dto/get-book-tags.dto';
import { AddBookSeoTagDto } from './dto/add-book-seo-tags.dto';
import { BookType } from 'src/utills/enum';
import { AddItemInBooksgDto } from './dto/add-item.dto';
import { AwsUrlValidator } from 'src/utills/aws-url-validator.service';
import { GetBookItemByLanguageDto } from './dto/get-item.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModal: Model<Book>,
    @InjectModel(UserProductDetails.name)
    private userProductDetailsModel: Model<UserProductDetails>,
    private readonly commonService: CommonService,
    private readonly urlValidator: AwsUrlValidator,
  ) {}

  //SECTION - create book
  async createBook(
    payload: CreateBookDto,
    createdById: string,
  ): Promise<string> {
    const {
      categoryId,
      courseIds,
      bookName,
      slugUrl,
      bindingType,
      shortDescription,
      bookWeight,
      longDescription,
      InStock,
      totalPage,
      publication,
      author,
      skuCode,
      languageDetails,
      bookTypeDetails,
      coins,
      status,
      topSeller,
    } = payload;

    //NOTE: Check if slugUrl is already exist
    const isUniqueUrl = await this.bookModal.findOne({ slugUrl });
    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.BAD_REQUEST);

    //NOTE: Upload images concurrently for each language detail
    // await Promise.all(
    //   languageDetails.map(async (data) => {
    //     data.thumbnail = await this.commonService.handleImageUpload(
    //       data.thumbnail,
    //       BOOK_THUMBNAIL,
    //     );
    //     data.sampleDownload = await this.commonService.handleImageUpload(
    //       data.sampleDownload,
    //       BOOK_SAMPLE_DOWNLOAD,
    //     );
    //     if (data.actualbook && data.actualbook?.url) {
    //       data.actualbook.url =
    //         (await this.commonService.handleImageUpload(
    //           data.actualbook.url,
    //           BOOK_LIBRARY,
    //         )) ?? null;
    //     }
    //   }),
    // );

    //NOTE: Prepare book parameters
    const param: any = {
      categoryId,
      courseIds,
      bookName,
      slugUrl,
      bindingType,
      shortDescription,
      bookWeight,
      longDescription,
      InStock,
      totalPage,
      publication,
      author,
      skuCode,
      languageDetails,
      bookTypeDetails,
      status,
      createdBy: createdById,
    };

    //NOTE: Update optional parameters
    if (topSeller) param.topSeller = topSeller;
    if (coins) param.coins = coins;

    //NOTE: Create book
    await this.bookModal.create(param);

    return CREATE_DATA;
  }

  //SECTION - get all book
  async getAllBooks(
    query: ParsedQs,
  ): Promise<{ data: GetAllBookInterface[]; count: number }> {
    //NOTE - add paginanation
    const { page, limit, search, stock, fromDate, toDate, category } =
      query as unknown as {
        page: string;
        limit: string;
        search: string;
        stock: string;
        fromDate: Date;
        toDate: Date;
        category: string;
      };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    //NOTE - serach based on name
    const searchParams = search
      ? { $or: [{ bookName: { $regex: search, $options: 'i' } }] }
      : {};

    //NOTE - serach based on book in stock or not
    const searchStockParams = stock
      ? { InStock: stock.toLowerCase() === 'true' }
      : {};

    //NOTE - date based filter
    const dateFilter =
      fromDate && toDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {};

    //NOTE - category based filter
    const categoryFilter = category ? { categoryId: category } : {};

    //NOTE - get category count
    const count = await this.bookModal.countDocuments({
      ...searchParams,
      ...searchStockParams,
      ...dateFilter,
      ...categoryFilter,
    });

    //NOTE - find all subject data
    const bookDetails: any[] = await this.bookModal
      .find({
        ...searchParams,
        ...searchStockParams,
        ...dateFilter,
        ...categoryFilter,
      })
      .populate([
        { path: 'categoryId', select: 'name' },
        {
          path: 'languageDetails',
          select: 'languageId',
          populate: [{ path: 'languageId', select: 'language' }],
        },
        {
          path: 'bookTypeDetails',
          select: 'bookType priceId',
          populate: [
            {
              path: 'priceId',
              select: 'mrpPrice discountedPrice totalPrice discountPercentage',
            },
          ],
        },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-categoryId');

    //NOTE - push final data
    const data = await Promise.all(
      bookDetails.map(async (item: BookTypeInterface) => {
        const languageDetails = await Promise.all(
          item.languageDetails.map(async (language) => ({
            language: language.languageId,
            thumbnail: await this.commonService.getSignedUrl(
              language.thumbnail,
            ),
          })),
        );

        const bookTypeDetails = await Promise.all(
          item.bookTypeDetails.map(async (types) => ({
            bookType: types.bookType,
            priceId: types.priceId,
          })),
        );

        //NOTE: Check if "Paperback" exists in bookTypeDetails
        const isPaperbackExist = bookTypeDetails.some(
          (type) => type.bookType === BookType.PAPER_BACK,
        );

        return {
          _id: item._id,
          category: item.categoryId?.name ?? null,
          bookName: item?.bookName ?? null,
          slugUrl: item?.slugUrl ?? null,
          bindingType: item?.bindingType ?? null,
          languageDetails,
          shortDescription: item?.shortDescription ?? null,
          bookTypeDetails,
          inStock: item?.InStock ?? null,
          author: item?.author ?? null,
          coins: item?.coins ?? null,
          topSeller: item?.topSeller ?? false,
          isPaperbackExist,
          status: item?.status,
        };
      }),
    );

    return { data, count };
  }

  //SECTION - get book by id details
  async getBookById(id: string): Promise<BookByIdInterface> {
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: get book details
    const book: any = await this.bookModal
      .findById(id)
      .populate([
        { path: 'categoryId', select: 'name' },
        { path: 'courseIds', select: 'name' },
        {
          path: 'languageDetails',
          select: 'languageId thumbnail sampleDownload',
          populate: [{ path: 'languageId', select: 'language' }],
          options: { lean: true },
        },
        {
          path: 'bookTypeDetails',
          select: 'priceId',
          populate: [{ path: 'priceId', select: 'name totalPrice' }],
        },
      ])
      .select(
        '-categoryId -courseIds -__v -createdAt -updatedAt -createdBy -updatedBy',
      )
      .lean();

    if (!book)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - delete keys from languageDetails object and convert urls
    const updatedLanguageDetails = Array.isArray(book.languageDetails)
      ? await Promise.all(
          book.languageDetails.map(
            async ({
              _id,
              thumbnail,
              sampleDownload,
              languageId,
              actualbook,
              ...rest
            }) => ({
              _id,
              languageId: languageId?._id,
              languageName: languageId.language,
              thumbnail: thumbnail
                ? await this.commonService.getSignedUrl(thumbnail)
                : null,
              sampleDownload: sampleDownload
                ? await this.commonService.getSignedUrl(sampleDownload)
                : null,
              actualbook: {
                _id: actualbook?._id,
                title: actualbook?.title,
                url: actualbook?.url
                  ? await this.commonService.getSignedUrl(actualbook?.url)
                  : null,
              },
              ...rest,
            }),
          ),
        )
      : [];

    //NOTE - delete keys from bookTypeDetails
    const updatedBookTypeDetails = Array.isArray(book.bookTypeDetails)
      ? book.bookTypeDetails.map(({ _id, priceId, ...rest }) => ({
          _id,
          priceId: priceId?._id,
          priceName: priceId?.name,
          totalPrice: priceId?.totalPrice,
          ...rest,
        }))
      : [];

    //NOTE: Access the coins property with a default of 0 if it's missing or null
    const coins = book.coins ?? 0;

    return {
      ...book,
      coins,
      languageDetails: updatedLanguageDetails,
      bookTypeDetails: updatedBookTypeDetails,
    };
  }

  //SECTION: Update Book details
  async updateBook(
    id: string,
    payload: UpdateBookDto,
    updateById: string,
  ): Promise<string> {
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    const existBook: any = await this.bookModal.findById(id);
    if (!existBook)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE: Check if the slugUrl is already used by another book
    const isUniqueUrl = await this.bookModal.findOne({
      _id: { $ne: id },
      slugUrl: payload.slugUrl,
    });
    if (isUniqueUrl)
      throw new HttpException(DUPLICATE_SLUG_URL, HttpStatus.CONFLICT);

    //NOTE: Prepare parameters for updating the book
    const params: any = {
      ...payload,
      updatedBy: updateById,
    };

    //NOTE: Language details image upload optimization
    const updatedLanguageDetails: any[] = await Promise.all(
      payload.languageDetails.map(async (data: any) => {
        if (data?._id) {
          //NOTE - Find the existing language detail by its ID
          const exisitingBookDetail: any = existBook?.languageDetails.find(
            (language: any) => language?._id.equals(data?._id),
          );
          if (exisitingBookDetail) {
            //NOTE - Update languageId
            exisitingBookDetail.languageId = data?.languageId;

            // Upload thumbnail if it's a location url
            if (
              data.thumbnail &&
              this.urlValidator.isAWSLocationURL(data?.thumbnail)
            ) {
              data.thumbnail = data.thumbnail;
            } else if (this.urlValidator.isAWSSignedURL(data?.thumbnail)) {
              data.thumbnail = exisitingBookDetail.thumbnail;
            }

            //NOTE - Upload sampleDownload if it's a location Url
            if (
              data.sampleDownload &&
              this.urlValidator.isAWSLocationURL(data?.sampleDownload)
            ) {
              data.sampleDownload = data.sampleDownload;
            } else if (this.urlValidator.isAWSSignedURL(data?.sampleDownload)) {
              data.sampleDownload = exisitingBookDetail.sampleDownload;
            }

            //NOTE - Upload actualbook if it's a base64 string and not exists

            //NOTE -  Update actualbook url if it exists and is a base64 string
            if (
              exisitingBookDetail?.actualbook &&
              this.urlValidator.isAWSLocationURL(data?.actualbook?.url)
            ) {
              data.actualbook.url = data.actualbook.url;
              data.actualbook._id = exisitingBookDetail?.actualbook?._id;
            } else if (this.urlValidator.isAWSSignedURL(data.actualbook.url)) {
              data.actualbook.title = exisitingBookDetail?.actualbook?.title;
              data.actualbook.url = exisitingBookDetail?.actualbook?.url;
              data.actualbook._id = exisitingBookDetail?.actualbook?._id;
            }
          }
        } else {
          // Upload thumbnail if it's a base64 string
          if (
            data.thumbnail &&
            this.urlValidator.isAWSLocationURL(data?.thumbnail)
          ) {
            data.thumbnail = data.thumbnail;
          }

          //NOTE - Upload sampleDownload if it's a base64 string
          if (
            data.sampleDownload &&
            this.urlValidator.isAWSLocationURL(data?.sampleDownload)
          ) {
            data.sampleDownload = data.sampleDownload;
          }

          //NOTE - Upload actualbook if it's a base64 string and not exists
          if (
            data?.actualbook &&
            this.urlValidator.isAWSLocationURL(data?.actualbook?.url)
          ) {
            data.actualbook.url = data.actualbook.url;
          }
        }
        return data;
      }),
    );
    //NOTE: Update languageDetails with the optimized array
    params.languageDetails = updatedLanguageDetails;

    //NOTE: Update the book document
    await this.bookModal.findByIdAndUpdate(id, {
      $set: params,
    });

    return UPDATE_DATA;
  }

  //SECTION - delete book details
  async deleteBook(id: string): Promise<string> {
    //NOTE - check if the id is valid or not
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    //NOTE: check any one buy this course or not
    const check_book = await this.userProductDetailsModel.findOne({
      bookId: new mongoose.Types.ObjectId(id),
    });

    if (check_book)
      throw new HttpException(PRODUCT_DELETE_ERROR, HttpStatus.BAD_REQUEST);

    await this.bookModal.findByIdAndDelete(id);

    return id;
  }

  //SECTION - get Seo Tags for book
  async getSeoTagsDetails(payload: GetBookSeoTagDto): Promise<{ data: any }> {
    const { bookId } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(bookId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const book = await this.bookModal.findById(bookId);

    if (!book)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    const response = {
      metaTitle: book?.metaTitle,
      metaDescription: book?.metaDescription,
    };

    return { data: response };
  }

  //SECTION -Add Seo Tags in care packages
  async manageSeoTags(
    payload: AddBookSeoTagDto,
    updateById: string,
  ): Promise<any> {
    const { bookId, metaTitle, metaDescription } = payload;

    //NOTE - check id
    if (!mongoose.isValidObjectId(bookId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    if (!metaTitle || !metaDescription)
      throw new HttpException(FIELD_BLANK_ERROR, HttpStatus.BAD_REQUEST);

    const checkDetails = await this.bookModal.findById(bookId);

    if (!checkDetails)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    await this.bookModal.findByIdAndUpdate(bookId, {
      $set: {
        metaTitle,
        metaDescription,
        updatedBy: updateById,
      },
    });

    return UPDATE_DATA;
  }

  //SECTION - get book language details by book id
  async getBookLanguageDetails(
    payload: GetBookSeoTagDto,
  ): Promise<{ data: any[] }> {
    const { bookId } = payload;
    if (!mongoose.isValidObjectId(bookId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const book = await this.bookModal.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(bookId) } },
      {
        $lookup: {
          from: 'languages',
          localField: 'languageDetails.languageId',
          foreignField: '_id',
          as: 'languageDetails.languageId',
        },
      },
      { $unwind: '$languageDetails.languageId' },
      {
        $project: {
          _id: 0,
          bookId: '$_id',
          languageId: '$languageDetails.languageId._id',
          language: '$languageDetails.languageId.language',
        },
      },
    ]);

    if (book.length === 0) return { data: [] };

    return { data: book };
  }

  //SECTION - add Inventory Items in books
  async addInventoryItems(
    payload: AddItemInBooksgDto,
    staffId: string,
  ): Promise<string> {
    const { bookId, items } = payload;

    // Check if the bookId is valid
    if (!mongoose.isValidObjectId(bookId)) {
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    // Check if the book exists and retrieve language details
    const checkBook: any = await this.bookModal.findById(
      bookId,
      'languageDetails',
    );
    if (!checkBook) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    const languageDetails = checkBook.languageDetails;

    // Group items by languageId
    const itemsMap = new Map();
    items.forEach((item) => {
      const languageIdStr = item.languageId.toString();
      if (!itemsMap.has(languageIdStr)) {
        itemsMap.set(languageIdStr, []);
      }
      // Push the itemId into the array for the respective languageId
      itemsMap
        .get(languageIdStr)
        .push(new mongoose.Types.ObjectId(item.itemId));
    });

    // Create the update operations for bulkWrite
    const updateOperations = languageDetails.map((langDetail) => {
      const languageIdStr = langDetail.languageId.toString();
      const itemIds = itemsMap.has(languageIdStr)
        ? itemsMap.get(languageIdStr)
        : [];

      return {
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(bookId),
            'languageDetails.languageId': langDetail.languageId,
          },
          update: {
            $addToSet: {
              'languageDetails.$.itemId': { $each: itemIds }, // Add the grouped itemIds array
            },
            updatedBy: staffId,
          },
        },
      };
    });

    // Perform the bulk update
    const result = await this.bookModal.bulkWrite(updateOperations);

    // Check the result of the bulk update
    if (result.modifiedCount === 0) {
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    return UPDATE_DATA;
  }

  //SECTION - fetch Inventory Items for book
  async fetchInventoryItems(payload: GetBookSeoTagDto): Promise<{ data: any }> {
    const { bookId } = payload;

    // Validate bookId
    if (!mongoose.isValidObjectId(bookId))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    // Check if the book exists and populate language details
    const checkBook: any = await this.bookModal
      .findById(bookId)
      .populate([
        {
          path: 'languageDetails',
          select: 'languageId itemId',
          populate: [
            { path: 'languageId', select: 'language' },
            { path: 'itemId', select: 'name' },
          ],
          options: { lean: true },
        },
      ])
      .select('_id bookName languageDetails')
      .lean();

    // Throw an error if the book does not exist
    if (!checkBook)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    // Fetch item details and flatten them
    const itemDetails = checkBook.languageDetails.flatMap(
      (ele: { itemId: any[]; languageId: { _id: any; language: any } }) => {
        return ele.itemId.map((item) => ({
          languageId: ele.languageId?._id ?? null,
          languageName: ele.languageId?.language ?? null,
          itemId: item?._id ?? null,
          itemName: item?.name ?? null,
        }));
      },
    );

    // Structure the result
    const result = {
      _id: checkBook._id,
      bookName: checkBook.bookName ?? null,
      itemDetails,
    };

    return { data: result };
  }

  //SECTION - get all books for manual sale
  async getAllBookForSale(): Promise<{ data: any[] }> {
    const paperbackBooks = await this.bookModal.aggregate([
      { $unwind: '$bookTypeDetails' },
      { $match: { 'bookTypeDetails.bookType': BookType.PAPER_BACK } },
      {
        $lookup: {
          from: 'prices',
          localField: 'bookTypeDetails.priceId',
          foreignField: '_id',
          as: 'bookTypeDetails.priceId',
        },
      },
      {
        $unwind: {
          path: '$bookTypeDetails.priceId',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'languages',
          localField: 'languageDetails.languageId',
          foreignField: '_id',
          as: 'languageDetails.languageId',
        },
      },
      {
        $unwind: {
          path: '$languageDetails.languageId',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$_id',
          bookName: { $first: '$bookName' },
          bookTypeDetails: {
            $push: {
              _id: '$bookTypeDetails._id',
              shippingCharge: '$bookTypeDetails.shippingCharge',
              bookType: '$bookTypeDetails.bookType',
              priceId: {
                _id: '$bookTypeDetails.priceId._id',
                mrpPrice: '$bookTypeDetails.priceId.mrpPrice',
                discountedPrice: '$bookTypeDetails.priceId.discountedPrice',
                discountPercentage:
                  '$bookTypeDetails.priceId.discountPercentage',
                gst: '$bookTypeDetails.priceId.gst',
                totalPrice: '$bookTypeDetails.priceId.totalPrice',
              },
            },
          },
          languageDetails: {
            $push: {
              _id: '$languageDetails.languageId._id',
              language: '$languageDetails.languageId.language',
            },
          },
          createdAt: { $first: '$createdAt' },
        },
      },

      {
        $addFields: {
          bookTypeDetails: { $arrayElemAt: ['$bookTypeDetails', 0] },
        },
      },

      { $sort: { createdAt: -1 } },
    ]);
    return { data: paperbackBooks };
  }

  //SECTION - upadte Inventory Items in book
  async updateInventoryItems(): Promise<string> {
    // Check if the book exists
    const checkBooks: any[] = await this.bookModal.find({});

    for (const data of checkBooks) {
      // Iterate through languageDetails
      for (const languageDetail of data.languageDetails) {
        // Ensure itemId is initialized as an array
        let existingItemIds = languageDetail.itemId;

        // Check if itemId is not an array
        if (!Array.isArray(existingItemIds)) {
          existingItemIds = [existingItemIds]; // Convert single item to array
        }

        // Prepare the new itemId array, ensuring no duplicates
        const updatedItemIds = [...new Set(existingItemIds)];

        // Update the itemId to be an array
        await this.bookModal.findByIdAndUpdate(
          data._id,
          {
            $set: {
              'languageDetails.$[langDetail].itemId': updatedItemIds,
            },
          },
          {
            arrayFilters: [{ 'langDetail._id': languageDetail._id }],
            new: true,
          },
        );
      }
    }

    return UPDATE_DATA;
  }

  //SECTION - get all items in book by languageId
  async bookItemsByLanguageId(
    payload: GetBookItemByLanguageDto,
  ): Promise<{ data: any[] }> {
    const { bookId, languageId } = payload;

    const paperbackBooks = await this.bookModal.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(bookId),
          'languageDetails.languageId': new mongoose.Types.ObjectId(languageId),
        },
      },
      {
        $unwind: { path: '$languageDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          'languageDetails.languageId': new mongoose.Types.ObjectId(languageId),
        },
      },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: 'languageDetails.itemId',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: false } },
      {
        $match: { itemDetails: { $ne: null } },
      },
      {
        $project: {
          _id: '$_id',
          itemId: '$itemDetails._id',
          itemName: '$itemDetails.name',
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return { data: paperbackBooks.length ? paperbackBooks : [] };
  }
}
