import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateFoodDto} from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  private generateFoodId(): string {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit number
    return `AGO_FOOD${randomNum}`;
  }

  // Tạo món ăn
  async createFood(createFoodDto: CreateFoodDto) {
    try {
      const food = await this.prisma.food.create({
        data: {
          id: this.generateFoodId(), // Custom ID format
          ...createFoodDto,
          foodTags: JSON.stringify(createFoodDto.foodTags || []),
          foodType: JSON.stringify(createFoodDto.foodType || []),
          additives: JSON.stringify(createFoodDto.additives || []),
          imageUrl: createFoodDto.imageUrl
        },
        include: {
          category: true
        }
      });

      return {
        createFood: {
          ...food,
          foodTags: JSON.parse(food.foodTags as string || '[]'),
          foodType: JSON.parse(food.foodType as string || '[]'),
          additives: JSON.parse(food.additives as string || '[]')
        }
      };
    } catch (error) {
      throw new BadRequestException('Không thể tạo món ăn');
    }
  }

  // Lấy tất cả danh sách món ăn
  async getFoods(query: any) {
    let { pageIndex, pageSize, skip = 0, take = 10, restaurantId } = query as any;

    pageIndex = +pageIndex > 0 ? +pageIndex : 1; //chuỗi convert '' sang Number
    pageSize = +pageSize > 0 ? +pageSize : 3;

    skip = (pageIndex - 1) * pageSize;
    const totalItems = await this.prisma.user.count();
    const totalPages = Math.ceil(totalItems / pageSize);

    const foods = await this.prisma.food.findMany({
      where: { 
        restaurantId,
        isAvailable: true 
      },
      skip: Number(skip),
      take: Number(take),
      include: {
        category: true,
      }
    });

    return {
      data: {
        pageIndex,
        pageSize,
        totalItems,
        totalPages,
        items: foods.map(food => ({
          ...food,
          foodTags: JSON.parse(food.foodTags as string || '[]'),
          foodType: JSON.parse(food.foodType as string || '[]'),
          additives: JSON.parse(food.additives as string || '[]')
        }))
      }
    };
  }

  // Lấy danh sách món ăn bằng id
  async getFood(id: string) {
    const food = await this.prisma.food.findUnique({
      where: { id },
      include: {
        category: true,
      }
    });

    if (!food) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    return { 
      data: {
        ...food,
        foodTags: JSON.parse(food.foodTags as string),
        foodType: JSON.parse(food.foodType as string),
        additives: JSON.parse(food.additives as string)
      }
    };
  }


  // Lấy danh sách món ăn ngẫu nhiên
  async getRandomFoods(code: string) {
    try {
      // Get 5 random foods by code
      const foods = await this.prisma.food.findMany({
        where: {
          code,
          isAvailable: true
        },
        take: 5,
        orderBy: {
          rating: 'desc'
        },
        include: {
          category: true
        }
      });
  
      if (!foods.length) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }
  
      return {
        status: 'success',
        code: 200,
        data: foods.map(food => ({
          ...food,
          foodTags: JSON.parse(food.foodTags as string || '[]'),
          foodType: JSON.parse(food.foodType as string || '[]'),
          additives: JSON.parse(food.additives as string || '[]')
        }))
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách món ăn ngẫu nhiên');
    }
  }


  // Lấy món ăn theo nhà hàng
  async getFoodsByRestaurant(
    restaurantId: string,
    query: { pageIndex?: number; pageSize?: number; }
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
          isAvailable: true
        }
      });
  
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // Get paginated foods
      const foods = await this.prisma.food.findMany({
        where: {
          restaurantId,
          isAvailable: true
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          category: true
        }
      });
  
      return {
        status: 'success',
        code: 200,
        data: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          items: foods.map(food => ({
            ...food,
            foodTags: JSON.parse(food.foodTags as string || '[]'),
            foodType: JSON.parse(food.foodType as string || '[]'),
            additives: JSON.parse(food.additives as string || '[]')
          }))
        }
      };
    } catch (error) {
      throw new BadRequestException('Không thể lấy danh sách món ăn');
    }
  }
  
 
  // Cập nhật món ăn
  async updateFood(id: string, updateFoodDto: UpdateFoodDto) {
    const food = await this.prisma.food.update({
      where: { id },
      data: {
        ...updateFoodDto,
        foodTags: updateFoodDto.foodTags ? JSON.stringify(updateFoodDto.foodTags) : undefined,
        foodType: updateFoodDto.foodType ? JSON.stringify(updateFoodDto.foodType) : undefined,
        additives: updateFoodDto.additives ? JSON.stringify(updateFoodDto.additives) : undefined,
        imageUrl: updateFoodDto.imageUrl ? {
          deleteMany: {},
          create: updateFoodDto.imageUrl.map(url => ({
            url: url
          }))
        } : undefined
      },
      include: {
        category: true,
      }
    });

    return {
      message: 'Cập nhật thành công',
      data: {
        ...food,
        foodTags: JSON.parse(food.foodTags as string),
        foodType: JSON.parse(food.foodType as string),
        additives: JSON.parse(food.additives as string)
      }
    };
  }

  async deleteFood(id: string) {
    await this.prisma.food.delete({
      where: { id }
    });

    return {
      status: 'success',
      code: 200,
      message: 'Xóa món ăn thành công'
    };
  }
}