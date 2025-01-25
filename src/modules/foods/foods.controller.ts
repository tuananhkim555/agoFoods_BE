import { Controller, Get, Post, Body, UseGuards, Param, Put, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dtos/create-food.dto';
import { UpdateFoodDto } from './dtos/update-food.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Foods')
@Controller('api/foods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  //Tạo món ăn
  @Post()
  @Roles(Role.STORE)
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Tạo món ăn thành công')
  async createFood(
    @Body() createFoodDto: CreateFoodDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser('storeId') storeId: string
  ) {
    return this.foodsService.createFood(createFoodDto, file, storeId);
  }

  //Lấy danh sách món ăn
  @Get()
  @ResponseMessage('Lấy danh sách món ăn thành công')
  async getFoods(@Query() query: any) {
    return this.foodsService.getFoods(query);
  }

  //Lấy thông tin món ăn  
  @Get(':id')
  @ResponseMessage('Lấy thông tin món ăn thành công')
  async getFood(@Param('id') id: string) {
    return this.foodsService.getFood(id);
  }

  //Cập nhật món ăn
  @Put(':id')
  @Roles(Role.STORE)
  @ResponseMessage('Cập nhật món ăn thành công')
  async updateFood(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto
  ) {
    return this.foodsService.updateFood(id, updateFoodDto);
  }

  //Xóa món ăn
  @Delete(':id')
  @Roles(Role.STORE, Role.ADMIN)
  @ResponseMessage('Xóa món ăn thành công')
  async deleteFood(@Param('id') id: string) {
    return this.foodsService.deleteFood(id);
  }
}

