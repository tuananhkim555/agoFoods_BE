import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AddToCartDto,  DecrementCartItemQuantityDto, 
  IncrementCartItemDto, 
  RemoveCartItemDto } from './dto/cart.dto';
import { generateCartId } from 'src/common/utils/format-id';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { foodId, quantity, additiveIds } = addToCartDto;
  
    try {
      // Kiểm tra sự tồn tại của món ăn
      const food = await this.prisma.food.findUnique({
        where: { id: foodId },
        include: {
          additives: true, // Bao gồm thông tin phụ gia
        },
      });
  
      if (!food) {
        throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
      }
  
      // Kiểm tra sự tồn tại của phụ gia (nếu có)
      let selectedAdditives: { id: string; createdAt: Date; updatedAt: Date; title: string; price: number; }[] = [];      if (additiveIds && additiveIds.length > 0) {
        selectedAdditives = await this.prisma.additives.findMany({
          where: {
            id: {
              in: additiveIds,
            },
          },
        });
  
        if (selectedAdditives.length !== additiveIds.length) {
          throw new HttpException('One or more additives not found', HttpStatus.NOT_FOUND);
        }
      }
  
      // Tính toán tổng giá
      const basePrice = food.price * quantity;
      const additivesPrice = selectedAdditives.reduce((sum, additive) => sum + additive.price * quantity, 0);
      const totalPrice = basePrice + additivesPrice;
  
      // Kiểm tra xem mục này đã tồn tại trong giỏ hàng chưa
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          userId,
          foodId,
          additives: {
            every: {
              id: {
                in: additiveIds || [],
              },
            },
          },
        },
      });
  
      if (existingCartItem) {
        // Nếu mục đã tồn tại, tăng số lượng
        const updatedCartItem = await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: {
              increment: quantity,
            },
            totalPrice: {
              increment: totalPrice,
            },
          },
        });

  
        return {
          message: `Increased quantity of food ${foodId} by ${quantity}. New quantity: ${updatedCartItem.quantity}`,
          
        };
      } else {
        const cartId = await generateCartId(this.prisma);

        // Nếu mục chưa tồn tại, tạo mới
        const newCartItem = await this.prisma.cartItem.create({
          data: {
            id: cartId,
            userId,
            foodId,
            quantity,
            totalPrice,
            additives: {
              connect: selectedAdditives.map(additive => ({ id: additive.id, title: additive.title, price: additive.price })),
            },
          },
        });
  
        return {
          id: cartId,
            userId,
            foodId,
            quantity,
            totalPrice,
            additives: {
              connect: selectedAdditives.map(additive => ({ id: additive.id, title: additive.title, price: additive.price })),
            },
          message: `Added food ${foodId} to cart with quantity ${quantity}.`,
          
        };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
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
  
  
      return { message: 'Đã xóa mặt hàng trong giỏ hàng thành công.' };
    } catch (error) {
      console.error('Error removing cart item:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Lấy thông tin giỏ hàng của người dùng
  async getCart(userId: string) {
    try {
      // Lấy tất cả các mục trong giỏ hàng của người dùng
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: {
          food: true, // Bao gồm thông tin món ăn liên quan
          additives: true, // Bao gồm thông tin thành phần thêm
        },
      });

      if (!cartItems || cartItems.length === 0) {
        throw new HttpException('Không tìm thấy mặt hàng nào trong giỏ hàng', HttpStatus.NOT_FOUND);
      }

      return cartItems;
    } catch (error) {
      console.error('Error fetching cart:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Lấy số lượng mục trong giỏ hàng
  async getCartCount(userId: string) {
    try {
      // Kiểm tra sự tồn tại của người dùng
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Đếm số lượng mục trong giỏ hàng của người dùng
      const cartItemCount = await this.prisma.cartItem.count({
        where: { userId },
      });

      return { count: cartItemCount };
    } catch (error) {
      console.error('Error fetching cart count:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  // Tăng số lượng môn ăn trong giỏ hàng
  async incrementCartItem(incrementCartItemDto: IncrementCartItemDto) {
    const { cartItemId, quantity } = incrementCartItemDto;
  
    try {
      // Tìm mục trong giỏ hàng và bao gồm thông tin món ăn và phụ gia
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          food: true, // Bao gồm thông tin món ăn
          additives: true, // Bao gồm thông tin phụ gia
        },
      });
  
      if (!cartItem) {
        throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);
      }
  
      // Tính toán số lượng mới
      const newQuantity = cartItem.quantity + quantity;
  
      // Tính toán giá phụ gia
      const additivesPrice = cartItem.additives?.reduce(
        (sum, additive) => sum + additive.price,
        0
      ) || 0; // Đảm bảo trả về 0 nếu không có phụ gia
  
      // Tính toán tổng giá mới
      const basePrice = cartItem.food.price + additivesPrice; // Giá cơ bản + giá phụ gia
      const newTotalPrice = basePrice * newQuantity;
  
      // Cập nhật số lượng và tổng giá trong giỏ hàng
      const updatedCartItem = await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity: newQuantity,
          totalPrice: newTotalPrice,
        },
      });
  
      return {
        message: `Increased quantity of cart item ${cartItemId} by ${quantity}. New quantity: ${updatedCartItem.quantity}, New total price: ${updatedCartItem.totalPrice}`,
      };
    } catch (error) {
      console.error('Error incrementing cart item:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async decrementCartItemQuantity(decrementCartItemQuantityDto: DecrementCartItemQuantityDto) {
    const { cartItemId, quantity } = decrementCartItemQuantityDto;
  
    try {
      // Tìm mục trong giỏ hàng
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          food: true, // Bao gồm thông tin món ăn
          additives: true, // Bao gồm thông tin phụ gia
        },
      });
  
      if (!cartItem) {
        throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);
      }
  
      // Kiểm tra quantity không vượt quá số lượng hiện tại
      if (quantity > cartItem.quantity) {
        throw new HttpException('Quantity to decrement exceeds current quantity', HttpStatus.BAD_REQUEST);
      }
  
      // Tính toán số lượng mới
      const newQuantity = cartItem.quantity - quantity;
  
      if (newQuantity <= 0) {
        // Xóa mục khỏi giỏ hàng nếu số lượng nhỏ hơn hoặc bằng 0
        await this.prisma.cartItem.delete({
          where: { id: cartItemId },
        });
        return { message: 'Cart item removed successfully.' };
      }
  
      // Tính toán tổng giá mới
      const basePrice = cartItem.food.price * newQuantity; // Giá cơ bản
      const additivesPrice = cartItem.additives?.reduce(
        (sum, additive) => sum + additive.price * newQuantity,
        0
      ) || 0; // Đảm bảo trả về 0 nếu additives rỗng
      const newTotalPrice = basePrice + additivesPrice;
  
      // Log chi tiết
      console.log('Current cart item:', cartItem);
      console.log('New quantity:', newQuantity);
      console.log('Base price:', basePrice);
      console.log('Additives price:', additivesPrice);
      console.log('New total price:', newTotalPrice);
  
      // Cập nhật số lượng và tổng giá
      const updatedCartItem = await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity: newQuantity,
          totalPrice: newTotalPrice,
        },
      });
  
      return {
        message: `Decremented ${quantity} units of cart item ${cartItemId}. New quantity: ${updatedCartItem.quantity}, New total price: ${updatedCartItem.totalPrice}`,
      };
    } catch (error) {
      console.error('Error decrementing cart item quantity:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId: string) {
    try {
      // Xóa tất cả các mục trong giỏ hàng của người dùng
      await this.prisma.cartItem.deleteMany({
        where: { userId },
      });
  
      return {
        message: 'Cart cleared successfully.',
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
  
      if (error instanceof HttpException) {
        throw error;
      }
  
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}