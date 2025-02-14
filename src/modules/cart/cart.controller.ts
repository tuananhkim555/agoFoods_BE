import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Delete,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AddToCartDto, RemoveCartItemDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    const userId = req.user.id; // Lấy userId từ token JWT
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async removeCartItem(@Query() removeCartItemDto: RemoveCartItemDto, @Request() req) {
    const userId = req.user.id; // Lấy userId từ token JWT
  
    console.log('Received cartItemId:', removeCartItemDto.cartItemId);
    console.log('Current userId:', userId);
  
    return this.cartService.removeCartItem(userId, removeCartItemDto);
  }
}
