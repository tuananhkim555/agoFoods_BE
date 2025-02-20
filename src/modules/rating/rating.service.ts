import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateRatingDto, TargetType} from './dto/rating.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { generateRatingId } from 'src/common/utils/format-id';
import { calculateAverageRating } from 'src/common/utils/rating.calculate';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}


  // Thêm đánh giá cho món ăn
  async createRating(createRatingDto: CreateRatingDto, req: any) {
    try {
      // 🛠 Kiểm tra userId từ JWT
      const userId = req.user?.id; 
      if (!userId) {
        throw new UnauthorizedException('Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      }
  
      const { foodId, drinkId, restaurantId, shipperId, rating, comment, targetType } = createRatingDto;
  
      // 🛠 Kiểm tra targetType hợp lệ
      let target;
      switch (targetType) {
        case TargetType.FOOD:
          if (!foodId) throw new BadRequestException('foodId không được để trống');
          target = await this.prisma.food.findUnique({ where: { id: foodId } });
          break;
        case TargetType.DRINK:
          if (!drinkId) throw new BadRequestException('drinkId không được để trống');
          target = await this.prisma.drink.findUnique({ where: { id: drinkId } });
          break;
        case TargetType.RESTAURANT:
          if (!restaurantId) throw new BadRequestException('restaurantId không được để trống');
          target = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
          break;
        case TargetType.SHIPPER:
          if (!shipperId) throw new BadRequestException('shipperId không được để trống');
          target = await this.prisma.shipper.findUnique({ where: { id: shipperId } });
          break;
        default:
          throw new BadRequestException(`targetType không hợp lệ: ${targetType}`);
      }
  
      // 🛠 Kiểm tra target có tồn tại không
      if (!target) {
        throw new NotFoundException(`${targetType} với ID không tồn tại.`);
      }
  
      // 🛠 Tạo ID mới cho rating
      const ratingId = await generateRatingId(this.prisma);
  
      // 🛠 Tạo rating mới
      const newRating = await this.prisma.rating.create({
        data: {
          id: ratingId,
          user: { connect: { id: userId } },
          rating,
          comment,
          targetType,
          ...(foodId && { food: { connect: { id: foodId } } }),
          ...(drinkId && { drink: { connect: { id: drinkId } } }),
          ...(restaurantId && { restaurant: { connect: { id: restaurantId } } }),
          ...(shipperId && { shipper: { connect: { id: shipperId } } }),
        },
      });
  
      // 🛠 Cập nhật rating trung bình cho mục tiêu
      if (targetType === TargetType.FOOD && foodId) {
        await this.updateFoodRating(foodId);
      }
      if (targetType === TargetType.DRINK && drinkId) {
        await this.updateDrinkRating(drinkId);
      }
      if (targetType === TargetType.RESTAURANT && restaurantId) {
        await this.updateRestaurantRating(restaurantId);
      }
      if (targetType === TargetType.SHIPPER && shipperId) 
        await this.updateShipperRating(shipperId);
  
      return {
        status: 'success',
        message: 'Đánh giá thành công',
        data: newRating,
      };
    } catch (error) {
      console.error('❌ Error creating rating:', error);
      throw new BadRequestException(error.message || 'Không thể tạo đánh giá');
    }
  }
  
  // Cập nhật điểm đánh giá cho đồ uống
  async updateDrinkRating(drinkId: string) {
    const ratings = (await this.prisma.rating.findMany({
      where: { drinkId },
      select: { rating: true },
    })) || []; // ✅ Đảm bảo `ratings` luôn là mảng
  
    const ratingCount = ratings.length; // ✅ Lấy số lượng đánh giá
    const avgRating =
      ratingCount > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;
  
    await this.prisma.drink.update({
      where: { id: drinkId },
      data: { rating: avgRating, ratingCount }, // ✅ Cập nhật luôn ratingCount
    });
  }
  
  // Cập nhật điểm đánh giá cho món ăn
  private async updateFoodRating(foodId: string) {
    const food = await this.prisma.food.update({
      where: { id: foodId },
      data: {
        ratingCount: { increment: 1 },
        rating: { set: await calculateAverageRating(foodId, TargetType.FOOD, this.prisma) },
      },
    });
  }
  
  // Cập nhật điểm đánh giá cho nhà hàng
  private async updateRestaurantRating(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ratingCount: { increment: 1 },
        rating: { set: await calculateAverageRating(restaurantId, TargetType.RESTAURANT, this.prisma) },
      },
    });
  }
  
  // Cập nhật điểm đánh giá cho shipper
  private async updateShipperRating(shipperId: string) {
    const shipper = await this.prisma.shipper.update({
      where: { id: shipperId },
      data: {
        totalCompletedOrders: { increment: 1 },
        rating: { set: await calculateAverageRating(shipperId, TargetType.SHIPPER, this.prisma) },
      },
    });
  }

  
// Lấy danh sách checkUserRating
async checkUserRating(
  userId: string,
  ratingType: TargetType,
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

  if (ratingType === TargetType.FOOD && !foodId) {
    throw new HttpException('foodId is required for FOOD ratingType', HttpStatus.BAD_REQUEST);
  }

  if (ratingType === TargetType.RESTAURANT && !restaurantId) {
    throw new HttpException('restaurantId is required for RESTAURANT ratingType', HttpStatus.BAD_REQUEST);
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
  const { pageIndex = 1, pageSize = 7 } = query;
  const skip = (pageIndex - 1) * pageSize;
  const take = pageSize;

  // Điều kiện lọc dựa trên loại đánh giá (food hoặc restaurant)
  const where =
    ratingType === TargetType.FOOD
      ? { userId, foodId }
      : { userId, restaurantId };

  // Lấy tổng số đánh giá
  const totalItems = await this.prisma.rating.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);

  // Kiểm tra và lấy các đánh giá của người dùng
  existingRatings = await this.prisma.rating.findMany({
    where,
    skip: Number(skip),
    take: Number(take),
    include: {
      food: true, // Bao gồm thông tin món ăn
      restaurant: true, // Bao gồm thông tin nhà hàng
    },
  });

  if (existingRatings && existingRatings.length > 0) {
    // Nếu có ít nhất một đánh giá
    return {
      status: 'success',
      code: 200,
      message: 'Ratings retrieved successfully.',
      metaData: {
        totalRatings: totalItems,
        totalPages,
        pageIndex,
        pageSize,
        result: true,
        userInfo: {
          id: userInfo.id,
          name: userInfo.fullName || userInfo.email, // Sử dụng fullName hoặc email
          email: userInfo.email,
          phone: userInfo.phone,
          avatar: userInfo.avatar,
        },
        ratingInfo: existingRatings.map((rating) => ({
          id: rating.id,
          rating: rating.rating,
          comment: rating.comment,
          createdAt: rating.createdAt,
          targetType: rating.targetType, // Lấy từ database
          foodId: rating.foodId || null, // Trả về cả foodId
          restaurantId: rating.restaurantId || null, // Trả về cả restaurantId
          food: rating.food ? rating.food.title : null,
          restaurant: rating.restaurant ? rating.restaurant.title : null,
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
        name: userInfo.fullName || userInfo.email, // Sử dụng fullName hoặc email
        email: userInfo.email,
        phone: userInfo.phone,
        avatar: userInfo.avatar,
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

  


