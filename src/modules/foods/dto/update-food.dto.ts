import {  IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Additives, CreateFoodDto } from './create-food.dto';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateFoodDto extends PartialType(CreateFoodDto) {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  foodTags?: Array<string>[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  foodType?: Array<string>[];

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