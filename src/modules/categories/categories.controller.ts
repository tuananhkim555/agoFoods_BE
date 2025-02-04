import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { Categories} from './dto/categories.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Tạo mới một category
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: Categories
  })
  @Post()
  createCategory(@Body() categories: Categories) {
    return this.categoriesService.create(categories);
  }

  // Lấy tất cả các category
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Return all categories',
    type: [Categories]
  })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // Lấy một category theo id
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Return the category',
    type: Categories
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // Cập nhật một category
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
    type: Categories
  })
  @Put(':id')
  update(@Param('id') id: string, @Body() category: Categories) {
    return this.categoriesService.update(id, category);
  }

  // Xóa một category
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
    type: Categories
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // Lấy random categories
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Return random categories',
    type: [Categories]
  })
  @Get('random')
  getRandomCategories() {
    return this.categoriesService.getRandomCategories();
  }
}
