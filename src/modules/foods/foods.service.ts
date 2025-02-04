import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateFoodDto} from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  async createFood(createFoodDto: CreateFoodDto) {
    try {
      // Ensure additives is initialized as empty array if undefined
      const additives = createFoodDto.additives || [];
      const foodTags = createFoodDto.foodTags || [];
      const foodType = createFoodDto.foodType || [];

      const food = await this.prisma.food.create({
        data: {
          ...createFoodDto,
          foodTags: JSON.stringify(foodTags),
          foodType: JSON.stringify(foodType),
          additives: JSON.stringify(additives),
          imageUrl: 
             createFoodDto.imageUrl
        },
        include: {
          category: true,
        }
      });

      // Format response with parsed arrays
      return {
        message: 'Tạo món ăn thành công',
        data: {
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

  async getFoods(query: any) {
    const { skip = 0, take = 10, restaurantId } = query;

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
      status: 'success',
      code: 200,
      message: 'Thành công',
      data: foods.map(food => ({
        ...food,
        foodTags: JSON.parse(food.foodTags as string),
        foodType: JSON.parse(food.foodType as string),
        additives: JSON.parse(food.additives as string)
      }))
    };
  }

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
      status: 'success',
      code: 200,
      message: 'Thành công',
      data: {
        ...food,
        foodTags: JSON.parse(food.foodTags as string),
        foodType: JSON.parse(food.foodType as string),
        additives: JSON.parse(food.additives as string)
      }
    };
  }

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
      status: 'success',
      code: 200,
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