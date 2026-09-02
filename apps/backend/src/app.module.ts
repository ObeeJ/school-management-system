import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { TenantRouterService } from './tenancy/tenant-router.service';
import { TenancyController } from './tenancy/tenancy.controller';
import { StudentsService } from './students/students.service';
import { StudentsController } from './students/students.controller';
import { LedgerService } from './ledger/ledger.service';
import { LedgerController } from './ledger/ledger.controller';
import { KycService } from './kyc/kyc.service';
import { KycController } from './kyc/kyc.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsController } from './payments/payments.controller';
import { QueueService } from './queue/queue.service';
import { AiEngineService } from './ai-engine/ai-engine.service';
import { AiEngineController } from './ai-engine/ai-engine.controller';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';
import { SubscriptionsService } from './subscriptions/subscriptions.service';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';

@Module({
  imports: [],
  controllers: [
    TenancyController,
    StudentsController,
    LedgerController,
    KycController,
    PaymentsController,
    AiEngineController,
    AdminController,
    SubscriptionsController,
  ],
  providers: [
    DatabaseService,
    TenantRouterService,
    StudentsService,
    LedgerService,
    KycService,
    PaymentsService,
    QueueService,
    AiEngineService,
    AdminService,
    SubscriptionsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
