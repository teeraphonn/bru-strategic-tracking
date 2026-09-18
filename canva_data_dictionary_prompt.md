# ตารางพจนานุกรมข้อมูล (Data Dictionary Table - 1 หน้าสำหรับ Canva)
## ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)

> **วิธีใช้งานใน Canva:**  
> 1. ใน Canva เลือกเมนู **"องค์ประกอบ (Elements)" ➔ "ตาราง (Table)"**  
> 2. คัดลอกข้อมูลตารางด้านล่างนี้ไปวางลงในตาราง Canva ได้ทันที โดยข้อความจะถูกจัดลงแต่ละช่องอัตโนมัติ  
> 3. หรือใช้เป็นเนื้อหาอ้างอิงประกอบสไลด์ 1 หน้าเดี่ยว

---

### ตารางพจนานุกรมข้อมูลระบบ (System Data Dictionary - 14 ตารางหลัก)

| # | ชื่อตาราง (Table) | คำอธิบายภาษาไทย (Description) | Primary Key (PK) | Foreign Key (FK) | ฟิลด์สำคัญ (Key Attributes) | ความสัมพันธ์ (Relationship) |
| :-: | :--- | :--- | :---: | :---: | :--- | :--- |
| **1** | `faculties` | ตารางข้อมูลคณะ | `id` | - | `name (UK)` | 1:N ➔ `departments`, `projects` |
| **2** | `departments` | ตารางข้อมูลสาขาวิชา/ภาควิชา | `id` | `faculty_id` | `name (UK)` | 1:N ➔ `users`, `projects` |
| **3** | `users` | บัญชีผู้ใช้งานระบบ (4 บทบาท) | `id` | `department_id` | `username (UK), password, role, avatar` | 1:N ➔ `projects`, `issue_reports` |
| **4** | `fiscal_years` | ปีงบประมาณ (เช่น 2569) | `id` | - | `year (UK), active` | 1:N ➔ `projects` |
| **5** | `budget_sources` | แหล่งเงินงบประมาณ | `id` | - | `name (UK)` | 1:N ➔ `projects` |
| **6** | `local_development_issues` | ยุทธศาสตร์ขั้น 1: ประเด็นพัฒนาท้องถิ่น | `id` | - | `code (UK), name` | 1:N ➔ `strategies` |
| **7** | `strategies` | ยุทธศาสตร์ขั้น 2: ประเด็นยุทธศาสตร์ มรภ.บร. | `id` | `local_issue_id` | `code (UK), name` | 1:N ➔ `sub_strategies` |
| **8** | `sub_strategies` | ยุทธศาสตร์ขั้น 3: แผนงานย่อย/กลยุทธ์ | `id` | `strategy_id` | `code (UK), name` | 1:N ➔ `indicators`, `projects` |
| **9** | `indicators` | ยุทธศาสตร์ขั้น 4: ตัวชี้วัดความสำเร็จ | `id` | `sub_strategy_id` | `code (UK), name` | 1:N ➔ `projects` |
| **10** | `projects` | โครงการหลัก & การผูกยุทธศาสตร์ | `id` | `fiscal_year_id, budget_source_id, sub_strategy_id, indicator_id, faculty_id, department_id, creator_id` | `total_budget, target_count, progress, is_locked, directives` | 1:N ➔ `activities`<br>N:M ➔ `users` (ผ่าน project_users) |
| **11** | `project_users` | ทีมงานผู้รับผิดชอบโครงการ | `(project_id, user_id)` | `project_id, user_id` | `assigned_at` | N:M ระหว่าง `projects` และ `users` |
| **12** | `activities` | กิจกรรมย่อย & งบประมาณรายกิจกรรม | `id` | `project_id` | `name, budget, actual_budget, completed_count, is_locked` | 1:N ➔ `activity_images` (Cascade) |
| **13** | `activity_images` | รูปภาพหลักฐานกิจกรรมจริงเชิงประจักษ์ | `id` | `activity_id` | `file_path, created_at` | N:1 กับ `activities` |
| **14** | `issue_reports` | รายการแจ้งปัญหาและช่วยเหลือผู้ใช้ | `id` | `user_id` | `title, priority, status, admin_note` | N:1 กับ `users` |

---

### สรุปข้อกำหนดทางเทคนิค (Footer Technical Highlights)

* **Enums ในระบบ (3 รายการ):**
  * `Role`: `ADMIN`, `TEACHER`, `DEAN`, `PRESIDENT`
  * `IssuePriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  * `IssueStatus`: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`
* **Data Integrity & Governance:**
  * มีการผูก Foreign Keys ทุกความสัมพันธ์ ป้องกันข้อมูลขัดแย้ง
  * คำสั่ง `ON DELETE CASCADE` ที่กิจกรรมและรูปภาพ ป้องกันข้อมูลขยะ
  * กลไก `is_locked` ป้องกันการลดเป้าหมายและงบประมาณย้อนหลัง
