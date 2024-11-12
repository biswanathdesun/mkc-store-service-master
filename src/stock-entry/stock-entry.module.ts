import { Module } from '@nestjs/common';
import { StockEntryService } from './stock-entry.service';
import { StockEntryController } from './stock-entry.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockEntry, StockEntrySchema } from 'src/schema/stock-entry.schema';
import {
  ItemTransfer,
  ItemTransferSchema,
} from 'src/schema/item-transfer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockEntry.name, schema: StockEntrySchema },
      { name: ItemTransfer.name, schema: ItemTransferSchema },
    ]),
  ],
  providers: [StockEntryService],
  controllers: [StockEntryController],
})
export class StockEntryModule {}
