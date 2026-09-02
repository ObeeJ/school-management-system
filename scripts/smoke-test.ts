import { DatabaseService } from '../apps/backend/src/database/database.service';
import { StudentsService } from '../apps/backend/src/students/students.service';
import { LedgerService } from '../apps/backend/src/ledger/ledger.service';
import { TenantContext } from '../apps/backend/src/tenancy/tenant.context';

async function runSmokeTest() {
  console.log('================================================================');
  console.log(' SCHOLARIA MULTI-TENANCY & DATA ISOLATION INTEGRATION SMOKE TEST');
  console.log('================================================================\n');

  const dbService = new DatabaseService();
  await dbService.onModuleInit();

  const studentsService = new StudentsService(dbService);
  const ledgerService = new LedgerService(dbService);

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
      assert(
        oakwoodStudents.some((s) => s.student_code === 'OAK-SMOKE-1'),
        'Oakwood enrolled student is present in Oakwood tenant context.'
      );
    }
  );

  await TenantContext.run(
    { tenantId: 'st-jude-high', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const stJudeStudents: any[] = await studentsService.findAll();
      assert(
        stJudeStudents.every((s) => s.tenant_id === 'st-jude-high'),
        'Tenant 2 (St. Jude) query returns ONLY St. Jude students.'
      );
      assert(
        !stJudeStudents.some((s) => s.student_code === 'OAK-SMOKE-1'),
        'CRITICAL SECURITY: St. Jude tenant context CANNOT observe Oakwood student (Zero Data Leakage).'
      );
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Fintech Ledger Double-Entry Balance Invariant
  // ---------------------------------------------------------------------------
  await TenantContext.run(
    { tenantId: 'oakwood-academy', tier: 'STARTER_POOLED_RLS' },
    async () => {
      const accounts: any[] = await ledgerService.getAccounts();
      const assetAcc = accounts.find((a) => a.type === 'ASSET') || { id: 'acc-1' };
      const revAcc = accounts.find((a) => a.type === 'REVENUE') || { id: 'acc-2' };

      const postedTx = await ledgerService.postFeePayment({
        idempotency_key: `SMOKE-IK-${Date.now()}`,
        reference: 'REF-SMOKE-001',
        description: 'Smoke Test Tuition Payment',
        amount_cents: 50000,
        asset_account_id: assetAcc.id,
        revenue_account_id: revAcc.id,
      });

      assert(postedTx.status === 'POSTED', 'Ledger fee payment posted successfully.');
      assert(postedTx.balanced === true, 'Ledger transaction adheres to Debit = Credit invariant.');
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Unbound Tenant Execution Guard
  // ---------------------------------------------------------------------------
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
  console.log(` SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
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
