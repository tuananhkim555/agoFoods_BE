import { Controller, Get, Post, Body, UseGuards, Param, Put, Delete, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('api/foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // Tạo món ăn
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Return the category',
    type: [CreateFoodDto]
  })
  @Post()
  async createFood(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.createFood(createFoodDto);
  }


  //Lấy tất cả danh sách món ăn
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    type: [CreateFoodDto]
  })
  @Get()
  @ResponseMessage('Lấy danh sách món ăn thành công')
  async getFoods(@Query() query: any) {
    return this.foodsService.getFoods(query);
  }

  //Lấy thông tin món ăn bằng id
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ResponseMessage('Lấy thông tin món ăn thành công')
  async getFood(@Param('id') id: string) {
    return this.foodsService.getFood(id);
  }

  // Lấy Random danh sách món ăn
  @Get('random/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'code', required: true })
  @ResponseMessage('Lấy danh sách món ăn ngẫu nhiên thành công')
  async getRandomFoods(@Param('code') code: string) {
    return this.foodsService.getRandomFoods(code);
  }

 // Lấy món ăn theo nhà hàng
  @Get('byRestaurant/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getFoodsByRestaurant(@Param('id') id: string, @Query() query: { pageIndex?: number; pageSize?: number; }) {
    return this.foodsService.getFoodsByRestaurant(id, query);
  }




  //Cập nhật món ăn
  @Put(':id')
  @Roles(Role.RESTAURANTS)
  @ResponseMessage('Cập nhật món ăn thành công')
  async updateFood(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto
  ) {
    return this.foodsService.updateFood(id, updateFoodDto);
  }

  //Xóa món ăn
  @Delete(':id')
  @Roles(Role.RESTAURANTS, Role.ADMIN)
  @ResponseMessage('Xóa món ăn thành công')
  async deleteFood(@Param('id') id: string) {
    return this.foodsService.deleteFood(id);
  }
}

