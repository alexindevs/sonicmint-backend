import { Request } from 'express';
import { User } from '../modules/auth/entities/user.entity';

export interface AuthRequest extends Request {
  user: User;
}
