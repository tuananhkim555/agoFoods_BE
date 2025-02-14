
export const generateRestaurantId = async (prisma: any): Promise<string> => {
    while (true) {
      // Generate random 5 digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const restaurantId = `RES_${randomNum}`;
  
      // Check if ID exists
      const existingFood = await prisma.food.findUnique({
        where: { id: restaurantId },
      });
  
      // Return if ID is unique
      if (!existingFood) {
        return restaurantId;
      }
    }
  };
  
  export const generateFoodId = async (prisma: any): Promise<string> => {
    while (true) {
      // Generate random 5 digit number for food
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const foodId = `FOOD_${randomNum}`;
  
      // Check if ID exists
      const existingFood = await prisma.food.findUnique({
        where: { id: foodId },
      });
  
      // Return if ID is unique
      if (!existingFood) {
        return foodId;
      }
    }
  };
  
  // fomart id food tag, type, additives
  export const generateId = async (prisma: any, prefix: string, table: string): Promise<string> => {
    while (true) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const id = `${prefix}_${randomNum}`;
  
      const existing = await prisma[table]?.findUnique({ where: { id } });
  
      if (!existing) {
        return id;
      }
    }
  };
  
  // Format id cho Rating
  export const generateRatingId = async (prisma: any): Promise<string> => {
      while (true) {
        // Tạo một số ngẫu nhiên 5 chữ số
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const ratingId = `R_${randomNum}`;
  
        // Kiểm tra xem ID đã tồn tại trong cơ sở dữ liệu chưa
        const existingRating = await prisma.rating.findUnique({
          where: { id: ratingId },
        });
  
        // Nếu chưa tồn tại thì trả về ID duy nhất
        if (!existingRating) {
          return ratingId;
        }
      }
    }
  
// Format id cho Cart
export const generateCartId = async (prisma: any): Promise<string> => {
  while (true) {
    // Tạo một số ngẫu nhiên 5 chữ số
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const cartId = `CART_${randomNum}`;

    // Kiểm tra xem ID đã tồn tại trong cơ sở dữ liệu chưa
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id: cartId },
    });

    // Nếu chưa tồn tại thì trả về ID duy nhất
    if (!existingCartItem) {
      return cartId;
    }
  }
};