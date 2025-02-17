import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { GetUserOrdersDto, PlaceOrderDto } from './dto/order.dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class OrderService {
      constructor(private readonly prisma: PrismaService) {}

      async placeOrder(placeOrderDto: PlaceOrderDto) {
        const {
          customerId,
          restaurantId,
          deliveryAddress,
          promoCode,
          discountAmount,
          orderItems,
          paymentMethod,
        } = placeOrderDto;
    
        // Kiểm tra sự tồn tại của customer, restaurant
        const customer = await this.prisma.user.findUnique({
          where: { id: customerId },
        });
        if (!customer) {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        }
    
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: restaurantId },
        });
        if (!restaurant) {
          throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
        }
    
        // Tính toán tổng tiền
        let total = 0;
        for (const item of orderItems) {
          const food = await this.prisma.food.findUnique({
            where: { id: item.foodId },
          });
          if (!food) {
            throw new HttpException(`Food with ID ${item.foodId} not found`, HttpStatus.NOT_FOUND);
          }
    
          const itemTotal = food.price * item.quantity;
          total += itemTotal;
    
          // Nếu có phụ gia, cộng thêm giá phụ gia
          if (item.additives && item.additives.length > 0) {
            const additives = await this.prisma.additives.findMany({
              where: { id: { in: item.additives } },
            });
            total += additives.reduce((sum, additive) => sum + additive.price, 0);
          }
        }
    
        // Áp dụng mã giảm giá nếu có
        const grandTotal = discountAmount ? total - discountAmount : total;
    
        // Tạo đơn hàng
        const order = await this.prisma.order.create({
            data: {
                customerId,
                restaurantId,
                status: 'PENDING',
                total,
                grandTotal,
                deliveryAddress,
                promoCode,
                discountAmount,
                paymentMethod: paymentMethod as PaymentMethod, // Cast paymentMethod to PaymentMethod type
                orderItems: {
                  createMany: {
                    data: orderItems.map((item) => ({
                      foodId: item.foodId,
                      quantity: item.quantity,
                      price: total / orderItems.length, // Giá trung bình cho mỗi món
                      instructions: item.instructions,
                      additives: {
                        connect: item.additives?.map((additiveId) => ({ id: additiveId })),
                      },
                    })),
                  },
                },
              },
        });
    
        return order;
      }

      // Lấy danh sách user đơn hàng
      async getUserOrders(getUserOrdersDto: GetUserOrdersDto) {
        const { userId, page = 1, limit = 10 } = getUserOrdersDto;
        // Kiểm tra sự tồn tại của user
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
        }
    
        // Tính toán skip và take cho phân trang
        const skip = (page - 1) * limit;
        const take = limit;
    
        // Lấy tổng số đơn hàng của người dùng
        const totalOrders = await this.prisma.order.count({
          where: { customerId: userId },
        });
    
        // Lấy danh sách đơn hàng với phân trang
        const orders = await this.prisma.order.findMany({
          where: { customerId: userId },
          skip,
          take,
          orderBy: { createdAt: 'desc' }, // Sắp xếp theo thời gian tạo (mới nhất trước)
          include: {
            restaurant: true, // Bao gồm thông tin nhà hàng
            shipper: true, // Bao gồm thông tin shipper
            payment: true, // Bao gồm thông tin thanh toán
            orderItems: {
              include: {
                food: true, // Bao gồm thông tin món ăn trong đơn hàng
              },
            },
          },
        });
    
        // Trả về kết quả
        return {
          status: 'success',
          code: 200,
          message: 'Orders retrieved successfully.',
          metaData: {
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            pageSize: limit,
            result: true,
            orders: orders.map((order) => ({
              id: order.id,
              status: order.status,
              total: order.total,
              grandTotal: order.grandTotal,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              deliveryAddress: order.deliveryAddress,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              restaurant: order.restaurant?.title,
              shipper: order.shipper?.id,
              items: order.orderItems.map((item) => ({
                food: item.food.title,
                quantity: item.quantity,
                price: item.price,
              })),
            })),
          },
        };
      }

    }
    

