/*
  Warnings:

  - You are about to drop the `FoodImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `FoodImage` DROP FOREIGN KEY `FoodImage_foodId_fkey`;

-- AlterTable
ALTER TABLE `Food` ADD COLUMN `imageUrl` JSON NOT NULL;

-- DropTable
DROP TABLE `FoodImage`;
