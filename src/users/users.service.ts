import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, username: string, password: string): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      username,
      password: hashedPassword,
    });

    return user.save();
  }

  async findOne(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { lastLogin: new Date() }
    );
  }

  async addActivity(userId: string, activity: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { 
        $push: { 
          activities: {
            $each: [activity],
            $position: 0,
            $slice: 10
          }
        }
      }
    );
  }

  async getActiveUsers(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.userModel.countDocuments({
      lastLogin: { $gte: fiveMinutesAgo }
    });
  }
}