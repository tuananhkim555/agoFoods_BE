/*
  Warnings:

  - You are about to drop the column `orderId` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `product` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `Rating` table. All the data in the column will be lost.
  - You are about to alter the column `ratingType` on the `Rating` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- DropForeignKey
ALTER TABLE `Rating` DROP FOREIGN KEY `Rating_orderId_fkey`;

-- DropIndex
DROP INDEX `Rating_orderId_key` ON `Rating`;

-- AlterTable
ALTER TABLE `Rating` DROP COLUMN `orderId`,
    DROP COLUMN `product`,
    DROP COLUMN `ratingCount`,
    MODIFY `ratingType` ENUM('Restaurant', 'Driver', 'Food') NOT NULL;
