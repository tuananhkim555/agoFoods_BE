import { Injectable } from '@nestjs/common';
import { CreateRatingDto, RatingType } from './dto/rating.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  // Thêm đánh giá cho món ăn
  async createRating(createRatingDto: CreateRatingDto) {
    const { userId, foodId, restaurantId, rating, comment, ratingType } = createRatingDto;
  
    // Tạo một rating mới
    const newRating = await this.prisma.rating.create({
      data: {
        userId,
        foodId,
        restaurantId,
        rating,
        comment,
        ratingType,
      },
    });
  
    // Cập nhật ratingCount và rating cho món ăn hoặc nhà hàng
    if (ratingType === RatingType.Food) {
      // Cập nhật cho món ăn
      const food = await this.prisma.food.update({
        where: { id: foodId },
        data: {
          ratingCount: {
            increment: 1, // Tăng ratingCount lên 1
          },
          rating: {
            // Cập nhật lại điểm rating của món ăn
            set: (await this.calculateAverageRating(foodId, RatingType.Food)),
          },
        },
      });
    } else if (ratingType === RatingType.Restaurant) {
      // Cập nhật cho nhà hàng
      const restaurant = await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          ratingCount: {
            increment: 1, // Tăng ratingCount lên 1
          },
          rating: {
            // Cập nhật lại điểm rating của nhà hàng
            set: (await this.calculateAverageRating(restaurantId, RatingType.Restaurant)),
          },
        },
      });
    }
  
    return newRating;
  }
  
  // Tính điểm trung bình của rating cho món ăn hoặc nhà hàng
  private async calculateAverageRating(id: string, ratingType: RatingType) {
    let ratings;
    if (ratingType === RatingType.Food) {
      ratings = await this.prisma.rating.findMany({
        where: { foodId: id },
      });
    } else if (ratingType === RatingType.Restaurant) {
      ratings = await this.prisma.rating.findMany({
        where: { restaurantId: id },
      });
    }
  
    const ratingCount = ratings.length;
    const averageRating = ratings.reduce((sum, rate) => sum + rate.rating, 0) / ratingCount;
    return averageRating;
  }
  

}