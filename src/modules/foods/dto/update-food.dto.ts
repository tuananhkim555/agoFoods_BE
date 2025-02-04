import {  IsArray, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Additives, CreateFoodDto } from './create-food.dto';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {
  @IsOptional()
  @IsArray()
  foodTags?: string[];

  @IsOptional()
  @IsArray()
  foodType?: string[];

  @IsOptional()
  @IsArray()
  additives?: Additives[];

  @IsOptional()
  @IsArray()
  imageUrl?: string[];
}