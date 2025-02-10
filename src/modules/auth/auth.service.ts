import { PrismaService } from '../../common/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';
import {  Role } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IdGenerator } from 'src/common/helpers/id-generator.helper';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    public prisma: PrismaService,
    private jwtService: JwtService,
    public configService: ConfigService,
    private readonly emailService: EmailService,

  ) {}

  // Đăng ký tài khoản
async register(userData: RegisterDto, appSource: string) {
  try {
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

    userData.role = autoRole;

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

    if (!userData.fullName || !userData.birthday) {
      throw new HttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Họ tên và ngày sinh không được để trống',
        error: 'Bad Request'
      }, HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await hash(userData.password, 10);

    const customId = await IdGenerator.generateUserId(userData.role, this.prisma);

    const user = await this.prisma.user.create({
      data: {
        id: customId,
        email: userData.email,  // Không hash email
        phone: userData.phone,
        password: hashPassword,
        fullName: userData.fullName,
        gender: userData.gender,
        birthday: userData.birthday,
        role: userData.role,
        isActive: false,
        status: true,
        verifyToken: uuidv4(),
      }
    });

    // Gửi email xác thực
    if (user.verifyToken) {
      await this.emailService.sendVerificationEmail(userData.email, user.verifyToken);
    } else {
      throw new HttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Mã xác thực không hợp lệ',
        error: 'Bad Request'
      }, HttpStatus.BAD_REQUEST);
    }
      // Gửi email tới email gốc

    return { data: user };
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
  async login(data: { user: any }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role
      }
    });
    if (!user) {
      throw new HttpException({ message: 'Tài khoản không tồn tại' }, HttpStatus.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new HttpException({ message: 'Vui lòng xác thực email trước khi đăng nhập' }, HttpStatus.UNAUTHORIZED);
    }

    const verify = await compare(data.user.password, user.password);

    if (!verify) {
      throw new HttpException({ message: 'Mật khẩu không đúng.' }, HttpStatus.UNAUTHORIZED);
    }

    const payload = { id: user.id, fullName: user.fullName, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_EXPIRES,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  // Tạo lại token
  async refreshToken(refreshToken: string) {
    try {
      const { sub, email } = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens(sub, email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  generateTokens(sub: any, email: any) {
    const accessToken = this.jwtService.sign({ sub, email }, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign({ sub, email }, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // Đăng xuất
  async logout(userId: string) {
    return { success: true };
  }

  // Cập nhật vai trò Admin
  async setAdminRole(userId: string, apiKey: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newUserId = userId.replace(/^(KH|RES|DR)/, 'AD');
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN, id: newUserId }
    });
  }

  // Xác thực email
// Phương thức xác thực email
async verifyEmail(token: string): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { verifyToken: token },
  });

  if (!user) {
    throw new Error('Invalid token');
  }

  // Xác thực token và cập nhật thông tin người dùng
  user.isVerified = true;
  user.verifyToken = null;  // Xóa token sau khi xác thực

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      isActive: true,
      verifyToken: null,
    },
  });
}
  
  // Quên mật khẩu
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpException('Email không tồn tại', HttpStatus.NOT_FOUND);

    const resetToken = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken },
    });

    await this.emailService.sendResetPasswordEmail(email, resetToken);
    return { message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' };
  }

  // Reset Password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { resetPasswordToken: token } });
    if (!user) throw new HttpException('Token không hợp lệ', HttpStatus.BAD_REQUEST);

    const hashedPassword = await hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetPasswordToken: null },
    });

    return { message: 'Mật khẩu đã được đặt lại thành công' };
}

  // Đăng xuất
  async logoutWithToken(token: string) {
    try {
      return { success: true, message: 'Đăng xuất thành công' };
    } catch (error) {
      throw new InternalServerErrorException('Không thể thực hiện đăng xuất');
    }
  }


}
