import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GetUserOrdersDto, PlaceOrderDto } from "./dto/order.dto";
import { OrderService } from "./order.service";

@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Đặt hàng
  @Post('place')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
       summary: 'Đặt hàng',
     })
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto) {
    try {
      return await this.orderService.placeOrder(placeOrderDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Lấy danh sách đặt hàng của người dùng
  @Get('user-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách đặt hàng users',
  })
  async getUserOrders(@Query() getUserOrdersDto: GetUserOrdersDto) {
    try {
      return await this.orderService.getUserOrders(getUserOrdersDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}