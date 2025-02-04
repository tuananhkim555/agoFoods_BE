/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    console.log(`canActivate`);
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('JWT Guard Error:', err);
    console.log('JWT Guard User:', user);
    console.log('JWT Guard Info:', info);
    
    // Kiểm tra nếu có lỗi hoặc không có user
    if (err || !user) {
      throw new HttpException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Vui lòng nhâp token hoặc token không hợp lệ',
        error: info?.message || 'Token validation failed'
      }, HttpStatus.UNAUTHORIZED);
    }


    if (info instanceof TokenExpiredError) throw new ForbiddenException({statusCode: 403, message: 'Token hết hạn'});
    if (info instanceof JsonWebTokenError) throw new UnauthorizedException({statusCode: 401, message: 'Token không hợp lệ'});

    return user;
  }
}
