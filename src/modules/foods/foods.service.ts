import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Additives, CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Prisma } from '@prisma/client';
import { JsonParser } from 'src/common/helpers/json-parser';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

    // Helper method to safely parse JSON
    private safeJsonParse<T>(value: unknown): T[] {
      if (!value) return [];
      
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error('JSON parse error:', error);
          return [];
        }
      }
      
      // If value is already an object/array, return as is
      return value as T[];
    }

   // format id
    private async generateFoodId(): Promise<string> {
      while (true) {
        // Generate random 5 digit number
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const foodId = `FOOD_${randomNum}`;
        
        // Check if ID exists
        const existingFood = await this.prisma.food.findUnique({
          where: { id: foodId }
        });
        
        // Return if ID is unique
        if (!existingFood) {
          return foodId;
        }
      }
    }
  



  // Tạo món ăn
  async createFood(createFoodDto: CreateFoodDto) {
    try {

      const foodId = await this.generateFoodId();

      // Đảm bảo các trường JSON trong CreateFoodDto là mảng hoặc đối tượng hợp lệ
      const foodTags = Array.isArray(createFoodDto.foodTags)
        ? createFoodDto.foodTags
        : JSON.parse(createFoodDto.foodTags || '[]');

      const foodType = Array.isArray(createFoodDto.foodType)
        ? createFoodDto.foodType
        : JSON.parse(createFoodDto.foodType || '[]');

      const additives = Array.isArray(createFoodDto.additives)
        ? createFoodDto.additives
        : JSON.parse(createFoodDto.additives || '[]');

      const food = await this.prisma.food.create({
        data: {
          id: foodId,
          ...createFoodDto,
          foodTags, // Lưu mảng hoặc đối tượng trực tiếp
          foodType,
          additives,
          imageUrl: createFoodDto.imageUrl || [],
        },
        include: {
          category: true,
        },
      });

      return {
        createFood: food, // Trả về dữ liệu gốc, Prisma tự parse JSON
      };
    } catch (error) {
      console.error(error); // Log lỗi chi tiết
      throw new BadRequestException('Không thể tạo món ăn');
    }
  }

  // Lấy tất cả danh sách món ăn
  async getFoods(query: any) {
    let { pageIndex, pageSize, skip = 0, take = 10, restaurantId } = query;

    pageIndex = +pageIndex > 0 ? +pageIndex : 1;
    pageSize = +pageSize > 0 ? +pageSize : 3;

    skip = (pageIndex - 1) * pageSize;
    const totalItems = await this.prisma.user.count();
    const totalPages = Math.ceil(totalItems / pageSize);

    const foods = await this.prisma.food.findMany({
      where: {
        restaurantId,
        isAvailable: true,
      },
      skip: Number(skip),
      take: Number(take),
      include: {
        category: true,
      },
    });

    return {
      data: {
        pageIndex,
        pageSize,
        totalItems,
        totalPages,
        items: foods.map((food) => ({
          ...food,
          foodTags: JsonParser.safeJsonParse(food.foodTags),
          foodType: JsonParser.safeJsonParse(food.foodType),
          additives: JsonParser.safeJsonParse(food.additives),
        })),
      },
    };
  }

  // Lấy thông tin món ăn bằng ID
  // async getFood(id: string) {
  //   if (!id) {
  //     throw new BadRequestException('ID món ăn không hợp lệ');
  //   }
  
  //   console.log('Looking for food with ID:', id); // Log thêm để kiểm tra ID
  
  //   const food = await this.prisma.food.findUnique({
  //     where: { id },
  //     include: { category: true },
  //   });
  
  //   if (!food) {
  //     throw new NotFoundException('Không tìm thấy');
  //   }
  
  //   return {
  //     data: {
  //       ...food,
  //       foodTags: food.foodTags || [],
  //       foodType: food.foodType || [],
  //       additives: food.additives || [],
  //     },
  //   };
  // }

  
    // Lấy danh sách món ăn ngẫu nhiên
    async getRandomFoods(code: string) {
      try {
        // Get 5 random foods by code
        const foods = await this.prisma.food.findMany({
          where: {
            code,
            isAvailable: true,
          },
          take: 5,
          orderBy: {
            rating: 'desc',
          },
          include: {
            category: true,
          },
        });
  
        if (!foods.length) {
          throw new NotFoundException('Không tìm thấy món ăn');
        }
  
        return {
          data: foods.map((food) => ({
            ...food,
            foodTags: JsonParser.safeJsonParse(food.foodTags),
            foodType: JsonParser.safeJsonParse(food.foodType),
            additives: JsonParser.safeJsonParse(food.additives),
          })),
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new BadRequestException(
          'Không thể lấy danh sách món ăn ngẫu nhiên',
        );
      }
    }

  // Lấy món ăn theo nhà hàng
   async getFoodsByRestaurant(
    restaurantId: string,
    query: { pageIndex?: number; pageSize?: number },
  ) {
    try {
      // Default pagination values
      const pageIndex = Number(query.pageIndex) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (pageIndex - 1) * pageSize;

      // Get total count for this restaurant
      const totalItems = await this.prisma.food.count({
        where: {
          restaurantId,
          isAvailable: true,
        },
      });

      const totalPages = Math.ceil(totalItems / pageSize);

      // Get paginated foods
      const foods = await this.prisma.food.findMany({
        where: {
          restaurantId,
          isAvailable: true,
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      });

      return {
        data: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          items: foods.map((food) => ({
            ...food,
            foodTags: JsonParser.safeJsonParse(food.foodTags),
            foodType: JsonParser.safeJsonParse(food.foodType),
            additives: JsonParser.safeJsonParse(food.additives),
          })),
        },
      };
    } catch (error) {
      throw new BadRequestException('Không thể lấy danh sách món ăn');
    }
  }

  // Lấy món ăn theo danh mục và code
  async getFoodsByCategoryAndCode(
    code: string,
    category: string,
    query: { pageIndex?: number; pageSize?: number },
  ) {
    try {
      // Default pagination values
      const pageIndex = Number(query.pageIndex) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (pageIndex - 1) * pageSize;

      // Get total count
      const totalItems = await this.prisma.food.count({
        where: {
          code,
          isAvailable: true,
          categoryId: category,
        },
      });

      const totalPages = Math.ceil(totalItems / pageSize);

      // Get paginated foods
      const foods = await this.prisma.food.findMany({
        where: {
          code,
          isAvailable: true,
          categoryId: category,
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      });

      return {
        data: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          items: foods.map((food) => ({
            ...food,
            foodTags: JsonParser.safeJsonParse(food.foodTags),
            foodType: JsonParser.safeJsonParse(food.foodType),
            additives: (JsonParser.safeJsonParse<Additives>(food.additives) || []).map(
              (additive: Additives) => ({
                id: additive.id,
                title: additive.title,
                price: Number(additive.price),
              }),
            ),
          })),
        },
      };
    } catch (error) {
      throw new BadRequestException('Không thể lấy danh sách món ăn');
    }
  }

  // 🔎 Tìm kiếm món ăn
  async searchFoods(searchText: string, query?: { pageIndex?: number; pageSize?: number }) {
    const decodedSearchText = decodeURIComponent(searchText.trim());
  
    const where: Prisma.FoodWhereInput = {
      OR: [
        { title: { contains: decodedSearchText } },  
        { description: decodedSearchText ? { contains: decodedSearchText } : undefined },
        { foodTags: { array_contains: decodedSearchText } }, 
      ],
      isAvailable: true,
      status: true,
    };
  
    const totalItems = await this.prisma.food.count({ where });
    if (totalItems === 0) throw new NotFoundException(`Không tìm thấy món ăn với từ khóa "${decodedSearchText}"`);
  
    const pageIndex = query?.pageIndex ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const skip = (pageIndex - 1) * pageSize;
  
    const foods = await this.prisma.food.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { rating: 'desc' },
      include: { category: true, restaurant: true },
    });
  
    return {
      totalItems,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize),
      items: foods,
    };
  }
  

  // Cập nhật món ăn
  async updateFood(id: string, updateFoodDto: UpdateFoodDto) {
    const food = await this.prisma.food.update({
      where: { id },
      data: {
        ...updateFoodDto,
        foodTags: updateFoodDto.foodTags
          ? JSON.stringify(updateFoodDto.foodTags)
          : undefined,
        foodType: updateFoodDto.foodType
          ? JSON.stringify(updateFoodDto.foodType)
          : undefined,
        additives: updateFoodDto.additives
          ? JSON.stringify(updateFoodDto.additives)
          : undefined,
        imageUrl: updateFoodDto.imageUrl
          ? {
              deleteMany: {},
              create: updateFoodDto.imageUrl.map((url) => ({
                url: url,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
      },
    });

    return {
      message: 'Cập nhật thành công',
      data: {
        ...food,
        foodTags: JSON.parse(food.foodTags as string),
        foodType: JSON.parse(food.foodType as string),
        additives: JSON.parse(food.additives as string),
      },
    };
  }

  // Xóa món ăn
  async deleteFood(id: string) {
    await this.prisma.food.delete({
      where: { id },
    });

    return {
      status: 'success',
      code: 200,
      message: 'Xóa món ăn thành công',
    };
  }
}
