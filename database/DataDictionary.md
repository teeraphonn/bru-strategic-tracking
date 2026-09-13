# Data Dictionary - Strategic Performance Tracking System
## พจนานุกรมข้อมูลระบบติดตามการดำเนินงานตามประเด็นยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (14 ตาราง)

เอกสารนี้ระบุโครงสร้างตาราง ชนิดข้อมูล ข้อจำกัด และคำอธิบายความหมายของแต่ละแอตทริบิวต์ในระบบฐานข้อมูลจริง (MySQL / InnoDB) ครบทั้ง 14 ตาราง สอดคล้องกับเล่มวิทยานิพนธ์บทที่ 3 (ตาราง 3.6 ถึง 3.19)

---

## 1. faculties (ตาราง 3.6: ข้อมูลคณะ)
ตารางเก็บข้อมูลคณะและส่วนราชการระดับคณะ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักคณะ |
| 2 | `name` | VARCHAR(191) | Unique, Not Null | ชื่อคณะ/หน่วยงานระดับคณะ |
| 3 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 4 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 2. departments (ตาราง 3.7: ข้อมูลภาควิชา/สาขาวิชา)
ตารางเก็บข้อมูลภาควิชาและสาขาวิชาสังกัดคณะ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักสาขาวิชา |
| 2 | `name` | VARCHAR(191) | Unique, Not Null | ชื่อภาควิชา/สาขาวิชา |
| 3 | `faculty_id` | INT | FK to `faculties.id` (Set Null) | รหัสคณะต้นสังกัด |
| 4 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 5 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 3. users (ตาราง 3.8: ข้อมูลผู้ใช้งานและบทบาทสิทธิ์)
ตารางเก็บบัญชีผู้ใช้งานระบบและบทบาทสิทธิ์ 4 ระดับ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักผู้ใช้งาน |
| 2 | `username` | VARCHAR(191) | Unique, Not Null | บัญชีผู้ใช้งานเข้าสู่ระบบ |
| 3 | `password` | VARCHAR(191) | Not Null | รหัสผ่านเข้ารหัส bcrypt |
| 4 | `name` | VARCHAR(191) | Not Null | ชื่อ-นามสกุลจริง |
| 5 | `role` | ENUM | Not Null (ADMIN, TEACHER, DEAN, PRESIDENT) | บทบาทและสิทธิ์การใช้งาน |
| 6 | `department_id` | INT | FK to `departments.id` (Set Null) | รหัสสาขาวิชาที่สังกัด |
| 7 | `avatar` | LONGTEXT | Nullable | รูปภาพโปรไฟล์ (Base64/URL) |
| 8 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่สร้างบัญชี |
| 9 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 4. fiscal_years (ตาราง 3.9: ข้อมูลปีงบประมาณ)
ตารางเก็บรอบปีงบประมาณดำเนินโครงการ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักปีงบประมาณ |
| 2 | `year` | INT | Unique, Not Null | ปีงบประมาณ พ.ศ. (เช่น 2568, 2569) |
| 3 | `active` | BOOLEAN | Default FALSE, Not Null | สถานะปีปัจจุบัน (1=ปีปัจจุบัน) |
| 4 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 5 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 5. budget_sources (ตาราง 3.10: ข้อมูลแหล่งงบประมาณ)
ตารางเก็บประเภทและแหล่งเงินงบประมาณ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักแหล่งงบประมาณ |
| 2 | `name` | VARCHAR(191) | Unique, Not Null | ชื่อแหล่งเงินงบประมาณ |
| 3 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 4 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 6. local_development_issues (ตาราง 3.11: ประเด็นการพัฒนาท้องถิ่น)
ตารางเก็บประเด็นการพัฒนาเชิงพื้นที่และท้องถิ่น (LDI 1 - 4)

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักประเด็นพัฒนา |
| 2 | `name` | VARCHAR(191) | Not Null | ชื่อประเด็นการพัฒนาท้องถิ่น |
| 3 | `code` | VARCHAR(191) | Unique, Not Null | รหัสสัญลักษณ์ (เช่น LDI 1) |
| 4 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 5 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 7. strategies (ตาราง 3.12: ประเด็นยุทธศาสตร์หลัก)
ตารางเก็บประเด็นยุทธศาสตร์หลักการพัฒนามหาวิทยาลัย (S 1 - 6)

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักยุทธศาสตร์ |
| 2 | `name` | VARCHAR(191) | Not Null | ชื่อประเด็นยุทธศาสตร์หลัก |
| 3 | `code` | VARCHAR(191) | Unique, Not Null | รหัสสัญลักษณ์ยุทธศาสตร์ (เช่น S 1) |
| 4 | `local_issue_id` | INT | FK to `local_development_issues.id` (Set Null) | เชื่อมประเด็นพัฒนาท้องถิ่น |
| 5 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 6 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 8. sub_strategies (ตาราง 3.13: ประเด็นยุทธศาสตร์ย่อย)
ตารางเก็บยุทธศาสตร์ย่อยภายใต้ยุทธศาสตร์หลัก (SS 1.1 - 4.2)

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักยุทธศาสตร์ย่อย |
| 2 | `name` | VARCHAR(191) | Not Null | ชื่อยุทธศาสตร์ย่อย/แนวทางพัฒนา |
| 3 | `code` | VARCHAR(191) | Unique, Not Null | รหัสสัญลักษณ์ย่อย (เช่น SS 1.1) |
| 4 | `strategy_id` | INT | FK to `strategies.id` (Cascade) | รหัสยุทธศาสตร์หลักต้นสังกัด |
| 5 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 6 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 9. indicators (ตาราง 3.14: ตัวชี้วัดความสำเร็จ)
ตารางเก็บตัวชี้วัดความสำเร็จของยุทธศาสตร์และ 10 โครงการหลัก (IND 1 - 10)

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักตัวชี้วัด |
| 2 | `name` | VARCHAR(191) | Not Null | ชื่อตัวชี้วัดความสำเร็จ |
| 3 | `code` | VARCHAR(191) | Unique, Not Null | รหัสตัวชี้วัด (เช่น IND 1.1, MP 1.1) |
| 4 | `sub_strategy_id` | INT | FK to `sub_strategies.id` (Cascade) | รหัสยุทธศาสตร์ย่อยต้นสังกัด |
| 5 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกข้อมูล |
| 6 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 10. projects (ตาราง 3.15: โครงการยุทธศาสตร์)
ตารางเก็บรายละเอียดโครงการยุทธศาสตร์ ความก้าวหน้าสะสม และระบบข้อสั่งการ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักโครงการ |
| 2 | `name` | VARCHAR(191) | Not Null | ชื่อโครงการยุทธศาสตร์ |
| 3 | `description` | TEXT | Nullable | หลักการและเหตุผล/รายละเอียด |
| 4 | `fiscal_year_id` | INT | FK to `fiscal_years.id` | รหัสปีงบประมาณ |
| 5 | `budget_source_id`| INT | FK to `budget_sources.id` | รหัสแหล่งงบประมาณ |
| 6 | `sub_strategy_id` | INT | FK to `sub_strategies.id` | รหัสยุทธศาสตร์ย่อย |
| 7 | `indicator_id` | INT | FK to `indicators.id` (Set Null) | รหัสตัวชี้วัดความสำเร็จ |
| 8 | `total_budget` | DECIMAL(12,2) | Not Null | งบประมาณจัดสรรรวม (บาท) |
| 9 | `target_count` | INT | Not Null | เป้าหมายผลผลิตเชิงปริมาณ |
| 10 | `unit` | VARCHAR(191) | Not Null | หน่วยนับเป้าหมาย เช่น คน, แห่ง |
| 11 | `start_date` | DATETIME(3) | Not Null | วันเริ่มต้นโครงการตามแผน |
| 12 | `end_date` | DATETIME(3) | Not Null | วันสิ้นสุดโครงการตามแผน |
| 13 | `completed_count` | INT | Default 0, Not Null | ผลงานสะสมที่ทำได้จริง |
| 14 | `remaining_count` | INT | Default 0, Not Null | ผลงานคงเหลือตามเป้าหมาย |
| 15 | `progress` | DOUBLE | Default 0.0, Not Null | ร้อยละความก้าวหน้าสะสม |
| 16 | `creator_id` | INT | FK to `users.id` | อาจารย์ผู้เสนอโครงการ |
| 17 | `department_id` | INT | FK to `departments.id` (Set Null) | สาขาวิชาต้นสังกัด |
| 18 | `faculty_id` | INT | FK to `faculties.id` (Set Null) | คณะต้นสังกัด |
| 19 | `executive_directive` | TEXT | Nullable | ข้อสั่งการผู้บริหารระดับสูง |
| 20 | `directive_updated_at`| DATETIME(3) | Nullable | วันเวลาที่ออกข้อสั่งการ |
| 21 | `directive_issuer_name`| VARCHAR(191) | Nullable | ชื่อผู้ออกข้อสั่งการ |
| 22 | `directive_issuer_role`| VARCHAR(191) | Nullable | ตำแหน่งผู้ออกข้อสั่งการ |
| 23 | `dean_directive` | TEXT | Nullable | ข้อสั่งการกำกับของคณบดี |
| 24 | `dean_directive_updated_at`| DATETIME(3) | Nullable | วันเวลาที่คณบดีสั่งการ |
| 25 | `dean_directive_issuer_name`| VARCHAR(191) | Nullable | ชื่อคณบดีผู้ออกคำสั่ง |
| 26 | `president_directive` | TEXT | Nullable | ข้อสั่งการกำกับของอธิการบดี |
| 27 | `president_directive_updated_at`| DATETIME(3) | Nullable | วันเวลาที่อธิการบดีสั่งการ |
| 28 | `president_directive_issuer_name`| VARCHAR(191) | Nullable | ชื่ออธิการบดีผู้ออกคำสั่ง |
| 29 | `is_locked` | BOOLEAN | Default TRUE, Not Null | สถานะล็อกแผนงานโครงการ |
| 30 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกโครงการ |
| 31 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่แก้ไขล่าสุด |

