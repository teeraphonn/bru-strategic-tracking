# ผังกระบวนการทำงานของระบบ (Optimized Flowchart)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

ผังงานนี้จัดวางโครงสร้างและ **เส้นเชื่อมโยง (Connecting Lines) ใหม่ให้เป็นระเบียบ สวยงาม สมดุล ไม่ตัดไขว้กัน** โดยแบ่งบทบาทเป็นสัดส่วนชัดเจน พร้อมเส้นประวนลูปข้อสั่งการที่สะอาดตา

---

### 📊 ผังกระบวนการทำงานที่ปรับปรุงเส้นเชื่อมโยง (Optimized Layout)

```mermaid
flowchart TD
    %% ==========================================
    %% GLOBAL STYLES
    %% ==========================================
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold;
    classDef auth fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef admin fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px,color:#0369a1;
    classDef teacher fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#15803d;
    classDef engine fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#854d0e;
    classDef exec fill:#faf5ff,stroke:#9333ea,stroke-width:1.5px,color:#6b21a8;
    classDef report fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#0e7490,font-weight:bold;

    %% ==========================================
    %% AUTHENTICATION
    %% ==========================================
    Start([🟢 เริ่มต้นระบบ]) :::startEnd --> Login[เข้าสู่ระบบ ยืนยันตัวตนด้วย JWT] :::auth
    Login --> RoleCheck{ตรวจสอบบทบาทผู้ใช้ RBAC} :::auth

    %% ==========================================
    %% 1. ADMIN LANE (ซ้าย)
    %% ==========================================
    subgraph LaneAdmin ["⚙️ ผู้ดูแลระบบ (ADMIN)"]
        direction TB
        AdminMaster[จัดการข้อมูลหลัก Master Data<br/>เปิดรอบปีงบประมาณ / จัดการสิทธิ์] :::admin
        AdminUnlock[ปลดล็อกแผนงาน & ดูแลศูนย์แจ้งปัญหา] :::admin
        AdminMaster --> AdminUnlock
    end
    style LaneAdmin fill:#f8fafc,stroke:#cbd5e1,stroke-width:1.5px

    RoleCheck -->|ADMIN| AdminMaster

    %% ==========================================
    %% 2. TEACHER & ENGINE LANE (กลาง)
    %% ==========================================
    subgraph LaneTeacher ["📝 อาจารย์ผู้รับผิดชอบ & ระบบประมวลผล (TEACHER & SYSTEM)"]
        direction TB
        TeacherProj[1. สร้างข้อเสนอโครงการ<br/>ระบุยุทธศาสตร์ S1-S6, ตัวชี้วัด, งบประมาณ] :::teacher
        AutoRedirect[2. ระบบพาไปหน้าโครงการอัตโนมัติ<br/>พร้อมเปิดฟอร์มวางแผนกิจกรรม] :::teacher
        PlanAct[3. วางแผนกิจกรรมย่อย Activities<br/>กำหนดวันจัดกิจกรรม และงบประมาณ] :::teacher
        DoAct[4. ดำเนินกิจกรรมในพื้นที่จริง] :::teacher
        ReportAct[5. บันทึกผลสำเร็จ & งบใช้จริง<br/>อัปโหลดภาพถ่ายหลักฐาน] :::teacher
        
        EngineCalc[6. ระบบประมวลผลอัตโนมัติ Real-Time<br/>• คำนวณ % Progress สะสม<br/>• คำนวณ % Burn Rate<br/>• ตรวจจับสถานะ 🟢 ปกติ / 🟡 เฝ้าระวัง / 🔴 วิกฤต<br/>• ล็อกแผนงานป้องกันการเปลี่ยนเป้าหมายย้อนหลัง] :::engine

        TeacherProj --> AutoRedirect --> PlanAct --> DoAct --> ReportAct --> EngineCalc
    end
    style LaneTeacher fill:#f0fdf4,stroke:#86efac,stroke-width:1.5px

    RoleCheck -->|TEACHER| TeacherProj

    %% ==========================================
    %% 3. EXECUTIVE LANE (ขวา)
    %% ==========================================
    subgraph LaneExec ["🏛️ ผู้บริหาร (DEAN & PRESIDENT)"]
        direction TB
        DeanDashboard[ติดตามแดชบอร์ดระดับคณะ<br/>กำกับภาควิชา & โครงการติดธงแดง] :::exec
        PresDashboard[ติดตามแดชบอร์ดมหาวิทยาลัย<br/>ดูภาพรวมยุทธศาสตร์ & 10 โครงการหลัก] :::exec
        
        DeanDirective[ออกข้อสั่งการระดับคณบดี] :::exec
        PresDirective[ออกข้อสั่งการระดับอธิการบดี] :::exec
        
        TeacherReceive[อาจารย์รับข้อสั่งการ & รายงานผลปรับปรุง] :::teacher
        
        DeanDashboard --> DeanDirective --> TeacherReceive
        PresDashboard --> PresDirective --> TeacherReceive
    end
    style LaneExec fill:#faf5ff,stroke:#d8b4fe,stroke-width:1.5px

    RoleCheck -->|DEAN| DeanDashboard
    RoleCheck -->|PRESIDENT| PresDashboard

    %% Connecting Engine to Executives
    EngineCalc --> DeanDashboard
    EngineCalc --> PresDashboard

    %% Directive Loop Back (เส้นประเรียบร้อย ไม่ตัดทับเส้นหลัก)
    TeacherReceive -.->|ปรับปรุงข้อมูลผลงาน| ReportAct

    %% ==========================================
    %% OUTPUT & TERMINAL
    %% ==========================================
    EngineCalc --> ExportReport[ส่งออกรายงานราชการ<br/>PDF / Excel / CSV / พิมพ์ทางการ A4] :::report
    AdminUnlock --> ExportReport

    ExportReport --> End([🏁 สิ้นสุดรอบการประเมิน]) :::startEnd
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Mermaid Code)

```text
flowchart TD
    %% ==========================================
    %% GLOBAL STYLES
    %% ==========================================
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2.5px,color:#ffffff,font-weight:bold;
    classDef auth fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef admin fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px,color:#0369a1;
    classDef teacher fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#15803d;
    classDef engine fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#854d0e;
    classDef exec fill:#faf5ff,stroke:#9333ea,stroke-width:1.5px,color:#6b21a8;
    classDef report fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#0e7490,font-weight:bold;

    %% ==========================================
    %% AUTHENTICATION
    %% ==========================================
    Start([🟢 เริ่มต้นระบบ]) :::startEnd --> Login[เข้าสู่ระบบ ยืนยันตัวตนด้วย JWT] :::auth
    Login --> RoleCheck{ตรวจสอบบทบาทผู้ใช้ RBAC} :::auth

    %% ==========================================
    %% 1. ADMIN LANE
    %% ==========================================
    subgraph LaneAdmin ["⚙️ ผู้ดูแลระบบ (ADMIN)"]
        direction TB
        AdminMaster[จัดการข้อมูลหลัก Master Data<br/>เปิดรอบปีงบประมาณ / จัดการสิทธิ์] :::admin
        AdminUnlock[ปลดล็อกแผนงาน & ดูแลศูนย์แจ้งปัญหา] :::admin
        AdminMaster --> AdminUnlock
    end
    style LaneAdmin fill:#f8fafc,stroke:#cbd5e1,stroke-width:1.5px

    RoleCheck -->|ADMIN| AdminMaster

    %% ==========================================
    %% 2. TEACHER & ENGINE LANE
    %% ==========================================
    subgraph LaneTeacher ["📝 อาจารย์ผู้รับผิดชอบ & ระบบประมวลผล (TEACHER & SYSTEM)"]
        direction TB
        TeacherProj[1. สร้างข้อเสนอโครงการ<br/>ระบุยุทธศาสตร์ S1-S6, ตัวชี้วัด, งบประมาณ] :::teacher
        AutoRedirect[2. ระบบพาไปหน้าโครงการอัตโนมัติ<br/>พร้อมเปิดฟอร์มวางแผนกิจกรรม] :::teacher
        PlanAct[3. วางแผนกิจกรรมย่อย Activities<br/>กำหนดวันจัดกิจกรรม และงบประมาณ] :::teacher
        DoAct[4. ดำเนินกิจกรรมในพื้นที่จริง] :::teacher
        ReportAct[5. บันทึกผลสำเร็จ & งบใช้จริง<br/>อัปโหลดภาพถ่ายหลักฐาน] :::teacher
        
        EngineCalc[6. ระบบประมวลผลอัตโนมัติ Real-Time<br/>• คำนวณ % Progress สะสม<br/>• คำนวณ % Burn Rate<br/>• ตรวจจับสถานะ 🟢 ปกติ / 🟡 เฝ้าระวัง / 🔴 วิกฤต<br/>• ล็อกแผนงานป้องกันการเปลี่ยนเป้าหมายย้อนหลัง] :::engine

        TeacherProj --> AutoRedirect --> PlanAct --> DoAct --> ReportAct --> EngineCalc
    end
    style LaneTeacher fill:#f0fdf4,stroke:#86efac,stroke-width:1.5px

    RoleCheck -->|TEACHER| TeacherProj

    %% ==========================================
    %% 3. EXECUTIVE LANE
    %% ==========================================
    subgraph LaneExec ["🏛️ ผู้บริหาร (DEAN & PRESIDENT)"]
        direction TB
        DeanDashboard[ติดตามแดชบอร์ดระดับคณะ<br/>กำกับภาควิชา & โครงการติดธงแดง] :::exec
        PresDashboard[ติดตามแดชบอร์ดมหาวิทยาลัย<br/>ดูภาพรวมยุทธศาสตร์ & 10 โครงการหลัก] :::exec
        
        DeanDirective[ออกข้อสั่งการระดับคณบดี] :::exec
        PresDirective[ออกข้อสั่งการระดับอธิการบดี] :::exec
        
        TeacherReceive[อาจารย์รับข้อสั่งการ & รายงานผลปรับปรุง] :::teacher
        
        DeanDashboard --> DeanDirective --> TeacherReceive
        PresDashboard --> PresDirective --> TeacherReceive
    end
    style LaneExec fill:#faf5ff,stroke:#d8b4fe,stroke-width:1.5px

    RoleCheck -->|DEAN| DeanDashboard
    RoleCheck -->|PRESIDENT| PresDashboard

    %% Connecting Engine to Executives
    EngineCalc --> DeanDashboard
    EngineCalc --> PresDashboard

    %% Directive Loop Back (เส้นประเรียบร้อย ไม่ตัดทับเส้นหลัก)
    TeacherReceive -.->|ปรับปรุงข้อมูลผลงาน| ReportAct

    %% ==========================================
    %% OUTPUT & TERMINAL
    %% ==========================================
    EngineCalc --> ExportReport[ส่งออกรายงานราชการ<br/>PDF / Excel / CSV / พิมพ์ทางการ A4] :::report
    AdminUnlock --> ExportReport

    ExportReport --> End([🏁 สิ้นสุดรอบการประเมิน]) :::startEnd
```
