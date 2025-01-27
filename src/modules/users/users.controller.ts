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
  ForbiddenException,
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
import storageLocal from 'src/common/multer/upload-local.multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, User } from '@prisma/client';
import storageAvatarUser from 'src/common/services/upload-avarta-user';
import { GetUser } from 'src/common/decorators/get-user.decorator';
interface RequestWithUser extends ExpressRequest {
  user?: any;
}

@Controller('/api/users')
export class UsersController {
  constructor(private userService: UsersService) {}

  //Get all users
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    description: 'Success',
  })
  @Get()
  getAllUsers(@Req() req: ExpressRequest) {
    return this.userService.getAllUsers(req);
  }

  //Tạo tài khoản
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SHIPPER, Role.STORE)
  @ApiBearerAuth('JWT-auth')
  async deleteUser(@Param('id') id: string, @GetUser() user: User) {
    // Kiểm tra xem user có quyền xóa không
    if (user.role !== Role.ADMIN && id !== user.id) {
      throw new ForbiddenException('Bạn không có quyền xóa tài khoản này');
    }
    return this.userService.deleteUsers(id, user.id);
  }

  //Tìm kiếm và phân trang
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @ApiResponse({
    description: 'Success',
  })
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  //Cập nhật thông tin tài khoản
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Req() req: RequestWithUser,
  ) {
    return this.userService.updateUser(id, req.user.id, updateUserDto);
  }

  //Tìm kiếm tài khoản
  @ApiResponse({
    description: 'Success',
  })
  @Get('search/:name-user')
  searchUsers(@Param('name-user') name: string) {
    return this.userService.searchUsers({ name: name });
  }

  //Tải ảnh đại diện lên local
  @Post('avatar-local')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ description: 'Success' })
  @UseInterceptors(FileInterceptor('avatar', { storage: storageLocal }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  uploadAvatarLocal(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.userService.uploadAvatar(file, req.user.id, req.user.id);
  }

  //Tải ảnh đại diện lên cloud
  @Post('avatar-cloud')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ description: 'Success' })
  @UseInterceptors(FileInterceptor('avatar', { storage: storageAvatarUser }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  async uploadAvatarCloud(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.userService.uploadAvatar(file, req.user.id, req.user.id);
  }

  // Đăng ký cửa hàng
  @Post('register-store')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER)
  @ApiResponse({ description: 'Success' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        storeName: { type: 'string' },
        storeDescription: { type: 'string' },
        storeAddress: { type: 'string' },
      },
    },
  })
  async registerStore(
    @Body()
    storeData: {
      storeName: string;
      storeDescription: string;
      storeAddress: string;
    },
    @Req() req: RequestWithUser,
  ) {
    return this.userService.registerStore(req.user.id, storeData);
  }
}
