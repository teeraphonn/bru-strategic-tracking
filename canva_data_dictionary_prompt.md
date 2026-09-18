# Prompt สร้าง Data Dictionary สำหรับสไลด์ Canva (1 หน้าเดี่ยวจบ - Single Slide)
## ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)

เอกสารนี้จัดทำขึ้นสำหรับนำไป **แทรกเป็นสไลด์ 1 หน้า** ใน Canva ต่อจากสไลด์ ER Diagram โดยรวบรวมพจนานุกรมข้อมูล (Data Dictionary) ทั้ง 14 ตาราง ไว้อย่างกระชับ เป็นระเบียบ และอ่านง่ายในหน้าเดียว (16:9)

---

## 🎯 ส่วนที่ 1: Prompt สั่ง Canva AI เจนสไลด์ Data Dictionary 1 หน้า (Canva Magic Design)

> **วิธีใช้งาน:**  
> 1. ใน Canva กด **เพิ่มหน้าใหม่ (Add Page)** 1 หน้า  
> 2. กดที่เมนู **Canva Magic Design / AI Presentation**  
> 3. คัดลอก Prompt ด้านล่างนี้ไปวาง แล้วกด Generate:

```text
สร้างสไลด์นำเสนอเชิงวิชาการและโครงสร้างฐานข้อมูล 1 หน้าเดี่ยว (Single Slide 16:9) หัวข้อ: "พจนานุกรมข้อมูลระบบ (System Data Dictionary)" ของระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์

ธีมและดีไซน์:
- โทนสีม่วงสถาบัน (#6B21A8) สลับสีขาวและเทาอ่อน ดูสะอาดตา สไตล์ Modern Academic Tech
- จัดเลย์เอาต์หน้าจอแบ่งเป็นตาราง 4 กลุ่มโมดูล (4 Functional Modules) แสดง 14 ตาราง, วัตถุประสงค์, คีย์หลัก (PK), คีย์นอก (FK) และฟิลด์สำคัญ:

[กลุ่มที่ 1: ผู้ใช้งานและโครงสร้างองค์กร (Organization & Users - 3 ตาราง)]
1. faculties: ตารางคณะ (PK: id, UK: name)
2. departments: ตารางสาขาวิชา (PK: id, UK: name, FK: faculty_id)
3. users: ตารางบัญชีผู้ใช้ (PK: id, UK: username, password, name, role [ADMIN/TEACHER/DEAN/PRESIDENT], FK: department_id, avatar)

[กลุ่มที่ 2: ยุทธศาสตร์ 4 ระดับและข้อมูลหลัก (Cascading Strategy & Master Data - 6 ตาราง)]
4. local_development_issues: ประเด็นพัฒนาท้องถิ่น ยุทธศาสตร์ขั้น 1 (PK: id, UK: code, name)
5. strategies: ประเด็นยุทธศาสตร์มหาวิทยาลัย ยุทธศาสตร์ขั้น 2 (PK: id, UK: code, name, FK: local_issue_id)
6. sub_strategies: แผนงานย่อย/กลยุทธ์ ยุทธศาสตร์ขั้น 3 (PK: id, UK: code, name, FK: strategy_id)
7. indicators: ตัวชี้วัดความสำเร็จ ยุทธศาสตร์ขั้น 4 (PK: id, UK: code, name, FK: sub_strategy_id)
8. fiscal_years: ปีงบประมาณ (PK: id, UK: year, active)
9. budget_sources: แหล่งเงินงบประมาณ (PK: id, UK: name)

[กลุ่มที่ 3: โครงการ กิจกรรม และหลักฐาน (Projects, Activities & Evidence - 4 ตาราง)]
10. projects: ข้อมูลโครงการหลัก (PK: id, FK: sub_strategy_id, indicator_id, faculty_id, department_id, creator_id, fiscal_year_id, budget_source_id, total_budget, target_count, progress, is_locked, directives)
11. project_users: สมาชิกทีมงานโครงการ (Composite PK: project_id, user_id)
12. activities: กิจกรรมย่อยและการเบิกจ่าย (PK: id, FK: project_id, name, budget, actual_budget, completed_count, is_locked)
13. activity_images: รูปภาพหลักฐานเชิงประจักษ์ (PK: id, FK: activity_id, file_path)

[กลุ่มที่ 4: การดูแลระบบและแจ้งปัญหา (System Support - 1 ตาราง)]
14. issue_reports: รายการแจ้งปัญหาการใช้งาน (PK: id, FK: user_id, title, priority [LOW/MEDIUM/HIGH/URGENT], status [PENDING/IN_PROGRESS/RESOLVED/REJECTED], admin_note)

แถบสรุปสถิติด้านล่าง (Footer Stats):
• รวม 14 ตารางเชิงสัมพันธ์ (14 Tables)  |  • 3 Enums (Role, IssuePriority, IssueStatus)  |  • มาตรฐาน Third Normal Form (3NF) ไร้ความซ้ำซ้อน
```

