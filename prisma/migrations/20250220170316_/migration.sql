/*
  Warnings:

  - You are about to alter the column `type` on the `Drink` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(11))` to `VarChar(191)`.
  - You are about to alter the column `type` on the `Food` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(12))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Drink` MODIFY `type` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Food` MODIFY `type` VARCHAR(191) NULL;
