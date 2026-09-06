# ผังกระบวนการทำงานมาตรฐานของระบบ (Standard System Flowchart)
## ระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

ผังงานนี้ออกแบบตาม **มาตรฐานผังงานสากล (Standard ISO/ANSI Flowchart)** ใช้สัญลักษณ์มาตรฐาน (จุดเริ่มต้น/สิ้นสุด, กล่องประมวลผล, กล่องเงื่อนไขตัดสินใจ, ข้อมูลนำเข้า/ส่งออก) เชื่อมโยงเส้นตรง เรียงลำดับจากบนลงล่าง เข้าใจง่าย และนำไปใช้งานในเอกสารรายงานทางการได้ทันที

---

### 📊 ผังกระบวนการทำงานมาตรฐาน (Standard Flowchart)

```mermaid
flowchart TD
    %% ==========================================
    %% START / TERMINAL
    %% ==========================================
    Start([🟢 เริ่มต้น]) --> Login[/ผู้ใช้งานเข้าสู่ระบบ Authentication/]
    
    %% ==========================================
    %% AUTHENTICATION & ROLE CHECK
    %% ==========================================
    Login --> CheckAuth{ตรวจสอบความถูกต้องของรหัสผ่าน?}
    CheckAuth -->|ไม่ผ่าน| LoginFail[แสดงข้อความแจ้งเตือนข้อผิดพลาด]
    LoginFail --> Login
    
    CheckAuth -->|ผ่าน| CheckRole{ตรวจสอบบทบาทผู้ใช้ RBAC}
    
    %% ==========================================
    %% ROLE BRANCHES
    %% ==========================================
    %% 1. ADMIN BRANCH
    CheckRole -->|ADMIN| AdminSetup[จัดการข้อมูลหลัก Master Data<br/>• กำหนด 9 คณะ / ภาควิชา / สิทธิ์ผู้ใช้<br/>• กำหนดยุทธศาสตร์ S1-S6 และ 10 โครงการหลัก<br/>• เปิดรอบปีงบประมาณ & แหล่งเงินทุน]
    AdminSetup --> SaveMaster[(🗄️ บันทึกลงฐานข้อมูลกลาง)]
    SaveMaster --> WaitTeacher[เข้าสู่สถานะพร้อมใช้งาน]
    
    %% 2. TEACHER BRANCH
    CheckRole -->|TEACHER| CreateProj[/กรอกข้อมูลสร้างข้อเสนอโครงการ<br/>ระบุยุทธศาสตร์ S1-S6, ตัวชี้วัด, งบประมาณ/]
    WaitTeacher --> CreateProj
    
    CreateProj --> PlanActivities[กำหนดแผนกิจกรรมย่อย Activities<br/>ระบุวันจัดกิจกรรม & งบประมาณตามแผน]
    PlanActivities --> ExecuteAct[ดำเนินกิจกรรมเชิงยุทธศาสตร์ในพื้นที่จริง]
    
    ExecuteAct --> ReportActual[/บันทึกผลการดำเนินงานจริง<br/>• งบใช้จริง actualBudget<br/>• ผลผลิตสำเร็จ completedCount<br/>• อัปโหลดภาพถ่ายหลักฐาน/]
    
    %% ==========================================
    %% SYSTEM ENGINE PROCESSING
    %% ==========================================
    ReportActual --> SysEngine[ระบบประมวลผลอัตโนมัติ<br/>• คำนวณ % Progress & % Burn Rate<br/>• ประเมินสถานะ 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ล็อกแผนงาน IsLocked ป้องกันแก้ไขย้อนหลัง]
    
    SysEngine --> SaveKPI[(🗄️ ปรับปรุงสถานะโครงการใน DB)]
    
    %% ==========================================
    %% DEAN & PRESIDENT OVERSIGHT
    %% ==========================================
    CheckRole -->|DEAN / PRESIDENT| ExecMonitor[เข้าสู่หน้าแดชบอร์ดผู้บริหาร<br/>• Executive Health Banner<br/>• สรุปผลสัมฤทธิ์ S1-S6<br/>• ตารางเปรียบเทียบผลงานรายคณะ Heatmap]
    SaveKPI --> ExecMonitor
    
    ExecMonitor --> CheckRedFlag{พบโครงการติดธงแดง<br/>หรือล่าช้าผิดปกติ?}
    
    CheckRedFlag -->|พบปัญหา| SendDirective[/ผู้บริหารพิมพ์ข้อสั่งการเร่งรัด Directives/]
    SendDirective --> AlertTeacher[ระบบส่งข้อความแจ้งเตือนถึงอาจารย์ผู้รับผิดชอบ]
    AlertTeacher --> ReportActual
    
    %% ==========================================
    %% REPORTING & EXPORT
    %% ==========================================
    CheckRedFlag -->|เป็นไปตามแผน| ExportReport[/ส่งออกรายงานสรุปผลสัมฤทธิ์<br/>• เอกสารทางการ PDF / Excel / CSV<br/>• แบบพิมพ์ทางการ A4 Print Layout/]
    
    %% ==========================================
    %% END / TERMINAL
    %% ==========================================
    ExportReport --> End([🏁 สิ้นสุดกระบวนการ])

    %% ==========================================
    %% COLOR SCHEMES
    %% ==========================================
    classDef terminal fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef process fill:#f8fafc,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#854d0e,font-weight:bold;
    classDef io fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#166534;
    classDef db fill:#f1f5f9,stroke:#64748b,stroke-width:1.5px,color:#334155;

    class Start,End terminal;
    class Login,CreateProj,ReportActual,SendDirective,ExportReport io;
    class CheckAuth,CheckRole,CheckRedFlag decision;
    class AdminSetup,PlanActivities,ExecuteAct,SysEngine,ExecMonitor,AlertTeacher,LoginFail,WaitTeacher process;
    class SaveMaster,SaveKPI db;
```

