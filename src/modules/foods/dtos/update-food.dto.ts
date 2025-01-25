import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateFoodDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  tagIds?: string[];
}
