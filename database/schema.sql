-- =================================================================================
-- DDL for Strategic Performance Tracking System 
-- (ระบบ DDL สำหรับระบบติดตามการดำเนินงานตามประเด็นยุทธศาสตร์ มรภ.บุรีรัมย์)
-- Database Engine: MySQL / MariaDB (InnoDB)
-- Database Name: bru_strategic_tracking
-- 
-- คำอธิบายโครงสร้างและความสัมพันธ์ (Database Schema Overview):
-- 1. faculties (คณะ) -> เก็บชื่อคณะของมหาวิทยาลัย
-- 2. departments (ภาควิชา/หน่วยงาน) -> เก็บสาขาวิชา/งาน โดยเชื่อมแบบ 1-to-Many กับ faculties (faculty_id)
-- 3. users (ผู้ใช้ระบบ) -> เก็บข้อมูลบุคลากร, แบ่งสิทธิ์ตาม ENUM ('ADMIN', 'TEACHER', 'DEAN', 'PRESIDENT')
--    และเชื่อมสังกัดภาควิชาผ่าน department_id (รองรับค่า NULL สำหรับผู้บริหาร/ส่วนกลาง)
-- 4. fiscal_years (ปีงบประมาณ) -> เก็บรอบปีงบประมาณและทำเครื่องหมายปีปัจจุบัน (active)
-- 5. budget_sources (แหล่งเงินทุน) -> แหล่งงบประมาณโครงการ เช่น งบแผ่นดิน งบรายได้
-- 6. strategies -> sub_strategies -> indicators -> ยุทธศาสตร์หลัก, ยุทธศาสตร์ย่อย และตัวชี้วัดตามลำดับ (เชื่อมโยงแบบลำดับขั้น Cascading)
-- 7. projects (โครงการยุทธศาสตร์) -> ข้อมูลโครงการหลัก ผูกกับ ปีงบประมาณ, แหล่งงบ, ยุทธศาสตร์ย่อย, ตัวชี้วัด, คณะ, และภาควิชา
-- 8. project_users (ผู้รับผิดชอบร่วม) -> ตารางเชื่อมโยงแบบ Many-to-Many ระหว่างโครงการกับผู้ใช้งานที่ได้รับมอบหมาย
-- 9. activities (กิจกรรมย่อย) -> กิจกรรมย่อยภายใต้โครงการหลัก สำหรับรายงานผลการจัดและงบประมาณที่เบิกจ่ายจริง
-- 10. activity_images (รูปภาพผลงาน) -> เก็บไฟล์ภาพยืนยันการจัดกิจกรรม เชื่อม 1-to-Many กับตารางกิจกรรมย่อย
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `bru_strategic_tracking` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bru_strategic_tracking`;

-- ---------------------------------------------------------
-- 1. Table faculties (ตารางคณะ)
-- ---------------------------------------------------------
CREATE TABLE `faculties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักคณะ (Auto Increment)',
  `name` VARCHAR(191) UNIQUE NOT NULL COMMENT 'ชื่อคณะ/ส่วนราชการระดับคณะ',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่เพิ่มข้อมูล',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่แก้ไขข้อมูลล่าสุด'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลคณะและส่วนกลาง';

-- ---------------------------------------------------------
-- 2. Table departments (ตารางภาควิชา/หน่วยงานย่อย)
-- ---------------------------------------------------------
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักหน่วยงานย่อย',
  `name` VARCHAR(191) UNIQUE NOT NULL COMMENT 'ชื่อภาควิชา/สาขาวิชา/กอง/สำนัก',
  `faculty_id` INT DEFAULT NULL COMMENT 'รหัสเชื่อมโยงคณะต้นสังกัด (NULL = หน่วยงานอิสระส่วนกลาง)',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่สร้างข้อมูล',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่ปรับปรุงล่าสุด',
  CONSTRAINT `fk_departments_faculties` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลภาควิชาและหน่วยงานย่อยภายในคณะ';

