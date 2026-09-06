# ผังกระบวนการทำงานภาพรวมแบบแนวตรง (Straight Vertical Flowchart)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

ผังงานนี้ออกแบบเป็น **เส้นตรงแนวดิ่ง 100% (Strictly Vertical Line)** เริ่มต้นบนสุด ดิ่งตรงลงมาตามลำดับขั้นตอน จนถึงจุดสิ้นสุดล่างสุด ไม่มีเส้นแยกซ้ายขวา เรียบง่าย สวยงาม และเข้าใจง่ายที่สุด

---

### 📊 ผังกระบวนการแนวตรง (Top-to-Bottom Straight Flowchart)

```mermaid
flowchart TD
    %% ==========================================
    %% COLOR & STYLE DEFINITIONS
    %% ==========================================
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef step1 fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-size:14px;
    classDef step2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#15803d,font-size:14px;
    classDef step3 fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46,font-size:14px;
    classDef step4 fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#854d0e,font-size:14px;
    classDef step5 fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8,font-size:14px;
    classDef step6 fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#3730a3,font-size:14px;

    %% ==========================================
    %% 1. TOP : START
    %% ==========================================
    Start([🟢 1. เริ่มต้น : เข้าสู่ระบบและยืนยันตัวตน JWT]) :::startEnd

    %% ==========================================
    %% 2. STEP 1
    %% ==========================================
    Start --> S1["<b>2. เตรียมข้อมูลหลัก (Master Data & Setup)</b><br/>👤 ผู้ดูแลระบบ (ADMIN)<br/>• กำหนดข้อมูล 9 คณะ, ภาควิชา, แหล่งเงินทุน<br/>• กำหนดยุทธศาสตร์มหาวิทยาลัย S1-S6 และ 10 โครงการหลัก"] :::step1

    %% ==========================================
    %% 3. STEP 2
    %% ==========================================
    S1 --> S2["<b>3. เสนอโครงการ & วางแผนกิจกรรม (Project Proposal)</b><br/>👤 อาจารย์ผู้รับผิดชอบ (TEACHER)<br/>• สร้างข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และตั้งงบประมาณ<br/>• กำหนดแผนกิจกรรมย่อย ระบุวันจัดกิจกรรมและงบตามแผน"] :::step2

    %% ==========================================
    %% 4. STEP 3
    %% ==========================================
    S2 --> S3["<b>4. ดำเนินงาน & บันทึกผลจริง (Execution & Actuals)</b><br/>👤 อาจารย์ผู้รับผิดชอบ (TEACHER)<br/>• จัดกิจกรรมเชิงยุทธศาสตร์ในพื้นที่จริง<br/>• บันทึกงบประมาณใช้จริง (actualBudget) และผลผลิตจริง (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์"] :::step3

    %% ==========================================
    %% 5. STEP 4
    %% ==========================================
    S3 --> S4["<b>5. ประมวลผลและล็อกแผนงานอัตโนมัติ (Automated Engine)</b><br/>⚙️ ระบบประมวลผลกลาง (SYSTEM CORE)<br/>• คำนวณ % ความก้าวหน้า และ % การใช้จ่ายงบประมาณ Real-Time<br/>• ประเมินสถานะสุขภาพโครงการ 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ทำการล็อกแผนงาน (IsLocked) ป้องกันการแก้ไขตัวเลขย้อนหลัง"] :::step4

    %% ==========================================
    %% 6. STEP 5
    %% ==========================================
    S4 --> S5["<b>6. กำกับติดตาม & ออกข้อสั่งการเร่งรัด (Governance & Directives)</b><br/>👤 ผู้บริหาร (คณบดี DEAN / อธิการบดี PRESIDENT)<br/>• ติดตามความก้าวหน้าผ่าน Executive Dashboard & Faculty Heatmap<br/>• ตรวจสอบโครงการติดธงแดง และส่งข้อสั่งการตรงถึงผู้รับผิดชอบ"] :::step5

    %% ==========================================
    %% 7. STEP 6
    %% ==========================================
    S5 --> S6["<b>7. สรุปผลสัมฤทธิ์ & ส่งออกรายงาน (Official Reporting)</b><br/>👥 ผู้ใช้งานทุกระดับ<br/>• สรุปผลสัมฤทธิ์ภาพรวม 6 ประเด็นยุทธศาสตร์ เพื่อนำเสนอสภามหาวิทยาลัย<br/>• ส่งออกไฟล์เอกสารทางการ: PDF มาตรฐานราชการ / Excel / พิมพ์ A4"] :::step6

    %% ==========================================
    %% 8. BOTTOM : END
    %% ==========================================
    S6 --> End([🏁 8. สิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Mermaid Code)

```text
flowchart TD
    %% COLOR & STYLE DEFINITIONS
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef step1 fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-size:14px;
    classDef step2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#15803d,font-size:14px;
    classDef step3 fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46,font-size:14px;
    classDef step4 fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#854d0e,font-size:14px;
    classDef step5 fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8,font-size:14px;
    classDef step6 fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#3730a3,font-size:14px;

    %% 1. TOP : START
    Start([🟢 1. เริ่มต้น : เข้าสู่ระบบและยืนยันตัวตน JWT]) :::startEnd

    %% 2. STEP 1
    Start --> S1["<b>2. เตรียมข้อมูลหลัก (Master Data & Setup)</b><br/>👤 ผู้ดูแลระบบ (ADMIN)<br/>• กำหนดข้อมูล 9 คณะ, ภาควิชา, แหล่งเงินทุน<br/>• กำหนดยุทธศาสตร์มหาวิทยาลัย S1-S6 และ 10 โครงการหลัก"] :::step1

    %% 3. STEP 2
    S1 --> S2["<b>3. เสนอโครงการ & วางแผนกิจกรรม (Project Proposal)</b><br/>👤 อาจารย์ผู้รับผิดชอบ (TEACHER)<br/>• สร้างข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และตั้งงบประมาณ<br/>• กำหนดแผนกิจกรรมย่อย ระบุวันจัดกิจกรรมและงบตามแผน"] :::step2

    %% 4. STEP 3
    S2 --> S3["<b>4. ดำเนินงาน & บันทึกผลจริง (Execution & Actuals)</b><br/>👤 อาจารย์ผู้รับผิดชอบ (TEACHER)<br/>• จัดกิจกรรมเชิงยุทธศาสตร์ในพื้นที่จริง<br/>• บันทึกงบประมาณใช้จริง (actualBudget) และผลผลิตจริง (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์"] :::step3

    %% 5. STEP 4
    S3 --> S4["<b>5. ประมวลผลและล็อกแผนงานอัตโนมัติ (Automated Engine)</b><br/>⚙️ ระบบประมวลผลกลาง (SYSTEM CORE)<br/>• คำนวณ % ความก้าวหน้า และ % การใช้จ่ายงบประมาณ Real-Time<br/>• ประเมินสถานะสุขภาพโครงการ 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ทำการล็อกแผนงาน (IsLocked) ป้องกันการแก้ไขตัวเลขย้อนหลัง"] :::step4

    %% 6. STEP 5
    S4 --> S5["<b>6. กำกับติดตาม & ออกข้อสั่งการเร่งรัด (Governance & Directives)</b><br/>👤 ผู้บริหาร (คณบดี DEAN / อธิการบดี PRESIDENT)<br/>• ติดตามความก้าวหน้าผ่าน Executive Dashboard & Faculty Heatmap<br/>• ตรวจสอบโครงการติดธงแดง และส่งข้อสั่งการตรงถึงผู้รับผิดชอบ"] :::step5

    %% 7. STEP 6
    S5 --> S6["<b>7. สรุปผลสัมฤทธิ์ & ส่งออกรายงาน (Official Reporting)</b><br/>👥 ผู้ใช้งานทุกระดับ<br/>• สรุปผลสัมฤทธิ์ภาพรวม 6 ประเด็นยุทธศาสตร์ เพื่อนำเสนอสภามหาวิทยาลัย<br/>• ส่งออกไฟล์เอกสารทางการ: PDF มาตรฐานราชการ / Excel / พิมพ์ A4"] :::step6

    %% 8. BOTTOM : END
    S6 --> End([🏁 8. สิ้นสุด : ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```
