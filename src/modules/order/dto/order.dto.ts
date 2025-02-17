import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsArray()
  additives?: string[]; // IDs of selected additives

  @ApiProperty({ required: false })
  @IsString()
  instructions?: string; // Special instructions for the item
}

export class PlaceOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ required: false })
  @IsString()
  promoCode?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  discountAmount?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  paymentMethod?: string; // e.g., "CASH", "CREDIT_CARD"
}


export class GetUserOrdersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number; // Số trang (phân trang)

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number; // Số lượng đơn hàng trên mỗi trang
}