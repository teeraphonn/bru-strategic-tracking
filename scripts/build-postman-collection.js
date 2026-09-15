const fs = require('fs');
const path = require('path');

const postmanDir = path.join(__dirname, '..', 'postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

// ── 1. Postman Collection Definition ──────────────────────────────────────────
const collection = {
  info: {
    _postman_id: "57319714-984cc94c-c49c-4df9-8e15-c045594b7285",
    name: "BRU Strategic Tracking - API Test Collection",
    description: "ชุดทดสอบ API (RESTful API Collection v2.1.0) สำหรับระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์\nครอบคลุมการตรวจสอบสิทธิ์ RBAC, CRUD โครงการ/กิจกรรม, แดชบอร์ดสรุปผล 4 บทบาท และการสั่งการผู้บริหาร",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{token}}",
        type: "string"
      }
    ]
  },
  item: [
    // ── 01. Authentication & Users ──
    {
      name: "01. Authentication & Users",
      item: [
        {
          name: "Login as Teacher (อ.สมชาย)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has token and role is TEACHER', function () {",
                  "    pm.expect(jsonData.token).to.be.a('string');",
                  "    pm.expect(jsonData.user.role).to.eql('TEACHER');",
                  "    pm.environment.set('token', jsonData.token);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ username: "{{teacher_username}}", password: "{{teacher_password}}" }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            },
            description: "เข้าสู่ระบบด้วยบัญชีบทบาทอาจารย์ผู้รับผิดชอบโครงการ (Token จะถูกเก็บลง Environment 'token' อัตโนมัติ)"
          }
        },
        {
          name: "Login as Dean (คณบดีคณะวิทย์)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has token and role is DEAN', function () {",
                  "    pm.expect(jsonData.token).to.be.a('string');",
                  "    pm.expect(jsonData.user.role).to.eql('DEAN');",
                  "    pm.environment.set('token', jsonData.token);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ username: "{{dean_username}}", password: "{{dean_password}}" }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            },
            description: "เข้าสู่ระบบด้วยบัญชีบทบาทคณบดี เพื่อทดสอบสิทธิ์ระดับคณะ"
          }
        },
        {
          name: "Login as President (อธิการบดี)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has token and role is PRESIDENT', function () {",
                  "    pm.expect(jsonData.token).to.be.a('string');",
                  "    pm.expect(jsonData.user.role).to.eql('PRESIDENT');",
                  "    pm.environment.set('token', jsonData.token);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ username: "{{president_username}}", password: "{{president_password}}" }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            },
            description: "เข้าสู่ระบบด้วยบัญชีอธิการบดี เพื่อทดสอบสิทธิ์แดชบอร์ดมหาวิทยาลัยและการสั่งการระดับนโยบาย"
          }
        },
        {
          name: "Login as Admin (ผู้ดูแลระบบ)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has token and role is ADMIN', function () {",
                  "    pm.expect(jsonData.token).to.be.a('string');",
                  "    pm.expect(jsonData.user.role).to.eql('ADMIN');",
                  "    pm.environment.set('token', jsonData.token);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ username: "{{admin_username}}", password: "{{admin_password}}" }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            },
            description: "เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อทดสอบการจัดการ Master Data และปลดล็อกโครงการ"
          }
        },
        {
          name: "Get Current User Profile (/auth/me)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Profile returned has valid user id', function () {",
                  "    pm.expect(jsonData.user.id).to.be.a('number');",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/auth/me",
              host: ["{{base_url}}"],
              path: ["auth", "me"]
            },
            description: "ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันจาก JWT Token"
          }
        },
        {
          name: "Get Public Landing Stats (/auth/public-stats)",
          request: {
            auth: { type: "noauth" },
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/auth/public-stats",
              host: ["{{base_url}}"],
              path: ["auth", "public-stats"]
            },
            description: "ดึงข้อมูลสถิติสาธารณะสำหรับแสดงผลบนหน้า Login Page"
          }
        }
      ]
    },

    // ── 02. Dashboard API ──
    {
      name: "02. Dashboard API",
      item: [
        {
          name: "Get Teacher / My Dashboard (/dashboard)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Contains summary cards', function () {",
                  "    pm.expect(jsonData).to.have.property('stats');",
                  "    pm.expect(jsonData).to.have.property('projects');",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/dashboard",
              host: ["{{base_url}}"],
              path: ["dashboard"]
            },
            description: "แดชบอร์ดส่วนบุคคล สรุปเฉพาะโครงการที่ตนเองรับผิดชอบ"
          }
        },
        {
          name: "Get Dean Dashboard (/dashboard/dean)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has faculty scoped data and red flags', function () {",
                  "    pm.expect(jsonData).to.have.property('facultyName');",
                  "    pm.expect(jsonData).to.have.property('redFlags');",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/dashboard/dean",
              host: ["{{base_url}}"],
              path: ["dashboard", "dean"]
            },
            description: "แดชบอร์ดภาพรวมระดับคณะ (เห็นเฉพาะสาขาวิชาและโครงการในคณะตนเอง)"
          }
        },
        {
          name: "Get President Dashboard (/dashboard/president)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Has university-wide KPI and strategic pillars', function () {",
                  "    pm.expect(jsonData).to.have.property('strategicSummary');",
                  "    pm.expect(jsonData).to.have.property('facultiesMatrix');",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/dashboard/president",
              host: ["{{base_url}}"],
              path: ["dashboard", "president"]
            },
            description: "แดชบอร์ดยุทธศาสตร์มหาวิทยาลัย (สถิติรวมทุกคณะ, 6 เสายุทธศาสตร์, โครงการติดธงแดง)"
          }
        }
      ]
    },

    // ── 03. Projects API ──
    {
      name: "03. Projects API",
      item: [
        {
          name: "Get All Projects (/projects)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "if (jsonData.length > 0) {",
                  "    pm.environment.set('project_id', jsonData[0].id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/projects?fiscalYearId=1",
              host: ["{{base_url}}"],
              path: ["projects"],
              query: [{ key: "fiscalYearId", value: "1" }]
            },
            description: "ดึงรายการโครงการทั้งหมดตามสิทธิ์ของผู้ใช้งาน (รองรับตัวกรองปีงบประมาณ)"
          }
        },
        {
          name: "Get Project Details by ID (/projects/:id)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/projects/{{project_id}}",
              host: ["{{base_url}}"],
              path: ["projects", "{{project_id}}"]
            },
            description: "ดึงข้อมูลรายละเอียดโครงการ พร้อมกิจกรรมย่อย รูปภาพ และประวัติข้อสั่งการ"
          }
        },
        {
          name: "Create Project (/projects)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 or 200', function () { pm.expect(pm.response.code).to.be.oneOf([200, 201]); });",
                  "var jsonData = pm.response.json();",
                  "if (jsonData.project && jsonData.project.id) {",
                  "    pm.environment.set('created_project_id', jsonData.project.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "โครงการยกระดับเศรษฐกิจฐานรากและพัฒนาศักยภาพชุมชนท้องถิ่น",
                fiscalYearId: 1,
                budgetSourceId: 1,
                subStrategyId: 1,
                indicatorId: 1,
                totalBudget: 150000.00,
                targetCount: 100,
                unit: "คน",
                startDate: "2026-10-01T00:00:00.000Z",
                endDate: "2027-09-30T00:00:00.000Z",
                userIds: []
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/projects",
              host: ["{{base_url}}"],
              path: ["projects"]
            },
            description: "สร้างโครงการใหม่ ผูกความเชื่อมโยงยุทธศาสตร์ 4 ระดับ (LDI, Strategy, Sub-strategy, Indicator)"
          }
        },
        {
          name: "Update Project (/projects/:id)",
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "โครงการยกระดับเศรษฐกิจฐานรากและพัฒนาศักยภาพชุมชนท้องถิ่น (ฉบับปรับปรุง)",
                fiscalYearId: 1,
                budgetSourceId: 1,
                subStrategyId: 1,
                indicatorId: 1,
                totalBudget: 150000.00,
                targetCount: 100,
                unit: "คน",
                startDate: "2026-10-01T00:00:00.000Z",
                endDate: "2027-09-30T00:00:00.000Z",
                userIds: []
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/projects/{{project_id}}",
              host: ["{{base_url}}"],
              path: ["projects", "{{project_id}}"]
            },
            description: "แก้ไขข้อมูลโครงการ (หากโครงการมีกิจกรรมแล้ว ระบบจะล็อกงบและเป้าหมายไม่อนุญาตให้แก้ไข)"
          }
        },
        {
          name: "Toggle Project Lock (ADMIN only)",
          request: {
            method: "PATCH",
            header: [],
            url: {
              raw: "{{base_url}}/projects/{{project_id}}/toggle-lock",
              host: ["{{base_url}}"],
              path: ["projects", "{{project_id}}", "toggle-lock"]
            },
            description: "ปลดล็อก หรือล็อกแผนงานโครงการ (เฉพาะบทบาท ADMIN เท่านั้น)"
          }
        }
      ]
    },

    // ── 04. Activities & Progress API ──
    {
      name: "04. Activities & Progress API",
      item: [
        {
          name: "Get Activities by Project ID (/activities)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "if (jsonData.length > 0) {",
                  "    pm.environment.set('activity_id', jsonData[0].id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/activities?projectId={{project_id}}",
              host: ["{{base_url}}"],
              path: ["activities"],
              query: [{ key: "projectId", value: "{{project_id}}" }]
            },
            description: "ดึงรายการกิจกรรมย่อยทั้งหมดของโครงการ"
          }
        },
        {
          name: "Create Activity (/activities)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 or 200', function () { pm.expect(pm.response.code).to.be.oneOf([200, 201]); });",
                  "var jsonData = pm.response.json();",
                  "if (jsonData.activity && jsonData.activity.id) {",
                  "    pm.environment.set('created_activity_id', jsonData.activity.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                projectId: 1,
                name: "จัดอบรมเชิงปฏิบัติการถ่ายทอดองค์ความรู้แก่ชุมชน",
                activityDate: "2026-11-15T09:00:00.000Z",
                budget: 35000.00
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/activities",
              host: ["{{base_url}}"],
              path: ["activities"]
            },
            description: "เพิ่มกิจกรรมย่อยในโครงการ (จะทริกเกอร์ระบบล็อกแผนงานของโครงการทันที)"
          }
        },
        {
          name: "Update Activity Progress & Outcome (/activities/:id/progress)",
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                status: "COMPLETED",
                actualBudget: 34500.00,
                targetCount: 50,
                progressDetail: "ดำเนินโครงการเสร็จสิ้น มีกลุ่มเกษตรกรเข้าร่วมครบตามเป้าหมาย 50 คน",
                problemDetail: "การเดินทางช่วงบ่ายมีฝนตกเล็กน้อยแต่แก้ไขโดยปรับสถานที่ในอาคาร"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/activities/{{activity_id}}/progress",
              host: ["{{base_url}}"],
              path: ["activities", "{{activity_id}}", "progress"]
            },
            description: "บันทึกผลการดำเนินงาน งบประมาณที่ใช้จริง และคำนวณ % ความก้าวหน้าโครงการใหม่อัตโนมัติ"
          }
        }
      ]
    },

    // ── 05. Executive Directives API ──
    {
      name: "05. Executive Directives API",
      item: [
        {
          name: "Issue Dean Directive (/directives/dean)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
                  "var jsonData = pm.response.json();",
                  "pm.test('Directive updated', function () {",
                  "    pm.expect(jsonData).to.have.property('project');",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                projectId: 1,
                deanDirective: "ขอให้อาจารย์ผู้รับผิดชอบโครงการเร่งรัดการเบิกจ่ายงวดที่ 1 ภายในสิ้นเดือนนี้"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/directives/dean",
              host: ["{{base_url}}"],
              path: ["directives", "dean"]
            },
            description: "ข้อสั่งการระดับคณบดี (มีระบบป้องกัน IDOR ตรวจสอบว่าโครงการต้องอยู่ภายใต้คณะของคณบดีท่านนั้น)"
          }
        },
        {
          name: "Issue President Directive (/directives/president)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                projectId: 1,
                presidentDirective: "มอบหมายให้คณะติดตามผลสัมฤทธิ์ของผลผลิต และรายงานต่อที่ประชุม กบม. ในรอบถัดไป"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/directives/president",
              host: ["{{base_url}}"],
              path: ["directives", "president"]
            },
            description: "ข้อสั่งการระดับอธิการบดีสำหรับสั่งการโครงการเชิงยุทธศาสตร์ภาพรวมมหาวิทยาลัย"
          }
        }
      ]
    },

    // ── 06. Master Data API ──
    {
      name: "06. Master Data API",
      item: [
        {
          name: "Get Local Issues (ประเด็นการพัฒนาท้องถิ่น)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/local-issues",
              host: ["{{base_url}}"],
              path: ["master", "local-issues"]
            },
            description: "ดึงข้อมูลประเด็นการพัฒนาท้องถิ่น (ชั้นที่ 1 ของ Cascading Dropdown)"
          }
        },
        {
          name: "Get Strategies (แผนงานหลัก)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/strategies",
              host: ["{{base_url}}"],
              path: ["master", "strategies"]
            },
            description: "ดึงยุทธศาสตร์หลัก 6 ด้านของมหาวิทยาลัยราชภัฏบุรีรัมย์"
          }
        },
        {
          name: "Get Sub-Strategies (แผนงานย่อย)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/sub-strategies",
              host: ["{{base_url}}"],
              path: ["master", "sub-strategies"]
            },
            description: "ดึงแผนงานย่อยที่สังกัดภายใต้แผนงานหลัก"
          }
        },
        {
          name: "Get Indicators / Main Projects (โครงการหลัก MP)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/indicators",
              host: ["{{base_url}}"],
              path: ["master", "indicators"]
            },
            description: "ดึงโครงการหลัก 10 โครงการ (Main Projects)"
          }
        },
        {
          name: "Get Faculties & Departments",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/faculties",
              host: ["{{base_url}}"],
              path: ["master", "faculties"]
            },
            description: "ดึงโครงสร้าง 9 คณะ และภาควิชา/สาขาวิชาทั้งหมดในมหาวิทยาลัย"
          }
        },
        {
          name: "Get Fiscal Years",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/fiscal-years",
              host: ["{{base_url}}"],
              path: ["master", "fiscal-years"]
            },
            description: "ดึงรายชื่อปีงบประมาณ (เช่น 2569)"
          }
        },
        {
          name: "Get Budget Sources",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/master/budget-sources",
              host: ["{{base_url}}"],
              path: ["master", "budget-sources"]
            },
            description: "ดึงแหล่งเงินงบประมาณ (งบแผ่นดิน, งบรายได้, กองทุนวิจัย ฯลฯ)"
          }
        }
      ]
    },

    // ── 07. Issue Management API ──
    {
      name: "07. Issue Management API",
      item: [
        {
          name: "Report Issue (/issues)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "พบปัญหาไม่สามารถดาวน์โหลดเอกสาร PDF บนมือถือได้",
                description: "เมื่อกดดาวน์โหลดรายงานสรุปในหน้าแดชบอร์ดผ่านเบราว์เซอร์ Safari หน้าจอหมุนค้าง",
                priority: "MEDIUM",
                category: "SYSTEM_BUG"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/issues",
              host: ["{{base_url}}"],
              path: ["issues"]
            },
            description: "ผู้ใช้ส่งเรื่องแจ้งปัญหาหรือข้อเสนอแนะในการใช้งานระบบ"
          }
        },
        {
          name: "Get My Issues (/issues/my)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/issues/my",
              host: ["{{base_url}}"],
              path: ["issues", "my"]
            },
            description: "ตรวจสอบสถานะปัญหาที่ตนเองเคยส่งเรื่องไว้"
          }
        },
        {
          name: "Get All Issues (ADMIN only)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/issues",
              host: ["{{base_url}}"],
              path: ["issues"]
            },
            description: "ผู้ดูแลระบบตรวจสอบรายการปัญหาทั้งหมด เพื่อเปลี่ยนสถานะเป็น IN_PROGRESS หรือ RESOLVED"
          }
        }
      ]
    },

    // ── 08. Reports & Exports API ──
    {
      name: "08. Reports & Exports API",
      item: [
        {
          name: "Get Strategic Report Summary (/reports)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/reports?fiscalYearId=1",
              host: ["{{base_url}}"],
              path: ["reports"],
              query: [{ key: "fiscalYearId", value: "1" }]
            },
            description: "ดึงข้อมูลสรุปผลงานและงบประมาณตามยุทธศาสตร์สำหรับแสดงผลหน้าจอรายงาน"
          }
        },
        {
          name: "Export Projects to CSV (/reports/export/csv)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/reports/export/csv?fiscalYearId=1",
              host: ["{{base_url}}"],
              path: ["reports", "export", "csv"],
              query: [{ key: "fiscalYearId", value: "1" }]
            },
            description: "ส่งออกข้อมูลโครงการและงบประมาณเป็นไฟล์ CSV (UTF-8 BOM สำหรับ Excel ภาษาไทย)"
          }
        },
        {
          name: "Export Projects to Excel (/reports/export/excel)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/reports/export/excel?fiscalYearId=1",
              host: ["{{base_url}}"],
              path: ["reports", "export", "excel"],
              query: [{ key: "fiscalYearId", value: "1" }]
            },
            description: "ส่งออกข้อมูลโครงการเป็นไฟล์ Excel (.xlsx) พร้อมจัดรูปแบบตารางและสรุปยอดรวม"
          }
        }
      ]
    }
  ]
};

