/*
  Warnings:

  - You are about to drop the column `avatar` on the `Restaurant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Restaurant` DROP COLUMN `avatar`;

-- AlterTable
ALTER TABLE `Shipper` ADD COLUMN `idCardImage` VARCHAR(191) NULL,
    ADD COLUMN `licenseImage` VARCHAR(191) NULL;
