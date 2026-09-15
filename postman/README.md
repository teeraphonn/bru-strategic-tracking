# คู่มือการใช้งาน Postman: BRU Strategic Tracking - API Test Collection

ชุดทดสอบ API ฉบับสมบูรณ์สำหรับระบบ **BRU Strategic Performance Tracking System** (มหาวิทยาลัยราชภัฏบุรีรัมย์)
ตรงตามมาตรฐาน RESTful API Specification และการตรวจสอบสิทธิ์ความปลอดภัย Role-Based Access Control (RBAC)

---

## 📁 รายการไฟล์ในโฟลเดอร์นี้

1. **`BRU_Strategic_Tracking_API_Test_Collection.postman_collection.json`**  
   ไฟล์ Collection รวม Endpoints ทั้งหมด 8 หมวดหมู่ (25+ API Requests)
2. **`BRU_Strategic_Tracking_Environment.postman_environment.json`**  
   ไฟล์ Environment สำหรับตั้งค่าตัวแปรระบบ (`base_url`, `token`, User/Pass แต่ละ Role)

---

## 🚀 วิธีการนำเข้า (Import) เข้าโปรแกรม Postman ใน 2 คลิก

1. เปิดโปรแกรม **Postman**
2. กดปุ่ม **"Import"** (มุมซ้ายบนของโปรแกรม)
3. ลากทั้ง 2 ไฟล์ในโฟลเดอร์นี้เข้าไปในหน้าต่าง Import:
   - `BRU_Strategic_Tracking_API_Test_Collection.postman_collection.json`
   - `BRU_Strategic_Tracking_Environment.postman_environment.json`
4. ที่มุมขวาบนของ Postman เลือก Environment เป็น **"BRU Strategic Tracking - Local Dev Environment"**

---

## 🧪 ขั้นตอนการทดสอบ (Testing Workflow)

1. **เริ่มต้นด้วยการ Login เพื่อรับ Token:**
   - ไปที่โฟลเดอร์ `01. Authentication & Users`
   - เลือก Role ที่ต้องการทดสอบ เช่น `Login as Teacher` หรือ `Login as Dean`
   - กด **Send**
   - **ระบบมี Test Script เก็บ Token อัตโนมัติ:** เมื่อล็อกอินสำเร็จ Token จะถูกนำไปเก็บไว้ในตัวแปร `{{token}}` และนำไปแนบ Header `Authorization: Bearer <token>` ให้กับทุก Request อื่นๆ โดยอัตโนมัติ

2. **ทดสอบการทำงานตามบทบาท (Role Scenarios):**
   - **TEACHER:** ทดสอบดูแดชบอร์ดงานของตนเอง (`GET /dashboard`), สร้างโครงการ (`POST /projects`), และบันทึกกิจกรรม (`PUT /activities/:id/progress`)
   - **DEAN:** ทดสอบดูแดชบอร์ดคณะ (`GET /dashboard/dean`) และส่งข้อสั่งการเร่งรัดงาน (`POST /directives/dean`)
   - **PRESIDENT:** ทดสอบดูสถิติยุทธศาสตร์มหาวิทยาลัย (`GET /dashboard/president`) และส่งข้อสั่งการระดับนโยบาย
   - **ADMIN:** ทดสอบจัดการข้อมูล Master Data 9 หมวด และปลดล็อกแผนงานโครงการ (`PATCH /projects/:id/toggle-lock`)

3. **ทดสอบความปลอดภัย (Security & IDOR Check):**
   - ลองใช้ Token ของอาจารย์ หรือคณบดีคนละคณะ ยิงข้อสั่งการไปยังโครงการของคณะอื่น ระบบจะตอบกลับด้วย **HTTP 403 Forbidden** ทันที เพื่อพิสูจน์การป้องกันช่องโหว่ IDOR
