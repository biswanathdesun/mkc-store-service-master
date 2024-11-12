import { Module } from '@nestjs/common';
import { InventoryCategoryController } from './inventory-category.controller';
import { InventoryCategoryService } from './inventory-category.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InventoryCategory,
  InventoryCategorySchema,
} from 'src/schema/inventory-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryCategory.name, schema: InventoryCategorySchema },
    ]),
  ],
  controllers: [InventoryCategoryController],
  providers: [InventoryCategoryService],
})
export class InventoryCategoryModule {}
