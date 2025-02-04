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
          ...createRestaurantDto,
          rating: Number(createRestaurantDto.rating),
          ratingCount: Number(createRestaurantDto.ratingCount),
          coords: JSON.parse(JSON.stringify(createRestaurantDto.coords))
        },
        select: CREATE_SELECT_FIELDS
      });

      return {
        restaurant,
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
  async getRestaurantsById(id: string) {
    try {
        // Tìm nhà hàng theo ID
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: id },
            include: {
                foods: true, // Bao gồm thông tin về món ăn nếu cần
            },
        });

        // Kiểm tra xem nhà hàng có tồn tại không
        if (!restaurant) {
            throw new NotFoundException({
                message: 'Nhà hàng không tồn tại.',
            });
        }

        return {
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
            _v: 0,
            coords: restaurant.coords ? {
              id: (restaurant.coords as unknown as CoordsDto).id,
              title: (restaurant.coords as unknown as CoordsDto).title,
              latitude: (restaurant.coords as unknown as CoordsDto).latitude,
              longitude: (restaurant.coords as unknown as CoordsDto).longitude,
              address: (restaurant.coords as unknown as CoordsDto).address,
              latitudeDelta: typeof (restaurant.coords as any).latitudeDelta === "number" ? (restaurant.coords as any).latitudeDelta : 0.0122,
              longitudeDelta: typeof (restaurant.coords as any).longitudeDelta === "number" ? (restaurant.coords as any).longitudeDelta : 0.0122,
            } : null,
        }; // Trả về thông tin nhà hàng
    } catch (error) {
        console.error('Error fetching restaurant by ID:', error);
        throw new NotFoundException('Đã xảy ra lỗi khi lấy thông tin nhà hàng.');
    }
  }
}