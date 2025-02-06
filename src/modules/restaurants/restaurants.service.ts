import { Injectable, BadRequestException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CoordsDto, CreateRestaurantDto } from './dto/restaurants.dto';

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

@Injectable()
export class RestaurantsService {
  restaurants: any;
  constructor(private prisma: PrismaService) {}

  private generateRestaurantId(): string {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit number
    return `AGO_RES_${randomNum}`;
  }

  // Tạo nhà hàng
  async create(createRestaurantDto: CreateRestaurantDto) {
    if (createRestaurantDto) {
      // Check if restaurant exists
      const existingRestaurant = await this.prisma.restaurant.findFirst({
        where: {
          code: createRestaurantDto.code,
          isAvailable: true, // Optional: Add any other conditions if needed
        },
      });

      // Check if user has already created a restaurant
      const userRestaurant = await this.prisma.restaurant.findFirst({
        where: {
          userId: createRestaurantDto.userId, // Assuming userId is part of CreateRestaurantDto
        },

      });

      if (userRestaurant) {
        throw new ConflictException({
          status: 'error',
          code: 409,
          message: 'User này đã tạo nhà hàng trước đó',
        });
      }


      const restaurant = await this.prisma.restaurant.create({
        data: {
          id: this.generateRestaurantId(), // Custom ID format
          ...createRestaurantDto,
          rating: Number(createRestaurantDto.rating),
          ratingCount: Number(createRestaurantDto.ratingCount),
          coords: JSON.parse(JSON.stringify(createRestaurantDto.coords))
        },
        select: CREATE_SELECT_FIELDS
      });

      return {
        message: 'Tạo nhà hàng thành công',
        data: restaurant
      };

    } 
  }

