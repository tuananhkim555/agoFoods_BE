import { Controller, Post, Body, Headers, Patch, Param } from '@nestjs/common';
import { User } from '@prisma/client';
import {  LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  // Register
  @ApiBody({
    type:RegisterDto
  })
  @Post('register')
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-app-source') appSource: string
  ) {
    return this.authService.register(registerDto, appSource);
  }

  // Login
  @ApiBody({
    type: LoginDto
  })
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ResponseMessage(`Đăng nhập thành công`)
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Patch('set-admin/:userId')
  @UseGuards(ApiKeyGuard)
  async setAdminRole(
    @Param('userId') userId: string,
    @Headers('x-api-key') apiKey: string
  ) {
    return this.authService.setAdminRole(userId, apiKey);
  }
}
