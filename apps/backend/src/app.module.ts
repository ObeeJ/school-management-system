import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { TenantRouterService } from './tenancy/tenant-router.service';
import { TenancyController } from './tenancy/tenancy.controller';
import { StudentsService } from './students/students.service';
import { StudentsController } from './students/students.controller';
import { LedgerService } from './ledger/ledger.service';
import { LedgerController } from './ledger/ledger.controller';

@Module({
  imports: [],
  controllers: [TenancyController, StudentsController, LedgerController],
  providers: [DatabaseService, TenantRouterService, StudentsService, LedgerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
