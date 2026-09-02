const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('======================================================');
  console.log('  INITIALIZING CLEAN PRODUCTION DATABASE (ADMIN ONLY)');
  console.log('======================================================');

  // 1. Clean existing mock data safely
  console.log('[1/2] Clearing previous mock data...');
  await prisma.activityImage.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.issueReport.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create the Single Root Administrator Account
  console.log('[2/2] Creating Root Admin account...');
  const hashedPassword = await bcrypt.hash('@admin12', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin@bru.ac.th',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบสูงสุด (System Administrator)',
      role: 'ADMIN'
    }
  });

  console.log('\n✅ Database successfully initialized with ONLY Admin account!');
  console.log('------------------------------------------------------');
  console.log('  Username : admin@bru.ac.th');
  console.log('  Password : @admin12');
  console.log('  Role     : ADMIN');
  console.log('------------------------------------------------------');
  console.log('Database on TiDB Cloud is 100% clean and ready for real usage.');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