---

## 11. project_users (ตาราง 3.16: อาจารย์ผู้ร่วมรับผิดชอบโครงการ)
ตารางเชื่อมโยงความสัมพันธ์ Many-to-Many ระหว่างโครงการกับอาจารย์ผู้รับผิดชอบร่วม

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `project_id` | INT | Composite PK, FK to `projects.id` (Cascade) | รหัสโครงการ |
| 2 | `user_id` | INT | Composite PK, FK to `users.id` (Cascade) | รหัสผู้ใช้งานที่ร่วมรับผิดชอบ |
| 3 | `assigned_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่มอบหมาย |

---

## 12. activities (ตาราง 3.17: กิจกรรมย่อยและรายงานผลการดำเนินงาน)
ตารางเก็บแผนกิจกรรมย่อยและการรายงานผลการเบิกจ่ายงบประมาณจริง

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักกิจกรรม |
| 2 | `project_id` | INT | FK to `projects.id` (Cascade) | รหัสโครงการหลักต้นสังกัด |
| 3 | `name` | VARCHAR(191) | Not Null | ชื่อกิจกรรมย่อย |
| 4 | `description` | TEXT | Nullable | รายละเอียดการดำเนินงาน |
| 5 | `activity_date` | DATETIME(3) | Not Null | กำหนดการจัดกิจกรรมตามแผน |
| 6 | `budget` | DECIMAL(12,2) | Not Null | งบประมาณตามแผนที่จัดสรร (บาท) |
| 7 | `is_locked` | BOOLEAN | Default TRUE, Not Null | สถานะล็อกรายละเอียดแผน |
| 8 | `actual_budget` | DECIMAL(12,2) | Nullable | งบประมาณเบิกจ่ายใช้จริง (บาท) |
| 9 | `success` | BOOLEAN | Default FALSE, Not Null | สถานะประเมินผลสำเร็จ (1=สำเร็จ) |
| 10 | `completed_count` | INT | Default 0, Not Null | ผลงานเชิงปริมาณจริงที่ทำได้ |
| 11 | `remark` | TEXT | Nullable | หมายเหตุ/ปัญหาอุปสรรค |
| 12 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่บันทึกกิจกรรม |
| 13 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่รายงานผลล่าสุด |

---

## 13. activity_images (ตาราง 3.18: ภาพถ่ายหลักฐานการจัดกิจกรรม)
ตารางเก็บไฟล์ภาพถ่ายหลักฐานยืนยันการจัดกิจกรรมโครงการ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักรูปภาพ |
| 2 | `activity_id` | INT | FK to `activities.id` (Cascade) | รหัสกิจกรรมที่แนบรูปภาพ |
| 3 | `file_path` | TEXT | Not Null | ที่อยู่จัดเก็บไฟล์รูปภาพ/URL |
| 4 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่อัปโหลดภาพ |

---

## 14. issue_reports (ตาราง 3.19: รายงานปัญหาการใช้งานระบบ)
ตารางรับแจ้งและติดตามปัญหาข้อผิดพลาดการใช้งานระบบ

| ลำดับ | แอตทริบิวต์ (Field) | ชนิดข้อมูล (Data Type) | ข้อจำกัด (Constraint) | คำอธิบาย (Description) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | INT | PK, Auto Increment | รหัสไอดีหลักการแจ้งปัญหา |
| 2 | `title` | VARCHAR(191) | Not Null | หัวข้อปัญหาที่พบ |
| 3 | `description` | TEXT | Not Null | รายละเอียดปัญหา |
| 4 | `category` | VARCHAR(191) | Nullable | หมวดหมู่ปัญหา |
| 5 | `priority` | ENUM | Not Null (LOW, MEDIUM, HIGH, URGENT) | ระดับความเร่งด่วน |
| 6 | `status` | ENUM | Not Null (PENDING, IN_PROGRESS, RESOLVED, REJECTED) | สถานะการแก้ไขปัญหา |
| 7 | `admin_note` | TEXT | Nullable | บันทึกการตอบกลับจากแอดมิน |
| 8 | `user_id` | INT | FK to `users.id` (Cascade) | รหัสผู้ใช้งานที่แจ้งปัญหา |
| 9 | `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | วันเวลาที่ส่งแจ้งปัญหา |
| 10 | `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | วันเวลาที่ปรับปรุงสถานะ |
