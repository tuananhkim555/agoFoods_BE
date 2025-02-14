import { Controller, Get, Post, Body, UseGuards, Query, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, TargetType} from './dto/rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api/ratings')
export class RatingController {
  constructor(private readonly ratingsService: RatingService) {}

// Tạo rating
@Post('create')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Create a new rating' })
@ApiResponse({ status: 201, description: 'Rating created successfully.' })
@ApiResponse({ status: 400, description: 'Bad request.' })
@ApiResponse({ status: 500, description: 'Internal server error.' })
async createRating(@Body() createRatingDto: CreateRatingDto) {
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
  @Query('ratingType') ratingType: TargetType,
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

