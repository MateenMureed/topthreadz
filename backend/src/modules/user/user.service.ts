import prisma from '../../utils/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/auth.middleware';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, addresses: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  async addAddress(userId: string, data: any) {
    const normalized = {
      label: typeof data.label === 'string' ? data.label.trim() : undefined,
      fullName: String(data.fullName || '').trim(),
      phone: String(data.phone || '').trim(),
      address: String(data.address || '').trim(),
      city: String(data.city || '').trim(),
      province: String(data.province || '').trim(),
      postalCode: typeof data.postalCode === 'string' ? data.postalCode.trim() : undefined,
      isDefault: Boolean(data.isDefault),
    };

    if (!normalized.fullName || !normalized.phone || !normalized.address || !normalized.city || !normalized.province) {
      throw new BadRequestError('Required address fields are missing');
    }

    if (normalized.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const createData: any = {
      userId,
      fullName: normalized.fullName,
      phone: normalized.phone,
      address: normalized.address,
      city: normalized.city,
      province: normalized.province,
      isDefault: normalized.isDefault,
    };
    if (normalized.label) createData.label = normalized.label;
    if (normalized.postalCode) createData.postalCode = normalized.postalCode;

    return prisma.address.create({ data: createData });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundError('Address not found');

    const normalized: any = {};
    const keys = ['label', 'fullName', 'phone', 'address', 'city', 'province', 'postalCode'] as const;
    for (const key of keys) {
      if (typeof data[key] === 'string') {
        const value = data[key].trim();
        if (value) normalized[key] = value;
      }
    }

    if (typeof data.isDefault === 'boolean') {
      normalized.isDefault = data.isDefault;
    }

    if (normalized.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data: normalized });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundError('Address not found');
    await prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }

  async getAddresses(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
  }
}

export const userService = new UserService();
