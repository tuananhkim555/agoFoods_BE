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
    ParseIntPipe,
    UseGuards,
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
    ApiHeader,
  } from '@nestjs/swagger';
  import storageLocal from 'src/common/multer/upload-local.multer';
  import storageCloud from 'src/common/multer/upload-cloud.multer';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
  
  interface RequestWithUser extends ExpressRequest {
    user?: any;
  }
  
  @Controller('/api/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  export class UsersController {
    constructor(private userService: UsersService) {}
  
    //Lấy danh sách tài khoản
    @Roles(Role.ADMIN) // Thêm decorator để chỉ cho phép ADMIN truy cập
    @ApiResponse({
      description: 'Success',
    })
    @ApiBearerAuth('JWT-auth')
    @Get()
    getAllUsers(@Req() req: ExpressRequest) {
      return this.userService.getAllUsers(req);
    }
  
    //Tạo tài khoản
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
    @ApiResponse({
      description: 'Success',
    })
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.userService.deleteUsers(id);
    }
  
    //Tìm kiếm và phân trang
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
    getUserById(@Param('id', ParseIntPipe) id: string) {
      return this.userService.getUserById(id);
    }
  
    //Cập nhật thông tin tài khoản
    @ApiBody({
      type: UpdateUserDto,
    })
    @ApiResponse({
      description: 'Success',
    })
    @Put(':id')
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
      return this.userService.updateUser(id, updateUserDto);
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
      @Req() req: RequestWithUser
    ) {
      return this.userService.uploadAvatar(file, req.user.id);
    }
  
    //Tải ảnh đại diện lên cloud
    @Post('avatar-cloud')
    @UseGuards(JwtAuthGuard)
    @ApiHeader({
      name: 'accessToken',
      required: true,
      description: 'Access token for authentication'
    })
    @ApiResponse({ description: 'Success' })
    @UseInterceptors(FileInterceptor('avatar', { storage: storageCloud }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadAvatarDto })
    async uploadAvatarCloud(
      @UploadedFile() file: Express.Multer.File,
      @Req() req: RequestWithUser
    ) {
      return this.userService.uploadAvatar(file, req.user.id);
    }
  
  }
  