const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
  console.log('--- Creating local_development_issues table if not exists ---');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`local_development_issues\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`code\` VARCHAR(191) NOT NULL UNIQUE,
      \`name\` VARCHAR(191) NOT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('--- Adding local_issue_id column to strategies if not exists ---');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`strategies\` ADD COLUMN \`local_issue_id\` INT NULL;
    `);
  } catch (e) {
    // Column might already exist
    console.log('Column local_issue_id already exists or error ignored:', e.message);
  }

  console.log('✅ DB structure ready!');
}

setup()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
