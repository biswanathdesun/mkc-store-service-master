import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import {
  StockEntryMemberType,
  StockEntryStatus,
  StockEntryType,
} from 'src/utills/enum';
import {
  INVALID_STOCK_ENTRY_MEMBER_TYPE,
  INVALID_STOCK_ENTRY_STATUS,
  INVALID_STOCK_ENTRY_TYPE,
} from 'src/utills/messages';

export class CreateStockEntryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StockEntryStatus, { message: INVALID_STOCK_ENTRY_STATUS })
  readonly stockEntryStatus: StockEntryStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StockEntryType, { message: INVALID_STOCK_ENTRY_TYPE })
  readonly stockEntryType: StockEntryType;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StockEntryMemberType, { message: INVALID_STOCK_ENTRY_MEMBER_TYPE })
  readonly memberType: StockEntryMemberType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly memberId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly supplier: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly rate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly billNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly reorderQuantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly warehouseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly buyDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  readonly purchasedYear: number;
}
