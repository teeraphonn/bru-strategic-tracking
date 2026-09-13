-- =================================================================================
-- Strategic Performance Tracking System - Complete Database Schema (14 Tables)
-- ระบบติดตามการดำเนินงานตามประเด็นยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์
-- 
-- Database Engine: MySQL 8.0+ / MariaDB 10.5+ (InnoDB)
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Total Tables: 14 Tables (ตาราง 3.6 ถึง ตาราง 3.19 ในเล่มบทที่ 3)
-- 
-- ลำดับการสร้างตารางตาม Foreign Key Dependencies (Order of Creation):
-- 1.  faculties                (ตาราง 3.6  : ข้อมูลคณะ)
-- 2.  departments              (ตาราง 3.7  : ข้อมูลภาควิชา/สาขาวิชา)
-- 3.  users                    (ตาราง 3.8  : ข้อมูลผู้ใช้งานและสิทธิ์ 4 ระดับ)
-- 4.  fiscal_years             (ตาราง 3.9  : ข้อมูลปีงบประมาณ)
-- 5.  budget_sources           (ตาราง 3.10 : ข้อมูลแหล่งงบประมาณ)
-- 6.  local_development_issues (ตาราง 3.11 : ประเด็นการพัฒนาท้องถิ่น LDI 1-4)
-- 7.  strategies               (ตาราง 3.12 : ประเด็นยุทธศาสตร์หลัก S 1-6)
-- 8.  sub_strategies           (ตาราง 3.13 : ประเด็นยุทธศาสตร์ย่อย SS 1.1-4.2)
-- 9.  indicators               (ตาราง 3.14 : ตัวชี้วัดความสำเร็จ/10 โครงการหลัก IND 1-10)
-- 10. projects                 (ตาราง 3.15 : โครงการยุทธศาสตร์ และข้อสั่งการ)
-- 11. project_users            (ตาราง 3.16 : อาจารย์ผู้ร่วมรับผิดชอบโครงการ - Many-to-Many)
-- 12. activities               (ตาราง 3.17 : แผนกิจกรรมย่อยและรายงานผลการดำเนินงาน)
-- 13. activity_images          (ตาราง 3.18 : ภาพถ่ายหลักฐานยืนยันการจัดกิจกรรม)
-- 14. issue_reports            (ตาราง 3.19 : รายงานปัญหาการใช้งานระบบ)
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `bru_strategic_tracking` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `bru_strategic_tracking`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `issue_reports`;
DROP TABLE IF EXISTS `activity_images`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `project_users`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `indicators`;
DROP TABLE IF EXISTS `sub_strategies`;
DROP TABLE IF EXISTS `strategies`;
DROP TABLE IF EXISTS `local_development_issues`;
DROP TABLE IF EXISTS `budget_sources`;
DROP TABLE IF EXISTS `fiscal_years`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `faculties`;
SET FOREIGN_KEY_CHECKS = 1;