  // Lấy danh sách ngẫu nhiên 5 nhà hàng
  async getRandomRestaurants(req: any, code: string) {
    let { pageIndex, pageSize } = req.query as any;

    pageIndex = +pageIndex > 0 ? +pageIndex : 1; //chuỗi convert '' sang Number
    pageSize = +pageSize > 0 ? +pageSize : 3;

    const skip = (pageIndex - 1) * pageSize;
    const totalItems = await this.prisma.user.count();
    const totalPages = Math.ceil(totalItems / pageSize);
    // skip: (page -1) * pageSize,
    try {
      let randomRestaurants = await this.prisma.restaurant.findMany({
        where: {
          code: code,
          isAvailable: true,
          version: 0,
        },
        take: 5, // Limit to 5 random restaurants
        include: {
          foods: true, // Include the foods relation
        },
      });
  
      if (randomRestaurants.length === 0) {
        randomRestaurants = await this.prisma.restaurant.findMany({
          where: {
            isAvailable: true,
          },
          take: 5, // Limit to 5 random restaurants
          include: {
            foods: true, // Include the foods relation
          },
        });
      }  

      return {
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalItems: totalItems,
        totalPages: totalPages,
        randomRestaurants: randomRestaurants.map(restaurant => ({
          id: restaurant.id,
          title: restaurant.title,
          time: restaurant.time,
          imageUrl: restaurant.imageUrl,
          foods: restaurant.foods || [], // Now foods will be available
          pickup: restaurant.pickup,
          delivery: restaurant.delivery,
          isAvailable: restaurant.isAvailable,
          verification: restaurant.verification,
          verificationMessage: restaurant.verificationMessage,
          userId: restaurant.userId,
          code: restaurant.code,
          logoUrl: restaurant.logoUrl,
          rating: restaurant.rating,
          ratingCount: restaurant.ratingCount,
          coords: restaurant.coords ? {
            id: (restaurant.coords as unknown as CoordsDto).id,
            title: (restaurant.coords as unknown as CoordsDto).title,
            latitude: (restaurant.coords as unknown as CoordsDto).latitude,
            longitude: (restaurant.coords as unknown as CoordsDto).longitude,
            address: (restaurant.coords as unknown as CoordsDto).address,
            latitudeDelta: typeof (restaurant.coords as any).latitudeDelta === "number" ? (restaurant.coords as any).latitudeDelta : 0.0122,
            longitudeDelta: typeof (restaurant.coords as any).longitudeDelta === "number" ? (restaurant.coords as any).longitudeDelta : 0.0122,
          } : null,
        })),
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        status: 'error',
        code: 400,
        message: 'Lỗi khi lấy danh sách nhà hàng ngẫu nhiên'
      });
    }
  }

  // Lấy tất cả nhà hàng gần nhất
  async getAllNearByRestaurants(req: any, code: string) {
    let { pageIndex, pageSize } = req.query as any;

    pageIndex = +pageIndex > 0 ? +pageIndex : 1; // Convert to Number, default to 1
    pageSize = +pageSize > 0 ? +pageSize : 3; // Convert to Number, default to 3

    const totalItems = await this.prisma.restaurant.count({
        where: {
            code: code,
            isAvailable: true,
        },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    try {
        const allNearByRestaurants = await this.prisma.restaurant.findMany({
            where: {
                code: code,
                isAvailable: true,
            },
            take: pageSize, // Limit to pageSize
            skip: (pageIndex - 1) * pageSize, // Skip for pagination
            include: {
                foods: true, // Include the foods relation
            },
        });

        return {
            pageIndex: pageIndex,
            pageSize: pageSize,
            totalItems: totalItems,
            totalPages: totalPages,
            allNearByRestaurants: allNearByRestaurants.map(restaurant => ({
                id: restaurant.id,
                title: restaurant.title,
                time: restaurant.time,
                imageUrl: restaurant.imageUrl,
                foods: restaurant.foods || [],
                pickup: restaurant.pickup,
                delivery: restaurant.delivery,
                isAvailable: restaurant.isAvailable,
                verification: restaurant.verification,
                verificationMessage: restaurant.verificationMessage,
                userId: restaurant.userId,
                code: restaurant.code,
                logoUrl: restaurant.logoUrl,
                rating: restaurant.rating,
                ratingCount: restaurant.ratingCount,
                coords: restaurant.coords ? {
                    id: (restaurant.coords as unknown as CoordsDto).id,
                    title: (restaurant.coords as unknown as CoordsDto).title,
                    latitude: (restaurant.coords as unknown as CoordsDto).latitude,
                    longitude: (restaurant.coords as unknown as CoordsDto).longitude,
                    address: (restaurant.coords as unknown as CoordsDto).address,
                    latitudeDelta: typeof (restaurant.coords as any).latitudeDelta === "number" ? (restaurant.coords as any).latitudeDelta : 0.0122,
                    longitudeDelta: typeof (restaurant.coords as any).longitudeDelta === "number" ? (restaurant.coords as any).longitudeDelta : 0.0122,
                } : null,
            })),
        };

    } catch (error) {
        throw new BadRequestException({
            status: 'error',
            code: 400,
            message: 'Lỗi khi lấy danh sách nhà hàng gần đây'
        });
    }
  }

  // Lấy nhà hàng theo ID
  async getRestaurantById(id: string) {
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          foods: true
        }
      });
  
      if (!restaurant) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }
  
      return {
        getRestaurentID: {
          ...restaurant,
          foods: restaurant.foods.map(food => ({
            ...food,
            foodTags: JSON.parse(food.foodTags as string || '[]'),
            foodType: JSON.parse(food.foodType as string || '[]'),
            additives: JSON.parse(food.additives as string || '[]'),
            imageUrl: Array.isArray(food.imageUrl) ? food.imageUrl : JSON.parse(food.imageUrl as string || '[]')
          })),
          coords: restaurant.coords ? {
            id: (restaurant.coords as unknown as CoordsDto).id,
            title: (restaurant.coords as unknown as CoordsDto).title,
            latitude: (restaurant.coords as unknown as CoordsDto).latitude,
            longitude: (restaurant.coords as unknown as CoordsDto).longitude,
            address: (restaurant.coords as unknown as CoordsDto).address,
            latitudeDelta: (restaurant.coords as unknown as CoordsDto).latitudeDelta || 0.0122,
            longtitudeDelta: (restaurant.coords as unknown as CoordsDto).longtitudeDelta || 0.0122
          } : null
        },
      };
    } catch (error) {
      throw new BadRequestException('Không thể lấy thông tin nhà hàng');
    }
  }
}