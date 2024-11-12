import { BookLanguage } from 'src/schema/book.language.schema';
import { BookTypes } from 'src/schema/book.type.schema';
import { BindingType } from 'src/utills/enum';

interface CategoryDetailsInterface {
  _id: string;
  name: string;
}

export interface BookTypeInterface {
  _id: string;
  bookName: string;
  slugUrl: string;
  categoryId: CategoryDetailsInterface;
  bindingType: BindingType;
  shortDescription: string;
  InStock: boolean;
  author: string;
  languageDetails: BookLanguage[];
  bookTypeDetails: BookTypes[];
  coins: number;
  topSeller: boolean;
  status: boolean;
}

export interface GetAllBookInterface {
  _id: string;
  category: string;
  bookName: string;
  bindingType: BindingType;
  languageDetails: any;
  shortDescription: string;
  inStock: boolean;
  author: string;
  coins: number;
  status: boolean;
}

export interface BookByIdInterface {
  _id: string;
  userCountOfRating: number;
  totalPage: number;
  skuCode: number;
  shortDescription: string;
  publication: string;
  longDescription: string;
  languageDetails: any;
  courseIds: string[];
  coins: number;
  categoryId: string;
  bookWeight: string;
  bookTypeDetails: any;
  bookName: string;
  bindingType: BindingType;
  averageRating: number;
  InStock: boolean;
  author: string;
  status: boolean;
}
