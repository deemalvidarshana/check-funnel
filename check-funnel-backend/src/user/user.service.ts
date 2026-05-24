import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAssignableUsers(): Promise<
    Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'status'>[]
  > {
    return this.userRepository.find({
      select: ['id', 'fullName', 'email', 'role', 'status'],
      where: { status: 'approved' },
      order: { fullName: 'ASC' },
    });
  }

  async findByStatus(status: string): Promise<User[]> {
    return this.userRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async createUser(
    data: {
      fullName: string;
      email: string;
      password: string;
      role?: string;
      featureAccess?: string[];
    },
    adminEmail: string,
  ): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'viewer',
      featureAccess: data.role === 'manager' ? data.featureAccess || [] : [],
      status: 'approved',
      processedByEmail: adminEmail,
      processedAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);
    const safeUser = { ...savedUser } as Omit<User, 'password'> & {
      password?: string;
    };
    delete safeUser.password;
    return safeUser;
  }

  async updateUserStatus(
    id: number,
    status: string,
    adminEmail: string,
  ): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    user.processedByEmail = adminEmail;
    user.processedAt = new Date();
    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateAvatar(
    id: number,
    buffer: Buffer,
    mimeType: string,
  ): Promise<User> {
    const user = await this.findOne(id);
    user.avatarData = buffer;
    user.avatarMimeType = mimeType;
    return this.userRepository.save(user);
  }

  async getAvatar(id: number): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.findOne(id);
    if (!user.avatarData) {
      throw new NotFoundException('User has no avatar');
    }
    return {
      buffer: user.avatarData,
      mimeType: user.avatarMimeType,
    };
  }

  async updateUser(
    id: number,
    updateData: { fullName?: string; role?: string; featureAccess?: string[] },
  ): Promise<User> {
    const user = await this.findOne(id);
    if (updateData.fullName) {
      user.fullName = updateData.fullName;
    }
    if (updateData.role) {
      user.role = updateData.role;
      if (updateData.role !== 'manager') {
        user.featureAccess = [];
      }
    }
    if (Array.isArray(updateData.featureAccess)) {
      user.featureAccess =
        user.role === 'manager' ? updateData.featureAccess : [];
    }
    return this.userRepository.save(user);
  }
}
