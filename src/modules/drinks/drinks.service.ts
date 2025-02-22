import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateDrinkDto } from './dto/create-drinks.dto';
import { generateId } from 'src/common/utils/format-id';
import { CategoryType } from '@prisma/client';
import { JsonParser } from 'src/common/helpers/json-parser';
import { shuffleArray } from 'src/common/utils/array-utils';
import { UpdateDrinkDto } from './dto/update-drinks.dto';

@Injectable()
export class DrinksService {
  constructor(private prisma: PrismaService) {}

  // Tạo đồ uống
  async createDrink(createDrinkDto: CreateDrinkDto) {
    try {
      // 1. Tạo ID cho đồ uống
      const drinkId = await generateId(this.prisma, 'DRINK', 'drinks');
  
      // 2. Kiểm tra nhà hàng có tồn tại không (Chỉ where theo ID)
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: createDrinkDto.restaurantId },
        select: { id: true },
      });
      if (!restaurant) {
        throw new BadRequestException('Nhà hàng không tồn tại');
      }
  
      // 3. Kiểm tra danh mục có tồn tại không (Chỉ where theo ID)
      const category = await this.prisma.categories.findUnique({
        where: { id: createDrinkDto.categoryId },
        select: { id: true, type: true, title: true },
      });
      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }
  
      // 4. Kiểm tra type của category (Chỉ chấp nhận DRINK)
      if (category.type !== CategoryType.DRINK) {
        throw new BadRequestException(`Bạn đã chọn danh mục '${category.title}' không hợp lệ, vui lòng chọn danh mucn loại đồ uống DRINK`);
      }
  
      // 5. Xử lý drinkTags
      const drinkTags = await Promise.all(
        createDrinkDto.drinkTags.map(async (tagName) => {
          const tagId = await generateId(this.prisma, 'Tag', 'drinkTags');
          return await this.prisma.drinkTags.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, id: tagId },
            select: { id: true, name: true },
          });
        }),
      );
  
      // 6. Xử lý drinkTypes
      const drinkTypes = await Promise.all(
        createDrinkDto.drinkTypes.map(async (typeName) => {
          const typeId = await generateId(this.prisma, 'Type', 'drinkTypes');
          return await this.prisma.drinkTypes.upsert({
            where: { name: typeName },
            update: {},
            create: { name: typeName, id: typeId },
            select: { id: true, name: true },
          });
        }),
      );
  
      // 7. Xử lý additives
      const additives = await Promise.all(
        createDrinkDto.additives.map(async (additive) => {
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
      if (drinkTypes.length !== createDrinkDto.drinkTypes.length) {
        throw new BadRequestException('Một hoặc nhiều drinkTypes không tồn tại');
      }
      if (drinkTags.length !== createDrinkDto.drinkTags.length) {
        throw new BadRequestException('Một hoặc nhiều drinkTags không tồn tại');
      }
      if (additives.length !== createDrinkDto.additives.length) {
        throw new BadRequestException('Một hoặc nhiều additives không tồn tại');
      }
  
      // 9. Tạo đồ uống
      const drink = await this.prisma.drink.create({
        data: {
          id: drinkId,
          ...createDrinkDto,
          categoryId: category.id,
          drinkTypes: { connect: drinkTypes.map((type) => ({ id: type.id })) },
          drinkTags: { connect: drinkTags.map((tag) => ({ id: tag.id })) },
          additives: { connect: additives.map((additive) => ({ id: additive.id })) },
        },
      });
  
      return {
        status: 'success',
        message: 'Tạo đồ uống thành công',
        data: {
          ...drink,
          drinkTags,
          drinkTypes,
          additives,
        },
      };
    } catch (error) {
      console.error('Lỗi khi tạo đồ uống:', error);
      throw new BadRequestException(error.message || 'Không thể tạo đồ uống');
    }
  }

  // Lấy tất cả danh sách đồ uống
  async getDrinkAll(query: any) {
    try {
      let { pageIndex, pageSize, skip = 0, take = 10, restaurantId } = query;
  
      pageIndex = Number(pageIndex) > 0 ? Number(pageIndex) : 1;
      pageSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
      skip = (pageIndex - 1) * pageSize;
  
      // ✅ Đếm tổng số đồ uống
      const totalItems = await this.prisma.drink.count({
        where: { restaurantId, isAvailable: true },
      });
      const totalPages = Math.ceil(totalItems / pageSize);
  
      // ✅ Lấy danh sách đồ uống có phân trang
      const drinks = await this.prisma.drink.findMany({
        where: {
          restaurantId,
          isAvailable: true,
        },
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          category: true,
          drinkTags: true,
          drinkTypes: true,
          additives: true,
        },
      });
  
      return {
        data: {
          pageIndex,
          pageSize,
          totalItems,
          totalPages,
          items: drinks.map((drink) => ({
            ...drink,
            drinkTags: JsonParser.safeJsonParse(drink.drinkTags),
            drinkTypes: JsonParser.safeJsonParse(drink.drinkTypes),
            additives: JsonParser.safeJsonParse(drink.additives),
          })),
        },
      };
    } catch (error) {
      console.error('[getDrinkAll] Error:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách đồ uống');
    }
  }

  // Lấy thông tin đồ uống theo ID
  async getDrinkById(id: string) {
    try {
      console.log('[getDrink] Received ID:', id); // ✅ Log kiểm tra ID
  
      if (!id) {
        throw new BadRequestException('ID đồ uống không hợp lệ');
      }
  
      const drink = await this.prisma.drink.findUnique({
        where: { id },
        include: {
          drinkTags: true,
          drinkTypes: true,
          additives: true,
        },
      });
  
      if (!drink) {
        throw new NotFoundException('Không tìm thấy đồ uống');
      }
  
      return {
        data: {
          ...drink,
          drinkTags: JsonParser.safeJsonParse(drink.drinkTags) || [],
          drinkTypes: JsonParser.safeJsonParse(drink.drinkTypes) || [],
          additives: JsonParser.safeJsonParse(drink.additives) || [],},
      };
    } catch (error) {
      console.error('[getDrink] Error:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy đồ uống');
    }
  }

  // Lấy danh sách drink ngẫu nhiên
    async getRandomDrinks(code: string) {
      try {
        let drinks = await this.prisma.drink.findMany({
          where: {
            code,
            isAvailable: true,
          },
          take: 5,
          orderBy: {
            rating: 'desc',
          },
          include: {
            drinkTags: true,
            drinkTypes: true,
            additives: true,
          },
        });
  
        if (!drinks.length) {
          throw new NotFoundException('Không tìm thấy đồ uống nào');
        }
  
        drinks = shuffleArray(drinks).slice(0, 10);
  
        return {
          data: drinks.map((drinks) => ({
            ...drinks,
            drinkTags: JsonParser.safeJsonParse(drinks.drinkTags),
            drinkTypes: JsonParser.safeJsonParse(drinks.drinkTypes),
            additives: JsonParser.safeJsonParse(drinks.additives),
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
  async getDrinksByRestaurant(
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
          'Không tìm thấy đồ uống nào trong nhà hàng này',
        );
      }

      const totalPages = Math.ceil(totalItems / pageSize);

      const drinks = await this.prisma.drink.findMany({
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
          drinkTags: true,
          drinkTypes: true,
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
          items: drinks.map((drinks) => ({
            ...drinks,
            drinkTags: JsonParser.safeJsonParse(drinks.drinkTags),
            drinkTypes: JsonParser.safeJsonParse(drinks.drinkTypes),
            additives: JsonParser.safeJsonParse(drinks.additives),
          })),
        },
      };
    } catch (error) {
      console.error('[getDrinksByRestaurant] Error:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách đồ uống',
      );
    }
  }

  // Lấy món ăn theo danh mục và code
  async getDrinksByCategoryAndCode(
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
      const totalItems = await this.prisma.drink.count({
        where: {
          categoryId: category,
          code,
          isAvailable: true,
        },
      });

      if (totalItems === 0) {
        throw new NotFoundException(
          'Không tìm thấy đồ uống nào trong danh mục này',
        );
      }

      const totalPages = Math.ceil(totalItems / pageSize);

      // 6. Get paginated foods
      const drinks = await this.prisma.drink.findMany({
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
          drinkTags: true,
          drinkTypes: true,
          additives: true,
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
          items: drinks.map((drinks) => ({
            ...drinks,
            drinkTags: drinks.drinkTags,
            drinkTypes: drinks.drinkTypes,
            additives: drinks.additives,
          })),
        },
      };
    } catch (error) {
      console.error('[getDrinksByCategoryAndCode] Error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách đồ uống',
      );
    }
  }

   // Cập nhật món ăn
    async updateDrinks(id: string, updateDrinkDto: UpdateDrinkDto) {
      try {
        // Validate food exists
        const drinks = await this.prisma.drink.findUnique({
          where: { id },
          include: { drinkTags: true, drinkTypes: true, additives: true },
        });
  
        if (!drinks) {
          throw new BadRequestException('Không tìm thấy đồ uống');
        }
  
        // Tạo ID cho các tag
        const drinkTags = await Promise.all(
          updateDrinkDto.drinkTags.map(async (tagName) => {
            const tagId = await generateId(this.prisma, 'Tag', 'drinkTags');
            return await this.prisma.drinkTags.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName, id: tagId },
              select: { id: true, name: true },
            });
          }),
        );
  
        // Tạo ID cho các loại món ăn
        const drinkTypes = await Promise.all(
          updateDrinkDto.drinkTypes.map(async (typeName) => {
            const typeId = await generateId(this.prisma, 'Type', 'drinkTypes');
            return await this.prisma.drinkTypes.upsert({
              where: { name: typeName },
              update: {},
              create: { name: typeName, id: typeId },
              select: { id: true, name: true },
            });
          }),
        );
  
        // Tạo ID cho các additives và tránh tạo bản ghi trùng
        const additives = await Promise.all(
          updateDrinkDto.additives.map(async (additive) => {
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
        if (drinkTypes.length !== updateDrinkDto.drinkTypes.length) {
          throw new BadRequestException('Một hoặc nhiều drinkTypes không tồn tại');
        }
        if (drinkTags.length !== updateDrinkDto.drinkTags.length) {
          throw new BadRequestException('Một hoặc nhiều drinkTags không tồn tại');
        }
        if (additives.length !== updateDrinkDto.additives.length) {
          throw new BadRequestException('Một hoặc nhiều additives không tồn tại');
        }
  
        // Cập nhật món ăn
        const updatedDrink = await this.prisma.drink.update({
          where: { id },
          data: {
            ...updateDrinkDto, // Giữ nguyên các trường khác của food
            drinkTypes: {
              connect: drinkTypes.map((type) => ({ id: type.id })),
            },
            drinkTags: {
              connect: drinkTags.map((tag) => ({ id: tag.id })),
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
          message: 'Cập nhật đồ uống thành công',
          data: {
            ...updatedDrink,
            drinkTags,
            drinkTypes,
            additives,
          },
        };
      } catch (error) {
        console.error('Error updating drink:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Không thể cập nhật đồ uống');
      }
    }

    // Xóa đồ uống
  async deleteDrink(id: string) {
    try {
      // 1. Validate food ID
      if (!id) {
        throw new BadRequestException('ID đồ uống không hợp lệ');
      }

      // 2. Check if drink exists
      const existingDrink = await this.prisma.drink.findUnique({
        where: { id },
      });

      if (!existingDrink) {
        throw new NotFoundException('Không tìm thấy đồ uống');
      }

      // 3. Delete drink
      await this.prisma.drink.delete({
        where: { id },
      });

      // 4. Return success response
      return {
        message: 'ok',
      };
    } catch (error) {
      console.error('[deleteDrink] Error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy đồ uống');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Không thể đồ uống do có ràng buộc với dữ liệu khác',
        );
      }

      throw new InternalServerErrorException('Lỗi hệ thống khi xóa đồ uống');
    }
  }

  // Lấy ngẫu nhiên đồ bởi danh mục và code
  async getRandomDrinksByCategoryAndCode(category: string, code: string) {
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

      // 4. Get 5 random drinks
      const drinks = await this.prisma.drink.findMany({
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
          drinkTags: true,
          drinkTypes: true,
          additives: true,
        },
      });

      if (!drinks.length) {
        throw new NotFoundException('Không tìm thấy đồ uống nào');
      }

      return {
        data: drinks.map((drinks) => ({
          ...drinks,
          drinkTags: drinks.drinkTags,
          drinkTypes: drinks.drinkTypes,
          additives: drinks.additives,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Không thể lấy danh sách đồ uống ngẫu nhiên',
      );
    }
  }
  
}