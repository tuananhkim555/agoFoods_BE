import {  IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateDrinkDto } from './create-drinks.dto';




  export class AdditivesDto {
    @ApiProperty()
    @IsString()
    title: string;
  
    @ApiProperty()
    @IsNumber()
    @IsPositive()
    price: number;
  }
  
  export class UpdateDrinkDto extends PartialType(CreateDrinkDto) {
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
  