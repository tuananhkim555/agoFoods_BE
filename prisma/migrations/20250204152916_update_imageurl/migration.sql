-- DropForeignKey
ALTER TABLE `Restaurant` DROP FOREIGN KEY `Restaurant_userId_fkey`;

-- CreateIndex
CREATE INDEX `Restaurant_userId_idx` ON `Restaurant`(`userId`);

-- AddForeignKey
ALTER TABLE `Restaurant` ADD CONSTRAINT `Restaurant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
