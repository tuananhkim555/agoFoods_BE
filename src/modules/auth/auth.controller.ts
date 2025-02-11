import { Controller, Post, Body, Headers, Patch, Param, Query, Get, UseInterceptors, BadRequestException } from '@nestjs/common';
import {  LoginDto, RegisterDto, RegisterShipperDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ApiBody, ApiExcludeEndpoint, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { Public } from 'src/common/decorators/public.decorator';


// ApiKeyGuard: Kiểm tra API key cho các endpoint cần bảo mật đặc biệt
// JwtAuthGuard: Xác thực JWT token, kiểm tra user đã đăng nhập
// RolesGuard: Kiểm tra phân quyền (ADMIN và user thường)

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  // Register
  @ApiBody({ type: RegisterDto })
  @Post('register')
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @Public() // cho phép truy cập mà không cần xác thực
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Đăng ký shipper
  @Public()
  @Post('register-shipper')
  @ApiOperation({ summary: 'Đăng ký tài xế' })
  @ApiResponse({ status: 201, description: 'Đăng ký tài xế thành công' })
  @ApiResponse({ status: 400, description: 'Thông tin không hợp lệ' })
  async registerShipper(
    @Body() registerShipperDto: RegisterShipperDto
  ) {
      return await this.authService.registerShipper(registerShipperDto);
  }
  
  // Login
  @ApiBody({ type: LoginDto })
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @Public() // cho phép truy cập mà không cần xác thực
  @ResponseMessage(`Đăng nhập thành công`)
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login({ user: loginDto });
  }

  // Đặt quyền admin
  @Patch('set-admin/:userId')
  @UseGuards(ApiKeyGuard)
  @Public() // cho phép truy cập mà không cần xác thực
  async setAdminRole(
    @Param('userId') userId: string,
    @Headers('x-api-key') apiKey: string
  ) {
    return this.authService.setAdminRole(userId, apiKey);
  }

  // Xác thực email
  @Public()
  @Get('verify-email')
  @ApiExcludeEndpoint() 
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Quên mật khẩu
  @Public()
  @Post('forgot-password')
  @ApiExcludeEndpoint() 
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  
  // Reset mật khẩu
  @Patch('reset-password')
  @Public()
  @ApiExcludeEndpoint() 
  async resetPassword(@Query('token') token: string, @Body('newPassword') newPassword: string) {
    return this.authService.resetPassword(token, newPassword);
  }
  


  // Đăng xuất
@Public()
@Post('logout')
@ApiExcludeEndpoint() 
async logoutWithToken(@Headers('authorization') token: string) {
  return this.authService.logoutWithToken(token);
}


}
