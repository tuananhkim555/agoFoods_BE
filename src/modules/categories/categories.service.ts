import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Categories } from './dto/categories.dto';
import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

// Tạo mới một category
  async create(categories: Categories) {
    try {
      const { title, value, imageUrl } = categories;
      
      // Kiểm tra value đã tồn tại chưa
      const existingCategory = await this.prisma.categories.findUnique({
        where: { value }
      });

      if (existingCategory) {
        throw new HttpException(
          'Value này đã tồn tại. Vui lòng sử dụng giá trị khác.',
          HttpStatus.CONFLICT
        );
      }

      // Tạo ID ngắn gọn với prefix 'CAT'
      const customId = `CAT${nanoid(6)}`; // Ví dụ: CAT1a2b3c

      return await this.prisma.categories.create({
        data: {
          id: customId,
          title,
          value,
          imageUrl,
          version: 0,
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint violation
          throw new HttpException(
            'Danh mục với giá trị này đã tồn tại',
            HttpStatus.CONFLICT
          );
        }
      }
      throw error;
    }
  }


  // Lấy tất cả các category
  async findAll() {
    try {
      const categories = await this.prisma.categories.findMany();
      if (!categories.length) {
        throw new HttpException('Không tìm thấy danh mục nào', HttpStatus.NOT_FOUND);
      }
      return categories;
    } catch (error) {
      throw new HttpException(
        'Đã xảy ra lỗi khi lấy danh sách danh mục',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


   // Lấy random categories
   async getRandomCategories(limit: number = 7) {
    try {
      // Lấy tất cả danh mục
      
      const allCategories = await this.prisma.categories.findMany();
  
      if (!allCategories.length) {
        throw new HttpException('Không tìm thấy danh mục nào', HttpStatus.NOT_FOUND);
      }
  
      // Shuffle mảng danh mục
      const shuffledCategories = [...allCategories].sort(() => Math.random() - 0.5);
  
      // Trả về số lượng danh mục ngẫu nhiên
      const randomCategories = shuffledCategories.slice(0, limit);
  
      return randomCategories;
    } catch (error) {
      console.error('Error in getRandomCategories:', error);
      throw new HttpException('Đã xảy ra lỗi khi lấy danh mục ngẫu nhiên', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
  // Lấy một category theo id
  async findOne(id: string) {
    try {
      const category = await this.prisma.categories.findUnique({ where: { id } });
      if (!category) {
        throw new HttpException(
          `Không tìm thấy danh mục với ID ${id}`,
          HttpStatus.FORBIDDEN
        );
      }
      return category;
    } catch (error) {
      throw new HttpException(
        'Đã xảy ra lỗi khi tìm kiếm danh mục',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Cập nhật một category
  async update(id: string, categories: Categories) {
    try {
      const existingCategory = await this.prisma.categories.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new HttpException(
          `Không tìm thấy danh mục với ID ${id}`,
          HttpStatus.FORBIDDEN
        );
      }

      // Kiểm tra value có bị trùng không
      if (categories.value) {
        const duplicateValue = await this.prisma.categories.findFirst({
          where: {
            value: categories.value,
            id: { not: id },
          },
        });

        if (duplicateValue) {
          throw new HttpException(
            'Danh mục với giá trị này đã tồn tại',
            HttpStatus.CONFLICT
          );
        }
      }

      return await this.prisma.categories.update({
        where: { id },
        data: categories,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'Danh mục với giá trị này đã tồn tại',
            HttpStatus.CONFLICT
          );
        }
      }
      
      throw new HttpException(
        'Đã xảy ra lỗi khi cập nhật danh mục',
        HttpStatus.FORBIDDEN
      );
    }
  }

  
  // Xóa một category
  async remove(id: string) {
    try {
      const existingCategory = await this.prisma.categories.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new HttpException(
          `Không tìm thấy danh mục với ID ${id}`,
          HttpStatus.NOT_FOUND
        );
      }

      return await this.prisma.categories.delete({ where: { id } });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        'Đã xảy ra lỗi khi xóa danh mục',
        HttpStatus.NOT_FOUND
      );
    }
  }

  
}
