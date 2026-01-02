-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CanEditTempUserId` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tempUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TempUser` (
    `id` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `birthdate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Action` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `tempUserId` VARCHAR(191) NULL,
    `actionTypeId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `notiActionId` VARCHAR(191) NULL,
    `actionStatusId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InviteUser` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `tempUserId` VARCHAR(191) NULL,
    `actionId` VARCHAR(191) NOT NULL,
    `inviteStatusId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotiAction` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Config` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `configTypeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Config_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConfigType` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConfigType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleRepeatType` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ScheduleRepeatType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleRepeat` (
    `id` VARCHAR(191) NOT NULL,
    `actionId` VARCHAR(191) NOT NULL,
    `scheduleRepeatTypeId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NULL,
    `date` VARCHAR(191) NULL,
    `day` VARCHAR(191) NULL,
    `timeStart` VARCHAR(191) NULL,
    `timeEnd` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ScheduleRepeat_actionId_key`(`actionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionStatus` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ActionStatus_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InviteStatus` (
    `id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InviteStatus_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachfile` (
    `id` VARCHAR(191) NOT NULL,
    `actionId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CanEditTempUserId` ADD CONSTRAINT `CanEditTempUserId_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CanEditTempUserId` ADD CONSTRAINT `CanEditTempUserId_tempUserId_fkey` FOREIGN KEY (`tempUserId`) REFERENCES `TempUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_tempUserId_fkey` FOREIGN KEY (`tempUserId`) REFERENCES `TempUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_actionTypeId_fkey` FOREIGN KEY (`actionTypeId`) REFERENCES `Config`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Config`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_notiActionId_fkey` FOREIGN KEY (`notiActionId`) REFERENCES `NotiAction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_actionStatusId_fkey` FOREIGN KEY (`actionStatusId`) REFERENCES `ActionStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteUser` ADD CONSTRAINT `InviteUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteUser` ADD CONSTRAINT `InviteUser_tempUserId_fkey` FOREIGN KEY (`tempUserId`) REFERENCES `TempUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteUser` ADD CONSTRAINT `InviteUser_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteUser` ADD CONSTRAINT `InviteUser_inviteStatusId_fkey` FOREIGN KEY (`inviteStatusId`) REFERENCES `InviteStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Config` ADD CONSTRAINT `Config_configTypeId_fkey` FOREIGN KEY (`configTypeId`) REFERENCES `ConfigType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleRepeat` ADD CONSTRAINT `ScheduleRepeat_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleRepeat` ADD CONSTRAINT `ScheduleRepeat_scheduleRepeatTypeId_fkey` FOREIGN KEY (`scheduleRepeatTypeId`) REFERENCES `ScheduleRepeatType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachfile` ADD CONSTRAINT `Attachfile_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
