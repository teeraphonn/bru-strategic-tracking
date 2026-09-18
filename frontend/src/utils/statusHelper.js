/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/utils/statusHelper.js
 * หน้าที่: ฟังก์ชันยูทิลิตี้ช่วยประเมินสถานะเตือนภัยของโครงการ (Project Status & Warning Helper)
 *          - ประเมินสถานะผิดปกติแบบ Management by Exception
 *          - แจ้งเตือนงบบานปลายแต่งานไม่คืบ (RED)
 *          - แจ้งเตือนโครงการเลยกำหนดเสร็จสิ้น (RED)
 *          - แจ้งเตือนสำรองเบิกจ่ายล่าช้า/งบเฉื่อย (WARN)
 * ============================================================================
 */

/**
 * วิเคราะห์ระดับเตือนภัยของโครงการตามเกณฑ์งบประมาณและเวลา
 * @param {number} budget - งบประมาณรวมที่ได้รับจัดสรร
 * @param {number} spent - งบประมาณที่เบิกจ่ายจริงไปแล้ว
 * @param {number} target - ยอดผลผลิตตามเป้าหมาย
 * @param {number} completed - ยอดผลผลิตที่ทำเสร็จแล้ว
 * @param {number} progress - ร้อยละความก้าวหน้าสะสม
 * @param {string|Date} endDate - วันสิ้นสุดโครงการตามปฏิทิน
 * @returns {Object|null} ข้อมูลระดับเตือนภัย { level, label, color } หรือ null หากปกติ
 */
export const getProjectWarningState = (budget, spent, target, completed, progress, endDate) => {
  const budgetRatio = budget > 0 ? (spent / budget) * 100 : 0;
  const isExpired = endDate ? new Date(endDate) < new Date() : false;
  
  // ─── 1. งบหมดแต่งานไม่เดิน: ใช้เงินไปแล้วเกิน 80% แต่ความก้าวหน้าไม่ถึง 20% ──
  if (budgetRatio >= 80 && progress < 20) {
    return { level: 'RED', label: 'งบบานปลายแต่งานไม่คืบ', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  
  // ─── 2. โครงการหมดเวลาดำเนินการตามปฏิทินแต่งานยังไม่เสร็จสิ้น ──────────────
  if (isExpired && progress < 100) {
    return { level: 'RED', label: 'โครงการเลยกำหนดเสร็จสิ้น', color: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold' };
  }

  // ─── 3. เฝ้าระวังงบเฉื่อย: ดำเนินการโครงการคืบหน้าแต่ยังไม่ได้ทำเรื่องเบิกจ่าย ───
  if (budgetRatio > 0 && budgetRatio < 10 && progress > 50) {
    return { level: 'WARN', label: 'สำรองเบิกจ่ายล่าช้า', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  return null; // ปกติ / ไม่มีสัญญาณเตือน
};
