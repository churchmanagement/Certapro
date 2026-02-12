import prisma from '../config/database';
import { hashPassword } from '../utils/hash.utils';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import smsService from './sms.service';
import emailService from './email.service';
import { config } from '../config';

export interface CreateUserDto {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  notes?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
  notificationPreferences?: any;
}

export interface InviteUserDto {
  emails?: string[];
  phones?: string[];
}

export class UserService {
  async getAllUsers(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            projectAcceptances: true,
            assignedProjects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        notes: true,
        notificationPreferences: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            createdProjects: true,
            assignedProjects: true,
            projectAcceptances: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async createUser(data: CreateUserDto) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password if provided
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role,
        notes: data.notes,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        notes: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  async activateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return { message: 'User activated successfully' };
  }

  async getUsersByRole(role: UserRole, activeOnly: boolean = true) {
    const where = activeOnly ? { role, isActive: true } : { role };

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateFcmToken(userId: string, fcmToken: string | null) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return { message: 'FCM token updated successfully' };
  }

  async updateNotificationPreferences(userId: string, preferences: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences },
    });

    return { message: 'Notification preferences updated successfully' };
  }

  async sendInvitations(adminId: string, data: InviteUserDto) {
    const inviteLink = `${config.frontendUrl}/install`;
    const sentInvites: any[] = [];

    // Send email invitations
    if (data.emails && data.emails.length > 0) {
      for (const email of data.emails) {
        const inviteToken = uuidv4();

        // Create invitation record
        const invitation = await prisma.appInvitation.create({
          data: {
            adminId,
            invitedEmail: email,
            inviteToken,
            sentVia: 'email',
          },
        });

        // Send email
        const linkWithToken = `${inviteLink}?token=${inviteToken}`;
        const emailSent = await emailService.sendInvite(email, linkWithToken);

        sentInvites.push({
          type: 'email',
          recipient: email,
          sent: emailSent,
          token: inviteToken,
        });
      }
    }

    // Send SMS invitations
    if (data.phones && data.phones.length > 0) {
      for (const phone of data.phones) {
        const inviteToken = uuidv4();

        // Create invitation record
        const invitation = await prisma.appInvitation.create({
          data: {
            adminId,
            invitedPhone: phone,
            inviteToken,
            sentVia: 'sms',
          },
        });

        // Send SMS
        const linkWithToken = `${inviteLink}?token=${inviteToken}`;
        const smsSent = await smsService.sendInvite(phone, linkWithToken);

        sentInvites.push({
          type: 'sms',
          recipient: phone,
          sent: smsSent,
          token: inviteToken,
        });
      }
    }

    return {
      message: 'Invitations processed',
      invitations: sentInvites,
    };
  }

  async getInvitations(adminId: string) {
    return prisma.appInvitation.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackInviteOpen(token: string) {
    const invitation = await prisma.appInvitation.findUnique({
      where: { inviteToken: token },
    });

    if (invitation && invitation.status === 'PENDING') {
      await prisma.appInvitation.update({
        where: { inviteToken: token },
        data: {
          status: 'OPENED',
          openedAt: new Date(),
        },
      });
    }
  }
}

export default new UserService();
