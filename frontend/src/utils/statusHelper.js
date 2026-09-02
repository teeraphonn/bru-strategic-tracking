export const getProjectWarningState = (budget, spent, target, completed, progress, endDate) => {
  const budgetRatio = budget > 0 ? (spent / budget) * 100 : 0;
  const isExpired = endDate ? new Date(endDate) < new Date() : false;
  
  // 1. งบหมดแต่งานไม่เดิน: ใช้เงินไปแล้วเกิน 80% แต่เป้าความสำเร็จไม่ถึง 20%
  if (budgetRatio >= 80 && progress < 20) {
    return { level: 'RED', label: 'งบบานปลายแต่งานไม่คืบ', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  
  // 2. โครงการหมดเวลาดำเนินการตามปฏิทินแต่งานยังไม่เสร็จสิ้น
  if (isExpired && progress < 100) {
    return { level: 'RED', label: 'โครงการเลยกำหนดเสร็จสิ้น', color: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold' };
  }

  // 3. เฝ้าระวังงบเฉื่อย: ดำเนินการโครงการช้ากว่าแผน
  if (budgetRatio > 0 && budgetRatio < 10 && progress > 50) {
    return { level: 'WARN', label: 'สำรองเบิกจ่ายล่าช้า', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  return null; // Return null if normal / no warnings
};

