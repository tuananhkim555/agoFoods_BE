import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DrinksService } from './drinks.service';
import { CreateDrinkDto } from './dto/drinks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}