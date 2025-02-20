/*
  Warnings:

  - You are about to drop the column `type` on the `Drink` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Drink` DROP COLUMN `type`;

-- AlterTable
ALTER TABLE `Food` DROP COLUMN `type`;
