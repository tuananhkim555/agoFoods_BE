import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';

export enum RatingType {
  Restaurant = 'Restaurant',
  Driver = 'Driver',
  Food = 'Food',
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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ enum: RatingType })
  @IsEnum(RatingType)
  ratingType: RatingType;
}


export class DeleteRatingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  ratingId: string; // Chỉ cần ratingId để xóa
}
