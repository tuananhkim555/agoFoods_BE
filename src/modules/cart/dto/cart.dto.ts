import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Thêm mục v vào giỏ hàng
export class AddToCartDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  drinkId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additiveIds?: string[];
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