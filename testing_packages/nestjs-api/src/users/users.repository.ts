import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserDocument, UserEntity } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: 1 }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return Promise.resolve(null);
    }
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  create(dto: CreateUserDto): Promise<UserDocument> {
    const doc = new this.userModel({
      email: dto.email,
      name: dto.name,
    });
    return doc.save();
  }

  update(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
      .exec();
  }

  delete(id: string): Promise<boolean> {
    return this.userModel
      .deleteOne({ _id: id })
      .exec()
      .then((result) => result.deletedCount > 0);
  }
}
