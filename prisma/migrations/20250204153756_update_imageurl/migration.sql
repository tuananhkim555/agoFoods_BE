-- DropForeignKey
ALTER TABLE `Food` DROP FOREIGN KEY `Food_restaurantId_fkey`;

-- AddForeignKey
ALTER TABLE `Food` ADD CONSTRAINT `Food_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
