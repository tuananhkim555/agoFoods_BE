import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Put,
  Delete,
  Query,
  Get,
} from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // Tạo món ăn
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Return the category',
    type: [CreateFoodDto],
  })
  @Post()
  async createFood(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.createFood(createFoodDto);
  }

  //Lấy tất cả danh sách món ăn
  @Public()
  @ApiResponse({
    type: [CreateFoodDto],
  })
  @Get('all')
  @ResponseMessage('Lấy danh sách món ăn thành công')
  async getFoods(@Query() query: any) {
    return this.foodsService.getFoodAll(query);
  }

  // ✅ API tìm kiếm phải đặt trước
  //  @UseGuards(JwtAuthGuard)
  //  @ApiBearerAuth('JWT-auth')
  @Public()
   @Get('drinks/search')
   async searchAll(
     @Query('searchTerm') searchTerm: string,
   ) {
     console.log('[Controller] Received searchTerm:', searchTerm);
     return this.foodsService.searchAll(searchTerm, {});
   }

  // ✅ API lấy thông tin món ăn theo ID
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  async getFood(@Param('id') id: string) {
    console.log('[Controller] Received ID:', id);
    return this.foodsService.getFoodById(id);
  }

    // Lấy tất cả danh sách món ăn bằng code
    @Public()
    @Get('code/:code')
    @ApiParam({ name: 'code', required: true })
    @ResponseMessage('Lấy danh sách món ăn thành công')
    async getFoodsByCode(@Param('code') code: string) {
      return this.foodsService.getFoodsByCode(code, {});
    }

  // Lấy Random danh sách món ăn
  @Get('random/:code')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT-auth')
  @Public()
  @ApiParam({ name: 'code', required: true })
  @ResponseMessage('Lấy danh sách món ăn ngẫu nhiên thành công')
  async getRandomFoods(@Param('code') code: string) {
    return this.foodsService.getRandomFoods(code);
  }

  // Lấy món ăn theo id nhà hàng
  @Get('restaurant/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getFoodsByRestaurant(
    @Param('id') id: string,
    @Query() query: { pageIndex?: number; pageSize?: number },
  ) {
    return this.foodsService.getFoodsByRestaurant(id, query);
  }

  // Lấy món ăn theo danh mục và code
  @Get('byCategory/:category/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'code', required: true })
  async getFoodsByCategoryAndCode(
    @Param('category') category: string,
    @Param('code') code: string,
    @Query() query: { pageIndex?: number; pageSize?: number },
  ) {
    return this.foodsService.getFoodsByCategoryAndCode(category, code, query);
  }

  //Cập nhật món ăn
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Cập nhật món ăn thành công')
  async updateFood(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto,
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

  // Lấy món ăn ngẫu nhiên bởi danh mục và code
  @Get('random/:category/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getRandomFoodsByCategoryAndCode(
    @Param('category') category: string,
    @Param('code') code: string,
  ) {
    return this.foodsService.getRandomFoodsByCategoryAndCode(category, code);
  }
}
