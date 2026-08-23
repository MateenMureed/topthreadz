import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../utils/prisma';
import { signAccessToken } from '../../utils/jwt';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { env } from '../../config/env';
import { SignupInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

export class AuthService {
  async signup(data: SignupInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });

    if (existing) {
      throw new ConflictError('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        isVerified: true,
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    return { user, message: 'Account created successfully. You can now sign in.' };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      logger.warn(`Login attempt for non-existent email: ${data.email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedError('Please sign in with your social account');
    }

    // Check if account is locked
    if (user.isLocked) {
      if (user.lastFailedAt && Date.now() - user.lastFailedAt.getTime() < env.LOCK_DURATION) {
        throw new UnauthorizedError('Account is locked. Please try again later.');
      }
      // Unlock if lock duration has passed
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, failedAttempts: 0 },
      });
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      const failedAttempts = user.failedAttempts + 1;
      const shouldLock = failedAttempts >= env.MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts,
          lastFailedAt: new Date(),
          isLocked: shouldLock,
        },
      });

      logger.warn(`Failed login attempt for ${data.email}. Attempts: ${failedAttempts}`);

      if (shouldLock) {
        throw new UnauthorizedError('Account locked due to too many failed attempts');
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, isLocked: false, lastFailedAt: null },
    });

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a reset link will be sent.' };
    }

    const resetToken = uuidv4();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiresAt },
    });

    // Mock: In production, send reset email
    logger.info(`Password reset token for ${email}: ${resetToken} (mock)`);

    return { message: 'If an account exists, a reset link will be sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpiresAt: { gt: new Date() } },
    });

    if (!user) throw new BadRequestError('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiresAt: null,
        failedAttempts: 0,
        isLocked: false,
      },
    });

    return { message: 'Password reset successfully' };
  }
}

export const authService = new AuthService();
