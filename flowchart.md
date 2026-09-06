# ผังกระบวนการทำงานของระบบ (System Flowchart Manual) — SA Edition
## Strategic Performance Tracking System — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)
**วิเคราะห์และออกแบบโดย:** Senior System Analyst (SA Agent)  
**มาตรฐานสถาปัตยกรรม:** Role-Based Multi-Tier Workflow & Activity Diagram (Mermaid Standard)

---

## 📌 สารบัญผังกระบวนการทำงาน (Table of Flowcharts)

1. [Flowchart 1: ผังกระบวนการทำงานหลักทั้งระบบ (Master End-to-End System Flowchart)](#1-ผังกระบวนการทำงานหลักทั้งระบบ-master-end-to-end-system-flowchart)
2. [Flowchart 2: ผังการทำงานของอาจารย์/ผู้รับผิดชอบโครงการ (Teacher Workflow)](#2-ผังการทำงานของอาจารย์ผู้รับผิดชอบโครงการ-teacher-workflow)
3. [Flowchart 3: ผังการทำงานของผู้บริหารระดับคณะ (Dean Workflow)](#3-ผังการทำงานของผู้บริหารระดับคณะ-dean-flowchart)
4. [Flowchart 4: ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน (President Flowchart)](#4-ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน-president-flowchart)
5. [Flowchart 5: ผังการทำงานของผู้ดูแลระบบ (Admin Flowchart)](#5-ผังการทำงานของผู้ดูแลระบบ-admin-flowchart)
6. [Flowchart 6: ผังตรรกะการประมวลผลสถานะโครงการ (Project RAG Calculation Engine)](#6-ผังตรรกะการประมวลผลสถานะโครงการ-project-rag-calculation-engine)
7. [Flowchart 7: ผังกระบวนการล็อกและปลดล็อกแผนงาน (Plan Locking & Unlock Workflow)](#7-ผังกระบวนการล็อกและปลดล็อกแผนงาน-plan-locking--unlock-workflow)

---

## 1. ผังกระบวนการทำงานหลักทั้งระบบ (Master End-to-End System Flowchart)

ผังงานนี้ออกแบบตามหลักวิศวกรรมระบบ (System Analysis & Design) โดยแบ่งสัดส่วนการทำงานเป็น Swimlane / Stage ชัดเจน จัดการจุดเชื่อมโยง (Connectors) และเงื่อนไขการตัดสินใจ (Decision Gateways) ให้ไหลลื่นในทิศทางเดียว (Top-to-Bottom Flow)

```mermaid
flowchart TD
    %% ==========================================
    %% GLOBAL STYLES
    %% ==========================================
    classDef startEnd fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef authNode fill:#6366f1,stroke:#4f46e5,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef adminNode fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px,color:#0369a1;
    classDef teacherNode fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#15803d;
    classDef engineNode fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#a16207;
    classDef execNode fill:#faf5ff,stroke:#9333ea,stroke-width:1.5px,color:#7e22ce;
    classDef dbNode fill:#f1f5f9,stroke:#475569,stroke-width:1.5px,color:#334155;
    classDef reportNode fill:#ecfeff,stroke:#0891b2,stroke-width:1.5px,color:#0e7490;

    %% ==========================================
    %% START POINT
    %% ==========================================
    StartNode([🟢 เริ่มต้น: ผู้ใช้งานเข้าสู่ระบบ Authentication]) :::startEnd

    %% ==========================================
    %% AUTHENTICATION & RBAC GATEWAY
    %% ==========================================
    StartNode --> AuthStep[1. เข้าสู่ระบบ & ตรวจสอบสิทธิ์ JWT Token] :::authNode
    AuthStep --> RoleRouter{2. ตรวจสอบ Role} :::authNode

    RoleRouter -->|ADMIN| Stage1
    RoleRouter -->|TEACHER| Stage2
    RoleRouter -->|DEAN / PRESIDENT| Stage5

    %% ==========================================
    %% STAGE 1: MASTER DATA SETUP (ADMIN)
    %% ==========================================
    subgraph Stage1 ["Stage 1 : ⚙️ การเตรียมข้อมูลระบบ (Master Data & System Setup) — ADMIN"]
        direction TB
        Admin1["1.1 กำหนด 9 คณะ, ภาควิชา, แหล่งเงิน & เปิดรอบปีงบประมาณ"] :::adminNode
        Admin2["1.2 กำหนดยุทธศาสตร์ S1-S6, ตัวชี้วัด & 10 โครงการหลัก"] :::adminNode
        Admin3["1.3 จัดการสิทธิ์ผู้ใช้งาน (RBAC) & ดูแลศูนย์คำร้องขอปลดล็อกแผน"] :::adminNode
        Admin1 --> Admin2 --> Admin3
    end
    style Stage1 fill:#f8fafc,stroke:#94a3b8,stroke-width:2px

    Stage1 --> MasterDB[(🗄️ Master Data Tables)] :::dbNode
    MasterDB --> Stage2

    %% ==========================================
    %% STAGE 2: PROPOSAL & PLANNING (TEACHER)
    %% ==========================================
    subgraph Stage2 ["Stage 2 : 📝 การสร้างข้อเสนอและแผนงาน (Project Proposal & Planning) — TEACHER"]
        direction TB
        T_Create["2.1 กรอกข้อเสนอโครงการ: รหัสยุทธศาสตร์ S1-S6, ตัวชี้วัด, งบประมาณตั้งต้น"] :::teacherNode
        T_Redirect["2.2 บันทึกข้อมูล & ระบบนำทางอัตโนมัติ (Auto-Redirect) ไปหน้ารายละเอียด"] :::teacherNode
        T_Activities["2.3 เพิ่มแผนกิจกรรมย่อย (Activities): กำหนดวันจัดกิจกรรม และวงเงินตามแผน"] :::teacherNode
        T_Create --> T_Redirect --> T_Activities
    end
    style Stage2 fill:#f0fdf4,stroke:#86efac,stroke-width:2px

    Stage2 --> ProjDB[(🗄️ Projects & Activities DB)] :::dbNode
    ProjDB --> Stage3

    %% ==========================================
    %% STAGE 3: EXECUTION & ACTUALS (TEACHER)
    %% ==========================================
    subgraph Stage3 ["Stage 3 : 🚀 การดำเนินงานและรายงานผลจริง (Execution & Actuals) — TEACHER"]
        direction TB
        T_DoAct["3.1 จัดกิจกรรมเชิงยุทธศาสตร์ในพื้นที่จริง"] :::teacherNode
        T_Record["3.2 บันทึกงบใช้จริง (actualBudget) & ผลสำเร็จจริง (completedCount)"] :::teacherNode
        T_Upload["3.3 อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์ (Evidence Gallery)"] :::teacherNode
        T_DoAct --> T_Record --> T_Upload
    end
    style Stage3 fill:#f0fdf4,stroke:#4ade80,stroke-width:2px

    Stage3 --> Stage4

    %% ==========================================
    %% STAGE 4: AUTOMATED ENGINE & INTEGRITY (SYSTEM)
    %% ==========================================
    subgraph Stage4 ["Stage 4 : 🧠 ระบบประมวลผลอัตโนมัติ (Automated RAG & Integrity Engine) — CORE SYSTEM"]
        direction TB
        E_Calc["4.1 คำนวณอัตราความก้าวหน้า (% Progress) & การใช้จ่าย (% Burn Rate)"] :::engineNode
        E_RAG["4.2 ประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต (Red Flag)"] :::engineNode
        E_Lock["4.3 ล็อกแผนงานอัตโนมัติ (IsLocked = true) ป้องกันการแก้ไขเป้าหมายย้อนหลัง"] :::engineNode
        E_Calc --> E_RAG --> E_Lock
    end
    style Stage4 fill:#fefce8,stroke:#fde047,stroke-width:2px

    Stage4 --> SummaryDB[(🗄️ Aggregated KPI & Health DB)] :::dbNode
    SummaryDB --> Stage5

    %% ==========================================
    %% STAGE 5: GOVERNANCE & DIRECTIVES (EXEC)
    %% ==========================================
    subgraph Stage5 ["Stage 5 : 🏛️ การกำกับติดตามและข้อสั่งการ (Governance & Directives) — PRESIDENT & DEAN"]
        direction TB
        Exec_View["5.1 ผู้บริหารติดตามผลผ่าน Executive Dashboard & Faculty Heatmap"] :::execNode
        Exec_RedFlag["5.2 ตรวจสอบโครงการติดธงแดงวิกฤต (Management by Exception)"] :::execNode
        Exec_Directive["5.3 บันทึกข้อสั่งการกำชับเร่งรัด (Directive) ส่งตรงถึงผู้รับผิดชอบโครงการ"] :::execNode
        Exec_View --> Exec_RedFlag --> Exec_Directive
    end
    style Stage5 fill:#faf5ff,stroke:#d8b4fe,stroke-width:2px

    %% Feedback Loop: Directives to Teacher
    Exec_Directive -.->|แจ้งเตือนข้อสั่งการเร่งรัด| T_Record

    Stage5 --> Stage6

    %% ==========================================
    %% STAGE 6: REPORTING & EVALUATION (ALL)
    %% ==========================================
    subgraph Stage6 ["Stage 6 : 📄 การสรุปผลและส่งออกรายงาน (Reporting & Outputs) — ทุกระดับ"]
        direction TB
        R_Strategic["6.1 รายงานสรุปผลสัมฤทธิ์ราย 6 ประเด็นยุทธศาสตร์ & 10 โครงการหลัก"] :::reportNode
        R_Export["6.2 ส่งออกเอกสารทางการ: PDF มาตรฐานราชการ / Excel / CSV Data"] :::reportNode
        R_Print["6.3 สั่งพิมพ์แบบฟอร์มทางการ A4 Print Layout เพื่อเสนอสภามหาวิทยาลัย"] :::reportNode
        R_Strategic --> R_Export --> R_Print
    end
    style Stage6 fill:#ecfeff,stroke:#a5f3fc,stroke-width:2px

    %% ==========================================
    %% END POINT
    %% ==========================================
    Stage6 --> EndNode([🏁 สิ้นสุด: ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```

---

## 2. ผังการทำงานของอาจารย์/ผู้รับผิดชอบโครงการ (Teacher Workflow)

```mermaid
flowchart TD
    T_Start([🟢 เริ่มต้น: เข้าสู่ระบบ Role: TEACHER]) --> T_Dash[หน้าแดชบอร์ดอาจารย์: ดูโครงการของฉัน & สถิติส่วนบุคคล]
    
    T_Dash --> T_Choice{เลือกการดำเนินการ}
    
    %% Create Project
    T_Choice -->|สร้างโครงการใหม่| T_Form[กรอกฟอร์มสร้างโครงการ<br/>• เลือกปีงบประมาณ & แหล่งเงินทุน<br/>• เลือกรหัสยุทธศาสตร์ S1-S6 & ตัวชี้วัด MP<br/>• ระบุเป้าหมายเชิงปริมาณ หน่วยนับ งบประมาณ]
    T_Form --> T_SaveProj[บันทึกโครงการลงฐานข้อมูล]
    T_SaveProj --> T_Redirect[ระบบพาไปที่หน้ารายละเอียดโครงการ<br/>พร้อมเปิด Modal เพิ่มกิจกรรมทันที]
    
    %% Add Activities
    T_Redirect --> T_AddAct[กรอกแผนกิจกรรมย่อย<br/>• ชื่อกิจกรรม วันที่จัด งบประมาณตามแผน]
    T_Choice -->|จัดการโครงการเดิม| T_ProjDetail[เปิดหน้ารายละเอียดโครงการ]
    T_ProjDetail --> T_AddAct
    
    %% Record Progress
    T_ProjDetail --> T_ProgressModal[กดปุ่ม 'บันทึกความก้าวหน้า รูปภาพ & งบจริง']
    T_ProgressModal --> T_InputProgress[• ติ๊กเลือกสถานะ: ยังไม่เริ่ม / กำลังดำเนินงาน / เสร็จสิ้น<br/>• ระบุงบประมาณใช้จริง actualBudget<br/>• ระบุผลสัมฤทธิ์ที่ทำได้จริง completedCount<br/>• อัปโหลดภาพถ่ายกิจกรรม ไม่เกิน 5MB]
    T_InputProgress --> T_SaveProgress[บันทึกข้อมูลผลงาน]
    
    %% Lock & Calculate
    T_SaveProgress --> T_SysUpdate[ระบบคำนวณ % ความก้าวหน้าใหม่<br/>และทำการล็อกแผนงาน IsLocked = true]
    
    %% Directives
    T_ProjDetail --> T_CheckDirectives{มีข้อสั่งการหรือไม่?}
    T_CheckDirectives -->|มีข้อสั่งการ| T_ViewDirective[ดูข้อสั่งการอธิการบดี/คณบดี<br/>เร่งรัดดำเนินงานตามคำสั่ง]
    T_CheckDirectives -->|ไม่มี| T_Gallery[ดูคลังภาพกิจกรรม Gallery & พิมพ์รายงาน]
    T_ViewDirective --> T_Gallery
    
    T_Gallery --> T_End([🏁 สิ้นสุดการดำเนินงาน])
```

---

## 3. ผังการทำงานของผู้บริหารระดับคณะ (Dean Workflow)

```mermaid
flowchart TD
    D_Start([🟢 เริ่มต้น: เข้าสู่ระบบ Role: DEAN]) --> D_Dash[หน้าแดชบอร์ดคณบดี]
    
    D_Dash --> D_Scope[ระบบจำกัดขอบเขตข้อมูล<br/>เฉพาะโครงการภายใต้คณะตนเองเท่านั้น]
    
    D_Scope --> D_ViewKPIs[ตรวจสอบ 4 KPI Cards ระดับคณะ<br/>• % ความก้าวหน้าเฉลี่ยคณะ<br/>• งบประมาณจัดสรร vs เบิกจ่ายจริง<br/>• สัดส่วนสุขภาพโครงการ 🟢 ปกติ 🟡 เฝ้าระวัง 🔴 วิกฤต]
    
    D_ViewKPIs --> D_Actions{เลือกจุดกำกับติดตาม}
    
    %% Red Flags
    D_Actions -->|1. ติดตามจุดวิกฤต| D_RedFlags[ตรวจสอบ Faculty Red Flags Panel<br/>โครงการที่ก้าวหน้าต่ำกว่า 40% หรือเบิกจ่ายล่าช้า]
    D_RedFlags --> D_DeanDirective[พิมพ์ข้อสั่งการระดับคณบดี deanDirective<br/>ส่งตรงถึงอาจารย์ผู้รับผิดชอบ]
    
    %% Department Breakdown
    D_Actions -->|2. ดูผลงานรายภาควิชา| D_DeptTable[ตารางเปรียบเทียบผลงานรายภาควิชา<br/>ดูความก้าวหน้าและยอดเบิกจ่ายแยกตามสาขา]
    
    %% Drill-Down
    D_Actions -->|3. เจาะลึกรายโครงการ| D_DrillDown[คลิกดู Drill-Down Modal<br/>ตรวจสอบกิจกรรมย่อยและภาพถ่ายหลักฐาน]
    
    %% Export Report
    D_Actions -->|4. ออกรายงานคณะ| D_Export[ส่งออกรายงานผลงานระดับคณะ<br/>PDF มาตรฐาน / Excel / CSV]
    
    D_DeanDirective --> D_End([🏁 สิ้นสุดการกำกับ])
    D_DeptTable --> D_End
    D_DrillDown --> D_End
    D_Export --> D_End
```

---

## 4. ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน (President Flowchart)

```mermaid
flowchart TD
    P_Start([🟢 เริ่มต้น: เข้าสู่ระบบ Role: PRESIDENT]) --> P_Dash[หน้าแดชบอร์ดอธิการบดี]
    
    P_Dash --> P_Filters[1. Executive Health Banner<br/>• เลือกปีงบประมาณ / แหล่งเงินทุน<br/>• ดู 4 ภาพรวม: % ก้าวหน้าสถาบัน, ยอดเบิกจ่ายรวม, จำนวนโครงการ, จุดวิกฤต]
    
    P_Filters --> P_Pillars[2. ผลสัมฤทธิ์รายประเด็นยุทธศาสตร์ S1 - S6<br/>• กราฟเปรียบเทียบงบจัดสรร vs เบิกจ่ายจริง & % ก้าวหน้า<br/>• การ์ดอธิบายความหมายและตัวชี้วัดย่อย S1-S6]
    
    P_Pillars --> P_RedFlags[3. โครงการติดธงแดงวิกฤต Critical Red Flags<br/>Management by Exception]
    
    P_RedFlags --> P_DirectiveChoice{ต้องการออกข้อสั่งการหรือไม่?}
    P_DirectiveChoice -->|สั่งการเร่งรัด| P_SendDirective[พิมพ์ข้อสั่งการอธิการบดี presidentDirective<br/>บันทึกลงระบบส่งตรงถึงผู้รับผิดชอบ]
    P_DirectiveChoice -->|ข้าม| P_Heatmap
    P_SendDirective --> P_Heatmap
    
    P_Heatmap[4. ตารางเปรียบเทียบผลงาน 9 คณะ Cross-Faculty Heatmap<br/>• เปรียบเทียบความก้าวหน้า & การใช้จ่ายงบรายคณะ<br/>• คลิกชื่อคณะเพื่อ Drill-down ดูรายการโครงการทั้งหมดในคณะ]
    
    P_Heatmap --> P_MainProjects[5. ตารางกำกับ 10 โครงการหลัก 10 Main Projects<br/>• ตัวกรอง RAG: ทั้งหมด / ปกติ / เฝ้าระวัง / วิกฤต<br/>• คลิก Accordion ดูโครงการย่อยที่สังกัดใต้โครงการหลัก]
    
    P_MainProjects --> P_Print[พิมพ์รายงานสรุปผลเชิงยุทธศาสตร์ทางการ A4 Print Document]
    P_Print --> P_End([🏁 สิ้นสุดการกำกับยุทธศาสตร์])
```

---

## 5. ผังการทำงานของผู้ดูแลระบบ (Admin Flowchart)

```mermaid
flowchart TD
    A_Start([🟢 เริ่มต้น: เข้าสู่ระบบ Role: ADMIN]) --> A_Dash[หน้าแดชบอร์ดผู้ดูแลระบบ]
    
    A_Dash --> A_Menu{เลือกเมนูการจัดการ}
    
    %% Master Data
    A_Menu -->|1. จัดการข้อมูลหลัก| A_Master[Master Data Management 8 หมวด<br/>• คณะ Faculties & ภาควิชา Departments<br/>• ปีงบประมาณ Fiscal Years & แหล่งเงิน Budget Sources<br/>• ยุทธศาสตร์หลัก Strategies & ยุทธศาสตร์ย่อย Sub-Strategies<br/>• ตัวชี้วัดยุทธศาสตร์ Indicators<br/>• ผู้ใช้งาน Users & กำหนด Role]
    A_Master --> A_CRUD[เพิ่ม / แก้ไข / ลบ / เปิด-ปิดสถานะ Active]
    
    %% User Management
    A_Menu -->|2. จัดการผู้ใช้งาน| A_Users[จัดการบัญชีผู้ใช้งาน<br/>• สร้างบัญชีใหม่พร้อม Modal 2 คอลัมน์<br/>• กำหนดคณะ/ภาควิชาสังกัด<br/>• รีเซ็ตรหัสผ่าน]
    
    %% Plan Unlock
    A_Menu -->|3. ปลดล็อกแผนงาน| A_Unlock[ตรวจสอบรายการโครงการ/กิจกรรมที่ถูกล็อก<br/>เมื่อได้รับคำร้องขอแก้ไขแผนงาน]
    A_Unlock --> A_DoUnlock[กดปลดล็อก IsLocked = false<br/>ให้อาจารย์แก้ไขเป้าหมายหรือกิจกรรมได้ตามระเบียบ]
    
    %% Issue Tracker
    A_Menu -->|4. ศูนย์รับแจ้งปัญหา| A_Issues[Issue Management Center<br/>• ดูข้อร้องเรียนและปัญหาการใช้งานจากผู้ใช้<br/>• ตอบกลับคำแนะนำ<br/>• เปลี่ยนสถานะ: PENDING ➔ IN_PROGRESS ➔ RESOLVED]
    
    A_CRUD --> A_End([🏁 สิ้นสุดการจัดการ])
    A_Users --> A_End
    A_DoUnlock --> A_End
    A_Issues --> A_End
```

---

## 6. ผังตรรกะการประมวลผลสถานะโครงการ (Project RAG Calculation Engine)

```mermaid
flowchart TD
    Calc_Start([🟢 เริ่มต้นคำนวณสถานะโครงการ]) --> GetMetrics[ดึงข้อมูลโครงการ:<br/>• targetCount = จำนวนเป้าหมาย<br/>• completedCount = ผลสำเร็จที่ทำได้จริง<br/>• totalBudget = งบประมาณจัดสรร<br/>• actualSpent = ผลรวม actualBudget ของทุกกิจกรรม]
    
    GetMetrics --> CalcProgress["คำนวณ % Progress = (completedCount / targetCount) * 100"]
    CalcProgress --> CalcBurnRate["คำนวณ % Burn Rate = (actualSpent / totalBudget) * 100"]
    
    CalcBurnRate --> CheckOverBudget{มีกิจกรรมที่ actualBudget > budget หรือไม่?}
    
    CheckOverBudget -->|ใช่ งบเกินแผน| SetRED[🔴 สถานะ RED: วิกฤต / ต้องเร่งรัดแก้ไข<br/>badgeColor: bg-rose-50 text-rose-700]
    
    CheckOverBudget -->|ไม่ใช่| CheckRedCond{"% Progress < 40% <br/>หรือ (% Burn Rate > 90% แต่ % Progress < 50%) ?"}
    
    CheckRedCond -->|ใช่| SetRED
    
    CheckRedCond -->|ไม่ใช่| CheckYellowCond{"% Progress < 75% <br/>หรือ |% Burn Rate - % Progress| > 25% ?"}
    
    CheckYellowCond -->|ใช่| SetYELLOW[🟡 สถานะ YELLOW: เฝ้าระวัง / ช้าเล็กน้อย<br/>badgeColor: bg-amber-50 text-amber-700]
    
    CheckYellowCond -->|ไม่ใช่| SetGREEN[🟢 สถานะ GREEN: ปกติ / เป็นไปตามแผน<br/>badgeColor: bg-emerald-50 text-emerald-700]
    
    SetRED --> UpdateProjectStatus[บันทึกสถานะสุขภาพโครงการ RAG Status ลงฐานข้อมูล]
    SetYELLOW --> UpdateProjectStatus
    SetGREEN --> UpdateProjectStatus
    
    UpdateProjectStatus --> Calc_End([🏁 สิ้นสุดการประมวลผล: ส่งผลไปยัง Dashboards & Reports])
```

---

## 7. ผังกระบวนการล็อกและปลดล็อกแผนงาน (Plan Locking & Unlock Workflow)

```mermaid
flowchart TD
    L_Start([🟢 เริ่มต้น: สร้างโครงการ & กิจกรรมใหม่]) --> L_Init[สถานะเริ่มต้น: IsLocked = false<br/>สามารถแก้ไขชื่อ วันที่ และงบประมาณตั้งต้นได้]
    
    L_Init --> L_Action{มีการบันทึกผลการดำเนินงานหรือไม่?}
    
    L_Action -->|ยังไม่เริ่มรายงานผล| L_Init
    
    L_Action -->|อาจารย์บันทึก actualBudget หรือ completedCount| L_Lock[ระบบสั่งล็อกแผนงานอัตโนมัติ<br/>IsLocked = true]
    
    L_Lock --> L_LockedState[สถานะล็อก: ห้ามแก้ไขงบตั้งต้นและเป้าหมาย<br/>แต่ยังสามารถอัปเดตผลงานจริงและภาพถ่ายได้]
    
    L_LockedState --> L_NeedEdit{มีความจำเป็นต้องปรับแผนตามระเบียบ?}
    
    L_NeedEdit -->|ไม่จำเป็น| L_KeepLock[ดำเนินงานตามแผนงานเดิม]
    
    L_NeedEdit -->|จำเป็น| L_ContactAdmin[อาจารย์แจ้งคำร้องผ่านศูนย์แจ้งปัญหา Issue Center<br/>ระบุเหตุผลความจำเป็นในการขอปรับแผน]
    
    L_ContactAdmin --> L_AdminReview{ผู้ดูแลระบบ ADMIN ตรวจสอบคำร้อง}
    
    L_AdminReview -->|ไม่อนุมัติ| L_Reject[แจ้งเหตุผลปฏิเสธใน Issue Center]
    L_AdminReview -->|อนุมัติ| L_AdminUnlock[Admin กดปุ่ม 'ปลดล็อกโครงการ/กิจกรรม'<br/>IsLocked = false]
    
    L_AdminUnlock --> L_TeacherEdit[อาจารย์เข้าแก้ไขตัวเลขแผนงานให้ถูกต้อง]
    L_TeacherEdit --> L_ReLock[เมื่อบันทึกผลงานรอบใหม่ ระบบจะทำการล็อกอัตโนมัติ]
    
    L_Reject --> L_End([🏁 สิ้นสุดกระบวนการ])
    L_ReLock --> L_End
    L_KeepLock --> L_End
```
