import { Injectable } from '@nestjs/common';

export interface QueueJob {
  id: string;
  type: 'STRIPE_WEBHOOK' | 'PAYOUT_DISBURSEMENT' | 'AI_DATASET_INDEX' | 'KYC_VERIFICATION';
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED_DLQ';
  attempts: number;
  maxAttempts: number;
  created_at: Date;
}

@Injectable()
export class QueueService {
  private jobs: QueueJob[] = [];

  async enqueue(type: QueueJob['type'], payload: any): Promise<QueueJob> {
    const job: QueueJob = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 3,
      created_at: new Date(),
    };
    this.jobs.push(job);
    this.processNext(job.id);
    return job;
  }

  private async processNext(jobId: string) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    job.attempts++;

    try {
      // Process simulated async task execution
      job.status = 'COMPLETED';
    } catch (err) {
      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED_DLQ'; // Move to Dead Letter Queue
      } else {
        job.status = 'PENDING';
      }
    }
  }

  async getQueueStats() {
    return {
      pending: this.jobs.filter((j) => j.status === 'PENDING').length,
      processing: this.jobs.filter((j) => j.status === 'PROCESSING').length,
      completed: this.jobs.filter((j) => j.status === 'COMPLETED').length,
      failed_dlq: this.jobs.filter((j) => j.status === 'FAILED_DLQ').length,
      total_jobs: this.jobs.length,
      recent_jobs: this.jobs.slice(-5),
    };
  }
}
