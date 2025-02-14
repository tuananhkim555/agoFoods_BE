import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AddToCartDto } from './dto/cart.dto';
import { generateCartId } from 'src/common/utils/format-id';

@Injectable()
export class CartService {
      constructor(private readonly prisma: PrismaService) {}
    
      async addToCart(userId: string, addToCartDto: AddToCartDto) {
        const { foodId, quantity, additiveIds } = addToCartDto;
    
        try {
          // Kiểm tra sự tồn tại của món ăn
          const food = await this.prisma.food.findUnique({ where: { id: foodId } });
          if (!food) {
            throw new HttpException(`Food with ID ${foodId} not found`, HttpStatus.NOT_FOUND);
          }
    
          // Kiểm tra sự tồn tại của additives (nếu có)
          if (additiveIds && additiveIds.length > 0) {
            const existingAdditives = await this.prisma.additives.findMany({
              where: { id: { in: additiveIds } },
            });
    
            if (existingAdditives.length !== additiveIds.length) {
              throw new HttpException('One or more additives not found', HttpStatus.NOT_FOUND);
            }
          }
    
          // Kiểm tra xem món ăn đã có trong giỏ hàng chưa
          let cartItem = await this.prisma.cartItem.findFirst({
            where: { userId, foodId },
          });
    
          if (cartItem) {
            // Nếu món ăn đã có, cập nhật số lượng và tổng giá
            cartItem = await this.prisma.cartItem.update({
              where: { id: cartItem.id },
              data: {
                quantity: { increment: quantity },
                totalPrice: { increment: quantity * food.price },
              },
            });
          } else {
            // Nếu món ăn chưa có, tạo mới mục trong giỏ hàng
            const cartId = await generateCartId(this.prisma); // Sinh ID cho giỏ hàng
    
            cartItem = await this.prisma.cartItem.create({
              data: {
                id: cartId, // Sử dụng ID được sinh ra
                userId,
                foodId,
                quantity,
                totalPrice: quantity * food.price,
                ...(additiveIds && additiveIds.length > 0 && {
                  additives: {
                    connect: additiveIds.map((id) => ({ id })),
                  },
                }),
              },
            });
          }
    
          return cartItem;
        } catch (error) {
          console.error('Error adding to cart:', error);
    
          // Xử lý lỗi Prisma
          if (error instanceof HttpException) {
            throw error; // Ném lại lỗi HTTP nếu đã được xử lý trước đó
          }
    
          // Lỗi không xác định
          throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }




