import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateDrinkDto } from './dto/drinks.dto';
import { generateId } from 'src/common/utils/format-id';
import { CategoryType } from '@prisma/client';

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
}