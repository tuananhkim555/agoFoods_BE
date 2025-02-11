/*
  Warnings:

  - Added the required column `idCard` to the `Shipper` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Shipper` ADD COLUMN `idCard` VARCHAR(191) NOT NULL;
