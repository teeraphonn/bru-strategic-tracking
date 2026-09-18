# Prompt สร้าง Data ER Diagram สำหรับสไลด์ Canva (1 หน้าเดี่ยวจบ - Single Slide)
## ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU Strategic Tracking System)

เอกสารนี้จัดทำขึ้นสำหรับนำไป **แทรกเป็นสไลด์ 1 หน้า** ในชุดงานนำเสนอเดิมของคุณ โดยจัดเนื้อหาให้พอดีกับสไลด์ขนาด 16:9 สวยงาม กระชับ และครบทั้ง 14 ตาราง

---

## 🎯 ส่วนที่ 1: Prompt สั่ง Canva AI เจนสไลด์ 1 หน้าทันที (Canva Magic Design)

> **วิธีใช้งาน:**  
> 1. ใน Canva เปิดงานนำเสนอเดิมของคุณ แล้ว **กดเพิ่มหน้าใหม่ (Add Page)** 1 หน้า  
> 2. กดที่เครื่องมือ **Canva Magic Design / AI** (หรือ Magic Switch)  
> 3. คัดลอก Prompt ด้านล่างนี้ไปวาง แล้วกดสร้างได้ทันที:

```text
สร้างสไลด์นำเสนอเชิงวิชาการและสถาปัตยกรรมซอฟต์แวร์ 1 หน้าเดี่ยว (Single Slide 16:9) หัวข้อ: "สถาปัตยกรรมฐานข้อมูลและผังความสัมพันธ์ (Database ER Diagram)" ของระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์

ธีมและดีไซน์:
- โทนสีม่วงสถาบัน (#6B21A8) และสีขาว คลีน ทันสมัย สไตล์ Modern Tech
- จัดเลย์เอาต์หน้าจอแบ่งเป็น 4 การ์ดสี่เหลี่ยม (4 Functional Box Cards) แสดง 14 ตารางหลักและความสัมพันธ์ (1:N, N:M):

[กล่องที่ 1: โครงสร้างองค์กรและผู้ใช้งาน (Organization & Users)]
• faculties (คณะ) [1] ───< [N] departments (สาขาวิชา)
• departments [1] ───< [N] users (ผู้ใช้งาน 4 Roles: ADMIN, TEACHER, DEAN, PRESIDENT)
• จุดเด่น: รองรับ Data Isolation แยกสิทธิ์กำกับดูแลตามคณะและสาขา

[กล่องที่ 2: ยุทธศาสตร์ 4 ระดับ (Cascading Strategy & Master Data)]
• local_development_issues [1] ───< [N] strategies (ยุทธศาสตร์หลัก)
• strategies [1] ───< [N] sub_strategies (แผนงานย่อย)
• sub_strategies [1] ───< [N] indicators (ตัวชี้วัดความสำเร็จ)
• ข้อมูลพื้นฐานร่วม: fiscal_years (ปีงบประมาณ), budget_sources (แหล่งเงิน)

[กล่องที่ 3: โครงการ กิจกรรม และหลักฐาน (Projects & Evidence)]
• projects (โครงการหลัก): ผูก sub_strategies, คณะ, สาขา, ผู้สร้าง
• projects [1] ───< [N] activities (กิจกรรมย่อย คำนวณความก้าวหน้าอัตโนมัติ)
• activities [1] ───< [N] activity_images (รูปภาพหลักฐานจริงเชิงประจักษ์)
• projects [N] ─── [M] users (เชื่อมโยงทีมงานผ่าน project_users)
• จุดเด่น: Plan Locking ล็อกแผนงานเมื่อเริ่มกิจกรรม และบันทึกข้อสั่งการผู้บริหาร

[กล่องที่ 4: ระบบสนับสนุนและแจ้งปัญหา (Support & Logs)]
• users [1] ───< [N] issue_reports (แจ้งปัญหาการใช้งาน บันทึกผลโดย Admin)

แถบสรุปด้านล่าง (Footer Stats):
✓ 14 Normalized Relational Tables (MySQL & Prisma ORM)  |  ✓ 4-Tier Cascading Alignment  |  ✓ Referential Integrity with Cascade Delete
```

---

