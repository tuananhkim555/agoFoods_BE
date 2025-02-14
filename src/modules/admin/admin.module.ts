import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  providers: [AdminService, PrismaService, JwtStrategy, JwtAuthGuard],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
