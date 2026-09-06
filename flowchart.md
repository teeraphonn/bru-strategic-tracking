# คู่มืออธิบายการทำงานของระบบตามบทบาทผู้ใช้งาน (Role-Based Workflow Manual)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

---

### 🟢 1. จุดเริ่มต้นของระบบ (System Start Point)
* **การเริ่มต้น (Authentication & Role Check):** ผู้ใช้งานทุกคนเข้าสู่ระบบผ่านหน้า Login เดียวกัน โดยระบบจะตรวจสอบความถูกต้องของบัญชีผู้ใช้ด้วยระบบ **JWT Token** และส่งต่อผู้ใช้งานไปยังหน้าการทำงานเฉพาะตาม **บทบาท (RBAC: Role-Based Access Control)** ที่ตนเองได้รับมอบหมาย

---

### 👥 2. หน้าที่การทำงานแบบย่อ แบ่งตาม 4 บทบาทหลัก (Roles & Concise Duties)

#### 1) ⚙️ ผู้ดูแลระบบ (ADMIN) — *ผู้เตรียมความพร้อมระบบ*
* **หน้าที่หลัก:** 
  1. จัดการข้อมูลหลัก (Master Data): เพิ่ม/แก้ไข คณะทั้ง 9 คณะ, ภาควิชา, แหล่งเงินทุน และเปิดรอบปีงบประมาณ
  2. กำหนดโครงสร้างยุทธศาสตร์: 6 ประเด็นยุทธศาสตร์ (S1-S6), ตัวชี้วัด และ 10 โครงการหลัก
  3. จัดการบัญชีผู้ใช้ & กำหนด Role ให้กับบุคลากรในมหาวิทยาลัย
  4. ศูนย์รับแจ้งปัญหา & ปลดล็อกแผนงาน (Unlock Plan) ในกรณีที่มีคำร้องขอปรับเปลี่ยนเป้าหมายตามระเบียบ

#### 2) 📝 อาจารย์ / ผู้รับผิดชอบโครงการ (TEACHER) — *ผู้ปฏิบัติการและรายงานผล*
* **หน้าที่หลัก:**
  1. สร้างข้อเสนอโครงการ (Proposal): ผูกโครงการกับยุทธศาสตร์ S1-S6, ตัวชี้วัด และงบประมาณที่ได้รับจัดสรร
  2. วางแผนกิจกรรมย่อย (Activities): ระบุกำหนดการจัดกิจกรรมและวงเงินตามแผน
  3. ลงมือดำเนินกิจกรรมจริงในพื้นที่
  4. บันทึกผลงานจริง (Actual Reporting): บันทึกงบใช้จริง (`actualBudget`), ผลผลิตที่ทำได้ (`completedCount`) และอัปโหลดภาพถ่ายหลักฐานกิจกรรม
  5. รับข้อสั่งการเร่งรัดจากผู้บริหารและรายงานผลการปรับปรุง

#### 3) 🏛️ คณบดี / ผู้บริหารระดับคณะ (DEAN) — *ผู้กำกับติดตามระดับคณะ*
* **หน้าที่หลัก:**
  1. ติดตามแดชบอร์ดระดับคณะ: ดู % ความก้าวหน้าเฉลี่ย และยอดเบิกจ่ายงบประมาณเฉพาะคณะของตนเอง
  2. เปรียบเทียบผลงานรายภาควิชา/สาขาวิชา (Department Breakdown)
  3. ตรวจสอบโครงการติดธงแดงระดับคณะ (Faculty Red Flags): คัดกรองโครงการที่ช้าหรือเบิกจ่ายต่ำกว่าเป้า
  4. ออกข้อสั่งการระดับคณบดี (`deanDirective`): ส่งตรงถึงอาจารย์ผู้รับผิดชอบโครงการเพื่อเร่งรัดการดำเนินงาน

#### 4) 👑 อธิการบดี / ผู้บริหารระดับสถาบัน (PRESIDENT) — *ผู้กำกับนโยบายภาพรวมมหาวิทยาลัย*
* **หน้าที่หลัก:**
  1. ติดตามภาพรวมยุทธศาสตร์สถาบัน: ดูผลสัมฤทธิ์แยกตาม 6 ประเด็นยุทธศาสตร์ (S1-S6)
  2. ตรวจสอบตารางเปรียบเทียบผลงาน 9 คณะ (Cross-Faculty Heatmap)
  3. กำกับติดตาม 10 โครงการหลักของมหาวิทยาลัย (10 Main Projects)
  4. จัดการเชิงยกเว้น (Management by Exception): ตรวจสอบโครงการวิกฤตระดับสถาบัน (Critical Red Flags)
  5. ออกข้อสั่งการระดับอธิการบดี (`presidentDirective`): สั่งการเชิงนโยบายเพื่อขับเคลื่อนยุทธศาสตร์

