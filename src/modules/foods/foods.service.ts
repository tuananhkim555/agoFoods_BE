import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateFoodDto } from './dtos/create-food.dto';
import { UpdateFoodDto } from './dtos/update-food.dto';
import { UploadService } from 'src/common/services/upload.service';

@Injectable()
export class FoodsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}
 
  // TODO: Add validation
  async createFood(createFoodDto: CreateFoodDto, file: Express.Multer.File, storeId: string) {
    const imageUrl = await this.uploadService.uploadImage(file, 'foods');

    return this.prisma.food.create({
      data: {
        ...createFoodDto,
        storeId,
        images: {
          create: [{ url: imageUrl as string }]
        }
      },
      include: {
        images: true,
        category: true,
        tags: true
      }
    });
  }

  // TODO: Add pagination
  async getFoods(query: any) {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search ? { 
          OR: [
            { name: { contains: search } },
            { description: { contains: search } }
          ]
        } : {},
        category ? { categoryId: category } : {},
        minPrice ? { price: { gte: +minPrice } } : {},
        maxPrice ? { price: { lte: +maxPrice } } : {}
      ]
    };

    const [total, foods] = await Promise.all([
      this.prisma.food.count({ where }),
      this.prisma.food.findMany({
        where,
        skip,
        take: +limit,
        include: {
          images: true,
          category: true,
          tags: true
        }
      })
    ]);

    return {
      data: foods,
      meta: {
        total,
        page: +page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  
  async getFood(id: string) {
    const food = await this.prisma.food.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        tags: true
      }
    });

    if (!food) throw new NotFoundException('Món ăn không tồn tại');

    return food;
  }

  async updateFood(id: string, updateFoodDto: UpdateFoodDto) {
    await this.getFood(id);

    return this.prisma.food.update({
      where: { id },
      data: updateFoodDto,
      include: {
        images: true,
        category: true,
        tags: true
      }
    });
  }

  async deleteFood(id: string) {
    await this.getFood(id);
    
    return this.prisma.food.delete({
      where: { id }
    });
  }
}