import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Additives, CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { Prisma } from '@prisma/client';
import { JsonParser } from 'src/common/helpers/json-parser';
import { InputJsonValue } from '@prisma/client/runtime/library';

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
      // 1. Generate unique food ID
      const foodId = await this.generateFoodId();
  
      // 2. Validate restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: createFoodDto.restaurantId }
      });
      
      if (!restaurant) {
        throw new BadRequestException('Không tìm thấy nhà hàng');
      }
  
      // 3. Validate category exists
      const category = await this.prisma.categories.findUnique({
        where: { id: createFoodDto.categoryId }
      });
      
      if (!category) {
        throw new BadRequestException('Không tìm thấy danh mục');
      }
  
      // 4. Validate restaurant code
      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code: createFoodDto.code }
      });
      
      // 5. Parse JSON fields
      const foodTags = JsonParser.safeJsonParse<InputJsonValue>(createFoodDto.foodTags);
      const foodType = JsonParser.safeJsonParse<InputJsonValue>(createFoodDto.foodType);
      const additives = JsonParser.safeJsonParse<InputJsonValue>(createFoodDto.additives);
  
      // 6. Create food with validated data
      const food = await this.prisma.food.create({
        data: {
          id: foodId,
          ...createFoodDto,
          foodTags,
          foodType,
          additives,
          imageUrl: createFoodDto.imageUrl || []
        },
        include: {
          category: true,
          restaurant: true
        }
      });
  
      return {
        status: 'success',
        message: 'Tạo món ăn thành công',
        data: {
          ...food,
          foodTags: JsonParser.safeJsonParse(food.foodTags),
          foodType: JsonParser.safeJsonParse(food.foodType),
          additives: JsonParser.safeJsonParse(food.additives)
        }
      };
  
    } catch (error) {
      console.error('Error creating food:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo món ăn');
    }
  }

  // Lấy tất cả danh sách món ăn
  async getFoodAll(query: any) {
    
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
  async getFoodById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID món ăn không hợp lệ');
      }
  
      console.log('[getFood] Looking for food with ID:', id);
  
      const food = await this.prisma.food.findUnique({
        where: { id },
        include: { category: true },
      });
  
      if (!food) {
        throw new NotFoundException('Không tìm thấy');
      }
  
      return {
        data: {
          ...food,
          foodTags: food.foodTags || [],
          foodType: food.foodType || [],
          additives: food.additives || [],
        },
      };
    } catch (error) {
      console.error('[getFood] Error:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy món ăn');
    }
  }
  

  
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
      // 1. Validate restaurantId
      if (!restaurantId) {
        throw new BadRequestException('Thiếu mã nhà hàng');
      }
  
      // 2. Check if restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });
  
      if (!restaurant) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }
  
      // 3. Validate pagination params
      const pageIndex = Number(query.pageIndex) || 1;
      const pageSize = Number(query.pageSize) || 10;
      
      const skip = (pageIndex - 1) * pageSize;
  
      // 4. Get total count for this restaurant
      const totalItems = await this.prisma.food.count({
        where: {
          restaurantId,
          isAvailable: true,
        },
      });
  
      if (totalItems === 0) {
        throw new NotFoundException('Không tìm thấy món ăn nào trong nhà hàng này');
      }
  
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // 5. Get paginated foods
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
          restaurant: true
        },
      });
  
      // 6. Return formatted response
      return {
        status: 'success',
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
      console.error('[getFoodsByRestaurant] Error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách món ăn');
    }
  }

  // Lấy món ăn theo danh mục và code
  async getFoodsByCategoryAndCode(
    category: string,
    code: string,
    query: { pageIndex?: number; pageSize?: number },
  ) {
    try {
      // 1. Validate required params

      if (!category) {
        throw new BadRequestException('Thiếu mã danh mục');
      }

      if (!code) {
        throw new BadRequestException('Thiếu mã code');
      }
  
      // 3. Validate category exists
      const categoryExists = await this.prisma.categories.findUnique({
        where: { id: category }
      });
      if (!categoryExists) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }


      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code }
      });
      if (!restaurantWithCode) {
        throw new NotFoundException('Không tìm thấy mã code');
      }
  
      // 4. Validate and set pagination
      const pageIndex = Number(query.pageIndex) || 1;
      const pageSize = Number(query.pageSize) || 10;
  
      const skip = (pageIndex - 1) * pageSize;
  
      // 5. Get total count
      const totalItems = await this.prisma.food.count({
        where: {
          categoryId: category,
          code,
          isAvailable: true,
        },
      });
  
      if (totalItems === 0) {
        throw new NotFoundException('Không tìm thấy món ăn nào trong danh mục này');
      }
  
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // 6. Get paginated foods
      const foods = await this.prisma.food.findMany({
        where: {
          categoryId: category,
          code,
          isAvailable: true,
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
          restaurant: true
        },
      });
  
      // 7. Return formatted response
      return {
        status: 'success',
        data: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          items: foods.map((food) => ({
            ...food,
            foodTags: JsonParser.safeJsonParse(food.foodTags),
            foodType: JsonParser.safeJsonParse(food.foodType),
            additives: (JsonParser.safeJsonParse<Additives>(food.additives) || [])
              .map((additive: Additives) => ({
                id: additive.id,
                title: additive.title,
                price: Number(additive.price),
              })),
          })),
        },
      };
  
    } catch (error) {
      console.error('[getFoodsByCategoryAndCode] Error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách món ăn');
    }
  }

  // 🔎 Tìm kiếm món ăn
  async searchFoods(searchText: string, query?: { pageIndex?: number; pageSize?: number }) {
    try {
      const decodedSearchText = decodeURIComponent(searchText.trim());
      console.log('[searchFoods] Searching for:', decodedSearchText);
  
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
  
      console.log('[searchFoods] Search results:', foods);
  
      await this.prisma.$disconnect(); // Đóng Prisma connection
  
      return {
        totalItems,
        pageIndex,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        items: foods,
      };
    } catch (error) {
      console.error('[searchFoods] Error:', error);
      throw new BadRequestException('Lỗi khi tìm kiếm món ăn');
    }
  }
  

  // Cập nhật món ăn
  async updateFood(id: string, updateFoodDto: UpdateFoodDto) {
    try {
     // 1. Validate food exists
     const existingFood = await this.prisma.food.findUnique({
      where: { id },
      include: { category: true, restaurant: true }
    });

    if (!existingFood) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    // 2. Validate restaurant if changing
    if (updateFoodDto.restaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: updateFoodDto.restaurantId }
      });
      if (!restaurant) {
        throw new BadRequestException('Không tìm thấy nhà hàng');
      }
    }

    // 3. Validate category if changing
    if (updateFoodDto.categoryId) {
      const category = await this.prisma.categories.findUnique({
        where: { id: updateFoodDto.categoryId }
      });
      if (!category) {
        throw new BadRequestException('Không tìm thấy danh mục');
      }
    }

    // 4. Validate code if changing
    if (updateFoodDto.code && updateFoodDto.code !== existingFood.code) {
      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code: updateFoodDto.code }
      });
      if (!restaurantWithCode) {
        throw new BadRequestException('Mã code không hợp lệ');
      }
    }

    const food = await this.prisma.food.update({
      where: { id },
      data: {
        ...updateFoodDto,
        foodTags: JsonParser.safeJsonParse<InputJsonValue>(updateFoodDto.foodTags) as InputJsonValue,
        foodType: JsonParser.safeJsonParse<InputJsonValue>(updateFoodDto.foodType),
        additives: JsonParser.safeJsonParse<InputJsonValue>(updateFoodDto.additives),
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
        foodTags: JsonParser.safeJsonParse(food.foodTags as string),
        foodType: JsonParser.safeJsonParse(food.foodType as string),
        additives: JsonParser.safeJsonParse(food.additives as string),
      },
    };
  } catch (error) {
    console.error('Error updating food:', error);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('Không thể cập nhật món ăn');
  }
}

  // Xóa món ăn
  async deleteFood(id: string) {
    try {
      // 1. Validate food ID
      if (!id) {
        throw new BadRequestException('ID món ăn không hợp lệ');
      }
  
      // 2. Check if food exists
      const existingFood = await this.prisma.food.findUnique({
        where: { id }
      });
  
      if (!existingFood) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }
  
      // 3. Delete food
      await this.prisma.food.delete({
        where: { id }
      });
  
      // 4. Return success response
      return {
        message: 'ok'
      };
  
    } catch (error) {
      console.error('[deleteFood] Error:', error);
  
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
  
      // Handle Prisma errors
      if (error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy món ăn');
      }
      
      if (error.code === 'P2003') {
        throw new BadRequestException('Không thể xóa món ăn do có ràng buộc với dữ liệu khác');
      }
  
      throw new InternalServerErrorException('Lỗi hệ thống khi xóa món ăn');
    }
  }

 // Lấy ngẫu nhiêm món ăn bởi danh mục và code
  async getRandomFoodsByCategoryAndCode(category: string, code: string,) {
    try {
      // 1. Validate required params
      if (!category) {
        throw new BadRequestException('Thiếu mã code');
      }
      if (!code) {
        throw new BadRequestException('Thiếu mã danh mục');
      }
    
      
      const categoryExists = await this.prisma.categories.findUnique({
        where: { id: category }
      });
      if (!categoryExists) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }


      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code }
      });
      if (!restaurantWithCode) {
        throw new NotFoundException('Không tìm thấy mã code');
      }
  
      // 4. Get 5 random foods
      const foods = await this.prisma.food.findMany({
        where: {
          categoryId: category,
          code,
          isAvailable: true,
        },
        take: 10,
        orderBy: {
          rating: 'desc',
        },
        include: {
          category: true,
          restaurant: true
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
        }),
        ),
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


}
