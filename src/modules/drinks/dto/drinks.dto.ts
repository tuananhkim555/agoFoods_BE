import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsNotEmpty, IsBoolean, IsOptional, Min, Max } from 'class-validator';
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

export class CreateDrinkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  drinkTags: string[] = [];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  drinkTypes: string[] = [];

  @ApiProperty({ type: [AdditivesDto] })
  @IsOptional()
  @Type(() => AdditivesDto)
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
