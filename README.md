# Strategic Performance Tracking System (ระบบติดตามการดำเนินงานตามประเด็นยุทธศาสตร์ มรภ.บุรีรัมย์)

ระบบติดตามการดำเนินงานและประเมินผลสัมฤทธิ์ตามประเด็นยุทธศาสตร์ของมหาวิทยาลัยราชภัฏบุรีรัมย์ พัฒนาด้วยสถาปัตยกรรม Full Stack Web Application (React + Node.js + MySQL) แบบพร้อมใช้งานจริง (Production Ready)

---

## 🚀 ฟังก์ชันหลักของระบบ (Core Features)

1. **ระบบความปลอดภัยและการควบคุมสิทธิ์ (JWT & RBAC):**
   - แบ่งระดับผู้ใช้งานตามตำแหน่ง: `Admin`, `อธิการบดี` (President), `คณบดี` (Dean), `หัวหน้าหน่วยงาน` (Head), `อาจารย์ / เจ้าหน้าที่` (Teacher)
   - หน้าจอ Dashboard แตกต่างกันตามบทบาทของผู้ใช้ (แสดงข้อมูลเฉพาะที่อยู่ในขอบเขตสิทธิ์ของตนเอง)

2. **ระบบจัดการโครงการและกิจกรรม (Strategic Projects & Activities):**
   - สามารถระบุจำนวนเป้าหมายสะสม (เช่น ดำเนินการ 10 ครั้ง, จัดอบรม 5 รุ่น)
   - ระบบการล็อกแผนงาน: เมื่อบันทึกกิจกรรมในแผนแล้ว จะล็อกห้ามแก้ไขข้อมูลตั้งต้น ยกเว้น Admin เพื่อป้องกันการเปลี่ยนตัวเลขหลังบันทึกแผน
   - บันทึกความสำเร็จและเบิกจ่ายงบประมาณจริง (Actual Budget, Success validation)
   - อัปโหลดรูปภาพบันทึกผลการจัดกิจกรรมได้หลายภาพพร้อมกัน กำหนดขนาดไม่เกิน 5MB (JPG/PNG) พร้อมระบบแสดงรูปตัวอย่าง (Preview) และแกลเลอรีรูปภาพความสำเร็จ

3. **แดชบอร์ดสรุปความคืบหน้าเรียลไทม์ (Real-time Analytics Dashboard):**
   - สรุปผลความสำเร็จสะสม (%) การเบิกจ่ายงบประมาณสะสม (%) และจำนวนโครงการสำเร็จ
   - แผนภูมิวิเคราะห์ความคืบหน้าโครงการ (Pie Chart), งบประมาณเปรียบเทียบใช้จริงแยกตามคณะ/หน่วยงาน (Bar Chart), และแนวโน้มรายจ่ายย้อนหลัง (Line Chart)

4. **ระบบออกรายงานและการส่งออกข้อมูล (Report Compiler & Export Engine):**
   - แสดงตารางตัวอย่าง (Live Preview) รายงานระดับโครงการ รายคณะ รายภาควิชา รายงบประมาณ และรายงานสรุปภาพรวมยุทธศาสตร์
   - ส่งออกข้อมูลเป็น PDF (รองรับอักษรภาษาไทย Tahoma), Excel (Styled .xlsx), และ CSV (UTF-8 BOM สำหรับเปิดใน MS Excel ภาษาไทย)

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **Vite**
- **Tailwind CSS v3** (Custom Brand Theme Purple `#6C3BFF`)
- **React Router v6** (Protected & Role-based Routing)
- **Axios** (API Client with Request Interceptors)
- **Chart.js** & **React-chartjs-2** (Visual charts)
- **React Hook Form** (Form validations)
- **SweetAlert2** (Interactive popup notification dialogs)
- **React Icons** (Material / Feather Icons)

