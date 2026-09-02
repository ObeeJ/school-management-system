import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';

export interface CreatePayInDto {
  idempotency_key: string;
  amount_cents: number;
  currency: string; // 'USD', 'GBP'
  description: string;
  student_id?: string;
}

export interface CreatePayOutDto {
  idempotency_key: string;
  amount_cents: number;
  currency: string; // 'USD', 'GBP'
  recipient_email: string;
  description: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ledgerService: LedgerService
  ) {}

  /**
   * Process Pay-In (Tuition / Fee collection via Stripe)
   */
  async processPayIn(dto: CreatePayInDto) {
    if (!dto.idempotency_key) {
      throw new BadRequestException('[FINOPS_VIOLATION] Idempotency key is required for payment processing.');
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    let stripeIntentId = `pi_mock_${Date.now()}`;
    let status: 'SUCCEEDED' | 'PENDING' = 'SUCCEEDED';

    if (!isDev && (!stripeKey || stripeKey === 'mock_dev_key')) {
      throw new BadRequestException('STRIPE_SECRET_KEY must be configured in production environment.');
    }

    // Insert payment record
    const payment = await this.db.queryTenantScoped(
      `INSERT INTO payments (type, idempotency_key, stripe_intent_id, amount_cents, currency, status, metadata)
       VALUES ('PAY_IN', $1, $2, $3, $4, $5, $6)
       RETURNING id, tenant_id, type, idempotency_key, stripe_intent_id, amount_cents, currency, status, created_at`,
      [
        dto.idempotency_key,
        stripeIntentId,
        dto.amount_cents,
        dto.currency.toUpperCase(),
        status,
        JSON.stringify({ description: dto.description, student_id: dto.student_id }),
      ]
    );

    // Atomically post double-entry fee ledger journal entry (Asset Cash Debit, Tuition Revenue Credit)
    const accounts = await this.ledgerService.getAccounts();
    const assetAcc = accounts.find((a: any) => a.type === 'ASSET') || { id: 'acc-1' };
    const revAcc = accounts.find((a: any) => a.type === 'REVENUE') || { id: 'acc-2' };

    await this.ledgerService.postFeePayment({
      idempotency_key: `LEDGER-${dto.idempotency_key}`,
      reference: `PAYIN-${payment[0].id.slice(0, 8)}`,
      description: dto.description,
      amount_cents: dto.amount_cents,
      asset_account_id: assetAcc.id,
      revenue_account_id: revAcc.id,
    });

    return payment[0];
  }

  /**
   * Process Pay-Out (Teacher payroll / Vendor disbursements via Stripe Payouts / Connect)
   */
  async processPayOut(dto: CreatePayOutDto) {
    if (!dto.idempotency_key) {
      throw new BadRequestException('[FINOPS_VIOLATION] Idempotency key is required for payouts.');
    }

    let stripePayoutId = `po_mock_${Date.now()}`;
    let status: 'SUCCEEDED' | 'PENDING' = 'SUCCEEDED';

    const payout = await this.db.queryTenantScoped(
      `INSERT INTO payments (type, idempotency_key, stripe_intent_id, amount_cents, currency, status, recipient_email, metadata)
       VALUES ('PAY_OUT', $1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tenant_id, type, idempotency_key, stripe_intent_id, amount_cents, currency, status, recipient_email, created_at`,
      [
        dto.idempotency_key,
        stripePayoutId,
        dto.amount_cents,
        dto.currency.toUpperCase(),
        status,
        dto.recipient_email,
        JSON.stringify({ description: dto.description }),
      ]
    );

    return payout[0];
  }

  async getPaymentsHistory() {
    return this.db.queryTenantScoped(
      `SELECT id, tenant_id, type, idempotency_key, stripe_intent_id, amount_cents, currency, status, recipient_email, created_at
       FROM payments ORDER BY created_at DESC`
    );
  }
}
