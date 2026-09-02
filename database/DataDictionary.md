# Data Dictionary - Strategic Performance Tracking System

This document provides a detailed breakdown of the tables, fields, data types, indexes, and constraints implemented in the system.

---

## 1. Table: `faculties` (คณะ)
Stores university faculties.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Faculty ID |
| `name` | VARCHAR(191) | Unique | Name of the Faculty (e.g. คณะวิทยาศาสตร์) |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 2. Table: `departments` (ภาควิชา/หน่วยงาน)
Stores departments which optional link to a faculty.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Department ID |
| `name` | VARCHAR(191) | Unique | Name of the Department (e.g. ภาควิชาคอมพิวเตอร์) |
| `faculty_id` | INT | FK to `faculties.id` (NULL on delete) | Parent Faculty ID |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 3. Table: `users` (ผู้ใช้งานระบบ)
System accounts.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique User ID |
| `username` | VARCHAR(191) | Unique | Login Username |
| `password` | VARCHAR(191) | Not Null | Bcrypt hashed password |
| `name` | VARCHAR(191) | Not Null | Full Name of the User |
| `role` | ENUM | Not Null | User role: `ADMIN`, `TEACHER`, `HEAD`, `DEAN`, `PRESIDENT` |
| `department_id` | INT | FK to `departments.id` (NULL on delete) | Assigned Department |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 4. Table: `fiscal_years` (ปีงบประมาณ)
Strategic tracking periods.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Year Record ID |
| `year` | INT | Unique | Buddhist Era Year (e.g., 2569) |
| `active` | BOOLEAN | Default `false` | True if this is the active current fiscal year |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 5. Table: `budget_sources` (แหล่งงบประมาณ)
Budget funding sources.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Budget Source ID |
| `name` | VARCHAR(191) | Unique | Funding name (e.g. งบประมาณแผ่นดิน) |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 6. Table: `strategies` (ยุทธศาสตร์หลัก)
University strategic pillars.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Strategy ID |
| `code` | VARCHAR(191) | Unique | Strategic Code (e.g., S1) |
| `name` | VARCHAR(191) | Not Null | Strategy Title text |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 7. Table: `sub_strategies` (ยุทธศาสตร์ย่อย)
Strategic sub-categories.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Sub-Strategy ID |
| `code` | VARCHAR(191) | Unique | Sub-strategy Code (e.g., SS1.1) |
| `name` | VARCHAR(191) | Not Null | Sub-strategy Title |
| `strategy_id` | INT | FK to `strategies.id` (Cascade) | Parent Strategy ID |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 8. Table: `indicators` (ตัวชี้วัด)
KPI measuring indicators.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Indicator ID |
| `code` | VARCHAR(191) | Unique | Indicator KPI Code (e.g., IND1.1.1) |
| `name` | VARCHAR(191) | Not Null | KPI description |
| `sub_strategy_id` | INT | FK to `sub_strategies.id` (Cascade) | Parent Sub-Strategy ID |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 9. Table: `projects` (โครงการ)
Strategic projects.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Project ID |
| `name` | VARCHAR(191) | Not Null | Project Name |
| `description` | TEXT | Nullable | Detail description |
| `fiscal_year_id` | INT | FK to `fiscal_years.id` | Associated budget year |
| `budget_source_id`| INT | FK to `budget_sources.id` | Assigned budget source |
| `sub_strategy_id` | INT | FK to `sub_strategies.id` | Aligned sub strategy |
| `indicator_id` | INT | FK to `indicators.id` (NULL on delete) | Aligned KPI indicator |
| `total_budget` | DECIMAL(12,2) | Not Null | Allocated initial budget (Baht) |
| `target_count` | INT | Not Null | Number of target accomplishments |
| `unit` | VARCHAR(191) | Not Null | Target Unit (e.g., ครั้ง, รุ่น, คน) |
| `start_date` | DATETIME(3) | Not Null | Project Start Date |
| `end_date` | DATETIME(3) | Not Null | Project End Date |
| `completed_count` | INT | Default `0` | Number of achieved milestones |
| `remaining_count` | INT | Default `0` | Calculated remaining milestones |
| `progress` | DOUBLE | Default `0.0` | Progress ratio (`completed / target * 100`) |
| `creator_id` | INT | FK to `users.id` | Project Creator ID |
| `department_id` | INT | FK to `departments.id` (NULL on delete) | Department of creator (inherited) |
| `faculty_id` | INT | FK to `faculties.id` (NULL on delete) | Faculty of creator (inherited) |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 10. Table: `project_users` (ผู้ประสานงาน/ผู้รับผิดชอบร่วม)
Join table representing many-to-many relationship between projects and users.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `project_id` | INT | PK, FK to `projects.id` (Cascade) | Project ID |
| `user_id` | INT | PK, FK to `users.id` (Cascade) | User ID |
| `assigned_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |

---

## 11. Table: `activities` (กิจกรรมโครงการ)
Sub-activities of a project.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Activity ID |
| `project_id` | INT | FK to `projects.id` (Cascade) | Parent Project ID |
| `name` | VARCHAR(191) | Not Null | Activity Name |
| `description` | TEXT | Nullable | Detail description |
| `activity_date` | DATETIME(3) | Not Null | Activity execution date |
| `budget` | DECIMAL(12,2) | Not Null | Allocated plan budget for activity |
| `is_locked` | BOOLEAN | Default `true` | True if the planning phase details are locked |
| `actual_budget` | DECIMAL(12,2) | Nullable | Actual expense budget |
| `success` | BOOLEAN | Default `false` | True if successfully executed |
| `completed_count` | INT | Default `0` | Accomplishment units completed in this activity |
| `remark` | TEXT | Nullable | Explanatory note or problem logs |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |
| `updated_at` | DATETIME(3) | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

---

## 12. Table: `activity_images` (รูปภาพแนบกิจกรรม)
Activity execution images.

| Column | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Auto Increment | Unique Image ID |
| `activity_id` | INT | FK to `activities.id` (Cascade) | Associated Activity |
| `file_path` | VARCHAR(191) | Not Null | Absolute upload storage path |
| `created_at` | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |
