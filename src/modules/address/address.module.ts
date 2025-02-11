import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';


@Module({
  imports: [PrismaModule],
  controllers: [AddressController],
  providers: [AddressService, PrismaService, JwtService],
  exports: [AddressService]
})
export class FoodsModule {}
