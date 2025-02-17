import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Delete,
  Query,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AddToCartDto, DecrementCartItemQuantityDto, GetCartCountDto, GetCartDto, IncrementCartItemDto, RemoveCartItemDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thêm giỏ hàng',
  })
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    const userId = req.user.id; // Lấy userId từ token JWT
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa giỏ hàng',
  })
  async removeCartItem(@Query() removeCartItemDto: RemoveCartItemDto, @Request() req) {
    const userId = req.user.id; // Lấy userId từ token JWT
  
    console.log('Received cartItemId:', removeCartItemDto.cartItemId);
    console.log('Current userId:', userId);
  
    return this.cartService.removeCartItem(userId, removeCartItemDto);
  }


  // Lấy thông tin giỏ hàng của người dùng
  @Get('get')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin giỏ hàng',
    description: 'Lấy tất cả các mục trong giỏ hàng của người dùng.',
  })
  @ApiResponse({ status: 200, description: 'Trả về danh sách các mục trong giỏ hàng.' })
  @ApiResponse({ status: 404, description: 'Người dùng không có giỏ hàng.' })
  async getCart(@Query() getCartDto: GetCartDto) {
    return this.cartService.getCart(getCartDto.userId);
  }


  // Lấy số lượng mục trong giỏ hàng
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy số lượng mục trong giỏ hàng',
    description: 'Trả về tổng số lượng mục trong giỏ hàng của người dùng.',
  })
  @ApiResponse({ status: 200, description: 'Trả về số lượng mục trong giỏ hàng.' })
  @ApiResponse({ status: 404, description: 'Người dùng không có giỏ hàng.' })
  async getCartCount(@Query() getCartCountDto: GetCartCountDto) {
    return this.cartService.getCartCount(getCartCountDto.userId);
  }


   // Tăng số lượng món ăn trong giỏ hàng
   @Post('increment')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({
     summary: 'Tăng số lượng món ăn trong giỏ hàng',
     description: 'Tăng số lượng của một mục trong giỏ hàng và cập nhật tổng giá.',
   })
   @ApiResponse({ status: 200, description: 'Số lượng món ăn đã được cập nhật thành công.' })
   @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
   @ApiResponse({ status: 404, description: 'Mục trong giỏ hàng không tồn tại.' })
   async incrementCartItem(@Body() incrementCartItemDto: IncrementCartItemDto) {
     return this.cartService.incrementCartItem(incrementCartItemDto);
   }


  // Giảm số lượng sản phẩm
  @Post('decrement')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Giảm số lượng sản phẩm',
    description: 'Giảm số lượng của một món ăn trong kho.',
  })
  @ApiResponse({ status: 200, description: 'Số lượng sản phẩm đã được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ hoặc số lượng không đủ.' })
  @ApiResponse({ status: 404, description: 'Món ăn không tồn tại.' })
  async decrementCartItemQuantity(@Body() decrementCartItemQuantityDto: DecrementCartItemQuantityDto) {
    return this.cartService.decrementCartItemQuantity(decrementCartItemQuantityDto);
  }

   // Xóa toàn bộ giỏ hàng của người dùng
   @Post('clear')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth('JWT-auth')
   @ApiOperation({
     summary: 'Xóa toàn bộ giỏ hàng',
     description: 'Xóa tất cả các mục trong giỏ hàng của người dùng hiện tại.',
   })
   @ApiResponse({ status: 200, description: 'Giỏ hàng đã được xóa thành công.' })
   @ApiResponse({ status: 401, description: 'Không được ủy quyền.' })
   async clearCart(@Request() req) {
     const userId = req.user.id; // Lấy userId từ token JWT
     return this.cartService.clearCart(userId);
   }
 }