-- ---------------------------------------------------------
-- 3. Table users (ตารางบัญชีผู้ใช้งานระบบ)
-- ---------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักของบัญชีผู้ใช้งาน',
  `username` VARCHAR(191) UNIQUE NOT NULL COMMENT 'ชื่อเข้าใช้งานระบบ (บัญชีผู้ใช้)',
  `password` VARCHAR(191) NOT NULL COMMENT 'รหัสผ่านผ่านการเข้ารหัสผ่าน bcrypt',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อ-นามสกุลจริงของบุคลากร/อาจารย์',
  `role` ENUM('ADMIN', 'TEACHER', 'DEAN', 'PRESIDENT') NOT NULL COMMENT 'สิทธิ์การใช้งาน (ADMIN=แอดมิน, TEACHER=อาจารย์/เจ้าหน้าที่โครงการ, DEAN=คณบดี, PRESIDENT=อธิการบดี)',
  `department_id` INT DEFAULT NULL COMMENT 'รหัสหน่วยงานย่อยที่สังกัด (NULL = ผู้บริหารระดับสูง/ไม่มีสังกัดย่อย)',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่สมัครบัญชี',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงโปรไฟล์ล่าสุด',
  CONSTRAINT `fk_users_departments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางบัญชีผู้ใช้บุคลากรและสิทธิ์การเข้าถึงระบบ';

-- ---------------------------------------------------------
-- 4. Table fiscal_years (ตารางรอบปีงบประมาณ)
-- ---------------------------------------------------------
CREATE TABLE `fiscal_years` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักปีงบประมาณ',
  `year` INT UNIQUE NOT NULL COMMENT 'ตัวเลขปีงบประมาณ พ.ศ. (เช่น 2568, 2569)',
  `active` BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'สถานะปีงบประมาณปัจจุบัน (1 = ปีหลักขณะนี้, 0 = ปีงบประมาณอื่น)',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงล่าสุด'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางปีงบประมาณสนับสนุนโครงการ';

-- ---------------------------------------------------------
-- 5. Table budget_sources (ตารางแหล่งทุน/งบประมาณ)
-- ---------------------------------------------------------
CREATE TABLE `budget_sources` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักแหล่งงบประมาณ',
  `name` VARCHAR(191) UNIQUE NOT NULL COMMENT 'ชื่อหมวดหมู่แหล่งงบประมาณ (เช่น งบแผ่นดิน, งบรายได้มหาวิทยาลัย)',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่บันทึกข้อมูล',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงล่าสุด'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางจำแนกแหล่งที่มาของงบประมาณ';

-- ---------------------------------------------------------
-- 6. Table strategies (ตารางยุทธศาสตร์หลัก)
-- ---------------------------------------------------------
CREATE TABLE `strategies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักยุทธศาสตร์หลัก',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อประเด็นยุทธศาสตร์หลัก',
  `code` VARCHAR(191) UNIQUE NOT NULL COMMENT 'รหัสสัญลักษณ์ยุทธศาสตร์ (เช่น S1, S2)',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่บันทึก',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงล่าสุด'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประเด็นยุทธศาสตร์หลักการพัฒนามหาวิทยาลัย';

