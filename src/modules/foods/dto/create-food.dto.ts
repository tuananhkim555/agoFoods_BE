import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, Min, Max, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Additives {
  @ApiProperty()
  @IsNumber()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNumber()
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
  foodTags?: string[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  foodType?: string[];

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
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  restaurantId: string;

  @ApiProperty({ default: 3 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  ratingCount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number; 

  @ApiProperty({ type: [Additives] })
  @IsOptional()
  additives?: Additives[];

  @ApiProperty({ type: [String] }) 
  @IsString({ each: true })
  @IsOptional()
  imageUrl: string[];
}