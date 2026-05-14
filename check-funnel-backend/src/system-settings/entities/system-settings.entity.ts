import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ length: 150 })
  lastModifiedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
