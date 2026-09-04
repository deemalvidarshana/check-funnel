import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  /**
   * Parse a string that might represent a JSON array into an actual array.
   * If input is undefined or invalid, returns an empty array.
   */
  private parseArrayField(value: string | undefined): string[] {
    if (!value) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string',
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  private parseOptionalNumber(value: string | undefined): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async create(
    createClientDto: CreateClientDto,
    logoData?: Buffer,
  ): Promise<Client> {
    // Parse array fields
    const hashtags = this.parseArrayField(createClientDto.hashtags);
    const activeChannels = this.parseArrayField(createClientDto.activeChannels);

    // Validate activeChannels length (max 3)
    if (activeChannels.length > 3) {
      throw new BadRequestException(
        'activeChannels must contain no more than 3 elements',
      );
    }

    const client = this.clientRepository.create({
      ...createClientDto,
      logoData: logoData || null,
      hashtags,
      activeChannels,
      responsiblePersonId: this.parseOptionalNumber(
        createClientDto.responsiblePersonId,
      ),
      responsiblePersonName: createClientDto.responsiblePersonName || null,
    });
    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    // Exclude binary data for performance
    return this.clientRepository.find({
      select: [
        'id',
        'name',
        'monthlyTargetPosts',
        'shortDescription',
        'contactEmail',
        'contactPhone',
        'responsiblePersonId',
        'responsiblePersonName',
        'activeChannels',
        'createdAt',
        'updatedAt',
        'hashtags',
        'facebookApiKey',
        'facebookPageId',
        'metaAdAccountId',
        'metaAdsAccessToken',
        'instagramApiKey',
        'instagramAccountId',
        'facebookUrl',
        'instagramUrl',
        'tiktokUrl',
        'tiktokApiKey',
        'tiktokClientKey',
        'tiktokClientSecret',
        'tiktokRefreshToken',
        'googleAnalyticsAccountId',
        'googleAnalyticsAccountName',
        'googleAnalyticsPropertyId',
        'googleAnalyticsPropertyName',
      ],
    });
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) throw new NotFoundException(`Client with ID ${id} not found`);
    return client;
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
    logoData?: Buffer,
  ): Promise<Client> {
    const client = await this.findOne(id);

    // Parse array fields if they are present in the update DTO
    if (updateClientDto.hashtags !== undefined) {
      client.hashtags = this.parseArrayField(updateClientDto.hashtags);
    }
    if (updateClientDto.activeChannels !== undefined) {
      client.activeChannels = this.parseArrayField(
        updateClientDto.activeChannels,
      );
      if (client.activeChannels.length > 3) {
        throw new BadRequestException(
          'activeChannels must contain no more than 3 elements',
        );
      }
    }

    // Copy other fields (excluding the array fields that we already handled)
    const rest = { ...updateClientDto };
    delete rest.hashtags;
    delete rest.activeChannels;
    delete rest.responsiblePersonId;
    delete rest.responsiblePersonName;
    Object.assign(client, rest);

    if (updateClientDto.responsiblePersonId !== undefined) {
      client.responsiblePersonId = this.parseOptionalNumber(
        updateClientDto.responsiblePersonId,
      );
    }
    if (updateClientDto.responsiblePersonName !== undefined) {
      client.responsiblePersonName =
        updateClientDto.responsiblePersonName || null;
    }

    // Update logo if provided
    if (logoData) client.logoData = logoData;

    return this.clientRepository.save(client);
  }

  async remove(id: number): Promise<void> {
    const result = await this.clientRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Client with ID ${id} not found`);
  }

  async toggleSharing(id: number, status: boolean): Promise<Client> {
    const client = await this.findOne(id);
    client.isShared = status;
    if (status && !client.shareToken) {
      client.shareToken = randomUUID();
    }
    return this.clientRepository.save(client);
  }

  async findByShareToken(shareToken: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { shareToken, isShared: true },
    });
    if (!client)
      throw new NotFoundException(
        'Public report not found or sharing is disabled',
      );
    return client;
  }
}