## 📋 ส่วนที่ 2: ข้อความสำเร็จรูปสำหรับคัดลอกไปแปะลงสไลด์ 1 หน้าด้วยตนเอง (Manual Copy-Paste)

> หากใน Canva มีเทมเพลตสไลด์เปล่าอยู่แล้ว และต้องการ **ก็อปปี้ข้อความไปวางใส่กล่อง 4 กล่องทันที**:

### หัวข้อสไลด์ (Slide Header):
* **หัวข้อหลัก (Title):** สถาปัตยกรรมฐานข้อมูลและผังความสัมพันธ์ (Database ER Diagram)
* **หัวข้อย่อย (Subtitle):** โครงสร้าง 14 ตารางเชิงสัมพันธ์ (Relational Schema) ภายใต้สถาปัตยกรรม Cascading 4 ระดับ

---

### เนื้อหาในการ์ดทั้ง 4 กล่อง:

| กล่องที่ 1: โครงสร้างองค์กรและผู้ใช้งาน | กล่องที่ 2: แผนยุทธศาสตร์ Cascading 4 ขั้น |
| :--- | :--- |
| **Organization & Users**<br>• `faculties` (คณะ)<br>&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `departments` (สาขาวิชา)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `users` (ผู้ใช้งานระบบ)<br><br>• **4 Roles:** ADMIN, TEACHER, DEAN, PRESIDENT<br>• **ความปลอดภัย:** แยกสิทธิ์และข้อมูลตามคณะ (Data Isolation) | **Cascading Strategy & Master Data**<br>• `local_development_issues` (ประเด็นพัฒนาท้องถิ่น)<br>&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `strategies` (ยุทธศาสตร์มหาวิทยาลัย)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `sub_strategies` (แผนงานย่อย)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `indicators` (ตัวชี้วัด)<br><br>• **ตารางร่วม:** `fiscal_years` (ปีงบฯ), `budget_sources` (แหล่งเงิน) |

| กล่องที่ 3: โครงการ กิจกรรม และหลักฐานเชิงประจักษ์ | กล่องที่ 4: การดูแลระบบและสนับสนุน |
| :--- | :--- |
| **Core Projects & Evidence**<br>• `projects` (โครงการหลัก) ผูกยุทธศาสตร์ 4 ระดับ<br>&nbsp;&nbsp;&nbsp;├── (1:N) ➔ `activities` (กิจกรรมย่อย)<br>&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `activity_images` (ภาพหลักฐานจริง)<br>&nbsp;&nbsp;&nbsp;└── (N:M) ➔ `users` (ทีมงานผ่าน `project_users`)<br><br>• **ฟังก์ชันเด่น:** Plan Locking ป้องกันลดเป้าหมายย้อนหลัง<br>• **Directives:** บันทึกข้อสั่งการจากคณบดีและอธิการบดี | **Support & Maintenance**<br>• `users`<br>&nbsp;&nbsp;&nbsp;└── (1:N) ➔ `issue_reports` (แจ้งปัญหาระบบ)<br><br>• **ระบบติดตามปัญหา:** ระบุระดับความสำคัญ (Priority) และสถานะการแก้ไขโดย Admin พร้อมบันทึก Admin Note |

---

### แถบสรุปท้ายสไลด์ (Footer Highlights):
* **14 ตารางเชิงสัมพันธ์ (Relational Tables)** ผ่านการนอร์มัลไลซ์ (Normalization) ไร้ข้อมูลซ้ำซ้อน
* **Cascading Alignment 4 ระดับ** เชื่อมโยงเป้าหมายมหาวิทยาลัยลงสู่ระดับกิจกรรมจริง 100%
* **Cascade Delete & Data Integrity** มี Foreign Keys ควบคุมความถูกต้องและป้องกันข้อมูลกำพร้า

---

## 💡 ทริคเสริม: ใส่ภาพ ER Diagram สวยๆ ใน 30 วินาที
1. เข้าเว็บฟรี **[dbdiagram.io](https://dbdiagram.io)**
2. คัดลอกโค้ด DBML จากไฟล์ [database_er_prompt.md](file:///c:/St_bru/database_er_prompt.md) ไปวาง
3. กด **Export to PNG** แล้วนำภาพมาวางคู่กับข้อความในการ์ดบน Canva ได้ทันที
