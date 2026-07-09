import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueCard } from './entities/issue-card.entity';

type IssueBoardUser = {
  id?: number;
  email?: string;
};

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(IssueCard)
    private readonly issueCardRepository: Repository<IssueCard>,
  ) {}

  private normalizeStatus(status: unknown) {
    return String(status || '').toLowerCase() === 'done' ? 'done' : 'todo';
  }

  private parseDate(value: unknown): Date | null {
    if (!value) return null;

    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private stringifyAttachments(attachments: unknown) {
    if (!Array.isArray(attachments)) return JSON.stringify([]);
    return JSON.stringify(attachments);
  }

  private parseAttachments(attachmentsJson: string | null) {
    if (!attachmentsJson) return [];

    try {
      const attachments = JSON.parse(attachmentsJson);
      return Array.isArray(attachments) ? attachments : [];
    } catch {
      return [];
    }
  }

  private issueToResponse(issue: IssueCard) {
    return {
      id: issue.id,
      clientId: issue.clientId,
      clientName: issue.clientName,
      title: issue.title,
      notes: issue.notes || '',
      attachments: this.parseAttachments(issue.attachmentsJson),
      status: this.normalizeStatus(issue.status),
      isPinned: Boolean(issue.isPinned),
      pinnedAt: issue.pinnedAt ? issue.pinnedAt.toISOString() : null,
      completedAt: issue.completedAt ? issue.completedAt.toISOString() : null,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt?.toISOString?.() || null,
    };
  }

  private getUserEmail(user: IssueBoardUser) {
    return user.email || 'guest';
  }

  async findAll() {
    const issues = await this.issueCardRepository.find({
      order: {
        isPinned: 'DESC',
        pinnedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return issues.map((issue) => this.issueToResponse(issue));
  }

  async findOne(id: string) {
    const issue = await this.issueCardRepository.findOne({
      where: { id },
    });

    if (!issue) throw new NotFoundException('Issue card not found');
    return this.issueToResponse(issue);
  }

  async create(data: any, user: IssueBoardUser) {
    const status = this.normalizeStatus(data?.status);
    const now = new Date();
    const issue = this.issueCardRepository.create({
      id: String(
        data?.id || `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ),
      userId: user.id ? Number(user.id) : null,
      userEmail: this.getUserEmail(user),
      clientId: String(data?.clientId || ''),
      clientName: String(data?.clientName || 'Client'),
      title: String(data?.title || 'Untitled issue'),
      notes: data?.notes ? String(data.notes) : '',
      attachmentsJson: this.stringifyAttachments(data?.attachments),
      status,
      isPinned: Boolean(data?.isPinned),
      pinnedAt: this.parseDate(data?.pinnedAt),
      completedAt: this.parseDate(data?.completedAt) || (status === 'done' ? now : null),
      createdAt: this.parseDate(data?.createdAt) || now,
    });

    const savedIssue = await this.issueCardRepository.save(issue);
    return this.issueToResponse(savedIssue);
  }

  async update(id: string, data: any) {
    const issue = await this.issueCardRepository.findOne({
      where: { id },
    });

    if (!issue) throw new NotFoundException('Issue card not found');

    if (Object.prototype.hasOwnProperty.call(data, 'clientId')) {
      issue.clientId = String(data.clientId || '');
    }
    if (Object.prototype.hasOwnProperty.call(data, 'clientName')) {
      issue.clientName = String(data.clientName || 'Client');
    }
    if (Object.prototype.hasOwnProperty.call(data, 'title')) {
      issue.title = String(data.title || 'Untitled issue');
    }
    if (Object.prototype.hasOwnProperty.call(data, 'notes')) {
      issue.notes = data.notes ? String(data.notes) : '';
    }
    if (Object.prototype.hasOwnProperty.call(data, 'attachments')) {
      issue.attachmentsJson = this.stringifyAttachments(data.attachments);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      const status = this.normalizeStatus(data.status);
      issue.status = status;
      issue.completedAt = status === 'done' ? new Date() : null;
    }
    if (Object.prototype.hasOwnProperty.call(data, 'isPinned')) {
      issue.isPinned = Boolean(data.isPinned);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'pinnedAt')) {
      issue.pinnedAt = this.parseDate(data.pinnedAt);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'completedAt')) {
      issue.completedAt = this.parseDate(data.completedAt);
    }

    const savedIssue = await this.issueCardRepository.save(issue);
    return this.issueToResponse(savedIssue);
  }

  async remove(id: string) {
    const issue = await this.issueCardRepository.findOne({
      where: { id },
    });

    if (!issue) throw new NotFoundException('Issue card not found');
    await this.issueCardRepository.remove(issue);
    return { success: true };
  }
}
