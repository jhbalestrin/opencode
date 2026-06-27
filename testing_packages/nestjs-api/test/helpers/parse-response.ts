import { Profile } from '../../src/profiles/dto/profile.dto';
import { User } from '../../src/users/dto/user.dto';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`Expected "${key}" to be a string`);
  }
  return value;
}

export function parseUserBody(body: unknown): User {
  if (!isRecord(body)) {
    throw new Error('Expected user response body to be an object');
  }

  return {
    id: readString(body, 'id'),
    email: readString(body, 'email'),
    name: readString(body, 'name'),
  };
}

export function parseProfileBody(body: unknown): Profile {
  if (!isRecord(body)) {
    throw new Error('Expected profile response body to be an object');
  }

  return {
    id: readString(body, 'id'),
    userId: readString(body, 'userId'),
    bio: readString(body, 'bio'),
  };
}
