import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateUserAddressDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  address_line_1: string;

  @IsNotEmpty()
  @IsString()
  post_code: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {}
