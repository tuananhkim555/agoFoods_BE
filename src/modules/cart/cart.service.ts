import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AddToCartDto,  DecrementCartItemQuantityDto, 
  IncrementCartItemDto, 
  RemoveCartItemDto } from './dto/cart.dto';
import { generateCartId } from 'src/common/utils/format-id';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Thêm mục vào giỏ hàng
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { foodId, drinkId, quantity, additiveIds } = addToCartDto;
  
    try {
      // Kiểm tra dữ liệu hợp lệ
      if (!foodId && !drinkId) {
        throw new HttpException('FoodId hoặc DrinkId là bắt buộc', HttpStatus.BAD_REQUEST);
      }
      if (foodId && drinkId) {
        throw new HttpException('Chỉ được thêm một loại sản phẩm (Food hoặc Drink)', HttpStatus.BAD_REQUEST);
      }
  
      let item: { 
        id: string; 
        price: number; 
        additives: { id: string; price: number; title: string }[] 
      } | null = null;
      
      if (foodId) {
        item = await this.prisma.food.findUnique({
          where: { id: foodId },
          include: { additives: true },
        });
      } else if (drinkId) {
        item = await this.prisma.drink.findUnique({
          where: { id: drinkId },
          include: { additives: true },
        });
      }
  
      if (!item) {
        throw new HttpException(`${foodId ? 'Food' : 'Drink'} not found`, HttpStatus.NOT_FOUND);
      }
  
      // Kiểm tra phụ gia (nếu có)
      let selectedAdditives: { id: string; createdAt: Date; updatedAt: Date; title: string; price: number; }[] = [];
      if (additiveIds && additiveIds.length > 0) {
        selectedAdditives = await this.prisma.additives.findMany({
          where: { id: { in: additiveIds } },
        });
  
        if (selectedAdditives.length !== additiveIds.length) {
          throw new HttpException('One or more additives not found', HttpStatus.NOT_FOUND);
        }
      }
  
      // Tính giá tiền
      const basePrice = item.price * quantity;
      const additivesPrice = selectedAdditives.reduce((sum, additive) => sum + additive.price * quantity, 0);
      const totalPrice = basePrice + additivesPrice;
  
      // Kiểm tra xem đã có sản phẩm này trong giỏ hàng chưa
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          userId,
          foodId: foodId || undefined,
          drinkId: drinkId || undefined,
          additives: {
            every: {
              id: { in: additiveIds || [] },
            },
          },
        },
      });
  
      if (existingCartItem) {
        // Nếu đã có, cập nhật số lượng
        const updatedCartItem = await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: { increment: quantity },
            totalPrice: { increment: totalPrice },
          },
        });
  
        return {
          message: `Increased quantity of ${foodId ? 'food' : 'drink'} ${foodId || drinkId} by ${quantity}. New quantity: ${updatedCartItem.quantity}`,
        };
      } else {
        // Nếu chưa có, thêm mới
        const cartId = await generateCartId(this.prisma);
  
        const newCartItem = await this.prisma.cartItem.create({
          data: {
            id: cartId,
            userId,
            foodId: foodId || null,
            drinkId: drinkId || null,
            quantity,
            totalPrice,
            additives: {
              connect: selectedAdditives.map(additive => ({ id: additive.id })),
            },
          },
        });
  
        return {
          id: cartId,
          userId,
          foodId,
          drinkId,
          quantity,
          totalPrice,
          additives: selectedAdditives.map(additive => ({ id: additive.id, title: additive.title, price: additive.price })),
          message: `Added ${foodId ? 'food' : 'drink'} ${foodId || drinkId} to cart with quantity ${quantity}.`,
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
  if (!userId) {
    throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST
    );
  }
  try {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        food: true, // Bao gồm thông tin món ăn
        drink: true, // Bao gồm thông tin đồ uống
        additives: true, // Bao gồm thông tin thành phần thêm
      },
    });

    return { items: cartItems };
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw new HttpException('Lỗi hệ thống', HttpStatus.INTERNAL_SERVER_ERROR);
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
      console.warn(`⚠️ User ID ${userId} not found.`);
      throw new HttpException('Người dùng không tồn tại', HttpStatus.NOT_FOUND);
    }

    // Đếm số lượng mục trong giỏ hàng của người dùng
    const cartItemCount = await this.prisma.cartItem.count({
      where: { userId },
    });

    // Nếu giỏ hàng trống, trả về 204 (No Content)
    if (cartItemCount === 0) {
      console.info(`ℹ️ User ID ${userId} has an empty cart.`);
      throw new HttpException('Giỏ hàng trống', HttpStatus.NO_CONTENT);
    }

    return { count: cartItemCount };
  } catch (error) {
    console.error(`❌ Error fetching cart count for user ID ${userId}:`, error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException('Lỗi hệ thống, vui lòng thử lại sau', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


 // Tăng số lượng món ăn hoặc đồ uống trong giỏ hàng
async incrementCartItem(incrementCartItemDto: IncrementCartItemDto) {
  const { cartItemId, quantity } = incrementCartItemDto;

  try {
    // Kiểm tra input hợp lệ
    if (quantity <= 0) {
      throw new HttpException(
        'Số lượng phải lớn hơn 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tìm mục trong giỏ hàng và lấy thông tin liên quan
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        food: true, // Bao gồm thông tin món ăn
        additives: true, // Bao gồm thông tin phụ gia
      },
    });

    if (!cartItem) {
      console.warn(`⚠️ Cart item ID ${cartItemId} not found.`);
      throw new HttpException(
        'Không tìm thấy mục trong giỏ hàng',
        HttpStatus.NOT_FOUND,
      );
    }

    // Tính toán số lượng mới
    const newQuantity = cartItem.quantity + quantity;

    // Giới hạn số lượng tối đa (ví dụ: 100)
    if (newQuantity > 100) {
      throw new HttpException(
        'Số lượng không được vượt quá 100',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tính toán giá phụ gia (nếu có)
    const additivesPrice =
      cartItem.additives?.reduce((sum, additive) => sum + additive.price, 0) || 0;

    // Tính toán tổng giá mới
    const basePrice = (cartItem.food?.price || 0) + additivesPrice;
    const newTotalPrice = basePrice * newQuantity;

    // Cập nhật số lượng và tổng giá trong giỏ hàng
    const updatedCartItem = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: newQuantity,
        totalPrice: newTotalPrice,
      },
    });

    console.info(
      `✅ Cart item ${cartItemId} updated: New quantity = ${updatedCartItem.quantity}, New total price = ${updatedCartItem.totalPrice}`,
    );

    return {
      message: `Tăng số lượng mục ${cartItemId} thêm ${quantity}. Số lượng mới: ${updatedCartItem.quantity}, Tổng giá mới: ${updatedCartItem.totalPrice}`,
    };
  } catch (error) {
    console.error(`❌ Error incrementing cart item ${cartItemId}:`, error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'Lỗi hệ thống, vui lòng thử lại sau',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}


// Giảm số lượng món ăn hoặc đồ uống trong giỏ hàng
async decrementCartItemQuantity(
  decrementCartItemQuantityDto: DecrementCartItemQuantityDto,
) {
  const { cartItemId, quantity } = decrementCartItemQuantityDto;

  try {
    // Kiểm tra input hợp lệ
    if (quantity <= 0) {
      throw new HttpException(
        'Số lượng giảm phải lớn hơn 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tìm mục trong giỏ hàng
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        food: true, // Bao gồm thông tin món ăn
        additives: true, // Bao gồm thông tin phụ gia
      },
    });

    if (!cartItem) {
      console.warn(`⚠️ Cart item ID ${cartItemId} not found.`);
      throw new HttpException(
        'Không tìm thấy mục trong giỏ hàng',
        HttpStatus.NOT_FOUND,
      );
    }

    // Kiểm tra nếu quantity cần giảm lớn hơn số lượng hiện tại
    if (quantity > cartItem.quantity) {
      throw new HttpException(
        `Không thể giảm ${quantity} vì chỉ có ${cartItem.quantity} trong giỏ hàng`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tính toán số lượng mới
    const newQuantity = cartItem.quantity - quantity;

    // Nếu số lượng mới <= 0, xóa mục khỏi giỏ hàng
    if (newQuantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: cartItemId } });
      console.info(`🗑️ Removed cart item ${cartItemId} as quantity reached 0.`);
      return { message: `Đã xóa mục ${cartItemId} khỏi giỏ hàng.` };
    }

    // Tính toán tổng giá mới
    const basePrice = (cartItem.food?.price || 0) * newQuantity;
    const additivesPrice =
      cartItem.additives?.reduce(
        (sum, additive) => sum + additive.price * newQuantity,
        0,
      ) || 0;
    const newTotalPrice = basePrice + additivesPrice;

    // Cập nhật số lượng và tổng giá
    const updatedCartItem = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: newQuantity,
        totalPrice: newTotalPrice,
      },
    });

    console.info(
      `✅ Updated cart item ${cartItemId}: New quantity = ${updatedCartItem.quantity}, New total price = ${updatedCartItem.totalPrice}`,
    );

    return {
      message: `Giảm ${quantity} mục ${cartItemId}. Số lượng mới: ${updatedCartItem.quantity}, Tổng giá mới: ${updatedCartItem.totalPrice}`,
    };
  } catch (error) {
    console.error(`❌ Lỗi khi giảm số lượng mục ${cartItemId}:`, error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'Lỗi hệ thống, vui lòng thử lại sau',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
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