import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, User } from './dto/user.dto';
import { toUser } from './mappers/user.mapper';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<User[]> {
    const docs = await this.usersRepository.findAll();
    return docs.map(toUser);
  }

  async findOne(id: string): Promise<User> {
    const doc = await this.usersRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return toUser(doc);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Email ${dto.email} already registered`);
    }

    const doc = await this.usersRepository.create(dto);
    return toUser(doc);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    const updated = await this.usersRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return toUser(updated);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
