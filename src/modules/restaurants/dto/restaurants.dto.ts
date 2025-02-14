import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Food } from "@prisma/client";
import { IsBoolean, IsNotEmpty, IsNumber, IsNumberString, IsString, Length, Matches, Max, Min } from "class-validator";


export class CoordsDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  latitudeDelta: number;

  @IsNumber()
  @IsNotEmpty()
  longitudeDelta: number;
  
}


export class CreateRestaurantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logoUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty()
  @IsString()
  description: string;

  
  @ApiProperty({ example: '079203001234' }) // Ví dụ số CCCD hợp lệ
  @IsNotEmpty({ message: 'idCard không được để trống' })
  @IsNumberString({}, { message: 'idCard chỉ được chứa số' })
  @Matches(/^(0\d{2}|10\d{2})[0-9]{1}[0-9]{2}[0-9]{6}$/, {
    message: 'idCard không hợp lệ. Vui lòng nhập đúng CCCD Việt Nam.',
  })
  idCard: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsNumber()
  ratingCount: string;

  @ApiProperty()
  @IsNotEmpty()
  coords: CoordsDto;
}

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  foods: Array<Food>;
  pickup: boolean;
  delivery: boolean;
  isAvailable: boolean;
  verification: string;
  verificationMessage: string;
  _v: number;

}

export interface Additive {
  id: string;
  title: string;
  price: number;
}

export interface FoodTags {
  [key: string]: string;
}

export interface FoodType {
  [key: string]: string;
}

// Duyệt cửa hàng tự động
export class CoordsRegisterDto extends CoordsDto{
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  latitudeDelta: number = 0.0122;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  longitudeDelta: number = 0.0122;
}

export class RegisterRestaurant {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '079203001234' })
  @IsNotEmpty({ message: 'idCard không được để trống' })
  @IsNumberString({}, { message: 'idCard chỉ được chứa số' })
  @Matches(/^(0\d{2}|10\d{2})[0-9]{1}[0-9]{2}[0-9]{6}$/, {
    message: 'idCard không hợp lệ. Vui lòng nhập đúng CCCD Việt Nam.',
  })
  idCard: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logoUrl: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  rating: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  ratingCount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  pickup: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  delivery: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verification: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationMessage: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isVerified: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isAvailable: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  reportCount: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 10, { message: "Mã cửa hàng phải từ 6 đến 10 ký tự." })
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  coords: CoordsRegisterDto;
}