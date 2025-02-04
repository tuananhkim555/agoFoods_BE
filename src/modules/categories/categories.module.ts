import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [PrismaModule],
  providers: [CategoriesService, PrismaService, JwtService],
  controllers: [CategoriesController],
  exports: [CategoriesService]
})
export class CategoriesModule {}
