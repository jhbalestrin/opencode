import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProfileDto {
  @IsMongoId()
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  bio!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  bio?: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio: string;
}
