import { Injectable, BadRequestException, ConflictException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Additive, CoordsDto, CreateRestaurantDto, FoodTags, FoodType, RegisterRestaurant } from './dto/restaurants.dto';
import { JsonParser } from 'src/common/helpers/json-parser';
import { Prisma } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';

const CREATE_SELECT_FIELDS = {
  id: true,
  title: true,
  time: true,
  imageUrl: true,
  userId: true,
  code: true,
  logoUrl: true,
  rating: true,
  ratingCount: true,
  coords: true,
};

function safeJsonParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value; // Return the original value if it's not valid JSON
  }

}

@Injectable()
export class RestaurantsService {
  restaurants: any;
  constructor(private prisma: PrismaService) {}

  // format id
  private async generateRestaurantId(): Promise<string> {
    while (true) {
      // Generate random 5 digit number
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const restaurantId = `RES_${randomNum}`;
      
      // Check if ID exists
      const existingFood = await this.prisma.food.findUnique({
        where: { id: restaurantId }
      });
      
      // Return if ID is unique
      if (!existingFood) {
        return restaurantId;
      }
    }
  }


// Helper method to format coordinates
private formatCoords(coords: any): CoordsDto | null {
  if (coords) {
    return {
      id: coords.id,
      title: coords.title,
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      address: coords.address,
      latitudeDelta: coords.latitudeDelta || 0.0122,
      longtitudeDelta: coords.longtitudeDelta || 0.0122,
    };
  }
  return null;
}


// đăng ký cửa hàng
async registerRestaurant(req: any, registerRestaurant: RegisterRestaurant) {
  const restaurantId = await this.generateRestaurantId();
  
  // Kiểm tra user có quyền đăng ký nhà hàng cho user khác không
  if (req['user'].id !== registerRestaurant.userId) {
    throw new ForbiddenException('Bạn không có quyền đăng ký nhà hàng cho user khác.');
  }

  // Kiểm tra mã CCCD hợp lệ
  const idCardRegex = /^(0\d{2}|10\d{2})[0-9]{1}[0-9]{2}[0-9]{6}$/;
  if (!idCardRegex.test(registerRestaurant.idCard)) {
    throw new BadRequestException('idCard không hợp lệ. Vui lòng nhập đúng CCCD Việt Nam.');
  }

  // Kiểm tra các trường bắt buộc
  if (
    !registerRestaurant.title?.trim() || 
    !registerRestaurant.imageUrl?.trim() || 
    !registerRestaurant.avatar?.trim() || 
    !registerRestaurant.logoUrl?.trim() || 
    !registerRestaurant.description?.trim()
  ) {
    throw new BadRequestException('Cần có ảnh đại diện, logo và mô tả để đăng ký.');
  }
  

  if (!registerRestaurant.pickup && !registerRestaurant.delivery) {
    throw new BadRequestException('Cửa hàng cần có ít nhất một hình thức bán hàng.');
  }

  // ✅ Kiểm tra `code` có tồn tại không
  const existingCode = await this.prisma.restaurant.findFirst({
    where: { code: registerRestaurant.code },
  });
  
  if (existingCode) {
    throw new BadRequestException('Mã cửa hàng đã tồn tại, vui lòng chọn mã khác.');
  }
  

  // ✅ Nếu `code` hợp lệ, tự động duyệt nhà hàng
  const newRestaurant = await this.prisma.restaurant.create({
    data: {
      id: restaurantId,
      title: registerRestaurant.title,
      imageUrl: registerRestaurant.imageUrl,
      userId: registerRestaurant.userId,
      idCard: registerRestaurant.idCard,
      avatar: registerRestaurant.avatar,
      logoUrl: registerRestaurant.logoUrl,
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
      longtitudeDelta: registerRestaurant.coords.longtitudeDelta || 0.0122,
    } as Prisma.JsonObject) // ✅ Đảm bảo kiểu dữ liệu đúng
  : Prisma.JsonNull,
   
           

      // ✅ Tự động duyệt nhà hàng
      isVerified: true,
      verification: 'Approved',
      verificationMessage: 'Nhà hàng đã được xác minh tự động.',
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
          foods: true,
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
            foodTags: JsonParser.safeJsonParse(food.foodTags as string || '[]'),
            foodType: JsonParser.safeJsonParse(food.foodType as string || '[]'),
            additives: JsonParser.safeJsonParse(food.additives as string || '[]'),
            imageUrl: Array.isArray(food.imageUrl)
              ? food.imageUrl
              : safeJsonParse(food.imageUrl as string || '[]'),
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
                longtitudeDelta:
                  (restaurant.coords as unknown as CoordsDto).longtitudeDelta || 0.0122,
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
      pageSize = +pageSize > 0 ? +pageSize : 3;
  
      const skip = (pageIndex - 1) * pageSize;
      const totalItems = await this.prisma.restaurant.count({
        where: { code, isAvailable: true }
      });
  
      if (totalItems === 0) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }
  
      const totalPages = Math.ceil(totalItems / pageSize);
  
      let restaurants = await this.prisma.restaurant.findMany({
        where: {
          code,
          isAvailable: true
        },
        include: {
          foods: true
        }
      });
  
      return {
        metaData: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          randomRestaurants: restaurants.map(restaurant => ({
            ...restaurant,         
            coords: this.formatCoords(restaurant.coords),
            foods: restaurant.foods.map(food => ({
              ...food,
              foodTags: JsonParser.safeJsonParse(food.foodTags as string || '[]'),
              foodType: JsonParser.safeJsonParse(food.foodType as string || '[]'),
              additives: JsonParser.safeJsonParse(food.additives as string || '[]'),
              imageUrl: Array.isArray(food.imageUrl) ? food.imageUrl : JsonParser.safeJsonParse(food.imageUrl as string || '[]')
            }))
          }))
        }
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
      restaurant.foods.forEach((food) => {
      });
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
            foodTags: JsonParser.safeJsonParse<FoodTags>(food.foodTags),
            foodType: JsonParser.safeJsonParse<FoodType>(food.foodType),
            additives: JsonParser.safeJsonParse<Additive>(food.additives)
              .map((additive) => ({
                id: additive.id,
                title: additive.title,
                price: Number(additive.price),
              })),
          })),
          coords: this.formatCoords(restaurant.coords),
        })),
      },
    };
  } catch (error) {
    console.error('Error in getAllNearByRestaurants:', error);
    throw new BadRequestException('Không thể lấy danh sách nhà hàng');
  }
}


}
  