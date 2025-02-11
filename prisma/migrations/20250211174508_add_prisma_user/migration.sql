/*
  Warnings:

  - You are about to drop the column `idCard` on the `Shipper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Shipper` DROP COLUMN `idCard`,
    ADD COLUMN `lastActiveAt` DATETIME(3) NULL,
    ADD COLUMN `rating` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalCancelledOrders` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalCompletedOrders` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `walletBalance` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `licensePlate` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ShipperReview` (
    `id` VARCHAR(191) NOT NULL,
    `shipperId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ShipperReview` ADD CONSTRAINT `ShipperReview_shipperId_fkey` FOREIGN KEY (`shipperId`) REFERENCES `Shipper`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
