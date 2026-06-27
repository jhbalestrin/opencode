import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProfileEntity, ProfileSchema } from './schemas/profile.schema';
import { ProfilesController } from './profiles.controller';
import { ProfilesRepository } from './profiles.repository';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: ProfileEntity.name, schema: ProfileSchema },
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesRepository, ProfilesService],
})
export class ProfilesModule {}
