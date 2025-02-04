/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Food` DROP COLUMN `imageUrl`;

-- CreateTable
CREATE TABLE `FoodImage` (
    `id` VARCHAR(191) NOT NULL,
    `foodId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FoodImage` ADD CONSTRAINT `FoodImage_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
