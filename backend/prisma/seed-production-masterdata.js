const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('  INITIALIZING BRU MASTER DATA (STRUCTURE READY, ADMIN ONLY)');
  console.log('================================================================');

  // 1. Clean existing mock data
  console.log('[1/5] Clearing mock projects and activities...');
  await prisma.activityImage.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.issueReport.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Single Root Administrator
  console.log('[2/5] Creating Root Administrator account...');
  const hashedPassword = await bcrypt.hash('@admin12', 10);
  await prisma.user.create({
    data: {
      username: 'admin@bru.ac.th',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบสูงสุด (System Administrator)',
      role: 'ADMIN'
    }
  });

  // 3. Create Faculties & Departments
  console.log('[3/5] Seeding Faculties and Departments...');
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

  for (const item of seedFaculties) {
    const fac = await prisma.faculty.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name }
    });

    for (const dName of item.depts) {
      await prisma.department.upsert({
        where: { name: dName },
        update: { facultyId: fac.id },
        create: { name: dName, facultyId: fac.id }
      });
    }
  }

  // 4. Create Fiscal Years & Budget Sources
  console.log('[4/5] Seeding Fiscal Years & Budget Sources...');
  await prisma.fiscalYear.upsert({
    where: { year: 2569 },
    update: { active: true },
    create: { year: 2569, active: true }
  });
  await prisma.fiscalYear.upsert({
    where: { year: 2568 },
    update: { active: false },
    create: { year: 2568, active: false }
  });
  await prisma.fiscalYear.upsert({
    where: { year: 2567 },
    update: { active: false },
    create: { year: 2567, active: false }
  });

  await prisma.budgetSource.upsert({
    where: { name: 'งบประมาณแผ่นดิน' },
    update: {},
    create: { name: 'งบประมาณแผ่นดิน' }
  });
  await prisma.budgetSource.upsert({
    where: { name: 'งบรายได้มหาวิทยาลัย' },
    update: {},
    create: { name: 'งบรายได้มหาวิทยาลัย' }
  });
  await prisma.budgetSource.upsert({
    where: { name: 'งบประมาณกองทุนพัฒนาท้องถิ่น' },
    update: {},
    create: { name: 'งบประมาณกองทุนพัฒนาท้องถิ่น' }
  });

  // 5. Create Strategies, SubStrategies, and Indicators
  console.log('[5/5] Seeding Strategies, SubStrategies & Indicators...');
  const s1 = await prisma.strategy.upsert({
    where: { code: 'S1' },
    update: { name: 'ยุทธศาสตร์ที่ 1: การพัฒนาท้องถิ่นด้วยวิทยาศาสตร์ เทคโนโลยี และนวัตกรรม' },
    create: { code: 'S1', name: 'ยุทธศาสตร์ที่ 1: การพัฒนาท้องถิ่นด้วยวิทยาศาสตร์ เทคโนโลยี และนวัตกรรม' }
  });
  const s2 = await prisma.strategy.upsert({
    where: { code: 'S2' },
    update: { name: 'ยุทธศาสตร์ที่ 2: การยกระดับคุณภาพการศึกษาและการผลิตบัณฑิตนักปฏิบัติ' },
    create: { code: 'S2', name: 'ยุทธศาสตร์ที่ 2: การยกระดับคุณภาพการศึกษาและการผลิตบัณฑิตนักปฏิบัติ' }
  });
  const s3 = await prisma.strategy.upsert({
    where: { code: 'S3' },
    update: { name: 'ยุทธศาสตร์ที่ 3: การวิจัยและสร้างสรรค์นวัตกรรมเพื่อการแข่งขัน' },
    create: { code: 'S3', name: 'ยุทธศาสตร์ที่ 3: การวิจัยและสร้างสรรค์นวัตกรรมเพื่อการแข่งขัน' }
  });
  const s4 = await prisma.strategy.upsert({
    where: { code: 'S4' },
    update: { name: 'ยุทธศาสตร์ที่ 4: การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัยและธรรมาภิบาล' },
    create: { code: 'S4', name: 'ยุทธศาสตร์ที่ 4: การพัฒนาระบบบริหารจัดการองค์กรสู่ความทันสมัยและธรรมาภิบาล' }
  });

  // Sub-strategies
  const ss1_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.1' },
    update: { name: 'ประเด็นยุทธศาสตร์ 1.1: การส่งเสริมการเกษตรปลอดภัยและการแปรรูปสินค้าเกษตร', strategyId: s1.id },
    create: { code: 'SS1.1', name: 'ประเด็นยุทธศาสตร์ 1.1: การส่งเสริมการเกษตรปลอดภัยและการแปรรูปสินค้าเกษตร', strategyId: s1.id }
  });
  const ss1_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.2' },
    update: { name: 'ประเด็นยุทธศาสตร์ 1.2: การส่งเสริมการท่องเที่ยวเชิงวัฒนธรรมและนวัตกรรมชุมชน', strategyId: s1.id },
    create: { code: 'SS1.2', name: 'ประเด็นยุทธศาสตร์ 1.2: การส่งเสริมการท่องเที่ยวเชิงวัฒนธรรมและนวัตกรรมชุมชน', strategyId: s1.id }
  });
  const ss2_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS2.1' },
    update: { name: 'ประเด็นยุทธศาสตร์ 2.1: การพัฒนาทักษะวิชาชีพและสมรรถนะดิจิทัลของบัณฑิต', strategyId: s2.id },
    create: { code: 'SS2.1', name: 'ประเด็นยุทธศาสตร์ 2.1: การพัฒนาทักษะวิชาชีพและสมรรถนะดิจิทัลของบัณฑิต', strategyId: s2.id }
  });
  const ss3_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS3.1' },
    update: { name: 'ประเด็นยุทธศาสตร์ 3.1: การส่งเสริมงานวิจัยและนวัตกรรมที่นำไปใช้ประโยชน์เชิงพาณิชย์และสังคม', strategyId: s3.id },
    create: { code: 'SS3.1', name: 'ประเด็นยุทธศาสตร์ 3.1: การส่งเสริมงานวิจัยและนวัตกรรมที่นำไปใช้ประโยชน์เชิงพาณิชย์และสังคม', strategyId: s3.id }
  });
  const ss4_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS4.1' },
    update: { name: 'ประเด็นยุทธศาสตร์ 4.1: การยกระดับการบริหารจัดการองค์กรด้วยเทคโนโลยีดิจิทัล', strategyId: s4.id },
    create: { code: 'SS4.1', name: 'ประเด็นยุทธศาสตร์ 4.1: การยกระดับการบริหารจัดการองค์กรด้วยเทคโนโลยีดิจิทัล', strategyId: s4.id }
  });

  // Indicators
  await prisma.indicator.upsert({
    where: { code: 'IND1.1.1' },
    update: { name: 'จำนวนชุมชน/กลุ่มเกษตรกรที่ได้รับการยกระดับคุณภาพชีวิตและรายได้', subStrategyId: ss1_1.id },
    create: { code: 'IND1.1.1', name: 'จำนวนชุมชน/กลุ่มเกษตรกรที่ได้รับการยกระดับคุณภาพชีวิตและรายได้', subStrategyId: ss1_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'IND1.2.1' },
    update: { name: 'จำนวนเส้นทางการท่องเที่ยวและผลิตภัณฑ์วัฒนธรรมที่ได้รับการพัฒนาสู่มาตรฐาน', subStrategyId: ss1_2.id },
    create: { code: 'IND1.2.1', name: 'จำนวนเส้นทางการท่องเที่ยวและผลิตภัณฑ์วัฒนธรรมที่ได้รับการพัฒนาสู่มาตรฐาน', subStrategyId: ss1_2.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'IND2.1.1' },
    update: { name: 'ร้อยละของบัณฑิตที่มีคะแนนสมรรถนะดิจิทัลและทักษะวิชาชีพผ่านเกณฑ์มาตรฐานสากล', subStrategyId: ss2_1.id },
    create: { code: 'IND2.1.1', name: 'ร้อยละของบัณฑิตที่มีคะแนนสมรรถนะดิจิทัลและทักษะวิชาชีพผ่านเกณฑ์มาตรฐานสากล', subStrategyId: ss2_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'IND3.1.1' },
    update: { name: 'จำนวนผลงานวิจัย/นวัตกรรมที่ได้รับการจดสิทธิบัตรหรือถ่ายทอดสู่การใช้ประโยชน์จริง', subStrategyId: ss3_1.id },
    create: { code: 'IND3.1.1', name: 'จำนวนผลงานวิจัย/นวัตกรรมที่ได้รับการจดสิทธิบัตรหรือถ่ายทอดสู่การใช้ประโยชน์จริง', subStrategyId: ss3_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'IND4.1.1' },
    update: { name: 'ระดับความพึงพอใจและประสิทธิภาพการให้บริการผ่านระบบดิจิทัลของมหาวิทยาลัย', subStrategyId: ss4_1.id },
    create: { code: 'IND4.1.1', name: 'ระดับความพึงพอใจและประสิทธิภาพการให้บริการผ่านระบบดิจิทัลของมหาวิทยาลัย', subStrategyId: ss4_1.id }
  });

  console.log('\n================================================================');
  console.log('  ✅ ALL BRU MASTER DATA SUCCESSFULLY POPULATED!');
  console.log('================================================================');
  console.log('  • Faculties & Depts : 9 คณะ/หน่วยงาน ครบทุกสาขาวิชา');
  console.log('  • Fiscal Years      : 2567, 2568, 2569 (Active: 2569)');
  console.log('  • Budget Sources    : งบแผ่นดิน, งบรายได้, งบกองทุนพัฒนาท้องถิ่น');
  console.log('  • Strategies (S1-S4): ยุทธศาสตร์ 4 ด้าน + 5 ประเด็นย่อย + 5 ตัวชี้วัด');
  console.log('  • Projects/Activities: ว่างเปล่า 0 รายการ (พร้อมบันทึกจริง)');
  console.log('  • Single Admin User : admin@bru.ac.th (Password: @admin12)');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
