import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CoordsDto,
  RegisterRestaurant,
} from './dto/restaurants.dto';
import { JsonParser } from 'src/common/helpers/json-parser';
import { Prisma, Role } from '@prisma/client';
import { formatCoords } from '../../common/utils/coords-utils';
import { generateRestaurantId } from 'src/common/utils/format-id';
import { shuffleArray } from 'src/common/utils/array-utils';



@Injectable()
export class RestaurantsService {
  restaurants: any;
  constructor(private prisma: PrismaService) {}




  // Đăng ký cửa hàng
  async registerRestaurant(req: any, registerRestaurant: RegisterRestaurant) {
    const restaurantId = await generateRestaurantId(this.prisma);

    if (req['user'].id !== registerRestaurant.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền đăng ký nhà hàng cho user khác.',
      );
    }

    const idCardRegex = /^(0\d{2}|10\d{2})[0-9]{1}[0-9]{2}[0-9]{6}$/;
    if (!idCardRegex.test(registerRestaurant.idCard)) {
      throw new BadRequestException(
        'idCard không hợp lệ. Vui lòng nhập đúng CCCD Việt Nam.',
      );
    }

    if (
      !registerRestaurant.title?.trim() ||
      !registerRestaurant.imageUrl?.trim() ||
      !registerRestaurant.avatar?.trim() ||
      !registerRestaurant.logoUrl?.trim() ||
      !registerRestaurant.description?.trim()
    ) {
      throw new BadRequestException(
        'Cần có ảnh đại diện, logo và mô tả để đăng ký.',
      );
    }

    if (!registerRestaurant.pickup && !registerRestaurant.delivery) {
      throw new BadRequestException(
        'Cửa hàng cần có ít nhất một hình thức bán hàng.',
      );
    }

    const existingCode = await this.prisma.restaurant.findFirst({
      where: { code: registerRestaurant.code },
    });

    if (existingCode) {
      throw new BadRequestException(
        'Mã cửa hàng đã tồn tại, vui lòng chọn mã khác.',
      );
    }
    
    let newRestaurant; // Declare newRestaurant outside of the try block

