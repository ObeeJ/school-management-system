import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface PostFeePaymentDto {
  idempotency_key: string;
  reference: string;
  description: string;
  amount_cents: number;
  asset_account_id: string; // e.g. Cash / Bank Account
  revenue_account_id: string; // e.g. Tuition Revenue Account
}

@Injectable()
export class LedgerService {
  constructor(private readonly db: DatabaseService) {}

  async getAccounts() {
    return this.db.queryTenantScoped(
      'SELECT id, tenant_id, account_number, name, type FROM accounts ORDER BY account_number ASC'
    );
  }

  async postFeePayment(dto: PostFeePaymentDto) {
    if (!dto.amount_cents || dto.amount_cents <= 0) {
      throw new BadRequestException('Transaction amount must be a positive integer in cents.');
    }

    if (!dto.idempotency_key) {
      throw new BadRequestException('Idempotency key is required for double-entry financial transactions.');
    }

    // Atomic double entry journal insertion:
    // Debit Asset (Cash) and Credit Revenue (Tuition Fee)
    const journalEntries = await this.db.queryTenantScoped(
      `INSERT INTO journal_entries (reference, description)
       VALUES ($1, $2)
       RETURNING id, tenant_id, reference, description, posted_at`,
      [dto.reference, `${dto.description} [Idempotency: ${dto.idempotency_key}]`]
    );

    const entryId = journalEntries[0].id;

    // Line 1: Debit Asset
    await this.db.queryTenantScoped(
      `INSERT INTO ledger_lines (entry_id, account_id, amount_cents, direction)
       VALUES ($1, $2, $3, $4)`,
      [entryId, dto.asset_account_id, dto.amount_cents, 'DEBIT']
    );

    // Line 2: Credit Revenue
    await this.db.queryTenantScoped(
      `INSERT INTO ledger_lines (entry_id, account_id, amount_cents, direction)
       VALUES ($1, $2, $3, $4)`,
      [entryId, dto.revenue_account_id, dto.amount_cents, 'CREDIT']
    );

    return {
      transaction_id: entryId,
      reference: dto.reference,
      status: 'POSTED',
      amount_cents: dto.amount_cents,
      balanced: true,
      posted_at: journalEntries[0].posted_at,
    };
  }
}
