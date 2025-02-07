import { Controller, Get, Post, Body, UseGuards, Param, Put, Delete, Query, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

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
    return this.foodsService.getFoodAll(query);
  }


     // Search món ăn (nên nhớ đặt trước /:id)
     @Get('search')
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth('JWT-auth')
     @ApiQuery({ name: 'text', required: true, description: 'Từ khóa tìm kiếm' })
     @ApiQuery({ name: 'pageIndex', required: false, type: Number, description: 'Trang hiện tại (mặc định 1)' })
     @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Số lượng món/trang (mặc định 10)' })
     async searchFoods(
       @Query('text') text: string,
       @Query('pageIndex') pageIndex?: number,
       @Query('pageSize') pageSize?: number
     ) {
       if (!text) throw new BadRequestException('Vui lòng nhập từ khóa tìm kiếm');
       return this.foodsService.searchFoods(text, { pageIndex, pageSize });
     }
     
  
  //Lấy thông tin món ăn bằng id
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ResponseMessage('Lấy thông tin món ăn thành công')
  async getFood(@Param('id') id: string) {
    return this.foodsService.getFoodById(id);
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

 // Lấy món ăn theo id nhà hàng
  @Get('byRestaurant/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getFoodsByRestaurant(@Param('id') id: string, @Query() query: { pageIndex?: number; pageSize?: number; }) {
    return this.foodsService.getFoodsByRestaurant(id, query);
  }

  // Lấy món ăn theo danh mục và code
  @Get('byCategory/:code/:category')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'code', required: true })
  async getFoodsByCategoryAndCode(@Param('code') code: string, @Param('category') category: string, @Query() query: { pageIndex?: number; pageSize?: number }) {
    return this.foodsService.getFoodsByCategoryAndCode(code, category, query);
  }


  //Cập nhật món ăn
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Cập nhật món ăn thành công')
  async updateFood(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto
  ) {
    return this.foodsService.updateFood(id, updateFoodDto);
  }

  //Xóa món ăn
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.RESTAURANTS, Role.ADMIN)
  @ResponseMessage('Xóa món ăn thành công')
  async deleteFood(@Param('id') id: string) {
    return this.foodsService.deleteFood(id);
  }
}

