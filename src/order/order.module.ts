import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { CommonService } from 'src/utills/commonService';
import {
  ProductTracking,
  ProductTrackingSchema,
} from 'src/schema/product-tracking.schema';
import { Setting, SettingSchema } from 'src/schema/site-setting.schema';
import { Payment, PaymentSchema } from 'src/schema/payment.schema';
import { User, UserSchema } from 'src/schema/user.schema';
import {
  OfflineCoursePayment,
  OfflineCoursePaymentSchema,
} from 'src/schema/offline-course-payment';
import {
  InventoryItemTransaction,
  InventoryItemTransactionSchema,
} from 'src/schema/inventory-item-transaction.schema';
import { Warehouse, WarehouseSchema } from 'src/schema/warehouse.schema';
import { Book, BookSchema } from 'src/schema/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: ProductTracking.name, schema: ProductTrackingSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Book.name, schema: BookSchema },
      { name: OfflineCoursePayment.name, schema: OfflineCoursePaymentSchema },
      { name: User.name, schema: UserSchema },
      {
        name: InventoryItemTransaction.name,
        schema: InventoryItemTransactionSchema,
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, CommonService],
})
export class OrderModule {}
