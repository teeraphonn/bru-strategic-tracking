# ผังกระบวนการทำงานของระบบ (System Flowchart Manual)
## Strategic Performance Tracking System — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

เอกสารนี้รวบรวม **ผังกระบวนการทำงาน (Flowcharts)** ของระบบติดตามและประเมินผลโครงการเชิงยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์ ครอบคลุมตั้งแต่ภาพรวมวงจรระบบ การทำงานแยกตามบทบาทผู้ใช้งาน (RBAC) ตรรกะการประมวลผลสถานะสุขภาพโครงการ (RAG Engine) ไปจนถึงกระบวนการออกรายงาน

---

## 📌 สารบัญผังกระบวนการทำงาน (Table of Flowcharts)

1. [Flowchart 1: ผังภาพรวมการทำงานทั้งระบบ (End-to-End System Workflow)](#1-ผังภาพรวมการทำงานทั้งระบบ-end-to-end-system-workflow)
2. [Flowchart 2: ผังการทำงานของอาจารย์/ผู้รับผิดชอบโครงการ (Teacher Workflow)](#2-ผังการทำงานของอาจารย์ผู้รับผิดชอบโครงการ-teacher-workflow)
3. [Flowchart 3: ผังการทำงานของผู้บริหารระดับคณะ (Dean Workflow)](#3-ผังการทำงานของผู้บริหารระดับคณะ-dean-flowchart)
4. [Flowchart 4: ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน (President Flowchart)](#4-ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน-president-flowchart)
5. [Flowchart 5: ผังการทำงานของผู้ดูแลระบบ (Admin Flowchart)](#5-ผังการทำงานของผู้ดูแลระบบ-admin-flowchart)
6. [Flowchart 6: ผังตรรกะการประมวลผลสถานะโครงการ (Project RAG Calculation Engine)](#6-ผังตรรกะการประมวลผลสถานะโครงการ-project-rag-calculation-engine)
7. [Flowchart 7: ผังกระบวนการล็อกและปลดล็อกแผนงาน (Plan Locking & Unlock Workflow)](#7-ผังกระบวนการล็อกและปลดล็อกแผนงาน-plan-locking--unlock-workflow)

---

## 1. ผังภาพรวมการทำงานทั้งระบบ (End-to-End System Workflow)

แสดงวงจรการทำงานเชิงยุทธศาสตร์ตั้งแต่การเตรียมข้อมูลพื้นฐาน การสร้างและดำเนินโครงการ การกำกับติดตาม ไปจนถึงการออกรายงาน

```mermaid
flowchart TD
    Start([เริ่มต้นระบบ]) --> Login[เข้าสู่ระบบ ยืนยันตัวตนด้วย JWT]
    
    Login --> RoleCheck{ตรวจสอบบทบาทผู้ใช้ RBAC}
    
    %% Admin Branch
    RoleCheck -->|ADMIN| AdminMaster[จัดการข้อมูลหลัก Master Data<br/>เปิดรอบปีงบประมาณ / จัดการสิทธิ์]
    AdminMaster --> AdminUnlock[ปลดล็อกแผนงาน & ดูแลศูนย์แจ้งปัญหา]
    
    %% Teacher Branch
    RoleCheck -->|TEACHER| TeacherProj[1. สร้างข้อเสนอโครงการ<br/>ระบุยุทธศาสตร์ ตัวชี้วัด งบประมาณ]
    TeacherProj --> AutoRedirect[2. ระบบพาไปหน้าโครงการอัตโนมัติ<br/>พร้อมเปิดฟอร์มวางแผนกิจกรรม]
    AutoRedirect --> PlanAct[3. วางแผนกิจกรรมย่อย Activities<br/>กำหนดวันจัดกิจกรรม และงบประมาณ]
    PlanAct --> DoAct[4. ดำเนินกิจกรรมในพื้นที่จริง]
    DoAct --> ReportAct[5. บันทึกผลสำเร็จ & งบใช้จริง<br/>อัปโหลดภาพถ่ายหลักฐาน]
    
    %% Engine Processing
    ReportAct --> EngineCalc[6. ระบบประมวลผลอัตโนมัติ Real-Time<br/>• คำนวณ % Progress สะสม<br/>• คำนวณ % Burn Rate<br/>• ตรวจจับสถานะ 🟢 ปกติ / 🟡 เฝ้าระวัง / 🔴 วิกฤต<br/>• ล็อกแผนงานป้องกันการเปลี่ยนเป้าหมายย้อนหลัง]
    
    %% Dean & President Branch
    EngineCalc --> DeanPresOversight{ผู้บริหารติดตามผล}
    RoleCheck -->|DEAN| DeanDashboard[ติดตามแดชบอร์ดระดับคณะ<br/>กำกับภาควิชา & โครงการติดธงแดง]
    RoleCheck -->|PRESIDENT| PresDashboard[ติดตามแดชบอร์ดมหาวิทยาลัย<br/>ดูภาพรวมยุทธศาสตร์ & 10 โครงการหลัก]
    
    DeanDashboard --> DeanDirective[ออกข้อสั่งการระดับคณบดี]
    PresDashboard --> PresDirective[ออกข้อสั่งการระดับอธิการบดี]
    
    DeanDirective --> TeacherReceive[อาจารย์รับข้อสั่งการ & รายงานผลปรับปรุง]
    PresDirective --> TeacherReceive
    TeacherReceive --> ReportAct
    
    %% Reporting
    EngineCalc --> ExportReport[ส่งออกรายงานราชการ<br/>PDF / Excel / CSV / พิมพ์ทางการ A4]
    ExportReport --> End([สิ้นสุดรอบการประเมิน])
```

---

## 2. ผังการทำงานของอาจารย์/ผู้รับผิดชอบโครงการ (Teacher Workflow)

แสดงขั้นตอนการสร้างโครงการ การวางแผนกิจกรรม การรายงานผลผลิตพร้อมแนบภาพถ่าย และการตอบสนองต่อข้อสั่งการ

```mermaid
flowchart TD
    T_Start([เข้าสู่ระบบ Role: TEACHER]) --> T_Dash[หน้าแดชบอร์ดอาจารย์<br/>ดูโครงการของฉัน & สถิติส่วนบุคคล]
    
    T_Dash --> T_Choice{เลือกการดำเนินการ}
    
    %% Create Project
    T_Choice -->|สร้างโครงการใหม่| T_Form[กรอกฟอร์มสร้างโครงการ<br/>• เลือกปีงบประมาณ & แหล่งเงินทุน<br/>• เลือกรหัสยุทธศาสตร์ S1-S6 & ตัวชี้วัด MP<br/>• ระบุเป้าหมายเชิงปริมาณ หน่วยนับ งบประมาณ]
    T_Form --> T_SaveProj[บันทึกโครงการ]
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
    
    T_Gallery --> T_End([เสร็จสิ้นภารกิจ])
```

---

## 3. ผังการทำงานของผู้บริหารระดับคณะ (Dean Workflow)

แสดงการกำกับติดตามโครงการภายในคณะ การชี้เป้าโครงการติดธงแดง (Faculty Red Flags) และการออกข้อสั่งการคณบดี

```mermaid
flowchart TD
    D_Start([เข้าสู่ระบบ Role: DEAN]) --> D_Dash[หน้าแดชบอร์ดคณบดี]
    
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
    
    D_DeanDirective --> D_End([เสร็จสิ้นการกำกับ])
    D_DeptTable --> D_End
    D_DrillDown --> D_End
    D_Export --> D_End
```

---

## 4. ผังการทำงานของอธิการบดีและผู้บริหารระดับสถาบัน (President Flowchart)

แสดงสถาปัตยกรรมแดชบอร์ด 5 ลำดับชั้นสำหรับอธิการบดี (Executive Information System - EIS)

```mermaid
flowchart TD
    P_Start([เข้าสู่ระบบ Role: PRESIDENT]) --> P_Dash[หน้าแดชบอร์ดอธิการบดี]
    
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
    P_Print --> P_End([เสร็จสิ้นการกำกับยุทธศาสตร์])
```

---

## 5. ผังการทำงานของผู้ดูแลระบบ (Admin Flowchart)

แสดงกระบวนการบริหารจัดการข้อมูลหลัก (Master Data), การควบคุมสิทธิ์ผู้ใช้ (RBAC), การปลดล็อกแผนงาน และศูนย์รับแจ้งปัญหา

```mermaid
flowchart TD
    A_Start([เข้าสู่ระบบ Role: ADMIN]) --> A_Dash[หน้าแดชบอร์ดผู้ดูแลระบบ]
    
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
    
    A_CRUD --> A_End([บันทึกผลเรียบร้อย])
    A_Users --> A_End
    A_DoUnlock --> A_End
    A_Issues --> A_End
```

---

## 6. ผังตรรกะการประมวลผลสถานะโครงการ (Project RAG Calculation Engine)

แสดงขั้นตอนการคำนวณและประเมินเกณฑ์สี (Red / Yellow / Green) ของแต่ละโครงการแบบอัตโนมัติ

```mermaid
flowchart TD
    Calc_Start([เริ่มต้นคำนวณสถานะโครงการ]) --> GetMetrics[ดึงข้อมูลโครงการ:<br/>• targetCount = จำนวนเป้าหมาย<br/>• completedCount = ผลสำเร็จที่ทำได้จริง<br/>• totalBudget = งบประมาณจัดสรร<br/>• actualSpent = ผลรวม actualBudget ของทุกกิจกรรม]
    
    GetMetrics --> CalcProgress["คำนวณ % Progress = (completedCount / targetCount) * 100"]
    CalcProgress --> CalcBurnRate["คำนวณ % Burn Rate = (actualSpent / totalBudget) * 100"]
    
    CalcBurnRate --> CheckOverBudget{มีกิจกรรมที่ actualBudget > budget หรือไม่?}
    
    CheckOverBudget -->|ใช่ งบเกินแผน| SetRED[🔴 สถานะ RED: วิกฤต / ต้องเร่งรัดแก้ไข<br/>badgeColor: bg-rose-50 text-rose-700]
    
    CheckOverBudget -->|ไม่ใช่| CheckRedCond{"% Progress < 40% <br/>หรือ (% Burn Rate > 90% แต่ % Progress < 50%) ?"}
    
    CheckRedCond -->|ใช่| SetRED
    
    CheckRedCond -->|ไม่ใช่| CheckYellowCond{"% Progress < 75% <br/>หรือ |% Burn Rate - % Progress| > 25% ?"}
    
    CheckYellowCond -->|ใช่| SetYELLOW[🟡 สถานะ YELLOW: เฝ้าระวัง / ช้าเล็กน้อย<br/>badgeColor: bg-amber-50 text-amber-700]
    
    CheckYellowCond -->|ไม่ใช่| SetGREEN[🟢 สถานะ GREEN: ปกติ / เป็นไปตามแผน<br/>badgeColor: bg-emerald-50 text-emerald-700]
    
    SetRED --> UpdateProjectStatus[บันทึกสถานะสุขภาพโครงการ RAG Status]
    SetYELLOW --> UpdateProjectStatus
    SetGREEN --> UpdateProjectStatus
    
    UpdateProjectStatus --> Calc_End([ส่งผลลัพธ์ไปยัง Dashboard & Reports])
```

---

## 7. ผังกระบวนการล็อกและปลดล็อกแผนงาน (Plan Locking & Unlock Workflow)

แสดงมาตรการรักษาความน่าเชื่อถือของแผนงาน (Plan Integrity) เพื่อป้องกันการแก้ไขตัวเลขย้อนหลัง

```mermaid
flowchart TD
    L_Start([สร้างโครงการ & กิจกรรมใหม่]) --> L_Init[สถานะเริ่มต้น: IsLocked = false<br/>สามารถแก้ไขชื่อ วันที่ และงบประมาณตั้งต้นได้]
    
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
    
    L_Reject --> L_End([สิ้นสุดกระบวนการ])
    L_ReLock --> L_End
    L_KeepLock --> L_End
```
