const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting seed...');

  // 1 & 2. Create Faculties and Departments programmatically
  const seedFaculties = [
    {
      name: 'ส่วนกลาง',
      depts: [
        'กองกลาง',
        'กองนโยบายและแผน',
        'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ',
        'สำนักส่งเสริมวิชาการและงานทะเบียน',
        'สถาบันวิจัยและพัฒนา'
      ]
    },
    {
      name: 'คณะวิทยาศาสตร์',
      depts: [
        'ภาควิชาฟิสิกส์',
        'คณิตศาสตร์ (คณะวิทยาศาสตร์)',
        'วิทยาการคอมพิวเตอร์',
        'เทคโนโลยีสารสนเทศ',
        'สถิติประยุกต์',
        'เคมี',
        'ชีววิทยา',
        'วิทยาศาสตร์สิ่งแวดล้อม',
        'วิทยาศาสตร์การกีฬา',
        'วิทยาศาสตร์และเทคโนโลยีอาหาร',
        'สุขภาพชุมชน',
        'ภูมิสารสนเทศ',
        'วิทยาศาสตร์สิ่งทอ'
      ]
    },
    {
      name: 'คณะครุศาสตร์',
      depts: [
        'การศึกษาปฐมวัย',
        'คณิตศาสตร์ (คณะครุศาสตร์)',
        'วิทยาศาสตร์ทั่วไป',
        'ฟิสิกส์ (คณะครุศาสตร์)',
        'ภาษาไทย (คณะครุศาสตร์)',
        'ภาษาอังกฤษ (คณะครุศาสตร์)',
        'สังคมศึกษา',
        'พลศึกษา',
        'ดนตรีศึกษา',
        'นาฏศิลป์',
        'ศิลปศึกษา',
        'เทคโนโลยีและคอมพิวเตอร์เพื่อการศึกษา'
      ]
    },
    {
      name: 'คณะวิทยาการจัดการ',
      depts: [
        'ภาควิชาการบริหารธุรกิจ',
        'การจัดการ',
        'การตลาด',
        'การบริหารทรัพยากรมนุษย์',
        'คอมพิวเตอร์ธุรกิจ',
        'การเงินและการธนาคาร',
        'การบัญชี',
        'เศรษฐศาสตร์ธุรกิจ',
        'การท่องเที่ยวและการโรงแรม',
        'นิเทศศาสตร์'
      ]
    },
    {
      name: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
      depts: [
        'ภาควิชาภาษาอังกฤษ',
        'ภาษาไทย (คณะมนุษยศาสตร์ฯ)',
        'ภาษาอังกฤษธุรกิจ',
        'การพัฒนาสังคม',
        'ศิลปะดิจิทัล/คอมพิวเตอร์อาร์ตและดีไซน์',
        'ดนตรี',
        'รัฐประศาสนศาสตร์',
        'นิติศาสตร์',
        'บรรณารักษศาสตร์และสารสนเทศศาสตร์'
      ]
    },
    {
      name: 'คณะเทคโนโลยีอุตสาหกรรม',
      depts: [
        'เทคโนโลยีการจัดการอุตสาหกรรม',
        'เทคโนโลยีเซรามิกส์',
        'เทคโนโลยีสถาปัตยกรรม',
        'ออกแบบอุตสาหกรรม',
        'เทคโนโลยีอิเล็กทรอนิกส์สื่อสาร',
        'เทคโนโลยีวิศวกรรมไฟฟ้า',
        'เทคโนโลยีก่อสร้าง'
      ]
    },
    {
      name: 'คณะเทคโนโลยีการเกษตร',
      depts: [
        'เกษตรศาสตร์',
        'ประมง',
        'สัตวศาสตร์'
      ]
    },
    {
      name: 'คณะพยาบาลศาสตร์',
      depts: [
        'พยาบาลศาสตร์'
      ]
    },
    {
      name: 'บัณฑิตวิทยาลัย',
      depts: [
        'สาขาวิชาหลักสูตรและการสอน'
      ]
    }
  ];

  const facultyInstances = {};
  const departmentInstances = {};

  for (const item of seedFaculties) {
    const fac = await prisma.faculty.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name }
    });
    facultyInstances[item.name] = fac;

    for (const dName of item.depts) {
      const dept = await prisma.department.upsert({
        where: { name: dName },
        update: { facultyId: fac.id },
        create: { name: dName, facultyId: fac.id }
      });
      departmentInstances[dName] = dept;
    }
  }

  // Map to historical variables for down-stream seed references
  const fSci = facultyInstances['คณะวิทยาศาสตร์'];
  const fEdu = facultyInstances['คณะครุศาสตร์'];
  const fMng = facultyInstances['คณะวิทยาการจัดการ'];
  const fHum = facultyInstances['คณะมนุษยศาสตร์และสังคมศาสตร์'];

  const dComp = departmentInstances['ภาควิชาคอมพิวเตอร์'];
  const dPhys = departmentInstances['ภาควิชาฟิสิกส์'];

  console.log('[SEED] Faculties and Departments created.');

  // 3. Create Fiscal Years
  const fy2569 = await prisma.fiscalYear.upsert({
    where: { year: 2569 },
    update: { active: true },
    create: { year: 2569, active: true }
  });
  const fy2568 = await prisma.fiscalYear.upsert({
    where: { year: 2568 },
    update: { active: false },
    create: { year: 2568, active: false }
  });

  console.log('[SEED] Fiscal Years created.');

  // 4. Create Budget Sources
  const bsGov = await prisma.budgetSource.upsert({
    where: { name: 'งบประมาณแผ่นดิน' },
    update: {},
    create: { name: 'งบประมาณแผ่นดิน' }
  });
  const bsUni = await prisma.budgetSource.upsert({
    where: { name: 'งบรายได้มหาวิทยาลัย' },
    update: {},
    create: { name: 'งบรายได้มหาวิทยาลัย' }
  });
  const bsLoc = await prisma.budgetSource.upsert({
    where: { name: 'งบประมาณกองทุนพัฒนาท้องถิ่น' },
    update: {},
    create: { name: 'งบประมาณกองทุนพัฒนาท้องถิ่น' }
  });

  console.log('[SEED] Budget Sources created.');

  // 5. Create Strategies, Sub-strategies and Indicators
  const s1 = await prisma.strategy.upsert({
    where: { code: 'S1' },
    update: { name: 'การพัฒนาท้องถิ่นด้วยวิทยาศาสตร์ เทคโนโลยี และนวัตกรรม' },
    create: { code: 'S1', name: 'การพัฒนาท้องถิ่นด้วยวิทยาศาสตร์ เทคโนโลยี และนวัตกรรม' }
  });
  const s2 = await prisma.strategy.upsert({
    where: { code: 'S2' },
    update: { name: 'การยกระดับคุณภาพการศึกษาและการผลิตบัณฑิตนักปฏิบัติ' },
    create: { code: 'S2', name: 'การยกระดับคุณภาพการศึกษาและการผลิตบัณฑิตนักปฏิบัติ' }
  });

  const ss1_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.1' },
    update: { name: 'การส่งเสริมการเกษตรปลอดภัยและการแปรรูปสินค้าเกษตร', strategyId: s1.id },
    create: { code: 'SS1.1', name: 'การส่งเสริมการเกษตรปลอดภัยและการแปรรูปสินค้าเกษตร', strategyId: s1.id }
  });
  const ss1_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.2' },
    update: { name: 'การส่งเสริมการท่องเที่ยวเชิงวัฒนธรรมและนวัตกรรมชุมชน', strategyId: s1.id },
    create: { code: 'SS1.2', name: 'การส่งเสริมการท่องเที่ยวเชิงวัฒนธรรมและนวัตกรรมชุมชน', strategyId: s1.id }
  });
  const ss2_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS2.1' },
    update: { name: 'การพัฒนาทักษะวิชาชีพและสมรรถนะดิจิทัลของบัณฑิต', strategyId: s2.id },
    create: { code: 'SS2.1', name: 'การพัฒนาทักษะวิชาชีพและสมรรถนะดิจิทัลของบัณฑิต', strategyId: s2.id }
  });

  const ind1_1_1 = await prisma.indicator.upsert({
    where: { code: 'IND1.1.1' },
    update: { name: 'จำนวนชุมชนที่ได้รับการยกระดับคุณภาพชีวิต', subStrategyId: ss1_1.id },
    create: { code: 'IND1.1.1', name: 'จำนวนชุมชนที่ได้รับการยกระดับคุณภาพชีวิต', subStrategyId: ss1_1.id }
  });
  const ind1_2_1 = await prisma.indicator.upsert({
    where: { code: 'IND1.2.1' },
    update: { name: 'จำนวนเส้นทางการท่องเที่ยวและผลิตภัณฑ์วัฒนธรรมที่ได้รับการพัฒนา', subStrategyId: ss1_2.id },
    create: { code: 'IND1.2.1', name: 'จำนวนเส้นทางการท่องเที่ยวและผลิตภัณฑ์วัฒนธรรมที่ได้รับการพัฒนา', subStrategyId: ss1_2.id }
  });
  const ind2_1_1 = await prisma.indicator.upsert({
    where: { code: 'IND2.1.1' },
    update: { name: 'ร้อยละของบัณฑิตที่มีคะแนนสมรรถนะดิจิทัลผ่านเกณฑ์มาตรฐาน', subStrategyId: ss2_1.id },
    create: { code: 'IND2.1.1', name: 'ร้อยละของบัณฑิตที่มีคะแนนสมรรถนะดิจิทัลผ่านเกณฑ์มาตรฐาน', subStrategyId: ss2_1.id }
  });

  console.log('[SEED] Strategies, SubStrategies, and Indicators created.');

  // 6. Create Users
  const passwordHash = await bcrypt.hash('admin1234', 10);
  const commonPasswordHash = await bcrypt.hash('123456', 10);

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: passwordHash },
    create: {
      username: 'admin',
      password: passwordHash,
      name: 'ผู้ดูแลระบบ (Admin)',
      role: 'ADMIN'
    }
  });

  // President
  await prisma.user.upsert({
    where: { username: 'president' },
    update: { password: commonPasswordHash },
    create: {
      username: 'president',
      password: commonPasswordHash,
      name: 'รศ.ดร.อธิการบดี (President)',
      role: 'PRESIDENT'
    }
  });

  // Dean
  await prisma.user.upsert({
    where: { username: 'dean' },
    update: { password: commonPasswordHash, departmentId: dComp.id },
    create: {
      username: 'dean',
      password: commonPasswordHash,
      name: 'ผศ.ดร.คณบดีคณะวิทยาศาสตร์ (Dean)',
      role: 'DEAN',
      departmentId: dComp.id
    }
  });

  // Head
  await prisma.user.upsert({
    where: { username: 'head' },
    update: { password: commonPasswordHash, departmentId: dComp.id },
    create: {
      username: 'head',
      password: commonPasswordHash,
      name: 'หัวหน้าภาควิชาคอมพิวเตอร์ (Head)',
      role: 'TEACHER',
      departmentId: dComp.id
    }
  });

  // Teacher 1
  await prisma.user.upsert({
    where: { username: 'teacher' },
    update: { password: commonPasswordHash, departmentId: dComp.id },
    create: {
      username: 'teacher',
      password: commonPasswordHash,
      name: 'อ.สมชาย ใจดี (Teacher)',
      role: 'TEACHER',
      departmentId: dComp.id
    }
  });

  // Teacher 2
  await prisma.user.upsert({
    where: { username: 'teacher2' },
    update: { password: commonPasswordHash, departmentId: dPhys.id },
    create: {
      username: 'teacher2',
      password: commonPasswordHash,
      name: 'ดร.สมศรี มีสุข (Teacher 2)',
      role: 'TEACHER',
      departmentId: dPhys.id
    }
  });

  console.log('[SEED] Users created.');
  console.log('[SEED] Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED] Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
