import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApproveUserDto } from './dto/approve-user.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('approve-user/:userId')
//   @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN) // Chỉ admin có quyền duyệt
  @ApiOperation({ summary: 'Duyệt user' })
  @ApiResponse({ status: 200, description: 'Duyệt user thành công' })
  @ApiResponse({ status: 400, description: 'Duyệt user thất bại' })
  async approveUser(@Param('userId') userId: string, @Body() approveUserDto: ApproveUserDto) {
    return this.adminService.approveUser(userId, approveUserDto);
  }
}
