import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AddToCartDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}


    @Post('add')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
      const userId = req.user.id; // Lấy userId từ token JWT
      return this.cartService.addToCart(userId, addToCartDto);
    }
}
