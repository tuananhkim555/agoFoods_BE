import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DrinksService } from './drinks.service';
import { CreateDrinkDto } from './dto/create-drinks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UpdateDrinkDto } from './dto/update-drinks.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/drinks')
export class DrinksController {
  constructor(private readonly drinksService: DrinksService) {}

  // Tạo đồ uống
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post("create")
  @ApiOperation({ summary: 'Tạo đồ uống mới' })
  @ApiResponse({ status: 201, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async createDrink(@Body() createDrinkDto: CreateDrinkDto) {
    return await this.drinksService.createDrink(createDrinkDto);
  }

    // ✅ Lấy tất cả danh sách đồ uống
    @Public()
    @ApiResponse({
      type: [CreateDrinkDto], // Định dạng dữ liệu trả về
    })
    @Get('all')
    @ApiOperation({ summary: 'Lấy tất cả danh sách đồ uống' })
    @ResponseMessage('Lấy danh sách đồ uống thành công')
    async getDrinks(@Query() query: any) {
      return this.drinksService.getDrinkAll(query);
    }

    // ✅ API lấy thông tin đồ uống theo ID
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin đồ uống theo ID' })
  async getDrinkById(@Param('id') id: string) {
    console.log('[Controller] Received ID:', id);
    return this.drinksService.getDrinkById(id);
  }

    // Lấy Random danh sách món ăn
    @Get('random/:code')
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('JWT-auth')
    @Public()
    @ApiParam({ name: 'code', required: true })
    @ApiOperation({ summary: 'Lấy danh sách đồ uống ngẫu nhiên' })
    @ResponseMessage('Lấy danh đồ uống ngẫu nhiên thành công')
    async getRandomDrinks(@Param('code') code: string) {
      return this.drinksService.getRandomDrinks(code);
    }
  
    // Lấy đồ uống theo id nhà hàng
      @Get('restaurant/:id')
      @UseGuards(JwtAuthGuard)
      @ApiBearerAuth('JWT-auth')
      @ApiOperation({ summary: 'Lấy đồ uống theo id nhà hàng' })
      async getDrinksByRestaurant(
        @Param('id') id: string,
        @Query() query: { pageIndex?: number; pageSize?: number },
      ) {
        return this.drinksService.getDrinksByRestaurant(id, query);
      }
    
      // Lấy đồ uống theo danh mục và code
        @Get('byCategory/:category/:code')
        @UseGuards(JwtAuthGuard)
        @ApiBearerAuth('JWT-auth')
        @ApiParam({ name: 'code', required: true })
        @ApiOperation({ summary: 'Lấy đồ uống theo danh mục và code' })
        async getDrinksByCategoryAndCode(
          @Param('category') category: string,
          @Param('code') code: string,
          @Query() query: { pageIndex?: number; pageSize?: number },
        ) {
          return this.drinksService.getDrinksByCategoryAndCode(category, code, query);
        }

        //Cập nhật món ăn
          @Put(':id')
          @UseGuards(JwtAuthGuard)
          @ApiBearerAuth('JWT-auth')
          @ResponseMessage('Cập nhật đồ uống thành công')
          @ApiOperation({ summary: 'Cập nhật đồ uống' })
          async updateDrinks(
            @Param('id') id: string,
            @Body() updateFoodDto: UpdateDrinkDto,
          ) {
            return this.drinksService.updateDrinks(id, updateFoodDto);
          }

            //Xóa đồ uống
            @Delete(':id')
            @UseGuards(JwtAuthGuard)
            @ApiBearerAuth('JWT-auth')
            @Roles(Role.RESTAURANTS, Role.ADMIN)
            @ResponseMessage('Xóa đồ uống thành công')
            @ApiOperation({ summary: 'Xóa đồ uống' })
            async deleteDrink(@Param('id') id: string) {
              return this.drinksService.deleteDrink(id);
            }

             // Lấy đồ uống ngẫu nhiên bởi danh mục và code
              @Get('random/:category/:code')
              @UseGuards(JwtAuthGuard)
              @ApiBearerAuth('JWT-auth')
              @ApiOperation({ summary: 'Lấy danh sách đồ uống ngẫu nhiên theo danh mục và code' })
              async getRandomDrinksByCategoryAndCode(
                @Param('category') category: string,
                @Param('code') code: string,
              ) {
                return this.drinksService.getRandomDrinksByCategoryAndCode(category, code);
              }
}