// ── 2. Postman Environment Definition ─────────────────────────────────────────
const environment = {
  id: "44e6b15a-bc09-452f-bcaa-75c032859c76",
  name: "BRU Strategic Tracking - Local Dev Environment",
  values: [
    { key: "base_url", value: "http://localhost:5000/api", type: "default", enabled: true },
    { key: "token", value: "", type: "secret", enabled: true },
    { key: "project_id", value: "1", type: "default", enabled: true },
    { key: "activity_id", value: "1", type: "default", enabled: true },
    { key: "teacher_username", value: "teacher", type: "default", enabled: true },
    { key: "teacher_password", value: "123456", type: "secret", enabled: true },
    { key: "dean_username", value: "dean", type: "default", enabled: true },
    { key: "dean_password", value: "123456", type: "secret", enabled: true },
    { key: "president_username", value: "president", type: "default", enabled: true },
    { key: "president_password", value: "123456", type: "secret", enabled: true },
    { key: "admin_username", value: "admin", type: "default", enabled: true },
    { key: "admin_password", value: "admin1234", type: "secret", enabled: true }
  ],
  _postman_variable_scope: "environment"
};

// ── 3. README Guide ──────────────────────────────────────────────────────────
const readmeContent = `# คู่มือการใช้งาน Postman: BRU Strategic Tracking - API Test Collection

ชุดทดสอบ API ฉบับสมบูรณ์สำหรับระบบ **BRU Strategic Performance Tracking System** (มหาวิทยาลัยราชภัฏบุรีรัมย์)
ตรงตามมาตรฐาน RESTful API Specification และการตรวจสอบสิทธิ์ความปลอดภัย Role-Based Access Control (RBAC)

---

## 📁 รายการไฟล์ในโฟลเดอร์นี้

1. **\`BRU_Strategic_Tracking_API_Test_Collection.postman_collection.json\`**  
   ไฟล์ Collection รวม Endpoints ทั้งหมด 8 หมวดหมู่ (25+ API Requests)
2. **\`BRU_Strategic_Tracking_Environment.postman_environment.json\`**  
   ไฟล์ Environment สำหรับตั้งค่าตัวแปรระบบ (\`base_url\`, \`token\`, User/Pass แต่ละ Role)

---

## 🚀 วิธีการนำเข้า (Import) เข้าโปรแกรม Postman ใน 2 คลิก

1. เปิดโปรแกรม **Postman**
2. กดปุ่ม **"Import"** (มุมซ้ายบนของโปรแกรม)
3. ลากทั้ง 2 ไฟล์ในโฟลเดอร์นี้เข้าไปในหน้าต่าง Import:
   - \`BRU_Strategic_Tracking_API_Test_Collection.postman_collection.json\`
   - \`BRU_Strategic_Tracking_Environment.postman_environment.json\`
4. ที่มุมขวาบนของ Postman เลือก Environment เป็น **"BRU Strategic Tracking - Local Dev Environment"**

---

## 🧪 ขั้นตอนการทดสอบ (Testing Workflow)

1. **เริ่มต้นด้วยการ Login เพื่อรับ Token:**
   - ไปที่โฟลเดอร์ \`01. Authentication & Users\`
   - เลือก Role ที่ต้องการทดสอบ เช่น \`Login as Teacher\` หรือ \`Login as Dean\`
   - กด **Send**
   - **ระบบมี Test Script เก็บ Token อัตโนมัติ:** เมื่อล็อกอินสำเร็จ Token จะถูกนำไปเก็บไว้ในตัวแปร \`{{token}}\` และนำไปแนบ Header \`Authorization: Bearer <token>\` ให้กับทุก Request อื่นๆ โดยอัตโนมัติ

2. **ทดสอบการทำงานตามบทบาท (Role Scenarios):**
   - **TEACHER:** ทดสอบดูแดชบอร์ดงานของตนเอง (\`GET /dashboard\`), สร้างโครงการ (\`POST /projects\`), และบันทึกกิจกรรม (\`PUT /activities/:id/progress\`)
   - **DEAN:** ทดสอบดูแดชบอร์ดคณะ (\`GET /dashboard/dean\`) และส่งข้อสั่งการเร่งรัดงาน (\`POST /directives/dean\`)
   - **PRESIDENT:** ทดสอบดูสถิติยุทธศาสตร์มหาวิทยาลัย (\`GET /dashboard/president\`) และส่งข้อสั่งการระดับนโยบาย
   - **ADMIN:** ทดสอบจัดการข้อมูล Master Data 9 หมวด และปลดล็อกแผนงานโครงการ (\`PATCH /projects/:id/toggle-lock\`)

3. **ทดสอบความปลอดภัย (Security & IDOR Check):**
   - ลองใช้ Token ของอาจารย์ หรือคณบดีคนละคณะ ยิงข้อสั่งการไปยังโครงการของคณะอื่น ระบบจะตอบกลับด้วย **HTTP 403 Forbidden** ทันที เพื่อพิสูจน์การป้องกันช่องโหว่ IDOR
`;

// ── 4. Write Files to postman/ ────────────────────────────────────────────────
const collectionFile = path.join(postmanDir, 'BRU_Strategic_Tracking_API_Test_Collection.postman_collection.json');
const environmentFile = path.join(postmanDir, 'BRU_Strategic_Tracking_Environment.postman_environment.json');
const readmeFile = path.join(postmanDir, 'README.md');

fs.writeFileSync(collectionFile, JSON.stringify(collection, null, 2), 'utf8');
fs.writeFileSync(environmentFile, JSON.stringify(environment, null, 2), 'utf8');
fs.writeFileSync(readmeFile, readmeContent, 'utf8');

console.log('✅ Generated Postman Collection at:', collectionFile);
console.log('✅ Generated Postman Environment at:', environmentFile);
console.log('✅ Generated Guide at:', readmeFile);

