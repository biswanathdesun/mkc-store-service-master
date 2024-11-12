import { Module } from '@nestjs/common';
import { ProductCatalogService } from './product-catalog.service';
import { ProductCatalogController } from './product-catalog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductCatalog,
  ProductCatalogSchema,
} from 'src/schema/product-catalog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCatalog.name, schema: ProductCatalogSchema },
    ]),
  ],
  providers: [ProductCatalogService],
  controllers: [ProductCatalogController],
})
export class ProductCatalogModule {}