-- =================================================================================
-- ตารางที่ 1: faculties (ตาราง 3.6 ข้อมูลคณะ)
-- =================================================================================
CREATE TABLE `faculties` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักคณะ (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อคณะ/หน่วยงานเทียบเท่าคณะ',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_faculties_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลคณะและส่วนราชการระดับคณะ';

-- =================================================================================
-- ตารางที่ 2: departments (ตาราง 3.7 ข้อมูลภาควิชา/สาขาวิชา)
-- =================================================================================
CREATE TABLE `departments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักภาควิชา/สาขาวิชา (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อภาควิชา/สาขาวิชา/กอง/สำนัก',
  `faculty_id` INT DEFAULT NULL COMMENT 'รหัสคณะต้นสังกัด (Foreign Key อ้างอิง faculties.id)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departments_name` (`name`),
  KEY `idx_departments_faculty_id` (`faculty_id`),
  CONSTRAINT `fk_departments_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลภาควิชาและหน่วยงานย่อยภายในคณะ';

-- =================================================================================
-- ตารางที่ 3: users (ตาราง 3.8 ข้อมูลผู้ใช้งานและบทบาทสิทธิ์ 4 ระดับ)
-- =================================================================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักผู้ใช้งาน (Primary Key)',
  `username` VARCHAR(191) NOT NULL COMMENT 'ชื่อบัญชีเข้าสู่ระบบ (Username)',
  `password` VARCHAR(191) NOT NULL COMMENT 'รหัสผ่านแฮชด้วย bcrypt',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อ-นามสกุลจริงของผู้ใช้งาน',
  `role` ENUM('ADMIN','TEACHER','DEAN','PRESIDENT') NOT NULL COMMENT 'สิทธิ์การใช้งาน (ADMIN, TEACHER, DEAN, PRESIDENT)',
  `department_id` INT DEFAULT NULL COMMENT 'รหัสสาขาวิชาที่สังกัด (Foreign Key อ้างอิง departments.id)',
  `avatar` LONGTEXT DEFAULT NULL COMMENT 'รูปภาพโปรไฟล์ผู้ใช้งาน (Base64 หรือ URL)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่สร้างบัญชี',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_department_id` (`department_id`),
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางบัญชีผู้ใช้งานระบบและบทบาทสิทธิ์';

-- =================================================================================
-- ตารางที่ 4: fiscal_years (ตาราง 3.9 ข้อมูลปีงบประมาณ)
-- =================================================================================
CREATE TABLE `fiscal_years` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักปีงบประมาณ (Primary Key)',
  `year` INT NOT NULL COMMENT 'ปีงบประมาณ พ.ศ. (เช่น 2568, 2569)',
  `active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'สถานะปีงบประมาณปัจจุบัน (1=ปีปัจจุบัน, 0=ปีอื่น)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fiscal_years_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บรอบปีงบประมาณ';

-- =================================================================================
-- ตารางที่ 5: budget_sources (ตาราง 3.10 ข้อมูลแหล่งงบประมาณ)
-- =================================================================================
CREATE TABLE `budget_sources` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักแหล่งงบประมาณ (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อแหล่งเงินงบประมาณ (เช่น งบแผ่นดิน, งบรายได้มหาวิทยาลัย)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_budget_sources_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บประเภทแหล่งเงินงบประมาณ';

-- =================================================================================
-- ตารางที่ 6: local_development_issues (ตาราง 3.11 ประเด็นการพัฒนาท้องถิ่น LDI 1-4)
-- =================================================================================
CREATE TABLE `local_development_issues` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักประเด็นพัฒนาท้องถิ่น (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อประเด็นการพัฒนาท้องถิ่น',
  `code` VARCHAR(191) NOT NULL COMMENT 'รหัสประเด็นการพัฒนา (เช่น LDI 1, LDI 2)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_local_issues_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเด็นการพัฒนาท้องถิ่น (Local Development Issues)';

-- =================================================================================
-- ตารางที่ 7: strategies (ตาราง 3.12 ประเด็นยุทธศาสตร์หลัก S 1-6)
-- =================================================================================
CREATE TABLE `strategies` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักประเด็นยุทธศาสตร์ (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อประเด็นยุทธศาสตร์หลัก',
  `code` VARCHAR(191) NOT NULL COMMENT 'รหัสยุทธศาสตร์ (เช่น S 1, S 2)',
  `local_issue_id` INT DEFAULT NULL COMMENT 'รหัสประเด็นพัฒนาท้องถิ่น (Foreign Key อ้างอิง local_development_issues.id)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_strategies_code` (`code`),
  KEY `idx_strategies_local_issue_id` (`local_issue_id`),
  CONSTRAINT `fk_strategies_local_issue` FOREIGN KEY (`local_issue_id`) REFERENCES `local_development_issues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเด็นยุทธศาสตร์หลักการพัฒนามหาวิทยาลัย';

-- =================================================================================
-- ตารางที่ 8: sub_strategies (ตาราง 3.13 ประเด็นยุทธศาสตร์ย่อย SS 1.1-4.2)
-- =================================================================================
CREATE TABLE `sub_strategies` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักยุทธศาสตร์ย่อย (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อแนวทางการพัฒนา/ยุทธศาสตร์ย่อย',
  `code` VARCHAR(191) NOT NULL COMMENT 'รหัสยุทธศาสตร์ย่อย (เช่น SS 1.1, SS 1.2)',
  `strategy_id` INT NOT NULL COMMENT 'รหัสยุทธศาสตร์หลักต้นสังกัด (Foreign Key อ้างอิง strategies.id)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sub_strategies_code` (`code`),
  KEY `idx_sub_strategies_strategy_id` (`strategy_id`),
  CONSTRAINT `fk_sub_strategies_strategy` FOREIGN KEY (`strategy_id`) REFERENCES `strategies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเด็นยุทธศาสตร์ย่อยภายใต้ยุทธศาสตร์หลัก';

-- =================================================================================
-- ตารางที่ 9: indicators (ตาราง 3.14 ตัวชี้วัดความสำเร็จ / 10 โครงการหลัก IND 1-10)
-- =================================================================================
CREATE TABLE `indicators` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักตัวชี้วัด (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อรายละเอียดตัวชี้วัดความสำเร็จ / 10 โครงการหลัก',
  `code` VARCHAR(191) NOT NULL COMMENT 'รหัสตัวชี้วัด (เช่น IND 1.1, MP 1.1)',
  `sub_strategy_id` INT NOT NULL COMMENT 'รหัสยุทธศาสตร์ย่อย (Foreign Key อ้างอิง sub_strategies.id)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_indicators_code` (`code`),
  KEY `idx_indicators_sub_strategy_id` (`sub_strategy_id`),
  CONSTRAINT `fk_indicators_sub_strategy` FOREIGN KEY (`sub_strategy_id`) REFERENCES `sub_strategies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตัวชี้วัดความสำเร็จของยุทธศาสตร์และโครงการหลัก';

-- =================================================================================
-- ตารางที่ 10: projects (ตาราง 3.15 โครงการยุทธศาสตร์ และระบบข้อสั่งการ)
-- =================================================================================
CREATE TABLE `projects` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักโครงการ (Primary Key)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อโครงการยุทธศาสตร์',
  `description` TEXT DEFAULT NULL COMMENT 'หลักการและเหตุผล / วัตถุประสงค์โครงการ',
  `fiscal_year_id` INT NOT NULL COMMENT 'รหัสปีงบประมาณ (Foreign Key อ้างอิง fiscal_years.id)',
  `budget_source_id` INT NOT NULL COMMENT 'รหัสแหล่งเงินงบประมาณ (Foreign Key อ้างอิง budget_sources.id)',
  `sub_strategy_id` INT NOT NULL COMMENT 'รหัสยุทธศาสตร์ย่อย (Foreign Key อ้างอิง sub_strategies.id)',
  `indicator_id` INT DEFAULT NULL COMMENT 'รหัสตัวชี้วัดความสำเร็จ (Foreign Key อ้างอิง indicators.id)',
  `total_budget` DECIMAL(12,2) NOT NULL COMMENT 'งบประมาณจัดสรรรวมที่ได้รับอนุมัติ (บาท)',
  `target_count` INT NOT NULL COMMENT 'เป้าหมายความสำเร็จเชิงปริมาณ (ตามแผน)',
  `unit` VARCHAR(191) NOT NULL COMMENT 'หน่วยนับเป้าหมาย เช่น คน, ครั้ง, แห่ง, ชุมชน',
  `start_date` DATETIME(3) NOT NULL COMMENT 'วันที่เริ่มต้นโครงการตามแผนงาน',
  `end_date` DATETIME(3) NOT NULL COMMENT 'วันที่สิ้นสุดโครงการตามแผนงาน',
  `completed_count` INT NOT NULL DEFAULT 0 COMMENT 'ผลงานเชิงปริมาณสะสมที่ทำได้จริง',
  `remaining_count` INT NOT NULL DEFAULT 0 COMMENT 'ผลงานเชิงปริมาณคงเหลือที่ต้องดำเนินการ',
  `progress` DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'ร้อยละความก้าวหน้าสะสม ((completed_count / target_count) * 100)',
  `creator_id` INT NOT NULL COMMENT 'รหัสอาจารย์ผู้เสนอ/หัวหน้าโครงการ (Foreign Key อ้างอิง users.id)',
  `department_id` INT DEFAULT NULL COMMENT 'รหัสสาขาวิชาที่จัดตั้งโครงการ (Foreign Key อ้างอิง departments.id)',
  `faculty_id` INT DEFAULT NULL COMMENT 'รหัสคณะต้นสังกัดโครงการ (Foreign Key อ้างอิง faculties.id)',
  `executive_directive` TEXT DEFAULT NULL COMMENT 'ข้อสั่งการจากผู้บริหารระดับสูง',
  `directive_updated_at` DATETIME(3) DEFAULT NULL COMMENT 'วันเวลาที่ออกข้อสั่งการล่าสุด',
  `directive_issuer_name` VARCHAR(191) DEFAULT NULL COMMENT 'ชื่อผู้บริหารผู้ออกข้อสั่งการ',
  `directive_issuer_role` VARCHAR(191) DEFAULT NULL COMMENT 'ตำแหน่งผู้บริหารผู้ออกข้อสั่งการ',
  `dean_directive` TEXT DEFAULT NULL COMMENT 'ข้อสั่งการกำกับระดับคณะ (คณบดี)',
  `dean_directive_updated_at` DATETIME(3) DEFAULT NULL COMMENT 'วันเวลาที่คณบดีออกข้อสั่งการ',
  `dean_directive_issuer_name` VARCHAR(191) DEFAULT NULL COMMENT 'ชื่อคณบดีผู้ออกข้อสั่งการ',
  `president_directive` TEXT DEFAULT NULL COMMENT 'ข้อสั่งการกำกับระดับมหาวิทยาลัย (อธิการบดี)',
  `president_directive_updated_at` DATETIME(3) DEFAULT NULL COMMENT 'วันเวลาที่อธิการบดีออกข้อสั่งการ',
  `president_directive_issuer_name` VARCHAR(191) DEFAULT NULL COMMENT 'ชื่ออธิการบดีผู้ออกข้อสั่งการ',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'สถานะล็อกแผนงานโครงการหลังอนุมัติ (1=ล็อกห้ามแก้ไขแผน, 0=ปลดล็อก)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่สร้างโครงการ',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่ปรับปรุงข้อมูลล่าสุด',
  PRIMARY KEY (`id`),
  KEY `idx_projects_fiscal_year_id` (`fiscal_year_id`),
  KEY `idx_projects_budget_source_id` (`budget_source_id`),
  KEY `idx_projects_sub_strategy_id` (`sub_strategy_id`),
  KEY `idx_projects_indicator_id` (`indicator_id`),
  KEY `idx_projects_creator_id` (`creator_id`),
  KEY `idx_projects_department_id` (`department_id`),
  KEY `idx_projects_faculty_id` (`faculty_id`),
  CONSTRAINT `fk_projects_fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_budget_source` FOREIGN KEY (`budget_source_id`) REFERENCES `budget_sources` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_sub_strategy` FOREIGN KEY (`sub_strategy_id`) REFERENCES `sub_strategies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `indicators` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลโครงการยุทธศาสตร์ แผนงาน และข้อสั่งการผู้บริหาร';

-- =================================================================================
-- ตารางที่ 11: project_users (ตาราง 3.16 อาจารย์ผู้ร่วมรับผิดชอบโครงการ - Many to Many)
-- =================================================================================
CREATE TABLE `project_users` (
  `project_id` INT NOT NULL COMMENT 'รหัสโครงการ (Foreign Key อ้างอิง projects.id)',
  `user_id` INT NOT NULL COMMENT 'รหัสอาจารย์ผู้ร่วมรับผิดชอบ (Foreign Key อ้างอิง users.id)',
  `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่มอบหมายรับผิดชอบ',
  PRIMARY KEY (`project_id`, `user_id`),
  KEY `idx_project_users_user_id` (`user_id`),
  CONSTRAINT `fk_project_users_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางอาจารย์และเจ้าหน้าที่ผู้ร่วมรับผิดชอบโครงการ (Many-to-Many)';

-- =================================================================================
-- ตารางที่ 12: activities (ตาราง 3.17 แผนกิจกรรมย่อยและรายงานผลการดำเนินงาน)
-- =================================================================================
CREATE TABLE `activities` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักกิจกรรมย่อย (Primary Key)',
  `project_id` INT NOT NULL COMMENT 'รหัสโครงการหลัก (Foreign Key อ้างอิง projects.id)',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อแผนงานกิจกรรมย่อย',
  `description` TEXT DEFAULT NULL COMMENT 'รายละเอียดการดำเนินกิจกรรม',
  `activity_date` DATETIME(3) NOT NULL COMMENT 'กำหนดการวันที่จัดกิจกรรมตามแผนงาน',
  `budget` DECIMAL(12,2) NOT NULL COMMENT 'งบประมาณตามแผนที่จัดสรรให้กิจกรรมนี้ (บาท)',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'สถานะล็อกรายละเอียดแผนหลังอนุมัติ (1=ล็อกห้ามแก้, 0=ปลดล็อก)',
  `actual_budget` DECIMAL(12,2) DEFAULT NULL COMMENT 'งบประมาณเบิกจ่ายใช้จริงหลังดำเนินกิจกรรม (บาท)',
  `success` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'สถานะประเมินผลสำเร็จ (1=สำเร็จบรรลุเป้า, 0=ยังไม่เสร็จ/ไม่สำเร็จ)',
  `completed_count` INT NOT NULL DEFAULT 0 COMMENT 'ผลงานเชิงปริมาณที่ทำได้จริงของกิจกรรมนี้ เช่น จำนวนคนเข้าอบรม',
  `remark` TEXT DEFAULT NULL COMMENT 'หมายเหตุ / ปัญหาอุปสรรคและแนวทางแก้ไข',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่บันทึกกิจกรรม',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่รายงานผล/แก้ไขล่าสุด',
  PRIMARY KEY (`id`),
  KEY `idx_activities_project_id` (`project_id`),
  CONSTRAINT `fk_activities_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางแผนกิจกรรมย่อยและการรายงานผลการเบิกจ่ายและผลผลิต';

-- =================================================================================
-- ตารางที่ 13: activity_images (ตาราง 3.18 ภาพถ่ายหลักฐานยืนยันการจัดกิจกรรม)
-- =================================================================================
CREATE TABLE `activity_images` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักรูปภาพ (Primary Key)',
  `activity_id` INT NOT NULL COMMENT 'รหัสกิจกรรมย่อยที่แนบภาพ (Foreign Key อ้างอิง activities.id)',
  `file_path` TEXT NOT NULL COMMENT 'พาธจัดเก็บไฟล์รูปภาพหลักฐานหรือ URL รูปภาพ',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่อัปโหลดรูปภาพ',
  PRIMARY KEY (`id`),
  KEY `idx_activity_images_activity_id` (`activity_id`),
  CONSTRAINT `fk_activity_images_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางภาพถ่ายหลักฐานประกอบการรายงานผลกิจกรรม';

-- =================================================================================
-- ตารางที่ 14: issue_reports (ตาราง 3.19 รายงานปัญหาการใช้งานระบบ)
-- =================================================================================
CREATE TABLE `issue_reports` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'รหัสไอดีหลักรายงานปัญหา (Primary Key)',
  `title` VARCHAR(191) NOT NULL COMMENT 'หัวข้อปัญหาที่พบในการใช้งาน',
  `description` TEXT NOT NULL COMMENT 'รายละเอียดของปัญหาหรือข้อผิดพลาด',
  `category` VARCHAR(191) DEFAULT NULL COMMENT 'หมวดหมู่ปัญหา เช่น ระบบ, สิทธิ์, ข้อมูล, อื่นๆ',
  `priority` ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM' COMMENT 'ระดับความเร่งด่วน (LOW, MEDIUM, HIGH, URGENT)',
  `status` ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะการแก้ไข (PENDING, IN_PROGRESS, RESOLVED, REJECTED)',
  `admin_note` TEXT DEFAULT NULL COMMENT 'บันทึกการแก้ไขหรือข้อความตอบกลับจากผู้ดูแลระบบ',
  `user_id` INT NOT NULL COMMENT 'รหัสผู้ใช้งานที่แจ้งปัญหา (Foreign Key อ้างอิง users.id)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แจ้งปัญหา',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'วันเวลาที่แก้ไขสถานะล่าสุด',
  PRIMARY KEY (`id`),
  KEY `idx_issue_reports_user_id` (`user_id`),
  CONSTRAINT `fk_issue_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรับแจ้งและติดตามปัญหาการใช้งานระบบ (Issue Reporting)';
