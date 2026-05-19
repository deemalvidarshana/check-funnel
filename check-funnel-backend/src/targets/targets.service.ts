import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { TargetSnapshot } from './entities/target-snapshot.entity';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(TargetSnapshot)
    private readonly targetSnapshotRepository: Repository<TargetSnapshot>,
  ) {}

  private validateMonthKey(monthKey: string) {
    if (!/^\d{4}-\d{2}$/.test(monthKey || '')) {
      throw new BadRequestException('targetMonth must be in YYYY-MM format');
    }
  }

  private scopeWhere(scopeClientId?: number | null) {
    return scopeClientId ? scopeClientId : IsNull();
  }

  async findSnapshot(platform: string, targetMonth: string, scopeClientId?: number | null) {
    if (!platform) throw new BadRequestException('platform is required');
    this.validateMonthKey(targetMonth);

    return this.targetSnapshotRepository.findOne({
      where: {
        platform,
        targetMonth,
        scopeClientId: this.scopeWhere(scopeClientId),
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async createSnapshot(body: any) {
    const platform = body?.platform;
    const targetMonth = body?.targetMonth;
    const generatedMonth = body?.generatedMonth;
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const scopeClientId = body?.scopeClientId ? Number(body.scopeClientId) : null;

    if (!platform) throw new BadRequestException('platform is required');
    this.validateMonthKey(targetMonth);
    if (generatedMonth) this.validateMonthKey(generatedMonth);
    if (!rows.length) throw new BadRequestException('rows are required');

    const existing = await this.findSnapshot(platform, targetMonth, scopeClientId);
    const payload = {
      platform,
      targetMonth,
      generatedMonth,
      scopeClientId,
      rows,
      generatedAt: body?.generatedAt ? new Date(body.generatedAt) : new Date(),
      finalizedAt: body?.finalizedAt ? new Date(body.finalizedAt) : null,
    };

    if (existing) {
      Object.assign(existing, payload);
      return this.targetSnapshotRepository.save(existing);
    }

    return this.targetSnapshotRepository.save(
      this.targetSnapshotRepository.create(payload),
    );
  }
}
