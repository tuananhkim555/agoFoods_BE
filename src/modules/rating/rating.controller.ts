import { Controller, Get, Post, Body, UseGuards, Query, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, DeleteRatingDto, RatingType } from './dto/rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { query } from 'express';

@Controller('api/ratings')
export class RatingController {
  constructor(private readonly ratingsService: RatingService) {}

// Tạo rating
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('create')
  async rateFood(@Body() createRatingDto: CreateRatingDto) {
  return this.ratingsService.createRating(createRatingDto);
}

 // API kiểm tra người dùng đã đánh giá hay chưa
 @Get('check-user-rating')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
async checkUserRating(
@Query('pageIndex') pageIndex = 1,  // Giá trị mặc định là 1
  @Query('pageSize') pageSize = 7,    // Giá trị mặc định là 3
  @Query('userId') userId: string,
  @Query('ratingType') ratingType: RatingType,
  @Query('foodId') foodId?: string,
  @Query('restaurantId') restaurantId?: string,
  
) {
  return this.ratingsService.checkUserRating(userId, ratingType, foodId, restaurantId, { pageIndex, pageSize });
  }

  // Delete rating
  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async deleteRating(@Query('ratingId') ratingId: string) {
    return this.ratingsService.deleteRating(ratingId);
  }
  
  

}

