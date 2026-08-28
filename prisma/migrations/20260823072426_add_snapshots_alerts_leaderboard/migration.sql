-- AlterTable
ALTER TABLE `user` ADD COLUMN `last_net_worth` DECIMAL(12, 2) NOT NULL DEFAULT 10000.00;

-- CreateTable
CREATE TABLE `PortfolioSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cashBalance` DECIMAL(12, 2) NOT NULL,
    `investedValue` DECIMAL(12, 2) NOT NULL,
    `netWorth` DECIMAL(12, 2) NOT NULL,
    `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortfolioSnapshot_userId_capturedAt_idx`(`userId`, `capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceAlert` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `alertName` VARCHAR(191) NOT NULL,
    `alertType` ENUM('UPPER', 'LOWER') NOT NULL,
    `threshold` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'TRIGGERED') NOT NULL DEFAULT 'ACTIVE',
    `triggeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PriceAlert_userId_idx`(`userId`),
    INDEX `PriceAlert_status_symbol_idx`(`status`, `symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PortfolioSnapshot` ADD CONSTRAINT `PortfolioSnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceAlert` ADD CONSTRAINT `PriceAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