### Backend
- **Node.js** & **Express.js**
- **Prisma ORM** (Database Abstraction Layer)
- **JWT & bcryptjs** (Secure authentication)
- **Multer** (Multipart file upload handler)
- **Helmet & CORS & Express Rate Limit** (API Security & Access Control)
- **Express Validator** (Server-side schema validation)
- **Morgan** (HTTP request logger)

### Database
- **MySQL** (Relational Database)

---

## 📂 โครงสร้างระบบ (Project Structure)

```
Strategic-Tracking-System/
├── frontend/             # ส่วนติดต่อผู้ใช้งาน (React + Vite)
│   ├── src/
│   │   ├── assets/       # ไฟล์ภาพ/สื่อทั่วไป
│   │   ├── components/   # ส่วนประกอบ UI เช่น Sidebar, Topbar
│   │   ├── contexts/     # Context จัดการสถานะ Authentication
│   │   ├── layouts/      # AppLayout ออกแบบกรอบเมนูและหน้าจอ
│   │   ├── pages/        # หน้าต่างหลัก (Dashboard, Projects, Reports, MasterData, Login)
│   │   ├── services/     # Axios Client
│   │   └── index.css     # Tailwind directives & Custom font (Prompt)
│   └── package.json
│
├── backend/              # ส่วนจัดการ API (Express.js)
│   ├── config/           # ตั้งค่า Prisma Client
│   ├── controllers/      # คอนโทรลเลอร์จัดเก็บการประมวลผล (Auth, Master, Project, Activity, etc.)
│   ├── middleware/       # ตัวกลางตรวจสอบสิทธิ์ความปลอดภัยและอัปโหลดรูป
│   ├── routes/           # เส้นทาง API (auth, master, projects, activities, etc.)
│   ├── prisma/           # Prisma Schemas & Database Migration / Seeding script
│   ├── uploads/          # โฟลเดอร์เก็บไฟล์ภาพกิจกรรมจริงที่อัปโหลด
│   └── app.js            # ไฟล์ตั้งต้น Express App
│
├── database/             # เอกสารอธิบายฐานข้อมูล
│   ├── schema.sql        # โครงสร้างฐานข้อมูล DDL
│   ├── seed.sql          # ข้อมูลตั้งต้นระบบ SQL inserts
│   ├── ERD.md            # ไดอะแกรมความสัมพันธ์ตาราง (Mermaid Diagram)
│   └── DataDictionary.md # พจนานุกรมอธิบายฟิลด์ข้อมูล
│
└── .env                  # การตั้งค่า Environment ตัวแปรระบบ
```

---

## ⚙️ ขั้นตอนการติดตั้งและทดสอบ (Installation & Setup)

### 1. การเตรียมฐานข้อมูล (MySQL Setup)
1. เปิดโปรแกรม **XAMPP Control Panel** และเริ่มการทำงานของ **Apache** และ **MySQL**
2. ระบบจะเชื่อมต่อกับฐานข้อมูลโฮสต์ผ่าน `localhost:3306`

### 2. การเตรียมการในส่วนของ Backend
1. เปิด Terminal และเข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ทำการติดตั้งแพ็คเกจต่างๆ (node modules):
   ```bash
   npm install
   ```
3. รันระบบ Migration เพื่อแปลง Prisma Schema ไปเป็นโครงสร้างตารางจริงใน MySQL:
   ```bash
   npx prisma migrate dev --name init
   ```
4. รันคำสั่งเพิ่มข้อมูลหลักตั้งต้น (Seeding data - คณะ, ยุทธศาสตร์หลัก, ตัวชี้วัด และบัญชีผู้ใช้ทดสอบ):
   ```bash
   npx prisma db seed
   ```
5. สตาร์ทตัวรันเซิร์ฟเวอร์แบบนักพัฒนา (Development Server):
   ```bash
   npm run dev
   ```
   *เซิร์ฟเวอร์หลังบ้านจะเปิดทำงานที่พอร์ต `http://localhost:5000`*

