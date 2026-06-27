import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, User } from './dto/user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  findAll(): User[] {
    return [...this.users];
  }

  findOne(id: number): User {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  create(dto: CreateUserDto): User {
    const exists = this.users.some((item) => item.email === dto.email);
    if (exists) {
      throw new ConflictException(`Email ${dto.email} already registered`);
    }

    const user: User = {
      id: this.nextId++,
      email: dto.email,
      name: dto.name,
    };
    this.users.push(user);
    return user;
  }

  update(id: number, dto: UpdateUserDto): User {
    const user = this.findOne(id);
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    return user;
  }

  remove(id: number): void {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`User ${id} not found`);
    }
    this.users.splice(index, 1);
  }
}
