import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserEntity } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, collection: 'profiles' })
export class ProfileEntity {
  @Prop({
    type: Types.ObjectId,
    ref: UserEntity.name,
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  bio!: string;
}

export type ProfileDocument = HydratedDocument<ProfileEntity>;
export const ProfileSchema = SchemaFactory.createForClass(ProfileEntity);
