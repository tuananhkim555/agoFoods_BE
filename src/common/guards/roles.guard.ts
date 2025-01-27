import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    // Debug logs
    console.log('Required roles:', requiredRoles);
    console.log('User from request:', user);
    console.log('User role:', user?.role);
    console.log('Request params:', params);

    // Nếu không có user, từ chối truy cập
    if (!user) {
      console.log('No user found in request');
      return false;
    }

    // Nếu là ADMIN, cho phép tất cả
    if (user.role === Role.ADMIN) {
      console.log('User is ADMIN, access granted');
      return true;
    }

    // Nếu user đang thao tác trên chính tài khoản của mình
    if (params.id === user.id) {
      console.log('User accessing own account');
      return true;
    }

    // Kiểm tra role
    const hasRole = requiredRoles.includes(user.role);
    console.log('Role check result:', hasRole);

    return hasRole;
  }
} 