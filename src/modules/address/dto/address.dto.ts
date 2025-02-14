import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  addressLine1: string;

  @ApiProperty()
  @IsString()
  postalCode: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  default?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;

  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;


}
