import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../middleware/auth';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

class AuthService {
  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  }

  private signToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.getJwtSecret(), options);
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.signToken({
      userId: user.user_id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(input: RegisterInput): Promise<LoginResult> {
    const { username, email, password } = input;

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters', [
        { field: 'password', message: 'Password must be at least 6 characters' },
      ]);
    }

    const existing = await User.findOne({
      where: { email },
    });

    if (existing) {
      throw new ValidationError('Email already registered', [
        { field: 'email', message: 'Email already registered' },
      ]);
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new ValidationError('Username already taken', [
        { field: 'username', message: 'Username already taken' },
      ]);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password_hash: passwordHash,
      role: 'USER',
    });

    const token = this.signToken({
      userId: user.user_id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
