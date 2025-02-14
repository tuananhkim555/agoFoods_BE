import { TargetType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export async function calculateAverageRating(
  id: string,
  ratingType: TargetType,
  prisma: PrismaService
) {
  let ratings;

  if (ratingType === TargetType.FOOD) {
    ratings = await prisma.rating.findMany({
      where: { foodId: id }, // Sử dụng trường foodId
    });
  } else if (ratingType === TargetType.RESTAURANT) {
    ratings = await prisma.rating.findMany({
      where: { restaurantId: id }, // Sử dụng trường restaurantId
    });
  } else if (ratingType === TargetType.SHIPPER) {
    ratings = await prisma.rating.findMany({
      where: { shipperId: id }, // Sử dụng trường shipperId
    });
  }

  if (ratings.length === 0) {
    return 0; // Trả về điểm 0 nếu không có đánh giá nào
  }

  const ratingCount = ratings.length;
  const averageRating =
    ratings.reduce((sum, rate) => sum + rate.rating, 0) / ratingCount;
  return averageRating;
}