import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRatingDto, DeleteRatingDto, RatingType } from './dto/rating.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

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

    if (ratings.length === 0) {
      return 0; // Trả về điểm 0 nếu không có đánh giá nào
    }

    const ratingCount = ratings.length;
    const averageRating =
      ratings.reduce((sum, rate) => sum + rate.rating, 0) / ratingCount;
    return averageRating;
  }

  // Format id cho Rating
  private async generateRatingId(): Promise<string> {
    while (true) {
      // Tạo một số ngẫu nhiên 5 chữ số
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const ratingId = `R_${randomNum}`;

      // Kiểm tra xem ID đã tồn tại trong cơ sở dữ liệu chưa
      const existingRating = await this.prisma.rating.findUnique({
        where: { id: ratingId },
      });

      // Nếu chưa tồn tại thì trả về ID duy nhất
      if (!existingRating) {
        return ratingId;
      }
    }
  }

  // Thêm đánh giá cho món ăn
  async createRating(createRatingDto: CreateRatingDto) {
    const { userId, foodId, restaurantId, rating, comment, ratingType } =
      createRatingDto;

    // Kiểm tra tồn tại của user, food, và restaurant
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpException(
        `User with ID ${userId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) {
      throw new HttpException(
        `Food with ID ${foodId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new HttpException(
        `Restaurant with ID ${restaurantId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Tạo ID mới cho rating
    const ratingId = await this.generateRatingId();

    // Tạo một rating mới
    const newRating = await this.prisma.rating.create({
      data: {
        id: ratingId, // Sử dụng ratingId đã tạo
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
            set: await this.calculateAverageRating(foodId, RatingType.Food),
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
            set: await this.calculateAverageRating(
              restaurantId,
              RatingType.Restaurant,
            ),
          },
        },
      });
    }

    return newRating;
  }

  // Lấy danh sách checkUserRating
  async checkUserRating(
    userId: string,
    ratingType: RatingType,
    foodId?: string,
    restaurantId?: string,
    query: any = {}, // Khởi tạo mặc định cho query là một đối tượng rỗng
  ) {
    let existingRatings;
    let userInfo;
  
    // Kiểm tra các tham số bắt buộc
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }
  
    if (!ratingType) {
      throw new HttpException('ratingType is required', HttpStatus.BAD_REQUEST);
    }
  
    if (!foodId && !restaurantId) {
      throw new HttpException('foodId or restaurantId must be provided', HttpStatus.BAD_REQUEST);
    }
  
    // Lấy thông tin người dùng từ bảng users
    userInfo = await this.prisma.user.findUnique({
      where: { id: userId },
    });
  
    if (!userInfo) {
      return {
        status: 'error',
        code: 404,
        message: 'User not found.',
        metaData: {
          message: 'User with the provided ID does not exist.',
          result: false,
        },
      };
    }
  
    // Lấy pageIndex và pageSize từ query, với giá trị mặc định nếu không có
    let { pageIndex = 1, pageSize = 7, skip = 0, take = 10 } = query;
  
    skip = (pageIndex - 1) * pageSize;
    take = pageSize;
  
    // Điều kiện lọc dựa trên loại đánh giá (food hoặc restaurant)
    const where =
      ratingType === RatingType.Food
        ? { userId, foodId }
        : { userId, restaurantId };
  
    // Lấy tổng số đánh giá
    const totalItems = await this.prisma.rating.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);
  
    // Kiểm tra và lấy các đánh giá của người dùng
    if (ratingType === RatingType.Food && foodId) {
      // Lấy tất cả đánh giá của người dùng cho món ăn
      existingRatings = await this.prisma.rating.findMany({
        where: { userId, foodId },
        skip: Number(skip),
        take: Number(take),
        include: {
          food: true, // Bao gồm thông tin món ăn
          restaurant: true, // Bao gồm thông tin nhà hàng
        },
      });
    } else if (ratingType === RatingType.Restaurant && restaurantId) {
      // Lấy tất cả đánh giá của người dùng cho nhà hàng
      existingRatings = await this.prisma.rating.findMany({
        where: { userId, restaurantId },
        skip: Number(skip),
        take: Number(take),
        include: {
          food: true, // Bao gồm thông tin món ăn
          restaurant: true, // Bao gồm thông tin nhà hàng
        },
      });
    }
  
    if (existingRatings && existingRatings.length > 0) {
      // Nếu có ít nhất một đánh giá
      return {
        metaData: {
          totalRatings: totalItems,
          totalPages,
          pageIndex,
          pageSize,
          result: true,
          userInfo: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            avatar: userInfo.avatar,
          },
          ratingInfo: existingRatings.map((rating) => ({
            rating: rating.rating,
            comment: rating.comment,
            createdAt: rating.createdAt,
            ratingType: rating.ratingType, // Lấy từ database
            foodId: rating.foodId || null, // Trả về cả foodId
            restaurantId: rating.restaurantId || null, // Trả về cả restaurantId
            food: rating.food ? rating.food.title : null,
            restaurant: rating.restaurant ? rating.restaurant.title : null,
            driver: rating.driver ? rating.driver.name : null,
          })),
        },
      };
    }          
    // Nếu không có đánh giá
    return {
      status: 'error',
      code: 404,
      message: 'No ratings found.',
      metaData: {
        result: false,
        userInfo: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          avatar: userInfo.avatar, // Hoặc các thông tin khác nếu có
        },
      },
    };
  }
 
  // Xóa đánh giá
  async deleteRating(ratingId: string) {
    if (!ratingId) {
      throw new BadRequestException('ratingId is required.');
    }
  
    const existingRating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });
  
    if (!existingRating) {
      throw new BadRequestException('Rating not found.');
    }
  
    await this.prisma.rating.delete({ where: { id: ratingId } });
  
    return { message: 'Rating deleted successfully.' };
  }
  
}

  


