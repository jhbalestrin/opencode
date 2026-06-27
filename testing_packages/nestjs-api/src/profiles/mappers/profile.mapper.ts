import { Profile } from '../dto/profile.dto';
import { ProfileDocument } from '../schemas/profile.schema';

export function toProfile(doc: ProfileDocument): Profile {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    bio: doc.bio,
  };
}
