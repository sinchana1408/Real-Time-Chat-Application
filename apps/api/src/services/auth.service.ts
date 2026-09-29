import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { LoginInput, RegisterInput, UpdateProfileInput, UserProfile } from '@pulsechat/shared';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() },
    });
    if (existingUsername) {
      throw new ConflictError('This username is already taken. Please choose another');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return {
      user: {
        ...user,
        lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
    };
  }

  static async login(data: LoginInput) {
    const identifier = data.identifier.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials. Check your email/username and password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials. Check your email/username and password');
    }

    // Update lastSeenAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const token = generateToken(
      {
        userId: user.id,
        username: user.username,
      },
      data.rememberMe ? '30d' : undefined
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
        lastSeenAt: new Date().toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
    };
  }

  static async getMe(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username.toLowerCase(),
          id: { not: userId },
        },
      });
      if (existing) {
        throw new ConflictError('Username is already taken');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        username: data.username ? data.username.toLowerCase() : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      lastSeenAt: updated.lastSeenAt ? updated.lastSeenAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
