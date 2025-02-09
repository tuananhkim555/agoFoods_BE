/*
  Warnings:

  - You are about to drop the `Additives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FoodImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FoodTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FoodType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Rating` DROP FOREIGN KEY `Rating_foodId_fkey`;

-- DropForeignKey
ALTER TABLE `Rating` DROP FOREIGN KEY `Rating_restaurantId_fkey`;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `driverId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Rating` ADD COLUMN `driverId` VARCHAR(191) NULL,
    MODIFY `restaurantId` VARCHAR(191) NULL,
    MODIFY `foodId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Additives`;

-- DropTable
DROP TABLE `FoodImage`;

-- DropTable
DROP TABLE `FoodTag`;

-- DropTable
DROP TABLE `FoodType`;

-- CreateTable
CREATE TABLE `Driver` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Rating_driverId_idx` ON `Rating`(`driverId`);

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
