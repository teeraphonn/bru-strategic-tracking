# ผังกระบวนการทำงานของระบบ (System Flowchart Manual) — ขนาดกระดาษ A4 สำหรับ Microsoft Word
## Strategic Performance Tracking System — มหาวิทยาลัยราชภัฏบุรีรัมย์ (BRU)

เอกสารนี้รวบรวมผังกระบวนการทำงานที่ได้รับการจัดสัดส่วน (Aspect Ratio) และความกระชับของข้อความ ให้เหมาะสำหรับการนำไปใส่ใน **เอกสาร Microsoft Word ขนาด A4** โดยเฉพาะ (ไม่ล้นหน้า ตัวหนังสือไม่เล็กเกินไป และคมชัดเมื่อพิมพ์)

---

## 📌 สารบัญสำหรับเอกสาร Word A4
1. [รูปแบบที่ 1 : ผังกระบวนการสำหรับ A4 แนวตั้ง (Single-Page Portrait) — แนะนำสำหรับรายงานทั่วไป](#รูปแบบที่-1--ผังกระบวนการสำหรับ-a4-แนวตั้ง-single-page-portrait)
2. [รูปแบบที่ 2 : ผังกระบวนการสำหรับ A4 แนวนอน (Landscape Flowchart) — แนะนำสำหรับภาคผนวก](#รูปแบบที่-2--ผังกระบวนการสำหรับ-a4-แนวนอน-landscape-flowchart)
3. [💡 วิธี Export รูปภาพให้คมชัด 100% ไม่เบลอใน Microsoft Word](#-วิธี-export-รูปภาพให้คมชัด-100-ไม่เบลอใน-microsoft-word)

---

## รูปแบบที่ 1 : ผังกระบวนการสำหรับ A4 แนวตั้ง (Single-Page Portrait)
> **เหมาะสำหรับ:** รายงานราชการ / สรุปโครงการหน้าเดียว (A4 Portrait) ที่มีระยะขอบ 2.5 ซม.

```mermaid
flowchart TD
    %% Global Settings for Word A4
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef stepBox fill:#ffffff,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef engineBox fill:#fffbeb,stroke:#d97706,stroke-width:1.5px,color:#78350f;
    classDef execBox fill:#faf5ff,stroke:#7c3aed,stroke-width:1.5px,color:#4c1d95;
    classDef reportBox fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px,color:#14532d;

    Start([🟢 เริ่มต้น: ยืนยันตัวตนเข้าสู่ระบบด้วย JWT]) :::startEnd

    Start --> P1["<b>ขั้นตอนที่ 1 : เตรียมข้อมูลหลัก (Master Data)</b><br/>• ผู้ดูแลระบบ ADMIN กำหนดข้อมูล 9 คณะ, ภาควิชา, แหล่งเงิน<br/>• กำหนดยุทธศาสตร์ S1-S6, ตัวชี้วัด และเปิดรอบปีงบประมาณ"] :::stepBox

    P1 --> P2["<b>ขั้นตอนที่ 2 : เสนอโครงการ & วางแผนงาน (Proposal)</b><br/>• อาจารย์ TEACHER สร้างข้อเสนอ ระบุยุทธศาสตร์และงบประมาณ<br/>• ระบบนำทางอัตโนมัติเพื่อระบุกิจกรรมย่อยและวันดำเนินงาน"] :::stepBox

    P2 --> P3["<b>ขั้นตอนที่ 3 : ดำเนินการ & บันทึกผลจริง (Execution)</b><br/>• จัดกิจกรรมในพื้นที่จริงตามแผนงานที่กำหนด<br/>• บันทึกงบใช้จริง (actualBudget) และผลผลิต (completedCount)<br/>• อัปโหลดภาพถ่ายกิจกรรมเพื่อเป็นหลักฐานเชิงประจักษ์"] :::stepBox

    P3 --> P4["<b>ขั้นตอนที่ 4 : ประมวลผลอัตโนมัติ (Automated Engine)</b><br/>• คำนวณ % ความก้าวหน้า และ % การใช้จ่ายงบประมาณ Real-time<br/>• ประเมินสถานะสุขภาพโครงการ: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🔴 วิกฤต<br/>• ทำการล็อกแผนงาน (IsLocked) ป้องกันการแก้ไขย้อนหลัง"] :::engineBox

    P4 --> P5["<b>ขั้นตอนที่ 5 : กำกับติดตาม & ข้อสั่งการ (Governance)</b><br/>• ผู้บริหาร PRESIDENT & DEAN ตรวจสอบแดชบอร์ด & ธงแดง<br/>• ออกข้อสั่งการเร่งรัด (Directives) ส่งตรงถึงผู้รับผิดชอบโครงการ"] :::execBox

    P5 --> P6["<b>ขั้นตอนที่ 6 : สรุปผลสัมฤทธิ์ & ส่งออกรายงาน (Outputs)</b><br/>• รายงานสรุปผลสัมฤทธิ์รายยุทธศาสตร์ S1-S6 & 10 โครงการหลัก<br/>• ส่งออกไฟล์มาตรฐาน: PDF เอกสารราชการ / Excel / พิมพ์ A4"] :::reportBox

    P6 --> End([🏁 สิ้นสุด: ครบวงจรการติดตามและประเมินผลเชิงยุทธศาสตร์]) :::startEnd
```

---

## รูปแบบที่ 2 : ผังกระบวนการสำหรับ A4 แนวนอน (Landscape Flowchart)
> **เหมาะสำหรับ:** เอกสารแนวนอน หรือส่วนหัวของสไลด์นำเสนอ

```mermaid
flowchart LR
    %% Global Settings for Word A4 Landscape
    classDef startEnd fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef nodeStyle fill:#ffffff,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef engineStyle fill:#fffbeb,stroke:#d97706,stroke-width:1.5px,color:#78350f;

    S([🟢 เริ่มต้น]) :::startEnd --> S1["<b>1. Setup</b><br/>เตรียมข้อมูลหลัก<br/>S1-S6 / ผู้ใช้งาน"] :::nodeStyle
    S1 --> S2["<b>2. Proposal</b><br/>สร้างโครงการ<br/>วางแผนกิจกรรม"] :::nodeStyle
    S2 --> S3["<b>3. Execution</b><br/>บันทึกงบจริง<br/>แนบภาพถ่าย"] :::nodeStyle
    S3 --> S4["<b>4. Engine</b><br/>คำนวณ RAG<br/>ล็อกแผนงาน"] :::engineStyle
    S4 --> S5["<b>5. Directives</b><br/>ผู้บริหารกำกับ<br/>สั่งการเร่งรัด"] :::nodeStyle
    S5 --> S6["<b>6. Reports</b><br/>ส่งออก PDF/Excel<br/>สรุปผลสัมฤทธิ์"] :::nodeStyle
    S6 --> E([🏁 สิ้นสุด]) :::startEnd
```

---

## 💡 วิธี Export รูปภาพให้คมชัด 100% ไม่เบลอใน Microsoft Word

1. **เปิดเว็บไซต์:** ไปที่ [Mermaid Live Editor (mermaid.live)](https://mermaid.live)
2. **วางโค้ด:** คัดลอกโค้ดด้านบนไปวางในช่องซ้ายมือ
3. **ดาวน์โหลดภาพความละเอียดสูง (แนะนำ):**
   - กดปุ่ม **Actions** > เลือก **PNG** 
   - หรือเลือก **SVG** (หากใช้ Word 2016 ขึ้นไป หรือ Office 365 จะสามารถ Insert SVG ได้โดยตรง ภาพจะคมชัดไม่แตกแม้ขยายใหญ่)
4. **แทรกลงใน Microsoft Word:**
   - เมนู **Insert (แทรก)** > **Pictures (รูปภาพ)** > เลือกไฟล์ที่ดาวน์โหลดมา
   - ปรับขนาดให้กว้างประมาณ **15 - 16 ซม.** จะพอดีกับขอบกระดาษ A4 (Margins Normal 1 นิ้ว) สวยงาม อ่านง่าย ไม่ล้นหน้าครับ
