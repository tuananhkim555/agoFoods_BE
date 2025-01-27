import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender, Role, User } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, Matches, MinLength } from "class-validator";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateUserDto {
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

  export class UpdateUserDto {
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
// filter search

export class UserFilterDto {
    @ApiProperty({
        type: Number,
        description: 'Page number',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageIndex: number;

    @ApiProperty({
        type: Number,
        description: 'Items per page',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize: number;

    @ApiProperty({
        type: String,
        example: '',
        description: 'Search keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;
}

export class UserNameSearchDto {
    @ApiProperty({
        description: 'TenNguoiDung',
        required: true,
        type: String
    })
    @IsNotEmpty()
    name: string;
}

  export interface UserPaginationResponseType {
    data: User[];
    total: number;
    currentPage: number;
    itemsPerPage: number;
  }

export class UploadAvatarDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    avatar: any;
}