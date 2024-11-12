import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from 'src/schema/book.schema';
import { CommonService } from 'src/utills/commonService';
import { Language, LanguageSchema } from 'src/schema/language.schema';
import { Category, CategorySchema } from 'src/schema/category.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { Price, PriceSchema } from 'src/schema/price.schema';
import {
  UserProductDetails,
  UserProductDetailsSchema,
} from 'src/schema/user-product-details.schema';
import { AwsUrlValidator } from 'src/utills/aws-url-validator.service';
import {
  InventoryItem,
  InventoryItemSchema,
} from 'src/schema/inventory-item.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: Language.name, schema: LanguageSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Course.name, schema: CourseSchema },
      { name: Price.name, schema: PriceSchema },
      { name: UserProductDetails.name, schema: UserProductDetailsSchema },
    ]),
  ],
  controllers: [BookController],
  providers: [BookService, CommonService, AwsUrlValidator],
})
export class BookModule {}