-- ---------------------------------------------------------
-- 7. Table sub_strategies (ตารางประเด็นยุทธศาสตร์ย่อย)
-- ---------------------------------------------------------
CREATE TABLE `sub_strategies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักยุทธศาสตร์ย่อย',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อแนวทางการพัฒนาประเด็นยุทธศาสตร์ย่อย',
  `code` VARCHAR(191) UNIQUE NOT NULL COMMENT 'รหัสสัญลักษณ์ยุทธศาสตร์ย่อย (เช่น SS1.1, SS1.2)',
  `strategy_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงยุทธศาสตร์หลักต้นสังกัด',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่บันทึก',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงล่าสุด',
  CONSTRAINT `fk_sub_strategies_strategies` FOREIGN KEY (`strategy_id`) REFERENCES `strategies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางยุทธศาสตร์ย่อยภายใต้ยุทธศาสตร์หลัก';

-- ---------------------------------------------------------
-- 8. Table indicators (ตารางเป้าประสงค์และตัวชี้วัด)
-- ---------------------------------------------------------
CREATE TABLE `indicators` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักตัวชี้วัด',
  `name` VARCHAR(191) NOT NULL COMMENT 'รายละเอียดตัวชี้วัดความสำเร็จ',
  `code` VARCHAR(191) UNIQUE NOT NULL COMMENT 'รหัสสัญลักษณ์ตัวชี้วัด (เช่น IND1.1.1)',
  `sub_strategy_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงยุทธศาสตร์ย่อยต้นสังกัด',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาบันทึก',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงล่าสุด',
  CONSTRAINT `fk_indicators_sub_strategies` FOREIGN KEY (`sub_strategy_id`) REFERENCES `sub_strategies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตัวชี้วัดความสำเร็จของยุทธศาสตร์';

-- ---------------------------------------------------------
-- 9. Table projects (ตารางรายละเอียดโครงการหลัก)
-- ---------------------------------------------------------
CREATE TABLE `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักโครงการยุทธศาสตร์',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อโครงการพัฒนาตามแผนงานยุทธศาสตร์',
  `description` TEXT DEFAULT NULL COMMENT 'คำอธิบาย/หลักการและเหตุผลของโครงการ',
  `fiscal_year_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงปีงบประมาณ',
  `budget_source_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงแหล่งทุนงบประมาณ',
  `sub_strategy_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงยุทธศาสตร์ย่อยที่สอดคล้อง',
  `indicator_id` INT DEFAULT NULL COMMENT 'รหัสเชื่อมโยงตัวชี้วัดที่ต้องการตอบสนอง',
  `total_budget` DECIMAL(12,2) NOT NULL COMMENT 'ยอดเงินงบประมาณจัดสรรโครงการตั้งต้น (บาท)',
  `target_count` INT NOT NULL COMMENT 'เป้าหมายความสำเร็จเชิงปริมาณ (สะสม)',
  `unit` VARCHAR(191) NOT NULL COMMENT 'หน่วยวัดความสำเร็จ เช่น ครั้ง, รุ่น, คน, แห่ง',
  `start_date` DATETIME(3) NOT NULL COMMENT 'วันที่เริ่มต้นการจัดโครงการตามแผนงาน',
  `end_date` DATETIME(3) NOT NULL COMMENT 'วันที่สิ้นสุดโครงการตามแผนงาน',
  `completed_count` INT DEFAULT 0 NOT NULL COMMENT 'จำนวนเป้าหมายย่อยที่ดำเนินงานแล้วเสร็จสะสมจากกิจกรรม',
  `remaining_count` INT DEFAULT 0 NOT NULL COMMENT 'จำนวนเป้าหมายคงเหลือที่ต้องดำเนินงานให้สำเร็จ',
  `progress` DOUBLE DEFAULT 0.0 NOT NULL COMMENT 'ร้อยละความก้าวหน้าโครงการสะสม คำนวณจาก (completed_count / target_count) * 100',
  `creator_id` INT NOT NULL COMMENT 'รหัสอาจารย์/ผู้ใช้ผู้เขียนและเสนอโครงการ',
  `department_id` INT DEFAULT NULL COMMENT 'รหัสภาควิชาที่จัดตั้งโครงการ',
  `faculty_id` INT DEFAULT NULL COMMENT 'รหัสคณะต้นสังกัดโครงการ',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาบันทึกโครงการ',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลากิจกรรมที่ปรับปรุงล่าสุด',
  CONSTRAINT `fk_projects_fiscal_years` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_budget_sources` FOREIGN KEY (`budget_source_id`) REFERENCES `budget_sources` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_sub_strategies` FOREIGN KEY (`sub_strategy_id`) REFERENCES `sub_strategies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_indicators` FOREIGN KEY (`indicator_id`) REFERENCES `indicators` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_users_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_departments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_projects_faculties` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางบันทึกแผนงานโครงการยุทธศาสตร์ของคณะและมหาวิทยาลัย';

