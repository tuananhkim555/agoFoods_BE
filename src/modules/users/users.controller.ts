import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserFilterDto,
  UploadAvatarDto,
} from './dto/users.dto';
import { Request as ExpressRequest } from 'express';
import {
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, User } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
interface RequestWithUser extends ExpressRequest {
  user?: any;
}

@Controller('/api/users')
export class UsersController {
  constructor(private userService: UsersService) {}

  //Get all users
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    description: 'Success',
  })
  @Get()
  getAllUsers(@Req() req: ExpressRequest) {
    return this.userService.getAllUsers(req);
  }

  //Tạo tài khoản
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiResponse({
    description: 'Success',
  })
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    console.log('create user api =>', createUserDto);
    return this.userService.createUser(createUserDto);
  }

  //Xóa tài khoản
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUsers(@Param('id') id: string, @GetUser() currentUser: User) {
    return this.userService.deleteUsers(id, currentUser);
  }

  //Tìm kiếm và phân trang
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    description: 'Success',
  })
  @ApiQuery({ name: 'pageIndex', description: 'Page number' })
  @ApiQuery({ name: 'pageSize', description: 'Items per page' })
  @ApiQuery({ name: 'keyword', description: 'Search keyword' })
  @Get('search-pagination')
  getPaginatedUsers(@Query() query: UserFilterDto) {
    return this.userService.getPaginatedUsers(query);
  }

  //Lấy thông tin tài khoản
  // dùng JwtAuthGuard để lấy thông tin user 
  // ADMIN có thể xem tất cả, user khác chỉ xem được thông tin của mình
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SHIPPER, Role.RESTAURANTS)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    description: 'Success',
  })
  @Get(':id')
  getUserById(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.userService.getUserById(id, req);
  }

  //Cập nhật thông tin tài khoản
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SHIPPER, Role.RESTAURANTS)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    description: 'Success',
  })
  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ) {
    // ADMIN có thể update tất cả, user khác chỉ update được của mình
    if (user.role !== Role.ADMIN && id !== user.id) {
      throw new UnauthorizedException('Bạn chỉ có thể cập nhật thông tin của mình');
    }
    return this.userService.updateUser(id, user.id, updateUserDto);
  }

  //Tìm kiếm tài khoản
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    description: 'Success',
  })
  @Get('search/:name-user')
  searchUsers(@Param('name-user') name: string) {
    return this.userService.searchUsers({ name: name });
  }


  //Tải ảnh đại diện lên cloud
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SHIPPER, Role.RESTAURANTS)
  @ApiBearerAuth('JWT-auth')
  @Post('avatar-cloud')
  @ApiResponse({ description: 'Success' })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatarCloud(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.userService.uploadAvatar(file, req.user.id);
  }

}
