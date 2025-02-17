import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: any) {
    // Lấy thông tin user từ database dựa vào id hoặc email trong token
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.id || undefined,
        email: payload.email || undefined,
      },
    });
  
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
  
    return user;
  }
   
}