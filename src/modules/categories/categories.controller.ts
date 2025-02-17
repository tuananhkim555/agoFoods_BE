import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { Categories} from './dto/categories.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

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
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT-auth') 
  @ApiResponse({
    status: 200,
    description: 'Return all categories',
    type: [Categories]
  })
  @Get()
  @Public()
  findAll() {
    return this.categoriesService.findAll();
  }

 // Lấy random categories
 @Get('random')
 @ApiResponse({
  status: 200,
  description: 'Return random categories',
})
@Public()
//  @UseGuards(JwtAuthGuard)
//  @ApiBearerAuth('JWT-auth')
 @ApiOperation({
    summary: 'Lấy random danh mục',
  })
async getRandomCategory() {
  return this.categoriesService.getRandomCategories(7);
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

 
}

