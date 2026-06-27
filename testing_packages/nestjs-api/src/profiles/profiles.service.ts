import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateProfileDto, Profile, UpdateProfileDto } from './dto/profile.dto';
import { toProfile } from './mappers/profile.mapper';
import { ProfilesRepository } from './profiles.repository';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Profile[]> {
    const docs = await this.profilesRepository.findAll();
    return docs.map(toProfile);
  }

  async findOne(id: string): Promise<Profile> {
    const doc = await this.profilesRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
    return toProfile(doc);
  }

  async findByUserId(userId: string): Promise<Profile> {
    await this.usersService.findOne(userId);
    const doc = await this.profilesRepository.findByUserId(userId);
    if (!doc) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }
    return toProfile(doc);
  }

  async create(dto: CreateProfileDto): Promise<Profile> {
    await this.usersService.findOne(dto.userId);

    const existing = await this.profilesRepository.findByUserId(dto.userId);
    if (existing) {
      throw new ConflictException(
        `Profile for user ${dto.userId} already exists`,
      );
    }

    const doc = await this.profilesRepository.create(dto);
    return toProfile(doc);
  }

  async update(id: string, dto: UpdateProfileDto): Promise<Profile> {
    await this.findOne(id);
    const updated = await this.profilesRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
    return toProfile(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.profilesRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
  }
}
