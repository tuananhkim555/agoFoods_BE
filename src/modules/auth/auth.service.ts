import { PrismaService } from '../../common/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';
import { Gender, Role, User } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IdGenerator } from 'src/common/helpers/id-generator.helper';

@Injectable()
export class AuthService {
  constructor(
    public prisma: PrismaService,
    private jwtService: JwtService,
    public configService: ConfigService
  ) {}

  // Đăng ký tài khoản foods + shipper
  async register(userData: RegisterDto, appSource: string) {
    try {
      // Tự động gán role dựa vào nguồn request
      let autoRole: Role;
      switch (appSource) {
        case 'FOOD_APP':
          autoRole = Role.CUSTOMER;
          break;
        case 'SHIPPER_APP':
          autoRole = Role.SHIPPER;
          break;
        default:
          throw new HttpException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Nguồn request không hợp lệ',
            error: 'Bad Request'
          }, HttpStatus.BAD_REQUEST);
      }

      // Override role từ request với role tự động
      userData.role = autoRole;

      // Check if email exists
      const emailExists = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });
      if (emailExists) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email đã được sử dụng',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }

      // Check if phone exists
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: userData.phone }
      });
      if (phoneExists) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Số điện thoại đã được sử dụng',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }


      // Validate required fields
      if (!userData.fullName) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Họ tên không được để trống',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }

      if (!userData.birthday) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Ngày sinh không được để trống',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }

      const hashPassword = await hash(userData.password, 10);
      
      // Generate custom ID based on role
      const customId = await IdGenerator.generateUserId(userData.role, this.prisma);
      
      const user = await this.prisma.user.create({
        data: {
          id: customId, // Use generated ID instead of default UUID
          email: userData.email,
          phone: userData.phone,
          password: hashPassword,
          fullName: userData.fullName,
          gender: userData.gender,
          birthday: userData.birthday,
          role: userData.role,
          isActive: true,
          status: true
        }
      });

      return {
        data: user // Return full user object
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.code === 'P2002') {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Số điện thoại hoặc email đã được sử dụng',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Có lỗi xảy ra khi tạo tài khoản',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Đăng nhập
  login = async (data: { user: any }): Promise<any> => {
    // bước 1: kiểm tra xem tài khoản này có tồn tại không?
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role
      }
    });
    if (!user) {
      throw new HttpException(
        { message: 'Tài khoản không tồn tại' },
        HttpStatus.UNAUTHORIZED
      );
    }

    // bước 2: kiểm tra mật khẩu
    const verify = await compare(data.user.password, user.password);

    if (!verify) {
      throw new HttpException(
        { message: 'Mật khẩu không đúng.' },
        HttpStatus.UNAUTHORIZED
      );
    }

    // bước 3: tạo token truy cập và token làm mới
    const payload = { id: user.id, fullName: user.fullName, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_EXPIRES,
      expiresIn: '7d',
    });
    return { accessToken: this.jwtService.sign(payload), refreshToken };
  };

  async refreshToken(refreshToken: string) {
    try {
      const { sub, email } = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.generateTokens(sub, email);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  generateTokens(sub: any, email: any) {
    throw new Error('Method not implemented.');
  }

  async logout(userId: string) {
    // Implement any necessary cleanup
    return { success: true };
  }

  async setAdminRole(userId: string, apiKey: string): Promise<void> {
    try {
      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update the user's role to ADMIN
      const newUserId = userId.replace(/^(KH|ST|SH)/, 'AD'); // Thay đổi mã từ KH, ST, SH thành AD
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.ADMIN, id: newUserId }, // Ensure this matches your Role enum
      });
    } catch (error) {
      console.error('Error setting admin role:', error);
      throw new InternalServerErrorException('Could not set admin role: ' + error.message);
    }
  }
}