#### ⚙️ *กลไกกลางอัตโนมัติ (CORE SYSTEM ENGINE)*
* ประมวลผลคำนวณ % ความก้าวหน้า และ % การใช้จ่ายงบประมาณแบบ Real-Time
* ตัดเกรดสุขภาพโครงการอัตโนมัติ 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต
* สั่งล็อกแผนงานอัตโนมัติ (`IsLocked = true`) ทันทีที่มีการบันทึกผลงานจริง เพื่อป้องกันการแก้ไขตัวเลขเป้าหมายย้อนหลัง

---

### 🏁 3. จุดสิ้นสุดของระบบ (System End Point)
* **การสิ้นสุด (Reporting & Strategic Evaluation):** 
  * เมื่อทุกโครงการดำเนินงานและรายงานผลจริงครบถ้วน ระบบจะสรุปผลสัมฤทธิ์ภาพรวมทั้งหมด
  * ทุกบทบาทสามารถส่งออกเอกสารทางการ (PDF มาตรฐานราชการ / Excel ข้อมูลดิบ / CSV) หรือสั่งพิมพ์แบบฟอร์มทางการ A4 Print Layout เพื่อนำเสนอต่อผู้บริหาร คณะกรรมการบริหารมหาวิทยาลัย และสภามหาวิทยาลัย เป็นอันเสร็จสิ้นวงจรการประเมินยุทธศาสตร์ประจำปีงบประมาณ

---

### 📊 ผังกระบวนการทำงาน (Role-Based System Flowchart)

