import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}


  // Foramt id
  private async generateAddressId(): Promise<string> {
    while (true) {
      // Generate random 5 digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const addressId = `AD_${randomNum}`;
      
      // Check if ID exists
      const existingFood = await this.prisma.food.findUnique({
        where: { id: addressId }
      });
      
      // Return if ID is unique
      if (!existingFood) {
        return addressId;
      }
    }
  }

  async addAddress(userId: string, createAddressDto: CreateAddressDto) {
    try {
      // Nếu địa chỉ mới là default, cập nhật tất cả địa chỉ cũ thành false
      // 1. Generate unique food ID
      const addressId = await this.generateAddressId();

      if (createAddressDto.default) {
        await this.prisma.address.updateMany({
          where: { userId },
          data: { default: false },
        });
      }

      const newAddress = await this.prisma.address.create({
        data: {
          id: addressId,
          userId,
          ...createAddressDto,
        },
      });

      return { status: true, message: 'Đã thêm thành công địa chỉ', data: newAddress };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Lấy địa chỉ
  async getAddress(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
    });

    if (!addresses.length) {
      throw new NotFoundException('No addresses found');
    }

    return { status: true, data: addresses };
  }

  // Xóa địa chỉ
  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    return { status: true, message: 'Address successfully deleted' };
  }

  // set address default
  async setAddressDefault(userId: string, addressId: string) {
    try {
      // Cập nhật tất cả địa chỉ của user thành không phải mặc định
      await this.prisma.address.updateMany({
        where: { userId },
        data: { default: false },
      });

      // Cập nhật địa chỉ cụ thể thành mặc định
      const updatedAddress = await this.prisma.address.update({
        where: { id: addressId },
        data: { default: true },
      });

      return {
        status: true,
        message: 'Address set to default successfully',
        data: updatedAddress,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // get default address
  async getDefaultAddress(userId: string) {
    try {
      // Tìm địa chỉ mặc định của user
      const defaultAddress = await this.prisma.address.findFirst({
        where: { userId, default: true },
      });

      if (!defaultAddress) {
        throw new NotFoundException('No default address found');
      }

      return {
        status: true,
        data: defaultAddress,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

