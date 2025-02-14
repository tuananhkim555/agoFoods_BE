import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AddToCartDto, RemoveCartItemDto } from './dto/cart.dto';
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
        throw new HttpException(
          `Food with ID ${foodId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Kiểm tra sự tồn tại của additives (nếu có)
      if (additiveIds && additiveIds.length > 0) {
        const existingAdditives = await this.prisma.additives.findMany({
          where: { id: { in: additiveIds } },
        });

        if (existingAdditives.length !== additiveIds.length) {
          throw new HttpException(
            'One or more additives not found',
            HttpStatus.NOT_FOUND,
          );
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
            ...(additiveIds &&
              additiveIds.length > 0 && {
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
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Xóa mục khỏi giỏ hàng
  async removeCartItem(userId: string, removeCartItemDto: RemoveCartItemDto) {
    const { cartItemId } = removeCartItemDto;
  
    try {
      console.log('Checking if cart item exists with ID:', cartItemId);
  
      // Kiểm tra sự tồn tại của mục trong giỏ hàng
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });
  
      if (!cartItem) {
        console.error(`Cart item with ID ${cartItemId} not found.`);
        throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);
      }
  
      console.log('Found cart item:', cartItem);
  
      // Kiểm tra quyền sở hữu
      if (cartItem.userId !== userId) {
        console.error(`User ${userId} is not authorized to delete cart item ${cartItemId}.`);
        throw new HttpException('You are not authorized to delete this cart item', HttpStatus.FORBIDDEN);
      }
  
      console.log(`User ${userId} is authorized to delete cart item ${cartItemId}.`);
  
      // Xóa mục khỏi giỏ hàng
      await this.prisma.cartItem.delete({
        where: { id: cartItemId },
      });
  
      console.log(`Cart item ${cartItemId} deleted successfully.`);
  
      return { message: 'Cart item removed successfully.' };
    } catch (error) {
      console.error('Error removing cart item:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
