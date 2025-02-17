import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';

export enum TargetType {
  FOOD = 'FOOD',
  RESTAURANT = 'RESTAURANT',
  SHIPPER = 'SHIPPER',
}

export class CreateRatingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  rating: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shipperId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ enum: TargetType })
  @IsEnum(TargetType)
  targetType: TargetType;
}

export class DeleteRatingDto {
  @ApiProperty({
    description: 'ID của đánh giá cần xóa',
  })
  @IsNotEmpty({ message: 'ratingId không được để trống.' })
  @IsUUID('4', { message: 'ratingId phải là UUID hợp lệ.' })
  ratingId: string; // Chỉ cần ratingId để xóa
}