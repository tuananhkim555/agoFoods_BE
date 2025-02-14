import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApproveUserDto } from './dto/approve-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async approveUser(userId: string, approveUserDto: ApproveUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.role !== 'SHIPPER' && user.role !== 'RESTAURANTS') {
      throw new ForbiddenException('Chỉ có thể duyệt user Shipper hoặc Restaurant');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: approveUserDto.isApproved },
    });
  }
}
