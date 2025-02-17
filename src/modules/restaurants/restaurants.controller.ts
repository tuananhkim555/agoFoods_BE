import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RegisterRestaurant } from './dto/restaurants.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';



@Controller('api/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // Đăng ký nhà hàng
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('register')
  register(
    @Req() req: Request,
    @Body() registerRestaurant: RegisterRestaurant) {
    return this.restaurantsService.registerRestaurant(req, registerRestaurant);
  }


   // Lấy nhà hàng theo id
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @Get(':id')
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
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('all/:code')
  getAllNearByRestaurants(@Param('code') code : string, @Req() req: any ) {
    return this.restaurantsService.getAllNearByRestaurants(req, code);
  }

 
}