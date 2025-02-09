import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RatingController } from './rating.controller';

@Module({
  imports: [PrismaModule],
  providers: [RatingService, PrismaService, JwtAuthGuard],
  controllers: [RatingController],
  exports: [RatingService]
})
export class RatingModule {}
