import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [PrismaModule],
  controllers: [FoodsController],
  providers: [FoodsService, PrismaService, JwtService],
  exports: [FoodsService]
})
export class FoodsModule {}