### 3. การตรวจสอบความถูกต้องหลังบ้าน (Backend Verification)
เพื่อความมั่นใจในสิทธิ์และการคำนวณเป้าหมายความสำเร็จของระบบ ให้ทดสอบรันสคริปต์ตรวจเช็ค:
```bash
node verify-endpoints.js
```
*(ผลลัพธ์การตรวจสอบ TEST 1, 2, 3 ควรจะขึ้นข้อความ ✅ Passed ทั้งหมด)*

### 4. การเตรียมการในส่วนของ Frontend
1. เปิด Terminal แถบใหม่ และเข้าไปที่โฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ทำการติดตั้งแพ็คเกจต่างๆ:
   ```bash
   npm install
   ```
3. สตาร์ทตัวรันโปรเจกต์แสดงผลเว็บแอปพลิเคชัน:
   ```bash
   npm run dev
   ```
   *หน้าจอเว็บแอปพลิเคชันจะรันแสดงผลที่พอร์ต `http://localhost:5173` (หรือตามพอร์ตที่ระบุใน Terminal)*

---

## 🔑 บัญชีผู้ใช้งานระบบสำหรับการทดสอบ (Pre-seeded Test Accounts)

สำหรับการทดสอบระบบตามบทบาทและสิทธิ์การเข้าถึงข้อมูล (Role-Based Access Control) ระบบได้ระบุบัญชีผู้ใช้สำหรับการล็อคอินไว้ดังนี้:

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | บทบาทระบบ (Role) | สิทธิ์การมองเห็นข้อมูลบน Dashboard / หน้าโครงการ |
| :--- | :--- | :--- | :--- |
| **admin** | `admin1234` | ADMIN | **เห็นทุกข้อมูล** และสามารถจัดการ Master Data (CRUD ครบถ้วน) และแก้ไขตัวเลขสำเร็จข้ามเป้าหมายได้ |
| **president** | `123456` | PRESIDENT | **เห็นภาพรวมทั้งมหาวิทยาลัย** แต่ไม่มีสิทธิ์ในการจัดการข้อมูลหลักระบบ (Read only dashboard) |
| **dean** | `123456` | DEAN | **เห็นโครงการทั้งหมดภายใต้คณะของตนเอง** (ในเมล็ดข้อมูลตั้งต้นคือ คณะวิทยาศาสตร์) |
| **head** | `123456` | HEAD | **เห็นโครงการภายใต้ภาควิชา/หน่วยงานของตนเอง** (ภาควิชาคอมพิวเตอร์) |
| **teacher** | `123456` | TEACHER | **เห็นเฉพาะโครงการที่ตนเองเสนอสร้าง** หรือได้รับการระบุเป็นผู้รับผิดชอบร่วม |
| **teacher2** | `123456` | TEACHER | **เห็นเฉพาะโครงการของตนเอง** (สังกัดภาควิชาฟิสิกส์) |

---

## 🔒 มาตรฐานความปลอดภัยและการตรวจสอบข้อผิดพลาด (Security & Clean Code)
- รหัสผ่านถูกเข้ารหัสด้วยกลไก **bcrypt**
- ป้องกันการเข้าถึง API ผ่าน **JWT Token Interceptors** และการจำกัดสิทธิ์ในระดับ Middleware
- ใช้ **Prisma Client Transaction** ป้องกันปัญหาข้อมูลไม่สอดคล้องกัน (Data Inconsistency) ระหว่างการนับผลสัมฤทธิ์
- ตั้งชื่อตัวแปร คอนโทรลเลอร์ และเส้นทาง API เป็นภาษาอังกฤษมาตรฐาน (Clean Code) พร้อมแสดงความคิดเห็นกำกับในจุดประมวลผลที่สำคัญ
- ออกแบบหน้าจอให้รองรับการทำงานกับขนาดหน้าจอทุกระดับ (Responsive Design) เพื่อให้คณาจารย์และผู้บริหารสามารถติดตามความก้าวหน้าโครงการผ่านแท็บเล็ตและโทรศัพท์มือถือได้อย่างสมบูรณ์แบบ
