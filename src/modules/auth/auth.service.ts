import { PrismaService } from '../../common/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto, RegisterShipperDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IdGenerator } from 'src/common/helpers/id-generator.helper';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { JsonParser } from 'src/common/helpers/json-parser';
import { InputJsonObject } from '@prisma/client/runtime/library';
import { format } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    public prisma: PrismaService,
    private jwtService: JwtService,
    public configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // Đăng ký tài khoản
  async register(userData: RegisterDto) {
    try {
      // Gán role mặc định là Customer hoặc có thể là tùy chỉnh cho shipper hoặc nhà hàng
      let autoRole: Role = Role.CUSTOMER; // Đặt mặc định là CUSTOMER nếu không có appSource

      // Kiểm tra sự tồn tại của email
      const emailExists = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (emailExists) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Email đã được sử dụng',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Kiểm tra sự tồn tại của số điện thoại
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: userData.phone },
      });
      if (phoneExists) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Số điện thoại đã được sử dụng',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Kiểm tra họ tên và ngày sinh
      if (!userData.fullName || !userData.birthday) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Họ tên và ngày sinh không được để trống',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Mã hóa mật khẩu
      const hashPassword = await hash(userData.password, 10);

      // Tạo id tùy chỉnh cho người dùng
      const customId = await IdGenerator.generateUserId(autoRole, this.prisma);

      // Tạo người dùng mới trong cơ sở dữ liệu
      const user = await this.prisma.user.create({
        data: {
          id: customId,
          email: userData.email,
          phone: userData.phone,
          password: hashPassword,
          fullName: userData.fullName,
          address: JsonParser.safeJsonParse<InputJsonObject>(userData.address),
          gender: userData.gender,
          birthday: format(new Date(userData.birthday), 'dd-MM-yyyy'),
          role: autoRole, // Gán role mặc định là CUSTOMER hoặc tùy chỉnh
          isActive: false,
          isApproved: true,
          status: true,
          verifyToken: uuidv4(),
        },
      });

      // Gửi email xác thực
      if (user.verifyToken) {
        await this.emailService.sendVerificationEmail(
          userData.email,
          user.verifyToken,
        );
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Mã xác thực không hợp lệ',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return { data: user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Số điện thoại hoặc email đã được sử dụng',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Có lỗi xảy ra khi tạo tài khoản',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Đăng ký shipper
  async registerShipper(registerShipperDto: RegisterShipperDto) {
    try {
      // Kiểm tra sự tồn tại của email
      const emailExists = await this.prisma.user.findUnique({
        where: { email: registerShipperDto.email },
      });
      if (emailExists) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Email đã được sử dụng',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Kiểm tra sự tồn tại của số điện thoại
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: registerShipperDto.phone },
      });
      if (phoneExists) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Số điện thoại đã được sử dụng',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Kiểm tra giấy phép lái xe và biển số xe của shipper
      if (
        !registerShipperDto.licenseNumber ||
        !registerShipperDto.licensePlate
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Giấy phép lái xe và biển số xe không được để trống',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Mã hóa mật khẩu
      const hashPassword = await hash(registerShipperDto.password, 10);

      // Tạo id tùy chỉnh cho shipper
      const customId = await IdGenerator.generateUserId(
        Role.SHIPPER,
        this.prisma,
      );

      // Kiểm tra lại thông tin địa chỉ
      if (
        !registerShipperDto.address ||
        !registerShipperDto.address.street ||
        !registerShipperDto.address.districtOrCity ||
        !registerShipperDto.address.ward
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Địa chỉ không hợp lệ',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 🛠 **Tạo user và shipper trong cùng một transaction**
      const shipper = await this.prisma.$transaction(async (tx) => {
        // Tạo user
        const user = await tx.user.create({
          data: {
            id: customId,
            email: registerShipperDto.email,
            phone: registerShipperDto.phone,
            password: hashPassword,
            fullName: registerShipperDto.fullName,
            address: JsonParser.safeJsonParse<InputJsonObject>(
              registerShipperDto.address,
            ),
            gender: registerShipperDto.gender,
            birthday: format(
              new Date(registerShipperDto.birthday),
              'yyyy-MM-dd',
            ),
            role: Role.SHIPPER,
            isActive: false,
            status: true,
            verifyToken: uuidv4(),
            walletBalance: 0,
          },
        });

        // 🛠 **Tạo shipper gắn với user**
        await tx.shipper.create({
          data: {
            userId: user.id,
            licenseNumber: registerShipperDto.licenseNumber,
            licensePlate: registerShipperDto.licensePlate,
            avatar: registerShipperDto.avatar,
            idCardFront: registerShipperDto.idCardFront,
            idCardBack: registerShipperDto.idCardBack,
            licenseImage: registerShipperDto.licenseImage,
            birthday: format(
              new Date(registerShipperDto.birthday),
              'yyyy-MM-dd',
            ),
            vehicleType: registerShipperDto.vehicleType,
          },
        });

        return user;
      });

      // Gửi email xác thực
      if (shipper.verifyToken) {
        console.log('Sending verification email to:', registerShipperDto.email);
        await this.emailService.sendVerificationEmail(
          registerShipperDto.email,
          shipper.verifyToken,
        );
      }

      return {
        message:
          'Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản',
      };
    } catch (error) {
      console.error('Error registering shipper:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Đã xảy ra lỗi khi đăng ký tài xế',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Đăng nhập
  async login(data: { user: any }) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.user.email,
      },
    });
  
    if (!user) {
      throw new HttpException('Tài khoản không tồn tại', HttpStatus.NOT_FOUND);
    }
  
    // ❌ Nếu là shipper hoặc restaurant mà chưa được admin duyệt => cấm đăng nhập
    if (
      (user.role === Role.SHIPPER || user.role === Role.RESTAURANTS) &&
      !user.isApproved
    ) {
      throw new HttpException(
        'Tài khoản của bạn chưa được admin duyệt',
        HttpStatus.FORBIDDEN,
      );
    }
  
    // ❌ Nếu chưa xác thực email
    if (!user.isActive) {
      throw new HttpException(
        'Bạn cần xác thực email trước khi đăng nhập',
        HttpStatus.FORBIDDEN,
      );
    }
  
    const verify = await compare(data.user.password, user.password);
  
    if (!verify) {
      throw new HttpException(
        { message: 'Mật khẩu không đúng.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  
    const payload = { id: user.id, fullName: user.fullName, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '1h',
    });
  
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });
  
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.version,
      accessToken,
      refreshToken,
    };
  }
  

  // Tạo lại token
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens(payload.sub, payload.email);
    } catch (error) {
      console.error('Error verifying refresh token:', error.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  generateTokens(sub: any, email: any) {
    const accessToken = this.jwtService.sign(
      { sub, email },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '1h',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub, email },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

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
      data: { role: Role.ADMIN, id: newUserId },
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
    user.verifyToken = null; // Xóa token sau khi xác thực

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
    if (!user)
      throw new HttpException('Email không tồn tại', HttpStatus.NOT_FOUND);

    const resetToken = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken },
    });

    await this.emailService.sendResetPasswordEmail(email, resetToken);
    return { message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' };
  }

  // Reset Password
  async resetPassword(email: string, newPassword: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('User not found');
    }

    // Tạo một token duy nhất
    const resetToken = uuidv4();

    // Lưu token vào cơ sở dữ liệu
    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
      },
    });

    // Gửi email với đường link reset mật khẩu
    const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      // Cấu hình SMTP của bạn ở đây
    });

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `To reset your password, please click the following link: ${resetUrl}`,
    });

    return { message: 'Reset password email sent' };
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
