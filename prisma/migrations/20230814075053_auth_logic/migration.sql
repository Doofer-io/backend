-- CreateTable
CREATE TABLE `User` (
    `user_uuid` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`user_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BasicAccount` (
    `basic_account_uuid` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `BasicAccount_user_uuid_key`(`user_uuid`),
    PRIMARY KEY (`basic_account_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OauthAccount` (
    `oauth_account_uuid` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(191) NOT NULL,
    `provider` ENUM('GOOGLE', 'MICROSOFT') NOT NULL,
    `access_token` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `OauthAccount_user_uuid_key`(`user_uuid`),
    UNIQUE INDEX `OauthAccount_access_token_key`(`access_token`),
    PRIMARY KEY (`oauth_account_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Individual` (
    `individual_uuid` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Individual_user_uuid_key`(`user_uuid`),
    PRIMARY KEY (`individual_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `company_uuid` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Company_user_uuid_key`(`user_uuid`),
    PRIMARY KEY (`company_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BasicAccount` ADD CONSTRAINT `BasicAccount_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `User`(`user_uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OauthAccount` ADD CONSTRAINT `OauthAccount_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `User`(`user_uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Individual` ADD CONSTRAINT `Individual_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `User`(`user_uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `User`(`user_uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;
