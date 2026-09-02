import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext, TenantSession } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant identifier from header (x-tenant-id) or hostname subdomain
    let tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId && req.hostname) {
      const hostParts = req.hostname.split('.');
      if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
        tenantId = hostParts[0];
      }
    }

    // Default fallbacks for development/demo
    if (!tenantId) {
      tenantId = 'oakwood-academy'; // Default demo tenant
    }

    // Determine tenant metadata / tier based on tenant ID convention
    let tier: TenantSession['tier'] = 'STARTER_POOLED_RLS';
    let dbSchema = 'public';

    if (tenantId.endsWith('-enterprise')) {
      tier = 'ENTERPRISE_DEDICATED_DB';
    } else if (tenantId.endsWith('-schema')) {
      tier = 'GROWTH_ISOLATED_SCHEMA';
      dbSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    }

    const session: TenantSession = {
      tenantId,
      tier,
      dbSchema,
      userId: (req.headers['x-user-id'] as string) || 'system-admin',
    };

    TenantContext.run(session, () => {
      next();
    });
  }
}
