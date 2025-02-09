/*
  Warnings:

  - Added the required column `ratingType` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Rating` ADD COLUMN `product` VARCHAR(191) NULL,
    ADD COLUMN `ratingType` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
