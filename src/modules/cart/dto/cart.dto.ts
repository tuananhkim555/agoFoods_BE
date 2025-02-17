import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

// Thêm mục v vào giỏ hàng
export class AddToCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ each: true })
  additiveIds?: string[]; // Danh sách ID của các thành phần thêm (nếu có)
}

// Xóa mục khỏi giỏ hàng
export class RemoveCartItemDto {
  @ApiProperty({
    description: 'ID của mục trong giỏ hàng',
  })
  @IsNotEmpty({ message: 'cartItemId không được để trống.' })
  @IsString()
  cartItemId: string;
}

// Lấy thông tin giỏ hàng của người dùng
export class GetCartDto {
  @ApiProperty({
    description: 'ID của người dùng',
  })
  @IsNotEmpty({ message: 'userId không được để trống.' })
  @IsString()
  userId: string;
}


// Lấy số lượng mục trong giỏ hàng
export class GetCartCountDto {
  @ApiProperty({
    description: 'ID của người dùng',
  })
  @IsNotEmpty({ message: 'userId không được để trống.' })
  @IsString({ message: 'userId phải là chuỗi.' })
  userId: string;
}

// Tăng số lượng môn ăn trong giỏ hàng
export class IncrementCartItemDto {
  @ApiProperty({
    description: 'ID của mục trong giỏ hàng',
  })
  @IsNotEmpty({ message: 'cartItemId không được để trống.' })
  @IsString({ message: 'cartItemId phải là chuỗi.' })
  cartItemId: string;

  @ApiProperty({
    description: 'Số lượng cần tăng',
    example: 1,
  })
  @IsNotEmpty({ message: 'quantity không được để trống.' })
  @IsNumber({}, { message: 'quantity phải là số.' })
  quantity: number;
}

// Giảm số lượng môn ăn trong giỏ hàng

export class DecrementCartItemQuantityDto {
  @ApiProperty({
    description: 'ID của mục trong giỏ hàng',
  })
  @IsNotEmpty({ message: 'cartItemId không được để trống.' })
  @IsString({ message: 'cartItemId phải là chuỗi.' })
  cartItemId: string;

  @ApiProperty({
    description: 'Số lượng cần giảm',
    example: 1,
  })
  @IsNotEmpty({ message: 'quantity không được để trống.' })
  @IsNumber({}, { message: 'quantity phải là số.' })
  quantity: number;
}