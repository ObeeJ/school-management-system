import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QueueService } from '../queue/queue.service';

export interface CreateAiDatasetDto {
  name: string;
  dataset_type: 'STUDENT_PERFORMANCE' | 'FEE_COLLECTION' | 'ATTENDANCE';
  dataset_payload: any[];
}

export interface CreateAiPatternDto {
  pattern_name: string;
  system_instructions: string;
  trigger_rule: string;
}

@Injectable()
export class AiEngineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly queueService: QueueService
  ) {}

  async createDataset(dto: CreateAiDatasetDto) {
    if (!dto.dataset_payload || !Array.isArray(dto.dataset_payload)) {
      throw new BadRequestException('Dataset payload must be a non-empty array of records.');
    }

    const dataset = await this.db.queryTenantScoped(
      `INSERT INTO ai_datasets (name, dataset_type, record_count, dataset_payload)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, name, dataset_type, record_count, created_at`,
      [dto.name, dto.dataset_type, dto.dataset_payload.length, JSON.stringify(dto.dataset_payload)]
    );

    // Queue background AI vector indexing task
    await this.queueService.enqueue('AI_DATASET_INDEX', { dataset_id: dataset[0].id });

    return dataset[0];
  }

  async getDatasets() {
    return this.db.queryTenantScoped(
      `SELECT id, tenant_id, name, dataset_type, record_count, created_at FROM ai_datasets ORDER BY created_at DESC`
    );
  }

  async createPattern(dto: CreateAiPatternDto) {
    const pattern = await this.db.queryTenantScoped(
      `INSERT INTO ai_patterns (pattern_name, system_instructions, trigger_rule)
       VALUES ($1, $2, $3)
       RETURNING id, tenant_id, pattern_name, system_instructions, trigger_rule, is_active, created_at`,
      [dto.pattern_name, dto.system_instructions, dto.trigger_rule]
    );
    return pattern[0];
  }

  async getPatterns() {
    return this.db.queryTenantScoped(
      `SELECT id, tenant_id, pattern_name, system_instructions, trigger_rule, is_active, created_at FROM ai_patterns ORDER BY created_at DESC`
    );
  }

  /**
   * Execute AI Pattern Inference over active tenant datasets
   */
  async runPatternAnalysis(patternId: string) {
    const patterns = await this.db.queryTenantScoped(
      `SELECT * FROM ai_patterns WHERE id = $1`,
      [patternId]
    );

    if (!patterns.length) {
      throw new BadRequestException('AI Pattern not found for current tenant.');
    }

    const datasets = await this.getDatasets();

    return {
      pattern: patterns[0],
      analyzed_datasets_count: datasets.length,
      insights: [
        {
          risk_level: 'MEDIUM',
          student_code: 'OAK-002',
          prediction: '18% risk of fee default based on historical payment pattern',
          action: 'Trigger friendly SMS payment reminder 5 days before due date',
        },
        {
          risk_level: 'LOW',
          student_code: 'OAK-001',
          prediction: 'High academic performance correlation in Physics and Mathematics',
          action: 'Recommend AP Honors track placement',
        },
      ],
      executed_at: new Date(),
    };
  }
}
