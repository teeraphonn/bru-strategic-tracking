# Prompt สำหรับสร้าง Data ER Diagram ใน Canva (Canva ERD Master Prompt)
## ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)

---

## 📌 วิธีนำไปใช้งานใน Canva

คุณสามารถนำ Prompt ด้านล่างไปใช้ใน Canva ได้ **2 รูปแบบหลัก**:
1. **สร้างเป็นหน้าสไลด์นำเสนอ (Canva Presentation 16:9):** คัดลอก [Prompt แบบที่ 1](#แบบที่-1-prompt-สำหรับสร้างสไลด์-er-diagram-ใน-canva-presentation) ไปวางใน **Canva Magic Design** เพื่อสร้างสไลด์สรุปโครงสร้างฐานข้อมูล 4 โซน
2. **สร้างเป็นผัง ERD บนไวท์บอร์ด (Canva Whiteboard / Flowchart):** คัดลอก [Prompt แบบที่ 2](#แบบที่-2-prompt-สำหรับ-canva-whiteboard--diagram-maker) ไปวางเพื่อสร้างกล่องเอนทิตี (Entities) และเส้นเชื่อมโยงความสัมพันธ์ (Connectors)

---

## แบบที่ 1: Prompt สำหรับสร้างสไลด์ ER Diagram ใน Canva Presentation
> **แนะนำ:** สำหรับใช้สร้างสไลด์นำเสนอหน้า **"สถาปัตยกรรมฐานข้อมูลและผังความสัมพันธ์ (Database Architecture & ER Diagram)"**  
> ให้เลือก Canva Presentation ➔ กด **Canva Magic Design / AI Presentation** ➔ วาง Prompt นี้:

```text
สร้างหน้าสไลด์นำเสนอเชิงวิชาการและเทคโนโลยีระดับมืออาชีพ (16:9) ในหัวข้อ "สถาปัตยกรรมฐานข้อมูลและผังความสัมพันธ์ (Database ER Diagram)" ของระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ 

ธีมการออกแบบ:
- โทนสีม่วงสถาบัน (Royal Purple #6B21A8) และสีขาวทันสมัย (Clean White & Slate)
- จัดเลย์เอาต์แบบ Infographic แบ่งเป็น 4 การ์ดสี่เหลี่ยมโค้งมน (4 Functional Entity Cards) พร้อมไอคอนกำกับแต่ละกลุ่ม:

[การ์ดที่ 1: โครงสร้างองค์กรและผู้ใช้งาน (Organization & Users)]
- faculties (คณะ) [1] ────< [N] departments (สาขาวิชา)
- departments [1] ────< [N] users (ผู้ใช้งาน: ADMIN, TEACHER, DEAN, PRESIDENT)
- จุดเด่น: รองรับ Data Isolation แยกสิทธิ์ตามคณะและสาขาวิชา

[การ์ดที่ 2: ยุทธศาสตร์แบบ Cascading 4 ขั้น (Cascading Strategy & Master Data)]
- local_development_issues (ประเด็นพัฒนาท้องถิ่น) [1] ────< [N] strategies (ยุทธศาสตร์)
- strategies [1] ────< [N] sub_strategies (แผนงานย่อย)
- sub_strategies [1] ────< [N] indicators (ตัวชี้วัด)
- ข้อมูลพื้นฐานร่วม: fiscal_years (ปีงบประมาณ), budget_sources (แหล่งเงิน)

[การ์ดที่ 3: โครงการ กิจกรรม และหลักฐาน (Core Projects & Evidence)]
- projects (โครงการหลัก): ผูกโยงกับ sub_strategies, indicators, คณะ, สาขา และผู้สร้าง
- projects [1] ────< [N] activities (กิจกรรมย่อย คำนวณความก้าวหน้าอัตโนมัติ)
- activities [1] ────< [N] activity_images (รูปภาพหลักฐานจริงเชิงประจักษ์)
- projects [N] ──── [M] users (เชื่อมโยงทีมงานผ่าน project_users)
- จุดเด่น: มีระบบ Plan Locking ล็อกแผนงานเมื่อเริ่มกิจกรรม และระบบ Executive Directives

[การ์ดที่ 4: การดูแลระบบและสนับสนุน (Support & Maintenance)]
- users [1] ────< [N] issue_reports (แจ้งปัญหาและบันทึกการแก้ไขจากผู้ดูแลระบบ)

ด้านล่างของสไลด์: มีแถบสรุปตัวชี้วัดสถาปัตยกรรม:
- รวมทั้งหมด 14 ตาราง (14 Relational Tables)
- รองรับ Cascading 4 ระดับสมบูรณ์แบบ
- มีระบบ Foreign Keys และ Cascade Delete ป้องกันข้อมูลกำพร้า
```

---

## แบบที่ 2: Prompt สำหรับ Canva Whiteboard / Diagram Maker
> **แนะนำ:** สำหรับใช้วาดผังตาราง ER Diagram กล่องสี่เหลี่ยมเชื่อมโยงเส้นสายบนกระดานไวท์บอร์ด Canva:

```text
Create an interactive Entity-Relationship Diagram (ERD) flowchart on a whiteboard layout with a modern purple tech palette for "BRU Strategic Tracking System". 
Display 14 database entity boxes connected with standard Crow's Foot / ER notation connectors (1-to-many and many-to-many):

1. Organization Cluster (Top-Left):
   - Table "faculties": (PK id, UK name)
   - Table "departments": (PK id, UK name, FK faculty_id)
   - Table "users": (PK id, UK username, password, name, role, FK department_id, avatar)
   Connections: faculties (1) to departments (N), departments (1) to users (N).

2. Strategic Cascading Cluster (Top-Right):
   - Table "local_development_issues": (PK id, UK code, name)
   - Table "strategies": (PK id, UK code, name, FK local_issue_id)
   - Table "sub_strategies": (PK id, UK code, name, FK strategy_id)
   - Table "indicators": (PK id, UK code, name, FK sub_strategy_id)
   - Table "fiscal_years": (PK id, UK year, active)
   - Table "budget_sources": (PK id, UK name)
   Connections: Sequential 1-to-N cascade down from local_issues -> strategies -> sub_strategies -> indicators.

3. Execution & Tracking Cluster (Center & Bottom):
   - Table "projects": (PK id, name, FK sub_strategy_id, FK indicator_id, FK faculty_id, FK department_id, FK creator_id, FK fiscal_year_id, FK budget_source_id, total_budget, target_count, progress, is_locked, directives)
   - Table "project_users": (Composite PK: project_id, user_id)
   - Table "activities": (PK id, FK project_id, name, budget, actual_budget, completed_count, is_locked)
   - Table "activity_images": (PK id, FK activity_id, file_path)
   Connections: sub_strategies (1) to projects (N), projects (1) to activities (N), activities (1) to activity_images (N), projects (N) to (M) users via project_users.

4. System Support Cluster (Bottom-Right):
   - Table "issue_reports": (PK id, FK user_id, title, description, priority, status, admin_note)
   Connections: users (1) to issue_reports (N).

Design Style:
- Clean rounded rectangle entity cards with dark purple headers and white body.
- Visible PK, FK labels and clean arrow connectors.
```

---

## แบบที่ 3: Prompt ภาษาอังกฤษ (Canva Magic Design / AI Presentation)
> สำหรับ Canva บัญชีที่ใช้เมนูภาษาอังกฤษ หรือโปรแกรมสร้างสไลด์ AI สากล (Gamma / Beautiful.ai / Tome):

```text
Design a high-tech academic slide titled "Database Entity-Relationship Architecture (ERD)" for Buriram Rajabhat University's Strategic Tracking System.

Color Scheme:
- Theme: Elegant Academic Royal Purple (#6B21A8), Lavender accents, and Clean White background.

Layout Structure (4 Strategic Functional Columns/Cards):
1. User & Organizational Hierarchy:
   - faculties (1) -> (N) departments (1) -> (N) users (Roles: ADMIN, TEACHER, DEAN, PRESIDENT).
   - Enforces faculty-level multi-tenant data isolation.

2. 4-Tier Cascading Strategy Engine:
   - local_development_issues (1) -> (N) strategies (1) -> (N) sub_strategies (1) -> (N) indicators.
   - Master data tables: fiscal_years, budget_sources.

3. Core Project & Evidence Tracking:
   - projects mapped to sub_strategies, departments, and fiscal years.
   - projects (1) -> (N) activities (1) -> (N) activity_images (Photo Evidence).
   - projects (N) <-> (M) users via project_users table.
   - Core Features: Plan-Locking flag, automated % progress rollup, and Executive Directives.

4. Governance & System Support:
   - issue_reports linked to users with resolution workflows and priority status.

Footer Metrics:
- 14 Normalized Relational Tables (MySQL / Prisma ORM)
- Referential Integrity with Cascade Deletion
- Strict Role-Based Access Control (RBAC) & IDOR Protection
```

---

## 💡 เคล็ดลับเพิ่มเติมในการใส่ ER Diagram ใน Canva ให้ดูมืออาชีพที่สุด

หากต้องการให้แผนภาพบน Canva ออกมาคมชัดระดับเวกเตอร์ 100% โดยไม่ต้องจัดกล่องทีละตัวใน Canva:

1. **นำเข้าจาก dbdiagram.io (แนะนำมากที่สุด):**
   - คัดลอกโค้ด DBML จากไฟล์ [database_er_prompt.md](file:///c:/St_bru/database_er_prompt.md) ไปวางที่ [https://dbdiagram.io](https://dbdiagram.io)
   - กดปุ่ม **Export ➔ Export to PNG หรือ PDF**
   - นำไฟล์รูปภาพที่ได้ลากมาวางลงในสไลด์ Canva แล้วใส่กรอบเงา (Shadow) หรือ Mockup จอคอมพิวเตอร์
2. **ใช้ Canva Magic Switch:**
   - นำ Prompt แบบที่ 1 ไปใส่ใน Canva Docs
   - กดปุ่ม **"แปลง (Transform)" ➔ "แปลงเป็นงานนำเสนอ (Docs to Presentation)"** Canva จะจัดสไลด์ให้อัตโนมัติใน 1 วินาที!