    // ✅ Tạo nhà hàng mới
    try {
       newRestaurant = await this.prisma.restaurant.create({
        data: {
          id: restaurantId,
          title: registerRestaurant.title,
          imageUrl: registerRestaurant.imageUrl,
          userId: registerRestaurant.userId,
          idCard: registerRestaurant.idCard,
          logoUrl: registerRestaurant.logoUrl,
          avatar: registerRestaurant.avatar,
          description: registerRestaurant.description,
          pickup: registerRestaurant.pickup,
          delivery: registerRestaurant.delivery,
          time: registerRestaurant.time || '08:00 - 22:00',
          code: registerRestaurant.code,
          coords: registerRestaurant.coords
            ? ({
                id: registerRestaurant.coords.id,
                title: registerRestaurant.coords.title,
                latitude: registerRestaurant.coords.latitude,
                longitude: registerRestaurant.coords.longitude,
                address: registerRestaurant.coords.address,
                latitudeDelta: registerRestaurant.coords.latitudeDelta || 0.0122,
                longtitudeDelta: registerRestaurant.coords.longitudeDelta || 0.0122,
              } as Prisma.JsonObject)
            : Prisma.JsonNull,
          isVerified: true,
          verification: 'Approved',
          verificationMessage: 'Nhà hàng đã được xác minh tự động.',
        },
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw new InternalServerErrorException('Lỗi khi tạo nhà hàng.');
    }
    

    // ✅ Cập nhật role của user thành RESTAURANT
    await this.prisma.user.update({
      where: { id: registerRestaurant.userId },
      data: {
        role: Role.RESTAURANTS,
        isRestaurantVerified: true,
      },
    });

    return {
      message: 'Nhà hàng đã được đăng ký và duyệt thành công.',
      restaurant: newRestaurant,
    };
  }

  // Lấy thông tin nhà hàng theo id
  async getRestaurantById(id: string) {
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          foods: {
            include: {
              foodTags: true, // Lấy các foodTags liên quan
              foodTypes: true, // Lấy các foodTypes liên quan
              additives: true, // Lấy các additives liên quan
            },
          },
        },
      });
  
      if (!restaurant) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }
  
      return {
        getRestaurentID: {
          ...restaurant,
          foods: restaurant.foods.map((food) => ({
            ...food,
            // Parse JSON nếu cần thiết và tránh trường hợp undefined
            foodTags: food.foodTags ? food.foodTags : [], // Nếu foodTags không tồn tại, trả về mảng rỗng
            foodTypes: food.foodTypes ? food.foodTypes : [], // Nếu foodTypes không tồn tại, trả về mảng rỗng
            additives: food.additives ? food.additives : [], // Nếu additives không tồn tại, trả về mảng rỗng
            imageUrl: Array.isArray(food.imageUrl)
              ? food.imageUrl
              : JsonParser.safeJsonParse(food.imageUrl || '[]'),
          })),
          coords: restaurant.coords
            ? {
                id: (restaurant.coords as unknown as CoordsDto).id,
                title: (restaurant.coords as unknown as CoordsDto).title,
                latitude: (restaurant.coords as unknown as CoordsDto).latitude,
                longitude: (restaurant.coords as unknown as CoordsDto).longitude,
                address: (restaurant.coords as unknown as CoordsDto).address,
                latitudeDelta:
                  (restaurant.coords as unknown as CoordsDto).latitudeDelta || 0.0122,
                longitudeDelta:
                  (restaurant.coords as unknown as CoordsDto).longitudeDelta || 0.0122,
              }
            : null,
        },
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể lấy thông tin nhà hàng');
    }
  }
  
  // Lấy danh sách ngẫu nhiên 5 nhà hàng
  async getRandomRestaurants(req: any, code: string) {
    try {
      let { pageIndex, pageSize } = req.query as any;
      pageIndex = +pageIndex > 0 ? +pageIndex : 1;
      pageSize = +pageSize > 0 ? +pageSize : 10; // Đảm bảo lấy 10 nhà hàng ngẫu nhiên
  
      // Lấy tổng số nhà hàng có code và là available
      const totalItems = await this.prisma.restaurant.count({
        where: { code, isAvailable: true },
      });
  
      if (totalItems === 0) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }
  
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // Lấy tất cả các nhà hàng có code và available
      let restaurants = await this.prisma.restaurant.findMany({
        where: {
          code,
          isAvailable: true,
        },
        include: {
          foods: {
            include: {
              foodTags: true,
              foodTypes: true,
              additives: true,
            },
          },
        },
      });
  
      // Xáo trộn danh sách nhà hàng và lấy 10 nhà hàng ngẫu nhiên
      restaurants = shuffleArray(restaurants).slice(0, 10);
  
      return {
        metaData: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          randomRestaurants: restaurants.map((restaurant) => ({
            ...restaurant,
            coords: formatCoords(restaurant.coords),
            foods: restaurant.foods.map((food) => ({
              ...food,
              foodTags: food.foodTags || [],
              foodTypes: food.foodTypes || [],
              additives: food.additives || [],
              imageUrl: Array.isArray(food.imageUrl)
                ? food.imageUrl
                : JsonParser.safeJsonParse(food.imageUrl || '[]'),
            })),
          })),
        },
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể lấy danh sách nhà hàng');
    }
  }
  
  
  // Lấy tất cả nhà hàng gần nhất
  async getAllNearByRestaurants(req: any, code: string) {
    try {
      let { pageIndex, pageSize } = req.query as any;
      pageIndex = +pageIndex > 0 ? +pageIndex : 1;
      pageSize = +pageSize > 0 ? +pageSize : 3;

      const skip = (pageIndex - 1) * pageSize;
      const totalItems = await this.prisma.restaurant.count({
        where: { code, isAvailable: true },
      });

      const totalPages = Math.ceil(totalItems / pageSize);

      const restaurants = await this.prisma.restaurant.findMany({
        where: {
          code,
          isAvailable: true,
        },
        include: {
          foods: true,
        },
        skip,
        take: pageSize,
      });

      // Log the foodTags, foodType, and additives before parsing
      restaurants.forEach((restaurant) => {
        restaurant.foods.forEach((food) => {});
      });

      return {
        metaData: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          allNearByRestaurants: restaurants.map((restaurant) => ({
            ...restaurant,
            foods: restaurant.foods.map((food) => ({
              ...food,
              foodTags: JsonParser.safeJsonParse(
                ((food as any).foodTags as string) || '[]',
              ),
              foodType: JsonParser.safeJsonParse(
                ((food as any).foodTypes as string) || '[]',
              ),
              additives: JsonParser.safeJsonParse(
                ((food as any).additives as string) || '[]',
              ).map((additive: any) => ({
                id: additive.id,
                title: additive.title,
                price: Number(additive.price),
              })),
            })),
            coords: formatCoords(restaurant.coords),
          })),
        },
      };
    } catch (error) {
      console.error('Error in getAllNearByRestaurants:', error);
      throw new BadRequestException('Không thể lấy danh sách nhà hàng');
    }
  }
}
