import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (requiredRoles.includes(user?.role)) return true;

    if (user?.role === 'manager') {
      if (requiredRoles.includes('viewer') && request.method === 'GET') return true;

      const featureMap: Record<string, string> = {
        '/clients': 'clients',
        '/competitors': 'competitors',
        '/calendars': 'contentCalendar',
        '/targets': 'targets',
      };
      const path = `${request.baseUrl || ''}${request.url || ''}`;
      const feature = Object.entries(featureMap).find(([prefix]) =>
        String(path).startsWith(prefix),
      )?.[1];

      return Boolean(feature && user.featureAccess?.includes(feature));
    }

    return false;
  }
}
