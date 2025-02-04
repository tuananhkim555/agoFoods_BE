import { ApiProperty } from "@nestjs/swagger";
import { Food } from "@prisma/client";
import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class CoordsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  latitudeDelta: number;

  @IsNumber()
  @IsNotEmpty()
  longtitudeDelta: number;
  
}

export class CreateRestaurantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logoUrl: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsNumber()
  ratingCount: string;

  @ApiProperty()
  @IsNotEmpty()
  coords: CoordsDto;
}

export class RestaurantResponseDto extends CreateRestaurantDto {
  foods: Array<Food>;
  pickup: boolean;
  delivery: boolean;
  isAvailable: boolean;
  verification: string;
  verificationMessage: string;
  _v: number;
  


}