---

## 📋 ส่วนที่ 2: ตารางพจนานุกรมข้อมูลสำเร็จรูป (สำหรับคัดลอกไปวางใน Canva ด้วยตนเอง)

> หากใน Canva มีเทมเพลตสไลด์อยู่แล้ว สามารถนำตารางสรุป 1 หน้านี้ไปวางได้ทันที:

### หัวข้อสไลด์ (Slide Header):
* **หัวข้อหลัก (Title):** พจนานุกรมข้อมูลระบบ (System Data Dictionary)
* **หัวข้อย่อย (Subtitle):** สรุปโครงสร้าง 14 ตาราง ความสัมพันธ์ และข้อกำหนดข้อมูลตามมาตรฐาน 3NF

---

### ตารางสรุป 14 ตาราง (จัดลง 1 สไลด์ 16:9 พอดี):

| กลุ่มโมดูล | ชื่อตาราง (Table Name) | คำอธิบาย (Description) | Primary Key (PK) | Foreign Key (FK) & ฟิลด์สำคัญ |
| :--- | :--- | :--- | :---: | :--- |
| **1. องค์กรและผู้ใช้**<br>*(3 ตาราง)* | `faculties`<br>`departments`<br>`users` | ข้อมูลคณะ<br>ข้อมูลสาขาวิชา/ภาควิชา<br>บัญชีผู้ใช้งานระบบ (4 บทบาท) | `id`<br>`id`<br>`id` | `name (UK)`<br>`faculty_id (FK)`, `name (UK)`<br>`username (UK)`, `role (Enum)`, `department_id (FK)` |
| **2. ยุทธศาสตร์ 4 ขั้น**<br>*(4 ตาราง)* | `local_development_issues`<br>`strategies`<br>`sub_strategies`<br>`indicators` | ขั้น 1: ประเด็นพัฒนาท้องถิ่น<br>ขั้น 2: ประเด็นยุทธศาสตร์ มรภ.บร.<br>ขั้น 3: แผนงานย่อย/กลยุทธ์<br>ขั้น 4: ตัวชี้วัดความสำเร็จ | `id`<br>`id`<br>`id`<br>`id` | `code (UK)`, `name`<br>`local_issue_id (FK)`, `code (UK)`<br>`strategy_id (FK)`, `code (UK)`<br>`sub_strategy_id (FK)`, `code (UK)` |
| **3. ข้อมูลพื้นฐาน**<br>*(2 ตาราง)* | `fiscal_years`<br>`budget_sources` | ปีงบประมาณ (เช่น 2569)<br>แหล่งงบประมาณ (เช่น งบแผ่นดิน) | `id`<br>`id` | `year (UK)`, `active (Boolean)`<br>`name (UK)` |
| **4. โครงการ & ผลงาน**<br>*(4 ตาราง)* | `projects`<br>`project_users`<br>`activities`<br>`activity_images` | โครงการหลัก & การผูกยุทธศาสตร์<br>ทีมงานผู้รับผิดชอบโครงการ (N:M)<br>กิจกรรมย่อย & งบประมาณรายกิจกรรม<br>ภาพถ่ายหลักฐานจริงเชิงประจักษ์ | `id`<br>`project_id, user_id`<br>`id`<br>`id` | `sub_strategy_id, faculty_id, creator_id (FK), is_locked`<br>`project_id (FK), user_id (FK)`<br>`project_id (FK), actual_budget, is_locked`<br>`activity_id (FK), file_path` |
| **5. สนับสนุนระบบ**<br>*(1 ตาราง)* | `issue_reports` | รายการแจ้งปัญหา & ข้อเสนอแนะ | `id` | `user_id (FK), priority, status, admin_note` |

---

### แถบสรุปข้อกำหนดความปลอดภัยและคุณสมบัติทางเทคนิค (Footer Callout):
* **Data Integrity:** ควบคุมด้วย Foreign Keys ทุกความสัมพันธ์ พร้อมคำสั่ง `ON DELETE CASCADE` ในกิจกรรมและรูปภาพ ป้องกันข้อมูลขยะ
* **Plan Tamper-Proofing:** ควบคุมด้วยแฟล็ก `is_locked` ป้องกันการแก้ไขตัวชี้วัดและงบประมาณย้อนหลัง
* **Storage Standard:** รหัสผ่านเข้ารหัสด้วย `Bcrypt Hash`, รูปภาพโปรไฟล์จัดเก็บเป็น `LongText Base64`, รูปภาพกิจกรรมจัดเก็บเป็น `Path Reference`
