import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';

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
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<User[]> {
    return this.userRepository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async updateUserStatus(id: number, status: string, adminEmail: string): Promise<User> {
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

  async updateAvatar(id: number, buffer: Buffer, mimeType: string): Promise<User> {
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

  async updateUser(id: number, updateData: { fullName?: string; role?: string }): Promise<User> {
    const user = await this.findOne(id);
    if (updateData.fullName) {
      user.fullName = updateData.fullName;
    }
    if (updateData.role) {
      user.role = updateData.role;
    }
    return this.userRepository.save(user);
  }
}
