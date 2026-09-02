import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TenantContext } from '../tenancy/tenant.context';

export interface SubscribePlanDto {
  plan_id: 'PLAN_STARTER' | 'PLAN_GROWTH' | 'PLAN_ENTERPRISE';
  payment_method_id?: string;
  auto_debit: boolean;
}

export interface CancelSubscriptionDto {
  cancel_immediately?: boolean; // false = ChatGPT model (cancel at period end), true = immediate
  cancellation_reason?: string;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  getAvailablePlans() {
    return [
      {
        id: 'PLAN_STARTER',
        name: 'Starter Plan (Free)',
        price_cents: 0,
        currency: 'USD',
        billing_interval: 'MONTHLY',
        tier_mapping: 'STARTER_POOLED_RLS',
        auto_debit_required: false,
        features: [
          'Up to 100 Enrolled Students',
          'Shared PostgreSQL Row-Level Security (RLS)',
          'Basic Student Directory & Fee Receipts',
          'Community Support',
        ],
      },
      {
        id: 'PLAN_GROWTH',
        name: 'Growth Plan',
        price_cents: 19900, // $199.00 / month
        currency: 'USD',
        billing_interval: 'MONTHLY',
        tier_mapping: 'GROWTH_ISOLATED_SCHEMA',
        auto_debit_required: true,
        features: [
          'Up to 2,500 Enrolled Students',
          'Logical Schema-per-Tenant Isolation (Search Path)',
          'Stripe Pay-In & Pay-Out Gateway',
          'AI Student At-Risk & Fee Default Predictor',
          'Automated Monthly Auto-Debit Billing',
        ],
      },
      {
        id: 'PLAN_ENTERPRISE',
        name: 'Enterprise Plan',
        price_cents: 49900, // $499.00 / month
        currency: 'USD',
        billing_interval: 'MONTHLY',
        tier_mapping: 'ENTERPRISE_DEDICATED_DB',
        auto_debit_required: true,
        features: [
          'Unlimited Enrolled Students',
          'Physical Dedicated Database Instance (Zero Blast Radius)',
          'Dedicated Redis Session Pool & Custom NGINX Routing',
          'Stripe Identity / UK & USA KYC Integration',
          'Dedicated Account Manager & 99.99% SLA',
        ],
      },
    ];
  }

  async getCurrentSubscription() {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';

    const subs = await this.db.queryTenantScoped(
      `SELECT s.id, s.tenant_id, s.plan_id, s.stripe_subscription_id, s.status, s.auto_debit_enabled,
              s.current_period_start, s.current_period_end, s.cancel_at_period_end, p.name as plan_name, p.price_cents
       FROM tenant_subscriptions s
       JOIN membership_plans p ON s.plan_id = p.id
       WHERE s.tenant_id = $1`,
      [tenantId]
    );

    if (!subs.length) {
      // Default to Free Starter plan
      return {
        tenant_id: tenantId,
        plan_id: 'PLAN_STARTER',
        plan_name: 'Starter Plan (Free)',
        price_cents: 0,
        status: 'ACTIVE',
        auto_debit_enabled: false,
        cancel_at_period_end: false,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    return subs[0];
  }

  /**
   * Subscribe / Upgrade Plan with Recurring Auto-Debit (ChatGPT Billing Model)
   */
  async subscribePlan(dto: SubscribePlanDto) {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';

    const plan = this.getAvailablePlans().find((p) => p.id === dto.plan_id);
    if (!plan) {
      throw new BadRequestException('Invalid membership plan specified.');
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day recurring billing cycle

    const stripeSubId = `sub_stripe_${Date.now()}`;
    const stripeCustId = `cus_stripe_${tenantId}`;

    const sub = await this.db.queryTenantScoped(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_id, stripe_subscription_id, stripe_customer_id, status, auto_debit_enabled, current_period_start, current_period_end, cancel_at_period_end)
       VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, false)
       ON CONFLICT (tenant_id) DO UPDATE
       SET plan_id = EXCLUDED.plan_id,
           stripe_subscription_id = EXCLUDED.stripe_subscription_id,
           status = 'ACTIVE',
           auto_debit_enabled = EXCLUDED.auto_debit_enabled,
           current_period_start = EXCLUDED.current_period_start,
           current_period_end = EXCLUDED.current_period_end,
           cancel_at_period_end = false
       RETURNING id, tenant_id, plan_id, stripe_subscription_id, status, auto_debit_enabled, current_period_start, current_period_end, cancel_at_period_end`,
      [tenantId, dto.plan_id, stripeSubId, stripeCustId, dto.auto_debit, now, periodEnd]
    );

    return {
      message: `Successfully subscribed to ${plan.name}. Monthly auto-debit active.`,
      subscription: sub[0],
      planDetails: plan,
    };
  }

  /**
   * Cancel Subscription (ChatGPT Model: keep access until end of billing cycle)
   */
  async cancelSubscription(dto: CancelSubscriptionDto) {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';

    const currentSub = await this.getCurrentSubscription();

    if (dto.cancel_immediately) {
      // Immediate cancellation
      await this.db.queryTenantScoped(
        `UPDATE tenant_subscriptions
         SET status = 'CANCELED', auto_debit_enabled = false, cancel_at_period_end = false, canceled_at = NOW()
         WHERE tenant_id = $1`,
        [tenantId]
      );
      return {
        status: 'CANCELED',
        cancellation_type: 'IMMEDIATE',
        message: 'Membership subscription canceled immediately. Account downgraded to Free Starter tier.',
      };
    }

    // ChatGPT Model: Cancel at period end
    await this.db.queryTenantScoped(
      `UPDATE tenant_subscriptions
       SET cancel_at_period_end = true, auto_debit_enabled = false
       WHERE tenant_id = $1`,
      [tenantId]
    );

    return {
      status: 'ACTIVE',
      cancel_at_period_end: true,
      auto_debit_enabled: false,
      access_until: currentSub.current_period_end,
      cancellation_type: 'END_OF_BILLING_CYCLE',
      message: `Subscription renewal canceled. You retain full ${currentSub.plan_name} features until ${new Date(currentSub.current_period_end).toLocaleDateString()}. No future auto-debits will occur.`,
    };
  }
}