```mermaid
flowchart TD
    %% COLOR STYLES
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef router fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef admin fill:#f0f9ff,stroke:#0284c7,stroke-width:1.8px,color:#0369a1;
    classDef teacher fill:#f0fdf4,stroke:#16a34a,stroke-width:1.8px,color:#15803d;
    classDef engine fill:#fefce8,stroke:#ca8a04,stroke-width:1.8px,color:#854d0e;
    classDef dean fill:#faf5ff,stroke:#9333ea,stroke-width:1.8px,color:#6b21a8;
    classDef pres fill:#fff1f2,stroke:#e11d48,stroke-width:1.8px,color:#9f1239;
    classDef report fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.8px,color:#3730a3;

    %% 1. START POINT
    Start([🟢 1. เริ่มต้น : เข้าสู่ระบบ Authentication]) :::startEnd

    Start --> AuthRouter{2. ตรวจสอบ Role ผู้ใช้งาน} :::router

    %% 2. ADMIN ROLE
    AuthRouter -->|ADMIN| R_Admin["<b>⚙️ บทบาท : ผู้ดูแลระบบ (Admin)</b><br/>• เตรียมข้อมูลหลัก: 9 คณะ, ปีงบประมาณ, S1-S6, 10 โครงการหลัก<br/>• จัดการบัญชีผู้ใช้งาน และปลดล็อกแผนงานตามคำร้อง"] :::admin

    %% 3. TEACHER ROLE
    AuthRouter -->|TEACHER| R_Teacher["<b>📝 บทบาท : อาจารย์ / ผู้รับผิดชอบ (Teacher)</b><br/>• สร้างข้อเสนอโครงการ ผูกยุทธศาสตร์ S1-S6 & วางแผนกิจกรรม<br/>• ดำเนินงานจริง + บันทึกงบจริง + ผลิตจริง + แนบภาพถ่าย"] :::teacher

    R_Admin --> R_Teacher

    %% 4. CORE ENGINE
    R_Teacher --> Engine["<b>🧠 ระบบประมวลผลกลาง (System Core Engine)</b><br/>• คำนวณ % ก้าวหน้าสะสม & % เบิกจ่ายงบประมาณ Real-time<br/>• ตัดเกรดสถานะสี: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ล็อกแผนงาน IsLocked ป้องกันการแก้ตัวเลขย้อนหลัง"] :::engine

    %% 5. DEAN & PRESIDENT ROLES
    AuthRouter -->|DEAN| R_Dean["<b>🏛️ บทบาท : คณบดี (Dean)</b><br/>• กำกับภาพรวมระดับคณะ & รายภาควิชา<br/>• ตรวจสอบธงแดงคณะ & ออกข้อสั่งการคณบดี"] :::dean

    AuthRouter -->|PRESIDENT| R_Pres["<b>👑 บทบาท : อธิการบดี (President)</b><br/>• กำกับภาพรวมมหาวิทยาลัย & ผลสัมฤทธิ์ S1-S6<br/>• ดู Heatmap 9 คณะ, 10 โครงการหลัก & ออกข้อสั่งการอธิการ"] :::pres

    Engine --> R_Dean
    Engine --> R_Pres

    %% Directive Loop
    R_Dean -.->|ส่งข้อสั่งการเร่งรัด| R_Teacher
    R_Pres -.->|ส่งข้อสั่งการเร่งรัด| R_Teacher

    %% 6. REPORTING
    R_Dean --> Report["<b>📄 สรุปผลสัมฤทธิ์และส่งออกรายงาน (Reporting)</b><br/>• ส่งออกไฟล์ราชการ PDF / Excel / CSV<br/>• สั่งพิมพ์แบบฟอร์มทางการ A4 นำเสนอสภามหาวิทยาลัย"] :::report
    R_Pres --> Report

    %% 7. END POINT
    Report --> End([🏁 7. สิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Mermaid Code)

```text
flowchart TD
    %% COLOR STYLES
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef router fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef admin fill:#f0f9ff,stroke:#0284c7,stroke-width:1.8px,color:#0369a1;
    classDef teacher fill:#f0fdf4,stroke:#16a34a,stroke-width:1.8px,color:#15803d;
    classDef engine fill:#fefce8,stroke:#ca8a04,stroke-width:1.8px,color:#854d0e;
    classDef dean fill:#faf5ff,stroke:#9333ea,stroke-width:1.8px,color:#6b21a8;
    classDef pres fill:#fff1f2,stroke:#e11d48,stroke-width:1.8px,color:#9f1239;
    classDef report fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.8px,color:#3730a3;

    %% 1. START POINT
    Start([🟢 1. เริ่มต้น : เข้าสู่ระบบ Authentication]) :::startEnd

    Start --> AuthRouter{2. ตรวจสอบ Role ผู้ใช้งาน} :::router

    %% 2. ADMIN ROLE
    AuthRouter -->|ADMIN| R_Admin["<b>⚙️ บทบาท : ผู้ดูแลระบบ (Admin)</b><br/>• เตรียมข้อมูลหลัก: 9 คณะ, ปีงบประมาณ, S1-S6, 10 โครงการหลัก<br/>• จัดการบัญชีผู้ใช้งาน และปลดล็อกแผนงานตามคำร้อง"] :::admin

    %% 3. TEACHER ROLE
    AuthRouter -->|TEACHER| R_Teacher["<b>📝 บทบาท : อาจารย์ / ผู้รับผิดชอบ (Teacher)</b><br/>• สร้างข้อเสนอโครงการ ผูกยุทธศาสตร์ S1-S6 & วางแผนกิจกรรม<br/>• ดำเนินงานจริง + บันทึกงบจริง + ผลิตจริง + แนบภาพถ่าย"] :::teacher

    R_Admin --> R_Teacher

    %% 4. CORE ENGINE
    R_Teacher --> Engine["<b>🧠 ระบบประมวลผลกลาง (System Core Engine)</b><br/>• คำนวณ % ก้าวหน้าสะสม & % เบิกจ่ายงบประมาณ Real-time<br/>• ตัดเกรดสถานะสี: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ล็อกแผนงาน IsLocked ป้องกันการแก้ตัวเลขย้อนหลัง"] :::engine

    %% 5. DEAN & PRESIDENT ROLES
    AuthRouter -->|DEAN| R_Dean["<b>🏛️ บทบาท : คณบดี (Dean)</b><br/>• กำกับภาพรวมระดับคณะ & รายภาควิชา<br/>• ตรวจสอบธงแดงคณะ & ออกข้อสั่งการคณบดี"] :::dean

    AuthRouter -->|PRESIDENT| R_Pres["<b>👑 บทบาท : อธิการบดี (President)</b><br/>• กำกับภาพรวมมหาวิทยาลัย & ผลสัมฤทธิ์ S1-S6<br/>• ดู Heatmap 9 คณะ, 10 โครงการหลัก & ออกข้อสั่งการอธิการ"] :::pres

    Engine --> R_Dean
    Engine --> R_Pres

    %% Directive Loop
    R_Dean -.->|ส่งข้อสั่งการเร่งรัด| R_Teacher
    R_Pres -.->|ส่งข้อสั่งการเร่งรัด| R_Teacher

    %% 6. REPORTING
    R_Dean --> Report["<b>📄 สรุปผลสัมฤทธิ์และส่งออกรายงาน (Reporting)</b><br/>• ส่งออกไฟล์ราชการ PDF / Excel / CSV<br/>• สั่งพิมพ์แบบฟอร์มทางการ A4 นำเสนอสภามหาวิทยาลัย"] :::report
    R_Pres --> Report

    %% 7. END POINT
    Report --> End([🏁 7. สิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```
