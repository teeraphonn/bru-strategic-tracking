# ผังกระบวนการทำงานของระบบแบบแนวตรงลากยาว (Role-Based Straight Vertical Flowchart)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

ผังงานนี้รวบรวมบทบาทหน้าที่ของทุก Role จัดวางเป็น **เส้นตรงแนวดิ่งเส้นเดียว ลากยาวจากบนลงล่าง (Single Vertical Pipeline)** จุดเริ่มต้นอยู่บนสุด จุดสิ้นสุดอยู่ล่างสุด เส้นตรง สบายตา และเข้าใจง่ายที่สุด

---

### 📊 ผังกระบวนการแนวตรงลากยาว (Straight Vertical Flowchart)

```mermaid
flowchart TD
    %% ==========================================
    %% COLOR & STYLE DEFINITIONS
    %% ==========================================
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef adminNode fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-size:14px;
    classDef teacherNode fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#15803d,font-size:14px;
    classDef engineNode fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#854d0e,font-size:14px;
    classDef deanNode fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8,font-size:14px;
    classDef presNode fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#9f1239,font-size:14px;
    classDef reportNode fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#3730a3,font-size:14px;

    %% ==========================================
    %% 1. START POINT (TOP)
    %% ==========================================
    Start([🟢 1. จุดเริ่มต้น : เข้าสู่ระบบ Authentication & ยืนยันตัวตนด้วย JWT Token]) :::startEnd

    %% ==========================================
    %% 2. ADMIN ROLE
    %% ==========================================
    Start --> S1["<b>⚙️ 2. บทบาทผู้ดูแลระบบ (ADMIN) : จัดเตรียมข้อมูลหลัก (Master Data)</b><br/>• กำหนดข้อมูลโครงสร้าง: 9 คณะ, ภาควิชา, แหล่งเงินทุน และเปิดรอบปีงบประมาณ<br/>• กำหนดโครงสร้างยุทธศาสตร์: 6 ประเด็นยุทธศาสตร์ (S1-S6), ตัวชี้วัด และ 10 โครงการหลัก<br/>• บริหารจัดการบัญชีผู้ใช้งาน (RBAC) และดูแลการปลดล็อกแผนงานตามระเบียบ"] :::adminNode

    %% ==========================================
    %% 3. TEACHER ROLE
    %% ==========================================
    S1 --> S2["<b>📝 3. บทบาทอาจารย์ / ผู้รับผิดชอบ (TEACHER) : ดำเนินงาน & บันทึกผลจริง</b><br/>• สร้างข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และตั้งงบประมาณ<br/>• กำหนดแผนกิจกรรมย่อย (Activities) ระบุวันจัดกิจกรรมและงบตามแผน<br/>• ลงพื้นที่จัดกิจกรรมจริง + บันทึกงบใช้จริง (actualBudget) + ผลผลิตจริง (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์ (Evidence Gallery)"] :::teacherNode

    %% ==========================================
    %% 4. CORE ENGINE
    %% ==========================================
    S2 --> S3["<b>🧠 4. กลไกระบบประมวลผลกลาง (SYSTEM CORE ENGINE) : คำนวณอัตโนมัติ</b><br/>• คำนวณ % ความก้าวหน้าสะสม (% Progress) และ % การใช้จ่ายงบประมาณ Real-Time<br/>• ตัดเกรดประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต (Red Flag)<br/>• สั่งล็อกแผนงานอัตโนมัติ (IsLocked) ป้องกันการแก้ไขตัวเลขเป้าหมายย้อนหลัง"] :::engineNode

    %% ==========================================
    %% 5. DEAN ROLE
    %% ==========================================
    S3 --> S4["<b>🏛️ 5. บทบาทคณบดี (DEAN) : กำกับติดตามระดับคณะ</b><br/>• ติดตามแดชบอร์ดความก้าวหน้าและงบประมาณเฉพาะคณะตนเอง<br/>• เปรียบเทียบผลงานรายภาควิชา/สาขาวิชา (Department Breakdown)<br/>• ตรวจสอบโครงการติดธงแดงระดับคณะ (Faculty Red Flags) และออกข้อสั่งการเร่งรัด"] :::deanNode

    %% ==========================================
    %% 6. PRESIDENT ROLE
    %% ==========================================
    S4 --> S5["<b>👑 6. บทบาทอธิการบดี (PRESIDENT) : กำกับยุทธศาสตร์ระดับสถาบัน</b><br/>• ติดตามผลสัมฤทธิ์ภาพรวม 6 ประเด็นยุทธศาสตร์มหาวิทยาลัย (S1-S6)<br/>• ตรวจสอบตารางเปรียบเทียบผลงาน 9 คณะ (Cross-Faculty Heatmap) & 10 โครงการหลัก<br/>• ตรวจสอบโครงการวิกฤต (Critical Red Flags) และออกข้อสั่งการนโยบายเร่งรัด"] :::presNode

    %% ==========================================
    %% 7. REPORTING
    %% ==========================================
    S5 --> S6["<b>📄 7. การสรุปผลและออกรายงาน (REPORTING & OUTPUTS) : ทุกระดับผู้ใช้</b><br/>• สรุปผลสัมฤทธิ์เชิงยุทธศาสตร์เพื่อนำเสนอสภามหาวิทยาลัย<br/>• ส่งออกไฟล์รายงานทางการ: PDF มาตรฐานราชการ / Excel ข้อมูลดิบ / CSV<br/>• สั่งพิมพ์แบบฟอร์มรายงานทางการ A4 Print Layout"] :::reportNode

    %% ==========================================
    %% 8. END POINT (BOTTOM)
    %% ==========================================
    S6 --> End([🏁 8. จุดสิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์ประจำปีงบประมาณ]) :::startEnd
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Mermaid Code)

```text
flowchart TD
    %% COLOR & STYLE DEFINITIONS
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef adminNode fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-size:14px;
    classDef teacherNode fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#15803d,font-size:14px;
    classDef engineNode fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#854d0e,font-size:14px;
    classDef deanNode fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8,font-size:14px;
    classDef presNode fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#9f1239,font-size:14px;
    classDef reportNode fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#3730a3,font-size:14px;

    %% 1. START POINT (TOP)
    Start([🟢 1. จุดเริ่มต้น : เข้าสู่ระบบ Authentication & ยืนยันตัวตนด้วย JWT Token]) :::startEnd

    %% 2. ADMIN ROLE
    Start --> S1["<b>⚙️ 2. บทบาทผู้ดูแลระบบ (ADMIN) : จัดเตรียมข้อมูลหลัก (Master Data)</b><br/>• กำหนดข้อมูลโครงสร้าง: 9 คณะ, ภาควิชา, แหล่งเงินทุน และเปิดรอบปีงบประมาณ<br/>• กำหนดโครงสร้างยุทธศาสตร์: 6 ประเด็นยุทธศาสตร์ (S1-S6), ตัวชี้วัด และ 10 โครงการหลัก<br/>• บริหารจัดการบัญชีผู้ใช้งาน (RBAC) และดูแลการปลดล็อกแผนงานตามระเบียบ"] :::adminNode

    %% 3. TEACHER ROLE
    S1 --> S2["<b>📝 3. บทบาทอาจารย์ / ผู้รับผิดชอบ (TEACHER) : ดำเนินงาน & บันทึกผลจริง</b><br/>• สร้างข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และตั้งงบประมาณ<br/>• กำหนดแผนกิจกรรมย่อย (Activities) ระบุวันจัดกิจกรรมและงบตามแผน<br/>• ลงพื้นที่จัดกิจกรรมจริง + บันทึกงบใช้จริง (actualBudget) + ผลผลิตจริง (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์ (Evidence Gallery)"] :::teacherNode

    %% 4. CORE ENGINE
    S2 --> S3["<b>🧠 4. กลไกระบบประมวลผลกลาง (SYSTEM CORE ENGINE) : คำนวณอัตโนมัติ</b><br/>• คำนวณ % ความก้าวหน้าสะสม (% Progress) และ % การใช้จ่ายงบประมาณ Real-Time<br/>• ตัดเกรดประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต (Red Flag)<br/>• สั่งล็อกแผนงานอัตโนมัติ (IsLocked) ป้องกันการแก้ไขตัวเลขเป้าหมายย้อนหลัง"] :::engineNode

    %% 5. DEAN ROLE
    S3 --> S4["<b>🏛️ 5. บทบาทคณบดี (DEAN) : กำกับติดตามระดับคณะ</b><br/>• ติดตามแดชบอร์ดความก้าวหน้าและงบประมาณเฉพาะคณะตนเอง<br/>• เปรียบเทียบผลงานรายภาควิชา/สาขาวิชา (Department Breakdown)<br/>• ตรวจสอบโครงการติดธงแดงระดับคณะ (Faculty Red Flags) และออกข้อสั่งการเร่งรัด"] :::deanNode

    %% 6. PRESIDENT ROLE
    S4 --> S5["<b>👑 6. บทบาทอธิการบดี (PRESIDENT) : กำกับยุทธศาสตร์ระดับสถาบัน</b><br/>• ติดตามผลสัมฤทธิ์ภาพรวม 6 ประเด็นยุทธศาสตร์มหาวิทยาลัย (S1-S6)<br/>• ตรวจสอบตารางเปรียบเทียบผลงาน 9 คณะ (Cross-Faculty Heatmap) & 10 โครงการหลัก<br/>• ตรวจสอบโครงการวิกฤต (Critical Red Flags) และออกข้อสั่งการนโยบายเร่งรัด"] :::presNode

    %% 7. REPORTING
    S5 --> S6["<b>📄 7. การสรุปผลและออกรายงาน (REPORTING & OUTPUTS) : ทุกระดับผู้ใช้</b><br/>• สรุปผลสัมฤทธิ์เชิงยุทธศาสตร์เพื่อนำเสนอสภามหาวิทยาลัย<br/>• ส่งออกไฟล์รายงานทางการ: PDF มาตรฐานราชการ / Excel ข้อมูลดิบ / CSV<br/>• สั่งพิมพ์แบบฟอร์มรายงานทางการ A4 Print Layout"] :::reportNode

    %% 8. END POINT (BOTTOM)
    S6 --> End([🏁 8. จุดสิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์ประจำปีงบประมาณ]) :::startEnd
```
