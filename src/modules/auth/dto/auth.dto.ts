import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty()
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Số điện thoại không đúng định dạng'
  })
  phone: string;

  @ApiProperty()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @ApiProperty({ enum: Gender, enumName: 'Gender' })
  @IsEnum(Gender, {
    message: 'Giới tính phải là một trong các giá trị: MALE, FEMALE, OTHER'
  })
  gender: Gender;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  birthday: string;

  @ApiProperty()
  @IsEnum(Role)
  role: Role;
}


export class LoginDto {
  @ApiProperty()
  @IsString({ message: `Email phải là string` })
  @IsEmail(undefined, { message: `Email chưa hợp lệ` })
  email: string;

  @ApiProperty()
  @IsString({ message: `Password phải là string` })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  emailOrPhone: any;
}