-- ---------------------------------------------------------
-- 10. Table project_users (ตารางผู้ดูแลรับผิดชอบร่วมโครงการ - Many to Many)
-- ---------------------------------------------------------
CREATE TABLE `project_users` (
  `project_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงโครงการหลัก',
  `user_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงอาจารย์/เจ้าหน้าที่ผู้ดูแลรับผิดชอบร่วม',
  `assigned_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่ได้รับมอบหมายดูแลโครงการ',
  PRIMARY KEY (`project_id`, `user_id`),
  CONSTRAINT `fk_project_users_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_users_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้รับผิดชอบโครงการร่วมกันของคณะทำงาน';

-- ---------------------------------------------------------
-- 11. Table activities (ตารางแผนงานและกิจกรรมย่อยที่จัดขึ้น)
-- ---------------------------------------------------------
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีหลักกิจกรรมย่อย',
  `project_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงโครงการหลักต้นสังกัดกิจกรรม',
  `name` VARCHAR(191) NOT NULL COMMENT 'ชื่อแผนงานกิจกรรมย่อย',
  `description` TEXT DEFAULT NULL COMMENT 'รายละเอียดการดำเนินงานหรือหัวข้อกิจกรรมย่อย',
  `activity_date` DATETIME(3) NOT NULL COMMENT 'กำหนดการวันที่จัดงานตามแผนงาน',
  `budget` DECIMAL(12,2) NOT NULL COMMENT 'งบประมาณประมาณการที่ตั้งไว้ในแผนจัดกิจกรรม (บาท)',
  `is_locked` BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'สถานะล็อกรายละเอียดแผนกิจกรรมหลังจากการบันทึก (1 = ล็อกแก้ไขแผนงานเริ่มต้น, 0 = ปลดล็อก)',
  `actual_budget` DECIMAL(12,2) DEFAULT NULL COMMENT 'จำนวนงบประมาณจ่ายเบิกใช้จริงหลังจัดงานเสร็จสิ้น (บาท)',
  `success` BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'สถานะการประเมินการดำเนินงานสำเร็จ (1 = ดำเนินงานสำเร็จบรรลุเป้าหมาย, 0 = ยังไม่ได้รายงาน/ไม่บรรลุแผน)',
  `completed_count` INT DEFAULT 0 NOT NULL COMMENT 'เป้าหมายเชิงปริมาณที่บรรลุได้จริงของกิจกรรมนี้ เช่น จำนวนคนเข้าอบรม, จำนวนครั้งจัดสำเร็จ',
  `remark` TEXT DEFAULT NULL COMMENT 'หมายเหตุ / ปัญหาและอุปสรรคของการรายงานผลสำเร็จ',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาสร้างกิจกรรม',
  `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาปรับปรุงผลล่าสุด',
  CONSTRAINT `fk_activities_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางแผนกิจกรรมย่อยและการรายงานผลการเบิกจ่ายงบประมาณ';

-- ---------------------------------------------------------
-- 12. Table activity_images (ตารางที่เก็บรูปภาพผลสำเร็จของงาน)
-- ---------------------------------------------------------
CREATE TABLE `activity_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'รหัสไอดีรูปภาพกิจกรรม',
  `activity_id` INT NOT NULL COMMENT 'รหัสเชื่อมโยงกิจกรรมต้นทางต้นแบบรูปภาพ',
  `file_path` VARCHAR(191) NOT NULL COMMENT 'ที่อยู่ตำแหน่งจัดเก็บไฟล์รูปภาพหลักฐานความก้าวหน้าบนเซิร์ฟเวอร์',
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL COMMENT 'วันเวลาที่จัดส่งอัปโหลดรูปภาพหลักฐาน',
  CONSTRAINT `fk_activity_images_activities` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บความก้าวหน้าโครงการแนบรูปภาพกิจกรรมย่อย';
