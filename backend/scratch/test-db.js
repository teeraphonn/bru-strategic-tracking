const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        name: true
      }
    });
    console.log('Successfully connected to DB! Users in DB:', users);
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
