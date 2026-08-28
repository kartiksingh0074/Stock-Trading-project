-- AlterTable
ALTER TABLE `user` ADD COLUMN `tier` ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `stripeSessionId` VARCHAR(191) NOT NULL,
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'usd',
    `planId` VARCHAR(191) NOT NULL,
    `creditsGranted` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_stripeSessionId_key`(`stripeSessionId`),
    INDEX `Payment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
