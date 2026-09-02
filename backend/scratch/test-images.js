const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const images = await prisma.activityImage.findMany({
    take: 5
  });
  console.log('Query results:', JSON.stringify(images, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);

