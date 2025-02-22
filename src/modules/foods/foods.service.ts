import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { CategoryType, Prisma } from '@prisma/client';
import { JsonParser } from 'src/common/helpers/json-parser';
import _ from 'lodash';
import { generateFoodId, generateId } from 'src/common/utils/format-id';
import { shuffleArray } from 'src/common/utils/array-utils';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  // Tạo món ăn
  async createFood(createFoodDto: CreateFoodDto) {
    try {
      // 1. Tạo ID cho món ăn
      const foodId = await generateFoodId(this.prisma);

      // 2. Kiểm tra nhà hàng có tồn tại không (Chỉ where theo ID)
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: createFoodDto.restaurantId },
        select: { id: true },
      });

      if (!restaurant) {
        throw new BadRequestException('Nhà hàng không tồn tại');
      }

      // 3. Kiểm tra danh mục có tồn tại không (Chỉ where theo ID)
      const category = await this.prisma.categories.findUnique({
        where: { id: createFoodDto.categoryId },
        select: { id: true, type: true, title: true },
      });

      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }

      // 4. Kiểm tra type của category (Chỉ chấp nhận FOOD)
      if (category.type !== CategoryType.FOOD) {
        throw new BadRequestException(
          `Bạn đã chọn danh mục đồ uống '${category.title}' lỗi không hợp lệ,vui lòng chọn danh mục đồ ăn - FOOD`,
        );
      }

      // 5. Xử lý foodTags
      const foodTags = await Promise.all(
        createFoodDto.foodTags.map(async (tagName) => {
          const tagId = await generateId(this.prisma, 'Tag', 'foodTags');
          return await this.prisma.foodTags.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, id: tagId },
            select: { id: true, name: true },
          });
        }),
      );

      // 6. Xử lý foodTypes
      const foodTypes = await Promise.all(
        createFoodDto.foodTypes.map(async (typeName) => {
          const typeId = await generateId(this.prisma, 'Type', 'foodTypes');
          return await this.prisma.foodTypes.upsert({
            where: { name: typeName },
            update: {},
            create: { name: typeName, id: typeId },
            select: { id: true, name: true },
          });
        }),
      );

      // 7. Xử lý additives
      const additives = await Promise.all(
        createFoodDto.additives.map(async (additive) => {
          const existingAdditive = await this.prisma.additives.findFirst({
            where: { title: additive.title },
          });

          if (existingAdditive) {
            return {
              id: existingAdditive.id,
              title: existingAdditive.title,
              price: existingAdditive.price,
            };
          }

          const additiveId = await generateId(this.prisma, 'Add', 'additives');
          return await this.prisma.additives.create({
            data: {
              id: additiveId,
              title: additive.title,
              price: additive.price,
            },
            select: { id: true, title: true, price: true },
          });
        }),
      );

      // 8. Kiểm tra số lượng tags, types, additives có đúng không
      if (foodTypes.length !== createFoodDto.foodTypes.length) {
        throw new BadRequestException('Một hoặc nhiều foodTypes không tồn tại');
      }
      if (foodTags.length !== createFoodDto.foodTags.length) {
        throw new BadRequestException('Một hoặc nhiều foodTags không tồn tại');
      }
      if (additives.length !== createFoodDto.additives.length) {
        throw new BadRequestException('Một hoặc nhiều additives không tồn tại');
      }

      // 9. Tạo món ăn
      const food = await this.prisma.food.create({
        data: {
          id: foodId,
          ...createFoodDto,
          categoryId: category.id,
          foodTypes: { connect: foodTypes.map((type) => ({ id: type.id })) },
          foodTags: { connect: foodTags.map((tag) => ({ id: tag.id })) },
          additives: {
            connect: additives.map((additive) => ({ id: additive.id })),
          },
        },
      });

      return {
        status: 'success',
        message: 'Tạo món ăn thành công',
        data: {
          ...food,
          foodTags,
          foodTypes,
          additives,
        },
      };
    } catch (error) {
      console.error('Lỗi khi tạo món ăn:', error);
      throw new BadRequestException(error.message || 'Không thể tạo món ăn');
    }
  }

  // Lấy tất cả danh sách món ăn
  async getFoodAll(query: any) {
    let { pageIndex, pageSize, skip = 0, take = 10, restaurantId } = query;

    pageIndex = +pageIndex > 0 ? +pageIndex : 1;
    pageSize = +pageSize > 0 ? +pageSize : 3;

    skip = (pageIndex - 1) * pageSize;
    const totalItems = await this.prisma.food.count({
      where: { restaurantId, isAvailable: true },
    });
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
        foodTags: true,
        foodTypes: true,
        additives: true,
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
          foodTypes: JsonParser.safeJsonParse(food.foodTypes),
          additives: JsonParser.safeJsonParse(food.additives),
        })),
      },
    };
  }

  // 🔎 Tìm kiếm món ăn
  async searchAll(searchTerm: string, query: any) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new BadRequestException('Vui lòng nhập từ khóa tìm kiếm');
      }

      console.log('[searchAll] Searching for:', searchTerm);

      // ✅ Mặc định phân trang nếu không có query
      let pageIndex = Number(query.pageIndex) > 0 ? Number(query.pageIndex) : 1;
      let pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 10;
      let skip = (pageIndex - 1) * pageSize;

      // ✅ Tính tổng số món ăn & đồ uống
      const totalFoods = await this.prisma.food.count({
        where: {
          OR: [
            { title: { contains: searchTerm.toLowerCase() } },
            { description: { contains: searchTerm.toLowerCase() } },
          ],
        },
      });

      const totalDrinks = await this.prisma.drink.count({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
      });

      // ✅ Truy vấn dữ liệu có phân trang
      const foods = await this.prisma.food.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm.toLowerCase() } },
            { description: { contains: searchTerm.toLowerCase() } },
          ],
        },
        skip,
        take: pageSize,
      });

      const drinks = await this.prisma.drink.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        skip,
        take: pageSize,
      });

      // ✅ Tính tổng số tất cả môn ăn & đồ uống
      const totalResults = totalFoods + totalDrinks;
      const totalPages = Math.ceil(totalResults / pageSize);

      return {
        foods,
        drinks,
        pagination: {
          pageIndex,
          pageSize,
          totalResults,
          totalPages,
        },
      };
    } catch (error) {
      console.error('[searchAll] Error:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi tìm kiếm');
    }
  }

  // Lấy món ăn theo ID
  async getFoodById(id: string) {
    try {
      console.log('[getFood] Received ID:', id); // ✅ Log kiểm tra ID

      if (!id) {
        throw new BadRequestException('ID món ăn không hợp lệ');
      }

      const food = await this.prisma.food.findUnique({
        where: { id },
        include: {
          category: true,
          foodTags: true,
          foodTypes: true,
          additives: true,
        },
      });

      if (!food) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }

      return {
        data: {
          ...food,
          foodTags: JsonParser.safeJsonParse(food.foodTags) || [],
          foodTypes: JsonParser.safeJsonParse(food.foodTypes) || [],
          additives: JsonParser.safeJsonParse(food.additives) || [],
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
      let foods = await this.prisma.food.findMany({
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
          foodTags: true,
          foodTypes: true,
          additives: true,
        },
      });

      if (!foods.length) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }

      foods = shuffleArray(foods).slice(0, 10);

      return {
        data: foods.map((food) => ({
          ...food,
          foodTags: JsonParser.safeJsonParse(food.foodTags),
          foodTypes: JsonParser.safeJsonParse(food.foodTypes),
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
      if (!restaurantId) {
        throw new BadRequestException('Thiếu mã nhà hàng');
      }

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundException('Không tìm thấy nhà hàng');
      }

      const pageIndex = Number(query.pageIndex) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (pageIndex - 1) * pageSize;

      const totalItems = await this.prisma.food.count({
        where: {
          restaurantId,
          isAvailable: true,
        },
      });

      if (totalItems === 0) {
        throw new NotFoundException(
          'Không tìm thấy món ăn nào trong nhà hàng này',
        );
      }

      const totalPages = Math.ceil(totalItems / pageSize);

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
          foodTags: true,
          foodTypes: true,
          additives: true,
        },
      });

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
            foodTypes: JsonParser.safeJsonParse(food.foodTypes),
            additives: JsonParser.safeJsonParse(food.additives),
          })),
        },
      };
    } catch (error) {
      console.error('[getFoodsByRestaurant] Error:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách món ăn',
      );
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
        where: { id: category },
      });
      if (!categoryExists) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }

      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code },
      });

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
        throw new NotFoundException(
          'Không tìm thấy món ăn nào trong danh mục này',
        );
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
          restaurant: true,
          foodTags: true, // Add this line
          foodTypes: true, // Add this line
          additives: true, // Add this line
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
            foodTags: food.foodTags,
            foodTypes: food.foodTypes,
            additives: food.additives,
          })),
        },
      };
    } catch (error) {
      console.error('[getFoodsByCategoryAndCode] Error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách món ăn',
      );
    }
  }

  // Cập nhật món ăn
  async updateFood(id: string, updateFoodDto: UpdateFoodDto) {
    try {
      // Validate food exists
      const food = await this.prisma.food.findUnique({
        where: { id },
        include: { foodTags: true, foodTypes: true, additives: true },
      });

      if (!food) {
        throw new BadRequestException('Không tìm thấy món ăn');
      }

      // Tạo ID cho các tag
      const foodTags = await Promise.all(
        updateFoodDto.foodTags.map(async (tagName) => {
          const tagId = await generateId(this.prisma, 'Tag', 'foodTags');
          return await this.prisma.foodTags.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, id: tagId },
            select: { id: true, name: true },
          });
        }),
      );

      // Tạo ID cho các loại món ăn
      const foodTypes = await Promise.all(
        updateFoodDto.foodTypes.map(async (typeName) => {
          const typeId = await generateId(this.prisma, 'Type', 'foodTypes');
          return await this.prisma.foodTypes.upsert({
            where: { name: typeName },
            update: {},
            create: { name: typeName, id: typeId },
            select: { id: true, name: true },
          });
        }),
      );

      // Tạo ID cho các additives và tránh tạo bản ghi trùng
      const additives = await Promise.all(
        updateFoodDto.additives.map(async (additive) => {
          const existingAdditive = await this.prisma.additives.findFirst({
            where: { title: additive.title },
          });

          if (existingAdditive) {
            return {
              id: existingAdditive.id,
              title: existingAdditive.title,
              price: existingAdditive.price,
            };
          }

          const additiveId = await generateId(this.prisma, 'Add', 'additives');

          return await this.prisma.additives.create({
            data: {
              id: additiveId,
              title: additive.title,
              price: additive.price,
            },
            select: { id: true, title: true, price: true },
          });
        }),
      );

      // Kiểm tra xem có thiếu bất kỳ tags, types, additives nào không
      if (foodTypes.length !== updateFoodDto.foodTypes.length) {
        throw new BadRequestException('Một hoặc nhiều foodTypes không tồn tại');
      }
      if (foodTags.length !== updateFoodDto.foodTags.length) {
        throw new BadRequestException('Một hoặc nhiều foodTags không tồn tại');
      }
      if (additives.length !== updateFoodDto.additives.length) {
        throw new BadRequestException('Một hoặc nhiều additives không tồn tại');
      }

      // Cập nhật món ăn
      const updatedFood = await this.prisma.food.update({
        where: { id },
        data: {
          ...updateFoodDto, // Giữ nguyên các trường khác của food
          foodTypes: {
            connect: foodTypes.map((type) => ({ id: type.id })),
          },
          foodTags: {
            connect: foodTags.map((tag) => ({ id: tag.id })),
          },
          additives: {
            connect: additives.map((additive) => ({
              id: additive.id,
            })),
          },
        },
        include: {
          category: true,
          restaurant: true,
        },
      });

      return {
        status: 'success',
        message: 'Cập nhật món ăn thành công',
        data: {
          ...updatedFood,
          foodTags,
          foodTypes,
          additives,
        },
      };
    } catch (error) {
      console.error('Error updating food:', error);
      if (error instanceof BadRequestException) {
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
        where: { id },
      });

      if (!existingFood) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }

      // 3. Delete food
      await this.prisma.food.delete({
        where: { id },
      });

      // 4. Return success response
      return {
        message: 'ok',
      };
    } catch (error) {
      console.error('[deleteFood] Error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy món ăn');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Không thể xóa món ăn do có ràng buộc với dữ liệu khác',
        );
      }

      throw new InternalServerErrorException('Lỗi hệ thống khi xóa món ăn');
    }
  }

  // Lấy ngẫu nhiêm món ăn bởi danh mục và code
  async getRandomFoodsByCategoryAndCode(category: string, code: string) {
    try {
      // 1. Validate required params
      if (!category) {
        throw new BadRequestException('Thiếu mã code');
      }
      if (!code) {
        throw new BadRequestException('Thiếu mã danh mục');
      }

      const categoryExists = await this.prisma.categories.findUnique({
        where: { id: category },
      });
      if (!categoryExists) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }

      const restaurantWithCode = await this.prisma.restaurant.findFirst({
        where: { code },
      });

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
          restaurant: true,
          foodTags: true, // Add this line
          foodTypes: true, // Add this line
          additives: true, // Add this line
        },
      });

      if (!foods.length) {
        throw new NotFoundException('Không tìm thấy món ăn');
      }

      return {
        data: foods.map((food) => ({
          ...food,
          foodTags: food.foodTags,
          foodTypes: food.foodTypes,
          additives: food.additives,
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
}
