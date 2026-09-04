import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { encryptedColumnTransformer } from '../../common/encrypted-column.transformer';

@Entity()
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  apifyApiKey: string;

  @Column({ nullable: true })
  openRouterApiKey: string;

  @Column({ length: 100, default: 'google/gemini-2.0-flash-001' })
  openRouterModel: string;

  @Column({ length: 20, default: 'upload' })
  competitorAnalyzeMethod: string;

  @Column({ type: 'int', default: 100 })
  apifyDefaultResultsLimit: number;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsProjectId: string | null;

  @Column({ type: 'text', nullable: true })
  googleAnalyticsClientId: string | null;

  @Column({ type: 'text', nullable: true, transformer: encryptedColumnTransformer })
  googleAnalyticsClientSecret: string | null;

  @Column({ type: 'text', nullable: true, transformer: encryptedColumnTransformer })
  googleAnalyticsRefreshToken: string | null;

  @Column({ type: 'text', nullable: true, transformer: encryptedColumnTransformer })
  googleAnalyticsAccessToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  googleAnalyticsTokenExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsConnectedEmail: string | null;

  @Column({ type: 'text', nullable: true })
  googleAnalyticsLocalRedirectUri: string | null;

  @Column({ type: 'text', nullable: true })
  googleAnalyticsProductionRedirectUri: string | null;

  @Column({ length: 150 })
  lastModifiedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
