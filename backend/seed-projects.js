/**
 * Seeding Script - 1 Project for each Faculty
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 1 project for each Faculty...');

  const projectsToSeed = [
    {
      name: 'โครงการวิจัยนวัตกรรมเทคโนโลยีเพื่อชุมชนเข้มแข็ง (คณะวิทยาศาสตร์)',
      description: 'โครงการพัฒนาและถ่ายทอดเทคโนโลยีดิจิทัลสู่ชุมชนท้องถิ่นเพื่อสร้างความเข้มแข็ง',
      fiscalYearId: 1,
      budgetSourceId: 1,
      subStrategyId: 1,
      indicatorId: 1,
      totalBudget: 150000.00,
      targetCount: 5,
      unit: 'ชุมชน',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-09-30'),
      creatorId: 1,
      facultyId: 1,
      departmentId: null,
      progress: 0.0,
      completedCount: 0,
      remainingCount: 5
    },
    {
      name: 'โครงการยกระดับคุณภาพครูสู่มาตรฐานครูมืออาชีพยุคดิจิทัล (คณะครุศาสตร์)',
      description: 'อบรมสัมมนาทักษะวิชาชีพครูยุคใหม่และสมรรถนะการจัดเรียนรู้เชิงดิจิทัล',
      fiscalYearId: 1,
      budgetSourceId: 2,
      subStrategyId: 3,
      indicatorId: 3,
      totalBudget: 120000.00,
      targetCount: 100,
      unit: 'คน',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2027-08-31'),
      creatorId: 1,
      facultyId: 2,
      departmentId: null, // คณะครุศาสตร์ไม่มีแผนกย่อยใน seed
      progress: 0.0,
      completedCount: 0,
      remainingCount: 100
    },
    {
      name: 'โครงการบ่มเพาะผู้ประกอบการรุ่นใหม่และการพัฒนาวิสาหกิจชุมชน (คณะวิทยาการจัดการ)',
      description: 'ยกระดับการบริหารจัดการธุรกิจชุมชนเชิงนวัตกรรมและการเขียนแผนธุรกิจ',
      fiscalYearId: 1,
      budgetSourceId: 1,
      subStrategyId: 2,
      indicatorId: 2,
      totalBudget: 95000.00,
      targetCount: 4,
      unit: 'ผลิตภัณฑ์',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2027-07-31'),
      creatorId: 1,
      facultyId: 3,
      departmentId: 3, // ภาควิชาการบริหารธุรกิจ
      progress: 0.0,
      completedCount: 0,
      remainingCount: 4
    },
    {
      name: 'โครงการพัฒนาเส้นทางท่องเที่ยววัฒนธรรมเชิงสร้างสรรค์บุรีรัมย์ (คณะมนุษยศาสตร์และสังคมศาสตร์)',
      description: 'สืบสาน ถ่ายทอด และแปรรูปมรดกวัฒนธรรมท้องถิ่นเป็นเส้นทางท่องเที่ยวทางเลือกใหม่',
      fiscalYearId: 1,
      budgetSourceId: 2,
      subStrategyId: 2,
      indicatorId: 2,
      totalBudget: 180000.00,
      targetCount: 3,
      unit: 'เส้นทาง',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2027-09-15'),
      creatorId: 1,
      facultyId: 4,
      departmentId: 4, // ภาควิชาภาษาอังกฤษ
      progress: 0.0,
      completedCount: 0,
      remainingCount: 3
    }
  ];

  for (const proj of projectsToSeed) {
    const existing = await prisma.project.findFirst({
      where: { name: proj.name }
    });

    if (!existing) {
      const created = await prisma.project.create({
        data: proj
      });
      console.log(`Created: ${created.name}`);
    } else {
      console.log(`Already exists: ${proj.name}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
