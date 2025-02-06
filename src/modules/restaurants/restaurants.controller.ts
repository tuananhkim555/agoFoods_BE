import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/restaurants.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // Tạo nhà hàng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

   // Lấy nhà hàng theo id
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @Get('byId/:id')
   getRestaurantById(@Param('id') id: string) {
     return this.restaurantsService.getRestaurantById(id);
   }

  // Lấy ngẫu nhiên nhà hàng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('random/:code')
  getRandomRestaurants(@Param('code') code: string, @Req() req: any) {
    return this.restaurantsService.getRandomRestaurants(req, code);
  }


  // Lấy tất cả nhà hàng gần đây
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('all/:code')
  getAllNearByRestaurants(@Param('code') code : string, @Req() req: any ) {
    return this.restaurantsService.getAllNearByRestaurants(req, code);
  }

 
}