import { User } from '../dto/user.dto';
import { UserDocument } from '../schemas/user.schema';

export function toUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
  };
}
