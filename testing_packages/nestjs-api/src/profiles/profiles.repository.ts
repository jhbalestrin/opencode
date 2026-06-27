import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileDocument, ProfileEntity } from './schemas/profile.schema';

@Injectable()
export class ProfilesRepository {
  constructor(
    @InjectModel(ProfileEntity.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  findAll(): Promise<ProfileDocument[]> {
    return this.profileModel.find().sort({ createdAt: 1 }).exec();
  }

  findById(id: string): Promise<ProfileDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return Promise.resolve(null);
    }
    return this.profileModel.findById(id).exec();
  }

  findByUserId(userId: string): Promise<ProfileDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return Promise.resolve(null);
    }
    return this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  create(dto: CreateProfileDto): Promise<ProfileDocument> {
    const doc = new this.profileModel({
      userId: new Types.ObjectId(dto.userId),
      bio: dto.bio,
    });
    return doc.save();
  }

  update(id: string, dto: UpdateProfileDto): Promise<ProfileDocument | null> {
    return this.profileModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
      .exec();
  }

  delete(id: string): Promise<boolean> {
    return this.profileModel
      .deleteOne({ _id: id })
      .exec()
      .then((result) => result.deletedCount > 0);
  }
}
