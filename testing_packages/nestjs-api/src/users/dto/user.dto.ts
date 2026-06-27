export class CreateUserDto {
  email: string;
  name: string;
}

export class UpdateUserDto {
  name?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}
