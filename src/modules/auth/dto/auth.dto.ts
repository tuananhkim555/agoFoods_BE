import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Xóm hoặc đường' })
  @IsString()
  @IsNotEmpty({ message: 'Xóm hoặc đường không được để trống' })
  street: string;

  @ApiProperty({ example: 'Quận/Huyện/Thành Phố' })
  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  districtOrCity: string;

  @ApiProperty({ example: 'Phường/Xã' })
  @IsString()
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  ward: string;
}

export class ShipperAdressDto extends PartialType(AddressDto) {
  // Không cần khai báo lại các thuộc tính street, districtOrCity, ward
}

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regex email
    { message: 'Email không hợp lệ' }
  )
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

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: AddressDto;

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

// Đăng ký tài xế
export class RegisterShipperDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    { message: 'Email không hợp lệ' }
  )
  email: string;

  @ApiProperty()
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Số điện thoại không đúng định dạng'
  })
  phone: string;

  @ApiProperty({ type: AddressDto })  // Dùng AddressDto thay vì ShipperAdressDto
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: AddressDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày sinh phải có định dạng yyyy-MM-dd' })
  birthday: string;
  
  @ApiProperty()
  @IsEnum(Gender, {
  message: 'Giới tính phải là một trong các giá trị: MALE, FEMALE, OTHER'
  })
  gender: Gender;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'Số CCCD phải có 12 chữ số' })
  idCard: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,10}$/, { message: 'Số bằng lái không hợp lệ' })
  licenseNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9A-Z\-]+$/, { message: 'Biển số xe không hợp lệ' })
  licensePlate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idCardFront: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idCardBack: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licenseImage: string;

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

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}