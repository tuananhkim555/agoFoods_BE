import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

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


export class RemoveCartItemDto {
  @ApiProperty({
    description: 'ID của mục trong giỏ hàng',
    example: 'CART_958459',
  })
  @IsNotEmpty({ message: 'cartItemId không được để trống.' })
  @IsString()
  cartItemId: string;
}