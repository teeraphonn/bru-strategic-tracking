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

  // 5. Create Strategies, Sub-strategies and Indicators based on University Strategic Architecture
  // 2.1 ประเด็นการพัฒนาท้องถิ่น
  const s1 = await prisma.strategy.upsert({
    where: { code: 'S1' },
    update: { name: 'การพัฒนาท้องถิ่นด้านเศรษฐกิจ' },
    create: { code: 'S1', name: 'การพัฒนาท้องถิ่นด้านเศรษฐกิจ' }
  });
  const s2 = await prisma.strategy.upsert({
    where: { code: 'S2' },
    update: { name: 'การพัฒนาท้องถิ่นด้านสังคม' },
    create: { code: 'S2', name: 'การพัฒนาท้องถิ่นด้านสังคม' }
  });
  const s3 = await prisma.strategy.upsert({
    where: { code: 'S3' },
    update: { name: 'การพัฒนาท้องถิ่นด้านสิ่งแวดล้อม' },
    create: { code: 'S3', name: 'การพัฒนาท้องถิ่นด้านสิ่งแวดล้อม' }
  });
  const s4 = await prisma.strategy.upsert({
    where: { code: 'S4' },
    update: { name: 'การพัฒนาท้องถิ่นด้านการศึกษา' },
    create: { code: 'S4', name: 'การพัฒนาท้องถิ่นด้านการศึกษา' }
  });

  // 2.3 แผนงานย่อย (Sub-Program Name)
  // ภายใต้ S1: ด้านเศรษฐกิจ
  const ss1_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.1' },
    update: { name: 'การใช้ BCG MODEL ในการยกระดับเศรษฐกิจของคนในชุมชนท้องถิ่น', strategyId: s1.id },
    create: { code: 'SS1.1', name: 'การใช้ BCG MODEL ในการยกระดับเศรษฐกิจของคนในชุมชนท้องถิ่น', strategyId: s1.id }
  });
  const ss1_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS1.2' },
    update: { name: 'การใช้แนวคิดเศรษฐกิจสร้างสรรค์ในการยกระดับเศรษฐกิจของคนในชุมชน รวมถึงการนำประเด็น Soft power มาปรับใช้', strategyId: s1.id },
    create: { code: 'SS1.2', name: 'การใช้แนวคิดเศรษฐกิจสร้างสรรค์ในการยกระดับเศรษฐกิจของคนในชุมชน รวมถึงการนำประเด็น Soft power มาปรับใช้', strategyId: s1.id }
  });

  // ภายใต้ S2: ด้านสังคม
  const ss2_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS2.1' },
    update: { name: 'การทำนุบำรุงศิลปวัฒนธรรมและภูมิปัญญาท้องถิ่น สร้างความภาคภูมิใจให้คนในชุมชน ยึดโยงกับรากเหง้าเกิดความสามัคคีและมั่นคงในสถาบันหลักของชาติ', strategyId: s2.id },
    create: { code: 'SS2.1', name: 'การทำนุบำรุงศิลปวัฒนธรรมและภูมิปัญญาท้องถิ่น สร้างความภาคภูมิใจให้คนในชุมชน ยึดโยงกับรากเหง้าเกิดความสามัคคีและมั่นคงในสถาบันหลักของชาติ', strategyId: s2.id }
  });
  const ss2_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS2.2' },
    update: { name: 'การเสริมสร้างสุขภาวะทางร่างกาย ทางจิตใจ และทางจิตวิญญาณหรือปัญญาให้กับคนในชุมชนท้องถิ่น', strategyId: s2.id },
    create: { code: 'SS2.2', name: 'การเสริมสร้างสุขภาวะทางร่างกาย ทางจิตใจ และทางจิตวิญญาณหรือปัญญาให้กับคนในชุมชนท้องถิ่น', strategyId: s2.id }
  });

  // ภายใต้ S3: ด้านสิ่งแวดล้อม
  const ss3_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS3.1' },
    update: { name: 'การสร้างการมีส่วนร่วมในการบริหารจัดการ บำรุงรักษาและใช้ประโยชน์ทรัพยากรธรรมชาติและสิ่งแวดล้อมของคนในชุมชนท้องถิ่นอย่างสมดุลและยั่งยืน', strategyId: s3.id },
    create: { code: 'SS3.1', name: 'การสร้างการมีส่วนร่วมในการบริหารจัดการ บำรุงรักษาและใช้ประโยชน์ทรัพยากรธรรมชาติและสิ่งแวดล้อมของคนในชุมชนท้องถิ่นอย่างสมดุลและยั่งยืน', strategyId: s3.id }
  });
  const ss3_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS3.2' },
    update: { name: 'การสร้างความตระหนักรู้ และแนวทางการรองรับปรับตัวต่อผลกระทบด้านการเปลี่ยนแปลงสภาพภูมิอากาศของคนในชุมชนท้องถิ่น', strategyId: s3.id },
    create: { code: 'SS3.2', name: 'การสร้างความตระหนักรู้ และแนวทางการรองรับปรับตัวต่อผลกระทบด้านการเปลี่ยนแปลงสภาพภูมิอากาศของคนในชุมชนท้องถิ่น', strategyId: s3.id }
  });

  // ภายใต้ S4: ด้านการศึกษา
  const ss4_1 = await prisma.subStrategy.upsert({
    where: { code: 'SS4.1' },
    update: { name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นสาหรับการจัดการเรียนการสอนของครูในพื้นที่ ซึ่งต้องสามารถวัดประเมินผลได้อย่างเป็นรูปธรรม', strategyId: s4.id },
    create: { code: 'SS4.1', name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นสาหรับการจัดการเรียนการสอนของครูในพื้นที่ ซึ่งต้องสามารถวัดประเมินผลได้อย่างเป็นรูปธรรม', strategyId: s4.id }
  });
  const ss4_2 = await prisma.subStrategy.upsert({
    where: { code: 'SS4.2' },
    update: { name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นในการใช้ชีวิตในสังคมให้กับคนในชุมชนท้องถิ่นด้วยกระบวนการวิศวกรสังคม', strategyId: s4.id },
    create: { code: 'SS4.2', name: 'การเสริมสร้างทักษะ/ความสามารถที่จำเป็นในการใช้ชีวิตในสังคมให้กับคนในชุมชนท้องถิ่นด้วยกระบวนการวิศวกรสังคม', strategyId: s4.id }
  });

  // 2.4 โครงการหลัก (Main Projects - รหัส MP)
  await prisma.indicator.upsert({
    where: { code: 'MP1.1' },
    update: { name: 'โครงการพัฒนาคุณภาพชีวิต ผ่านโมเดลเศรษฐกิจทฤษฎีใหม่เพื่อยกระดับรายได้ครัวเรือนของชุมชน ท้องถิ่นอย่างยั่งยืน', subStrategyId: ss1_1.id },
    create: { code: 'MP1.1', name: 'โครงการพัฒนาคุณภาพชีวิต ผ่านโมเดลเศรษฐกิจทฤษฎีใหม่เพื่อยกระดับรายได้ครัวเรือนของชุมชน ท้องถิ่นอย่างยั่งยืน', subStrategyId: ss1_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP1.2' },
    update: { name: 'โครงการยกระดับเศรษฐกิจชุมชนเชิงสร้างสรรค์เพื่อสร้างมูลค่าผลิตภัณฑ์ทางภูมิปัญญาของชุมชนท้องถิ่น', subStrategyId: ss1_2.id },
    create: { code: 'MP1.2', name: 'โครงการยกระดับเศรษฐกิจชุมชนเชิงสร้างสรรค์เพื่อสร้างมูลค่าผลิตภัณฑ์ทางภูมิปัญญาของชุมชนท้องถิ่น', subStrategyId: ss1_2.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP1.3' },
    update: { name: 'โครงการยกระดับผลิตภัณฑ์ผ้าพื้นเมืองของกลุ่มอารยธรรมท้องถิ่นสู่เชิงพานิชย์', subStrategyId: ss1_2.id },
    create: { code: 'MP1.3', name: 'โครงการยกระดับผลิตภัณฑ์ผ้าพื้นเมืองของกลุ่มอารยธรรมท้องถิ่นสู่เชิงพานิชย์', subStrategyId: ss1_2.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP2.1' },
    update: { name: 'โครงการอนุรักษ์ และเผยแพร่รากอารยะของกลุ่มชาติพันธุ์ในชุมชนท้องถิ่นสู่มรดกทางวัฒนธรรม', subStrategyId: ss2_1.id },
    create: { code: 'MP2.1', name: 'โครงการอนุรักษ์ และเผยแพร่รากอารยะของกลุ่มชาติพันธุ์ในชุมชนท้องถิ่นสู่มรดกทางวัฒนธรรม', subStrategyId: ss2_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP2.2' },
    update: { name: 'โครงการเสริมสร้างคุณภาพชีวิตเพื่อพัฒนาสุขภาวะที่ดีให้กับประชาชนในชุมชนท้องถิ่นอย่างยั่งยืน', subStrategyId: ss2_2.id },
    create: { code: 'MP2.2', name: 'โครงการเสริมสร้างคุณภาพชีวิตเพื่อพัฒนาสุขภาวะที่ดีให้กับประชาชนในชุมชนท้องถิ่นอย่างยั่งยืน', subStrategyId: ss2_2.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP3.1' },
    update: { name: 'โครงการส่งเสริมการมีส่วนร่วมเพื่อบริหารจัดการทรัพยากรธรรมชาติและสิ่งแวดล้อมในชุมชนท้องถิ่นอย่างเป็นระบบที่ยั่งยืน', subStrategyId: ss3_1.id },
    create: { code: 'MP3.1', name: 'โครงการส่งเสริมการมีส่วนร่วมเพื่อบริหารจัดการทรัพยากรธรรมชาติและสิ่งแวดล้อมในชุมชนท้องถิ่นอย่างเป็นระบบที่ยั่งยืน', subStrategyId: ss3_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP3.2' },
    update: { name: 'โครงการเสริมสร้างทักษะการปรับตัวและสร้างภูมิต้านทานให้กับประชาชนในชุมชนท้องถิ่นเพื่อรองรับการเปลี่ยนแปลงทางสภาพภูมิอากาศ', subStrategyId: ss3_2.id },
    create: { code: 'MP3.2', name: 'โครงการเสริมสร้างทักษะการปรับตัวและสร้างภูมิต้านทานให้กับประชาชนในชุมชนท้องถิ่นเพื่อรองรับการเปลี่ยนแปลงทางสภาพภูมิอากาศ', subStrategyId: ss3_2.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP4.1' },
    update: { name: 'โครงการเสริมสร้างทักษะการจัดการเรียนการสอนของครูเพื่อยกระดับการศึกษาในชุมชนท้องถิ่น อย่างยั่งยืน', subStrategyId: ss4_1.id },
    create: { code: 'MP4.1', name: 'โครงการเสริมสร้างทักษะการจัดการเรียนการสอนของครูเพื่อยกระดับการศึกษาในชุมชนท้องถิ่น อย่างยั่งยืน', subStrategyId: ss4_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP4.2' },
    update: { name: 'โครงการพัฒนามาตรฐานโรงเรียนสาธิต', subStrategyId: ss4_1.id },
    create: { code: 'MP4.2', name: 'โครงการพัฒนามาตรฐานโรงเรียนสาธิต', subStrategyId: ss4_1.id }
  });
  await prisma.indicator.upsert({
    where: { code: 'MP4.3' },
    update: { name: 'โครงการเสริมสร้างทักษะความสามารถเชิงสมรรถนะด้วยกระบวนการวิศวกรสังคมโดยใช้ชุมชนท้องถิ่นเป็นฐาน', subStrategyId: ss4_2.id },
    create: { code: 'MP4.3', name: 'โครงการเสริมสร้างทักษะความสามารถเชิงสมรรถนะด้วยกระบวนการวิศวกรสังคมโดยใช้ชุมชนท้องถิ่นเป็นฐาน', subStrategyId: ss4_2.id }
  });

  console.log('[SEED] Strategies, SubStrategies, and Main Projects (MP) updated.');

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
