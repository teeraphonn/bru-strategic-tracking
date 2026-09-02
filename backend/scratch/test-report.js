const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fetchReportDataset = async (type, fiscalYearId, user) => {
  const where = {};
  if (fiscalYearId) {
    where.fiscalYearId = parseInt(fiscalYearId);
  }

  if (type === 'project') {
    const list = await prisma.project.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        department: { select: { name: true } },
        faculty: { select: { name: true } },
        fiscalYear: true,
        activities: true
      },
      orderBy: { id: 'asc' }
    });

    return list.map(p => {
      const spent = p.activities.filter(a => a.success).reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
      return {
        id: p.id,
        name: p.name,
        creator: p.creator?.name || '',
        department: p.department?.name || 'ส่วนกลาง',
        faculty: p.faculty?.name || 'ส่วนกลาง',
        fiscalYear: p.fiscalYear?.year || '',
        totalBudget: parseFloat(p.totalBudget),
        actualSpent: spent,
        targetCount: p.targetCount,
        completedCount: p.completedCount,
        unit: p.unit,
        progress: p.progress,
        endDate: p.endDate
      };
    });
  }
};

async function run() {
  try {
    const data = await fetchReportDataset('project', 1, null);
    console.log('Success, data length:', data.length);
  } catch (error) {
    console.error('CRITICAL ERROR IN CONTROLLER:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

