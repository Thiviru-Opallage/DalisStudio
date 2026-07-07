-- CreateTable
CREATE TABLE `hero_section` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `base_image` VARCHAR(500) NOT NULL,
    `hover_image` VARCHAR(500) NOT NULL,
    `title` VARCHAR(255) NOT NULL DEFAULT 'Dalis Studio',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quote_bracket_image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bracket_group` INTEGER NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `quote_bracket_image_bracket_group_sort_order_idx`(`bracket_group`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `signature_work` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `works_grid_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `width_class` VARCHAR(20) NOT NULL,
    `height_class` VARCHAR(20) NOT NULL,
    `top_class` VARCHAR(30) NOT NULL,
    `left_class` VARCHAR(30) NOT NULL,
    `z_index` INTEGER NOT NULL DEFAULT 10,
    `ambient_dark` VARCHAR(100) NOT NULL,
    `ambient_light` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_hero` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `base_image_dark` VARCHAR(500) NOT NULL,
    `hover_image_dark` VARCHAR(500) NOT NULL,
    `base_image_light` VARCHAR(500) NOT NULL,
    `hover_image_light` VARCHAR(500) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_quote_image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `position` VARCHAR(10) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `about_quote_image_position_key`(`position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `card_image_url` VARCHAR(500) NOT NULL,
    `showreel_url` VARCHAR(500) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
