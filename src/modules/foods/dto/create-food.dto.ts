import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, Min, Max, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';


export class AdditivesDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreateFoodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  foodTags: string[] = [];
  
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  foodTypes: string[] = [];

  @ApiProperty({ type: [AdditivesDto] }) // Sửa chỗ này
  @IsOptional()
  @Type(() => AdditivesDto) // Chuyển đổi thành object
  additives: AdditivesDto[] = [];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isAvailable: boolean;

  @ApiProperty()
  @IsString()
  restaurantId: string;

  @ApiProperty({ default: 3 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ratingCount?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  imageUrl: string[];
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageIndex?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;
}


export class SearchFoodsDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}