import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { UsersService } from '../users/users.service';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class ProductsService {
  private readonly CACHE_KEY = 'products:all';
  private readonly CACHE_TTL = 600;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('email-queue') private emailQueue: Queue,
    private eventsGateway: EventsGateway,
    private usersService: UsersService,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const product = new this.productModel({
      ...createProductDto,
      createdBy: userId,
    });
    
    const savedProduct = await product.save();
    
    await this.cacheManager.del(this.CACHE_KEY);
    
    this.eventsGateway.notifyProductCreated(savedProduct);
    
    const user = await this.usersService.findById(userId);
    await this.emailQueue.add('send-email', {
      to: user.email,
      subject: 'Product Created Successfully',
      body: `Your product "${savedProduct.name}" has been created successfully.`,
      type: 'product-created',
    });
    
    await this.emailQueue.add('log-activity', {
      activity: `Created product: ${savedProduct.name}`,
      userId,
      timestamp: new Date(),
    });

    await this.usersService.addActivity(userId, `Created product: ${savedProduct.name}`);
    
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    const cachedProducts = await this.cacheManager.get<Product[]>(this.CACHE_KEY);
    if (cachedProducts) {
      return cachedProducts;
    }
    
    const products = await this.productModel
      .find({ isActive: true })
      .populate('createdBy', 'email username')
      .exec();
    
    await this.cacheManager.set(this.CACHE_KEY, products, this.CACHE_TTL);
    
    return products;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('createdBy', 'email username')
      .exec();
      
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('createdBy', 'email username')
      .exec();
      
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    await this.cacheManager.del(this.CACHE_KEY);
    
    await this.usersService.addActivity(userId, `Updated product: ${product.name}`);
    
    return product;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.productModel.findById(id);
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    await this.productModel.findByIdAndDelete(id);
    
    await this.cacheManager.del(this.CACHE_KEY);
    
    await this.usersService.addActivity(userId, `Deleted product: ${product.name}`);
  }
}