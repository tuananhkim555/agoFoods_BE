-- DropForeignKey
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_foodId_fkey`;

-- AlterTable
ALTER TABLE `CartItem` ADD COLUMN `drinkId` VARCHAR(191) NULL,
    MODIFY `foodId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CartItem_drinkId_idx` ON `CartItem`(`drinkId`);

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_drinkId_fkey` FOREIGN KEY (`drinkId`) REFERENCES `Drink`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CartItem` RENAME INDEX `CartItem_foodId_fkey` TO `CartItem_foodId_idx`;

-- RenameIndex
ALTER TABLE `CartItem` RENAME INDEX `CartItem_userId_fkey` TO `CartItem_userId_idx`;
