import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateUserAddressDto, UpdateUserAddressDto  } from './dto/address.dto';
@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}


  async findAll() {
    return this.prisma.userAddress.findMany();
  }

  async findOne(id: string) {
    const address = await this.prisma.userAddress.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async update(id: string, data: UpdateUserAddressDto) {
    return this.prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.userAddress.delete({ where: { id } });
  }
}
