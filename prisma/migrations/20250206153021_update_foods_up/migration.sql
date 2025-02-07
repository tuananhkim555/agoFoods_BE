/*
  Warnings:

  - You are about to alter the column `title` on the `Food` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- DropIndex
DROP INDEX `Food_description_idx` ON `Food`;

-- DropIndex
DROP INDEX `Food_title_idx` ON `Food`;

-- AlterTable
ALTER TABLE `Food` MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `description` VARCHAR(191) NULL;
