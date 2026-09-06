# ผังกระบวนการทำงานของระบบ (Master System Flowchart)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

ผังงานนี้ได้รับการออกแบบให้ **เส้นเชื่อมโยงตรง สวยงาม อ่านง่าย มีจุดเริ่มต้นและจุดสิ้นสุดที่ชัดเจน** โดยเรียงลำดับกระบวนการทำงานจากบนลงล่าง (Top-to-Bottom Flow) อย่างสมดุล

---

### 📊 ผังกระบวนการทำงานหลัก (Master System Flowchart)

```mermaid
flowchart TD
    %% ==========================================
    %% GLOBAL STYLES & PALETTE
    %% ==========================================
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef stepNode fill:#ffffff,stroke:#2563eb,stroke-width:1.8px,color:#1e293b,font-size:14px;
    classDef engineNode fill:#fefce8,stroke:#d97706,stroke-width:1.8px,color:#78350f,font-size:14px;
    classDef decisionNode fill:#fdf4ff,stroke:#9333ea,stroke-width:2px,color:#581c87,font-weight:bold,font-size:14px;
    classDef directiveNode fill:#fff1f2,stroke:#e11d48,stroke-width:1.8px,color:#9f1239,font-size:14px;
    classDef reportNode fill:#f0fdf4,stroke:#16a34a,stroke-width:1.8px,color:#14532d,font-size:14px;

    %% ==========================================
    %% FLOW NODES
    %% ==========================================
    Start([🟢 เริ่มต้น : ผู้ใช้งานเข้าสู่ระบบ (Start)]) :::startEnd
    
    Start --> Step1["<b>ขั้นตอนที่ 1 : ตรวจสอบสิทธิ์ผู้ใช้งาน (Authentication & RBAC)</b><br/>• ยืนยันตัวตนด้วย JWT Token<br/>• ระบุบทบาท: ผู้ดูแลระบบ (ADMIN) / อาจารย์ (TEACHER) / ผู้บริหาร (DEAN, PRESIDENT)"] :::stepNode

    Step1 --> Step2["<b>ขั้นตอนที่ 2 : จัดเตรียมข้อมูลหลักของระบบ (Master Data Setup)</b><br/>• กำหนดข้อมูล 9 คณะ, ภาควิชา, แหล่งเงินทุน และเปิดรอบปีงบประมาณ<br/>• กำหนด 6 ประเด็นยุทธศาสตร์ (S1-S6), ตัวชี้วัด และ 10 โครงการหลัก"] :::stepNode

    Step2 --> Step3["<b>ขั้นตอนที่ 3 : สร้างข้อเสนอโครงการและวางแผนกิจกรรม (Project Planning)</b><br/>• อาจารย์กรอกข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และงบประมาณตั้งต้น<br/>• กำหนดแผนกิจกรรมย่อย (Activities) พร้อมระบุวันจัดกิจกรรมและวงเงินตามแผน"] :::stepNode

    Step3 --> Step4["<b>ขั้นตอนที่ 4 : ดำเนินกิจกรรมและบันทึกผลงานจริง (Execution & Actuals)</b><br/>• จัดกิจกรรมในพื้นที่จริงตามกำหนดการ<br/>• บันทึกงบประมาณใช้จริง (actualBudget) และผลผลิตที่ทำได้ (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์ (Evidence Gallery)"] :::stepNode

    Step4 --> Step5["<b>ขั้นตอนที่ 5 : ระบบประมวลผลอัตโนมัติ (Automated RAG Engine)</b><br/>• คำนวณ % ความก้าวหน้า (% Progress) และ % เบิกจ่ายงบประมาณ (% Burn Rate)<br/>• ประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต (Red Flag)<br/>• ล็อกแผนงานอัตโนมัติ (IsLocked) ป้องกันการเปลี่ยนแปลงเป้าหมายย้อนหลัง"] :::engineNode

    Step5 --> Step6{"<b>ขั้นตอนที่ 6 : ตรวจสอบสถานะโครงการ (Project Health Review)</b><br/>ผู้บริหารตรวจพบโครงการล่าช้าหรือติดธงแดงหรือไม่?"} :::decisionNode

    %% Branches
    Step6 -->|🔴 พบปัญหา / ติดธงแดง| StepDirective["<b>ออกข้อสั่งการเร่งรัด (Executive Directives)</b><br/>• อธิการบดี / คณบดี พิมพ์ข้อสั่งการผ่านระบบ<br/>• แจ้งเตือนตรงถึงอาจารย์ผู้รับผิดชอบเพื่อปรับปรุงการทำงาน"] :::directiveNode
    
    StepDirective -->|เร่งรัดดำเนินงาน / บันทึกผลใหม่| Step4

    Step6 -->|🟢 ปกติ / เป็นไปตามแผน| Step7["<b>ขั้นตอนที่ 7 : สรุปผลสัมฤทธิ์และส่งออกรายงาน (Reporting & Outputs)</b><br/>• รายงานสรุปผลสัมฤทธิ์ตาม 6 ประเด็นยุทธศาสตร์ และ 10 โครงการหลัก<br/>• ส่งออกเอกสารทางการ: PDF มาตรฐานราชการ / Excel / พิมพ์ A4 Print Layout"] :::reportNode

    Step7 --> End([🏁 สิ้นสุด : ครบวงจรการติดตามและประเมินผล (End)]) :::startEnd
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Copyable Code)

```text
flowchart TD
    %% GLOBAL STYLES & PALETTE
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold,font-size:15px;
    classDef stepNode fill:#ffffff,stroke:#2563eb,stroke-width:1.8px,color:#1e293b,font-size:14px;
    classDef engineNode fill:#fefce8,stroke:#d97706,stroke-width:1.8px,color:#78350f,font-size:14px;
    classDef decisionNode fill:#fdf4ff,stroke:#9333ea,stroke-width:2px,color:#581c87,font-weight:bold,font-size:14px;
    classDef directiveNode fill:#fff1f2,stroke:#e11d48,stroke-width:1.8px,color:#9f1239,font-size:14px;
    classDef reportNode fill:#f0fdf4,stroke:#16a34a,stroke-width:1.8px,color:#14532d,font-size:14px;

    %% FLOW NODES
    Start([🟢 เริ่มต้น : ผู้ใช้งานเข้าสู่ระบบ (Start)]) :::startEnd
    
    Start --> Step1["<b>ขั้นตอนที่ 1 : ตรวจสอบสิทธิ์ผู้ใช้งาน (Authentication & RBAC)</b><br/>• ยืนยันตัวตนด้วย JWT Token<br/>• ระบุบทบาท: ผู้ดูแลระบบ (ADMIN) / อาจารย์ (TEACHER) / ผู้บริหาร (DEAN, PRESIDENT)"] :::stepNode

    Step1 --> Step2["<b>ขั้นตอนที่ 2 : จัดเตรียมข้อมูลหลักของระบบ (Master Data Setup)</b><br/>• กำหนดข้อมูล 9 คณะ, ภาควิชา, แหล่งเงินทุน และเปิดรอบปีงบประมาณ<br/>• กำหนด 6 ประเด็นยุทธศาสตร์ (S1-S6), ตัวชี้วัด และ 10 โครงการหลัก"] :::stepNode

    Step2 --> Step3["<b>ขั้นตอนที่ 3 : สร้างข้อเสนอโครงการและวางแผนกิจกรรม (Project Planning)</b><br/>• อาจารย์กรอกข้อเสนอโครงการ ผูกกับยุทธศาสตร์ S1-S6 และงบประมาณตั้งต้น<br/>• กำหนดแผนกิจกรรมย่อย (Activities) พร้อมระบุวันจัดกิจกรรมและวงเงินตามแผน"] :::stepNode

    Step3 --> Step4["<b>ขั้นตอนที่ 4 : ดำเนินกิจกรรมและบันทึกผลงานจริง (Execution & Actuals)</b><br/>• จัดกิจกรรมในพื้นที่จริงตามกำหนดการ<br/>• บันทึกงบประมาณใช้จริง (actualBudget) และผลผลิตที่ทำได้ (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์ (Evidence Gallery)"] :::stepNode

    Step4 --> Step5["<b>ขั้นตอนที่ 5 : ระบบประมวลผลอัตโนมัติ (Automated RAG Engine)</b><br/>• คำนวณ % ความก้าวหน้า (% Progress) และ % เบิกจ่ายงบประมาณ (% Burn Rate)<br/>• ประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต (Red Flag)<br/>• ล็อกแผนงานอัตโนมัติ (IsLocked) ป้องกันการเปลี่ยนแปลงเป้าหมายย้อนหลัง"] :::engineNode

    Step5 --> Step6{"<b>ขั้นตอนที่ 6 : ตรวจสอบสถานะโครงการ (Project Health Review)</b><br/>ผู้บริหารตรวจพบโครงการล่าช้าหรือติดธงแดงหรือไม่?"} :::decisionNode

    %% Branches
    Step6 -->|🔴 พบปัญหา / ติดธงแดง| StepDirective["<b>ออกข้อสั่งการเร่งรัด (Executive Directives)</b><br/>• อธิการบดี / คณบดี พิมพ์ข้อสั่งการผ่านระบบ<br/>• แจ้งเตือนตรงถึงอาจารย์ผู้รับผิดชอบเพื่อปรับปรุงการทำงาน"] :::directiveNode
    
    StepDirective -->|เร่งรัดดำเนินงาน / บันทึกผลใหม่| Step4

    Step6 -->|🟢 ปกติ / เป็นไปตามแผน| Step7["<b>ขั้นตอนที่ 7 : สรุปผลสัมฤทธิ์และส่งออกรายงาน (Reporting & Outputs)</b><br/>• รายงานสรุปผลสัมฤทธิ์ตาม 6 ประเด็นยุทธศาสตร์ และ 10 โครงการหลัก<br/>• ส่งออกเอกสารทางการ: PDF มาตรฐานราชการ / Excel / พิมพ์ A4 Print Layout"] :::reportNode

    Step7 --> End([🏁 สิ้นสุด : ครบวงจรการติดตามและประเมินผล (End)]) :::startEnd
```
