import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/ratings')
export class RatingController {
  constructor(private readonly ratingsService: RatingService) {}


  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('create')
  async rateFood(@Body() createRatingDto: CreateRatingDto) {
  return this.ratingsService.createRating(createRatingDto);
}


}