---

### 📋 โค้ดดิบสำหรับคัดลอก (Raw Mermaid Code)

```text
flowchart TD
    %% START / TERMINAL
    Start([🟢 เริ่มต้น]) --> Login[/ผู้ใช้งานเข้าสู่ระบบ Authentication/]
    
    %% AUTHENTICATION & ROLE CHECK
    Login --> CheckAuth{ตรวจสอบความถูกต้องของรหัสผ่าน?}
    CheckAuth -->|ไม่ผ่าน| LoginFail[แสดงข้อความแจ้งเตือนข้อผิดพลาด]
    LoginFail --> Login
    
    CheckAuth -->|ผ่าน| CheckRole{ตรวจสอบบทบาทผู้ใช้ RBAC}
    
    %% ROLE BRANCHES
    CheckRole -->|ADMIN| AdminSetup[จัดการข้อมูลหลัก Master Data<br/>• กำหนด 9 คณะ / ภาควิชา / สิทธิ์ผู้ใช้<br/>• กำหนดยุทธศาสตร์ S1-S6 และ 10 โครงการหลัก<br/>• เปิดรอบปีงบประมาณ & แหล่งเงินทุน]
    AdminSetup --> SaveMaster[(🗄️ บันทึกลงฐานข้อมูลกลาง)]
    SaveMaster --> WaitTeacher[เข้าสู่สถานะพร้อมใช้งาน]
    
    CheckRole -->|TEACHER| CreateProj[/กรอกข้อมูลสร้างข้อเสนอโครงการ<br/>ระบุยุทธศาสตร์ S1-S6, ตัวชี้วัด, งบประมาณ/]
    WaitTeacher --> CreateProj
    
    CreateProj --> PlanActivities[กำหนดแผนกิจกรรมย่อย Activities<br/>ระบุวันจัดกิจกรรม & งบประมาณตามแผน]
    PlanActivities --> ExecuteAct[ดำเนินกิจกรรมเชิงยุทธศาสตร์ในพื้นที่จริง]
    
    ExecuteAct --> ReportActual[/บันทึกผลการดำเนินงานจริง<br/>• งบใช้จริง actualBudget<br/>• ผลผลิตสำเร็จ completedCount<br/>• อัปโหลดภาพถ่ายหลักฐาน/]
    
    %% SYSTEM ENGINE PROCESSING
    ReportActual --> SysEngine[ระบบประมวลผลอัตโนมัติ<br/>• คำนวณ % Progress & % Burn Rate<br/>• ประเมินสถานะ 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ล็อกแผนงาน IsLocked ป้องกันแก้ไขย้อนหลัง]
    
    SysEngine --> SaveKPI[(🗄️ ปรับปรุงสถานะโครงการใน DB)]
    
    %% DEAN & PRESIDENT OVERSIGHT
    CheckRole -->|DEAN / PRESIDENT| ExecMonitor[เข้าสู่หน้าแดชบอร์ดผู้บริหาร<br/>• Executive Health Banner<br/>• สรุปผลสัมฤทธิ์ S1-S6<br/>• ตารางเปรียบเทียบผลงานรายคณะ Heatmap]
    SaveKPI --> ExecMonitor
    
    ExecMonitor --> CheckRedFlag{พบโครงการติดธงแดง<br/>หรือล่าช้าผิดปกติ?}
    
    CheckRedFlag -->|พบปัญหา| SendDirective[/ผู้บริหารพิมพ์ข้อสั่งการเร่งรัด Directives/]
    SendDirective --> AlertTeacher[ระบบส่งข้อความแจ้งเตือนถึงอาจารย์ผู้รับผิดชอบ]
    AlertTeacher --> ReportActual
    
    %% REPORTING & EXPORT
    CheckRedFlag -->|เป็นไปตามแผน| ExportReport[/ส่งออกรายงานสรุปผลสัมฤทธิ์<br/>• เอกสารทางการ PDF / Excel / CSV<br/>• แบบพิมพ์ทางการ A4 Print Layout/]
    
    %% END / TERMINAL
    ExportReport --> End([🏁 สิ้นสุดกระบวนการ])

    %% COLOR SCHEMES
    classDef terminal fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef process fill:#f8fafc,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#854d0e,font-weight:bold;
    classDef io fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#166534;
    classDef db fill:#f1f5f9,stroke:#64748b,stroke-width:1.5px,color:#334155;

    class Start,End terminal;
    class Login,CreateProj,ReportActual,SendDirective,ExportReport io;
    class CheckAuth,CheckRole,CheckRedFlag decision;
    class AdminSetup,PlanActivities,ExecuteAct,SysEngine,ExecMonitor,AlertTeacher,LoginFail,WaitTeacher process;
    class SaveMaster,SaveKPI db;
```
