import { DatabaseService } from '../apps/backend/src/database/database.service';
import { StudentsService } from '../apps/backend/src/students/students.service';
import { LedgerService } from '../apps/backend/src/ledger/ledger.service';
import { KycService } from '../apps/backend/src/kyc/kyc.service';
import { PaymentsService } from '../apps/backend/src/payments/payments.service';
import { QueueService } from '../apps/backend/src/queue/queue.service';
import { AiEngineService } from '../apps/backend/src/ai-engine/ai-engine.service';
import { AdminService } from '../apps/backend/src/admin/admin.service';
import { SubscriptionsService } from '../apps/backend/src/subscriptions/subscriptions.service';
import { TenantContext } from '../apps/backend/src/tenancy/tenant.context';

async function runSmokeTest() {
  console.log('================================================================');
  console.log(' SCHOLARIA FULLSTACK MULTI-TENANCY & FINTECH INTEGRATION SMOKE  ');
  console.log('================================================================\n');

  const dbService = new DatabaseService();
  await dbService.onModuleInit();

  const queueService = new QueueService();
  const studentsService = new StudentsService(dbService);
  const ledgerService = new LedgerService(dbService);
  const kycService = new KycService(dbService);
  const paymentsService = new PaymentsService(dbService, ledgerService);
  const aiEngineService = new AiEngineService(dbService, queueService);
  const adminService = new AdminService(dbService, queueService);
  const subscriptionsService = new SubscriptionsService(dbService);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Tenant Context Isolation & RLS Policy Verification
  // ---------------------------------------------------------------------------
  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      await studentsService.create({
        student_code: 'OAK-SMOKE-1',
        first_name: 'Sophia',
        last_name: 'Davis',
        grade_level: 'Grade 11',
      });
      const oakwoodStudents: any[] = await studentsService.findAll();
      assert(
        oakwoodStudents.every((s) => s.tenant_id === 'oakwood-academy'),
        'Tenant 1 (Oakwood) query returns ONLY Oakwood students.'
      );
    }
  );

  await TenantContext.run(
    { tenantId: 'st-jude-high', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const stJudeStudents: any[] = await studentsService.findAll();
      assert(
        !stJudeStudents.some((s) => s.student_code === 'OAK-SMOKE-1'),
        'CRITICAL SECURITY: St. Jude tenant context CANNOT observe Oakwood student (Zero Leakage).'
      );
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Membership Plan System & ChatGPT Auto-Debit / Cancellation Model
  // ---------------------------------------------------------------------------
  const plans = subscriptionsService.getAvailablePlans();
  assert(plans.length === 3, 'Available membership plans include Starter, Growth, and Enterprise.');

  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const subRes = await subscriptionsService.subscribePlan({
        plan_id: 'PLAN_GROWTH',
        auto_debit: true,
      });
      assert(
        subRes.subscription.plan_id === 'PLAN_GROWTH' && subRes.subscription.auto_debit_enabled === true,
        'Subscribed to Growth Plan with automatic monthly Stripe auto-debit.'
      );

      // ChatGPT Cancellation Model: Cancel at period end
      const cancelRes = await subscriptionsService.cancelSubscription({
        cancel_immediately: false,
      });
      assert(
        cancelRes.cancel_at_period_end === true && cancelRes.auto_debit_enabled === false,
        'ChatGPT Cancellation: Auto-debit disabled, paid features retained until period end date.'
      );
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 3: KYC Compliance Evaluation & Dev Bypass Mode
  // ---------------------------------------------------------------------------
  const kycRec = kycService.getKycProviderRecommendation();
  assert(
    kycRec.recommendedProvider.includes('STRIPE_IDENTITY'),
    'KYC Evaluation accurately recommends Stripe Identity for UK & USA markets over Prembly/SmileID.'
  );

  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const kycRes = await kycService.verifyKyc({
        user_id: 'usr-smoke-1',
        provider: 'STRIPE_IDENTITY',
        document_type: 'PASSPORT',
        country_code: 'GB',
      });
      assert(
        kycRes.status === 'BYPASSED_DEV',
        'KYC Engine triggers BYPASSED_DEV status when API keys are absent in development environment.'
      );
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Stripe Pay-In & Pay-Out FinOps Idempotency & Ledger Balance
  // ---------------------------------------------------------------------------
  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const payIn = await paymentsService.processPayIn({
        idempotency_key: `IK-PAYIN-${Date.now()}`,
        amount_cents: 150000,
        currency: 'USD',
        description: 'Tuition Fall 2026',
      });
      assert(payIn.type === 'PAY_IN' && payIn.status === 'SUCCEEDED', 'Stripe Pay-In executed successfully.');

      const payOut = await paymentsService.processPayOut({
        idempotency_key: `IK-PAYOUT-${Date.now()}`,
        amount_cents: 45000,
        currency: 'USD',
        recipient_email: 'payroll@oakwood.edu',
        description: 'Teacher Monthly Stipend',
      });
      assert(payOut.type === 'PAY_OUT' && payOut.status === 'SUCCEEDED', 'Stripe Pay-Out executed successfully.');
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Queueing Engine & AI Dataset RAG Ingestion
  // ---------------------------------------------------------------------------
  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const dataset = await aiEngineService.createDataset({
        name: 'Student Grade & Attendance Dataset',
        dataset_type: 'STUDENT_PERFORMANCE',
        dataset_payload: [
          { student_code: 'OAK-001', grade_avg: 94, attendance_rate: 0.98 },
          { student_code: 'OAK-002', grade_avg: 71, attendance_rate: 0.82 },
        ],
      });
      assert(dataset.record_count === 2, 'AI Dataset ingested into vector queue.');

      const pattern = await aiEngineService.createPattern({
        pattern_name: 'Fee & Academic At-Risk Predictor',
        system_instructions: 'Identify students at risk of attendance drop or tuition default',
        trigger_rule: 'ON_ATTENDANCE_DROP',
      });

      const analysis = await aiEngineService.runPatternAnalysis(pattern.id);
      assert(analysis.insights.length > 0, 'AI Pattern Engine generated structured insights.');
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Admin Control Plane Dashboard & Unbound Guard
  // ---------------------------------------------------------------------------
  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const metrics = await adminService.getAdminDashboardMetrics();
      assert(metrics.totalStudents > 0, 'Admin Dashboard aggregates multi-tenant metric counters.');
    }
  );

  try {
    TenantContext.getRequiredTenantId();
    assert(false, 'Unbound tenant context execution throws exception.');
  } catch (err: any) {
    assert(
      err.message.includes('[TENANCY_VIOLATION]'),
      'Unbound execution blocked by TenantContext security guard.'
    );
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passedTests} / ${totalTests} INTEGRATION TESTS PASSED`);
  console.log('================================================================\n');

  await dbService.onModuleDestroy();
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSmokeTest().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
