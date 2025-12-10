import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { EmailProcessor } from '../queues/email.processor';
import { UsersModule } from '../users/users.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    EventsModule,
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, EmailProcessor],
})
export class ProductsModule {}