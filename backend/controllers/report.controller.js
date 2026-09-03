const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');

const registerThaiFonts = (doc) => {
  const fontRegular = path.join(__dirname, '../fonts/Thai-Regular.ttf');
  const fontBold = path.join(__dirname, '../fonts/Thai-Bold.ttf');

  if (fs.existsSync(fontRegular) && fs.existsSync(fontBold)) {
    doc.registerFont('ThaiRegular', fontRegular);
    doc.registerFont('ThaiBold', fontBold);
  } else {
    // Fallback standard fonts if custom fonts missing
    doc.registerFont('ThaiRegular', 'Helvetica');
    doc.registerFont('ThaiBold', 'Helvetica-Bold');
  }
};

const getProjectWarningState = (budget, spent, target, completed, progress, endDate) => {
  const budgetRatio = budget > 0 ? (spent / budget) * 100 : 0;
  const isExpired = endDate ? new Date(endDate) < new Date() : false;
  
  if (budgetRatio >= 80 && progress < 20) {
    return 'RED';
  }
  if (isExpired && progress < 100) {
    return 'RED';
  }
  if (budgetRatio > 0 && budgetRatio < 10 && progress > 50) {
    return 'WARN';
  }
  return null;
};

// Helper to query and prepare report datasets
const fetchReportDataset = async (type, fiscalYearId, user, statusFilter) => {
  const where = {};
  if (fiscalYearId) {
    where.fiscalYearId = parseInt(fiscalYearId);
  }

  // Filter project dataset by user role and scope
  if (user) {
    if (user.role === 'TEACHER') {
      where.OR = [
        { creatorId: user.id },
        { users: { some: { userId: user.id } } }
      ];
    } else if (user.role === 'DEAN') {
      if (user.department?.facultyId) {
        where.facultyId = user.department.facultyId;
      }
    }
  }

  if (type === 'project') {
    const list = await prisma.project.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        department: { select: { name: true } },
        faculty: { select: { name: true } },
        fiscalYear: true,
        activities: true,
        subStrategy: {
          include: {
            strategy: {
              include: { localIssue: true }
            }
          }
        },
        indicator: true
      },
      orderBy: { id: 'asc' }
    });

    const mapped = list.map(p => {
      const spent = p.activities.filter(a => a.success).reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
      return {
        id: p.id,
        name: p.name,
        creator: p.creator?.name || '',
        department: p.department?.name || 'ส่วนกลาง',
        faculty: p.faculty?.name || 'ส่วนกลาง',
        fiscalYear: p.fiscalYear?.year || '',
        localIssue: p.subStrategy?.strategy?.localIssue?.name || '',
        strategy: p.subStrategy?.strategy?.name || '',
        subStrategy: p.subStrategy?.name || '',
        indicator: p.indicator?.name || '',
        totalBudget: parseFloat(p.totalBudget),
        actualSpent: spent,
        targetCount: p.targetCount,
        completedCount: p.completedCount,
        unit: p.unit,
        progress: p.progress,
        endDate: p.endDate
      };
    });

    if (statusFilter && statusFilter !== 'all') {
      return mapped.filter(p => {
        const warn = getProjectWarningState(p.totalBudget, p.actualSpent, p.targetCount, p.completedCount, p.progress, p.endDate);
        if (statusFilter === 'normal') return warn === null;
        if (statusFilter === 'warn') return warn === 'WARN';
        if (statusFilter === 'red') return warn === 'RED';
        return true;
      });
    }

    return mapped;
  }

  if (type === 'faculty') {
    const facultyWhere = {};
    if (user && user.role === 'DEAN' && user.department?.facultyId) {
      facultyWhere.id = user.department.facultyId;
    }

    const faculties = await prisma.faculty.findMany({
      where: facultyWhere,
      include: {
        projects: {
          where,
          include: { activities: true }
        }
      }
    });

    return faculties.map(f => {
      const projectsCount = f.projects.length;
      const budget = f.projects.reduce((sum, p) => sum + parseFloat(p.totalBudget), 0);
      const spent = f.projects.reduce((sum, p) => {
        return sum + p.activities.filter(a => a.success).reduce((s, a) => s + parseFloat(a.actualBudget || 0), 0);
      }, 0);
      const avgProgress = projectsCount > 0 
        ? parseFloat((f.projects.reduce((sum, p) => sum + p.progress, 0) / projectsCount).toFixed(2)) 
        : 0;

      return {
        id: f.id,
        name: f.name,
        projectsCount,
        totalBudget: budget,
        actualSpent: spent,
        avgProgress
      };
    });
  }

  if (type === 'department') {
    const departmentWhere = {};
    if (user && user.role === 'DEAN' && user.department?.facultyId) {
      departmentWhere.facultyId = user.department.facultyId;
    }

    const departments = await prisma.department.findMany({
      where: departmentWhere,
      include: {
        faculty: true,
        projects: {
          where,
          include: { activities: true }
        }
      }
    });

    return departments.map(d => {
      const projectsCount = d.projects.length;
      const budget = d.projects.reduce((sum, p) => sum + parseFloat(p.totalBudget), 0);
      const spent = d.projects.reduce((sum, p) => {
        return sum + p.activities.filter(a => a.success).reduce((s, a) => s + parseFloat(a.actualBudget || 0), 0);
      }, 0);
      const avgProgress = projectsCount > 0 
        ? parseFloat((d.projects.reduce((sum, p) => sum + p.progress, 0) / projectsCount).toFixed(2)) 
        : 0;

      return {
        id: d.id,
        name: d.name,
        faculty: d.faculty?.name || 'ส่วนกลาง',
        projectsCount,
        totalBudget: budget,
        actualSpent: spent,
        avgProgress
      };
    });
  }

  if (type === 'budget') {
    const list = await prisma.project.findMany({
      where,
      include: {
        department: { select: { name: true } },
        activities: true,
        fiscalYear: true
      },
      orderBy: { id: 'asc' }
    });

    return list.map(p => {
      const budget = parseFloat(p.totalBudget);
      const spent = p.activities.filter(a => a.success).reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
      const remaining = Math.max(0, budget - spent);
      const usagePercentage = budget > 0 ? parseFloat(((spent / budget) * 100).toFixed(2)) : 0;

      return {
        id: p.id,
        projectName: p.name,
        department: p.department?.name || 'ส่วนกลาง',
        fiscalYear: p.fiscalYear?.year || '',
        totalBudget: budget,
        actualSpent: spent,
        remainingBudget: remaining,
        usagePercentage
      };
    });
  }

  if (type === 'university') {
    const strategies = await prisma.strategy.findMany({
      include: {
        subStrategies: {
          include: {
            projects: {
              where,
              include: { activities: true }
            }
          }
        }
      }
    });

    return strategies.map(s => {
      let projectsCount = 0;
      let budget = 0;
      let spent = 0;
      let totalProgress = 0;

      s.subStrategies.forEach(ss => {
        projectsCount += ss.projects.length;
        ss.projects.forEach(p => {
          budget += parseFloat(p.totalBudget);
          totalProgress += p.progress;
          spent += p.activities.filter(a => a.success).reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
        });
      });

      const avgProgress = projectsCount > 0 ? parseFloat((totalProgress / projectsCount).toFixed(2)) : 0;

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        projectsCount,
        totalBudget: budget,
        actualSpent: spent,
        avgProgress
      };
    });
  }

  throw new Error('Invalid report type');
};

const getReport = async (req, res) => {
  try {
    const { type, fiscalYearId, statusFilter } = req.query;
    const data = await fetchReportDataset(type, fiscalYearId, req.user, statusFilter);
    res.json(data);
  } catch (error) {
    console.error('Fetch report error:', error);
    res.status(500).json({ message: 'Failed to compile report data', error: error.message });
  }
};

const exportCSV = async (req, res) => {
  try {
    const { type, fiscalYearId, statusFilter } = req.query;
    const data = await fetchReportDataset(type, fiscalYearId, req.user, statusFilter);

    let csvContent = '\ufeff'; // Add UTF-8 BOM for Excel Thai character support
    let headers = [];
    if (type === 'project') {
      headers = ['ID', 'โครงการ', 'ผู้ประสานงาน', 'หน่วยงาน', 'คณะ', 'ปีงบประมาณ', 'งบประมาณตั้งต้น', 'เป้าหมาย', 'ดำเนินการแล้ว', 'หน่วยนับ', 'ความสำเร็จ (%)'];
      rows = data.map((r, index) => [index + 1, `"${r.name}"`, `"${r.creator}"`, `"${r.department}"`, `"${r.faculty}"`, r.fiscalYear, r.totalBudget, r.targetCount, r.completedCount, `"${r.unit}"`, r.progress]);
    } else if (type === 'faculty') {
      headers = ['ID', 'คณะ', 'จำนวนโครงการ', 'งบประมาณตั้งต้น', 'ใช้จ่ายจริง', 'ความสำเร็จเฉลี่ย (%)'];
      rows = data.map((r, index) => [index + 1, `"${r.name}"`, r.projectsCount, r.totalBudget, r.actualSpent, r.avgProgress]);
    } else if (type === 'department') {
      headers = ['ID', 'ภาควิชา/หน่วยงาน', 'คณะ', 'จำนวนโครงการ', 'งบประมาณตั้งต้น', 'ใช้จ่ายจริง', 'ความสำเร็จเฉลี่ย (%)'];
      rows = data.map((r, index) => [index + 1, `"${r.name}"`, `"${r.faculty}"`, r.projectsCount, r.totalBudget, r.actualSpent, r.avgProgress]);
    } else if (type === 'budget') {
      headers = ['ID', 'โครงการ', 'หน่วยงาน', 'ปีงบประมาณ', 'งบประมาณตั้งต้น', 'ใช้จ่ายจริง', 'คงเหลือ', 'สัดส่วนใช้จ่าย (%)'];
      rows = data.map((r, index) => [index + 1, `"${r.projectName}"`, `"${r.department}"`, r.fiscalYear, r.totalBudget, r.actualSpent, r.remainingBudget, r.usagePercentage]);
    } else if (type === 'university') {
      headers = ['ยุทธศาสตร์', 'ชื่อยุทธศาสตร์', 'จำนวนโครงการ', 'งบประมาณตั้งต้น', 'ใช้จ่ายจริง', 'ความสำเร็จเฉลี่ย (%)'];
      rows = data.map(r => [`"${r.code}"`, `"${r.name}"`, r.projectsCount, r.totalBudget, r.actualSpent, r.avgProgress]);
    }

    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export CSV', error: error.message });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { type, fiscalYearId, statusFilter } = req.query;
    const data = await fetchReportDataset(type, fiscalYearId, req.user, statusFilter);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BRU Strategic Tracking System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('รายงานสรุปผลงาน');

    // Title Row
    const titleRow = worksheet.addRow(['มหาวิทยาลัยราชภัฏบุรีรัมย์ - ระบบติดตามการทำงานโครงการยุทธศาสตร์']);
    titleRow.font = { name: 'Sarabun', size: 16, bold: true, color: { argb: 'FF2E1065' } };
    titleRow.alignment = { vertical: 'middle' };
    worksheet.addRow([`รายงาน: ${type.toUpperCase()} REPORT | วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`]);
    worksheet.addRow([]); // Blank line

    let columns = [];
    if (type === 'project') {
      columns = [
        { header: 'ลำดับ', key: 'index', width: 8 },
        { header: 'ชื่อโครงการ', key: 'name', width: 45 },
        { header: 'ผู้ประสานงาน', key: 'creator', width: 22 },
        { header: 'ภาควิชา/หน่วยงาน', key: 'department', width: 25 },
        { header: 'คณะ/สังกัด', key: 'faculty', width: 28 },
        { header: 'ปีงบฯ', key: 'fiscalYear', width: 12 },
        { header: 'งบประมาณตั้งต้น (บาท)', key: 'totalBudget', width: 24 },
        { header: 'เป้าหมาย', key: 'targetCount', width: 12 },
        { header: 'เสร็จสิ้น', key: 'completedCount', width: 12 },
        { header: 'หน่วยนับ', key: 'unit', width: 14 },
        { header: 'ความก้าวหน้า (%)', key: 'progress', width: 18 }
      ];
    } else if (type === 'faculty' || type === 'department') {
      columns = [
        { header: 'ลำดับ', key: 'index', width: 8 },
        { header: 'ชื่อหน่วยงาน / คณะ', key: 'name', width: 40 },
        { header: 'จำนวนโครงการ', key: 'projectsCount', width: 16 },
        { header: 'งบประมาณตั้งต้น (บาท)', key: 'totalBudget', width: 24 },
        { header: 'ใช้จ่ายจริง (บาท)', key: 'actualSpent', width: 22 },
        { header: 'ความสำเร็จเฉลี่ย (%)', key: 'avgProgress', width: 22 }
      ];
    } else if (type === 'budget') {
      columns = [
        { header: 'ลำดับ', key: 'index', width: 8 },
        { header: 'ชื่อโครงการ', key: 'projectName', width: 45 },
        { header: 'ภาควิชา/หน่วยงาน', key: 'department', width: 25 },
        { header: 'ปีงบฯ', key: 'fiscalYear', width: 12 },
        { header: 'งบประมาณตั้งต้น (บาท)', key: 'totalBudget', width: 24 },
        { header: 'ใช้จ่ายจริง (บาท)', key: 'actualSpent', width: 22 },
        { header: 'คงเหลือ (บาท)', key: 'remainingBudget', width: 22 },
        { header: 'สัดส่วนใช้จ่าย (%)', key: 'usagePercentage', width: 18 }
      ];
    } else if (type === 'university') {
      columns = [
        { header: 'รหัสยุทธศาสตร์', key: 'code', width: 16 },
        { header: 'ประเด็นยุทธศาสตร์หลัก', key: 'name', width: 50 },
        { header: 'จำนวนโครงการ', key: 'projectsCount', width: 16 },
        { header: 'งบประมาณตั้งต้น (บาท)', key: 'totalBudget', width: 24 },
        { header: 'ใช้จ่ายจริง (บาท)', key: 'actualSpent', width: 22 },
        { header: 'ความสำเร็จเฉลี่ย (%)', key: 'avgProgress', width: 22 }
      ];
    }

    // Add Header Row
    const headerRow = worksheet.addRow(columns.map(c => c.header));
    headerRow.font = { name: 'Sarabun', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // University Deep Indigo/Purple
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 28;

    // Apply column widths
    columns.forEach((col, idx) => {
      worksheet.getColumn(idx + 1).width = col.width;
    });

    // Add Data Rows
    data.forEach((item, index) => {
      let rowValues = [];
      if (type === 'project') {
        rowValues = [index + 1, item.name, item.creator, item.department, item.faculty, item.fiscalYear, item.totalBudget, item.targetCount, item.completedCount, item.unit, `${item.progress}%`];
      } else if (type === 'faculty' || type === 'department') {
        rowValues = [index + 1, item.name, item.projectsCount, item.totalBudget, item.actualSpent, `${item.avgProgress}%`];
      } else if (type === 'budget') {
        rowValues = [index + 1, item.projectName, item.department, item.fiscalYear, item.totalBudget, item.actualSpent, item.remainingBudget, `${item.usagePercentage}%`];
      } else if (type === 'university') {
        rowValues = [item.code, item.name, item.projectsCount, item.totalBudget, item.actualSpent, `${item.avgProgress}%`];
      }

      const row = worksheet.addRow(rowValues);
      row.height = 22;
      row.alignment = { vertical: 'middle' };

      // Zebra striping
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }

      // Thin borders
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.font = { name: 'Sarabun', size: 10 };

        // Align numbers right
        if (typeof cell.value === 'number') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (cell.value > 100) {
            cell.numFmt = '#,##0.00';
          }
        }
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ message: 'Failed to export Excel', error: error.message });
  }
};

const exportPDF = async (req, res) => {
  try {
    const { type, fiscalYearId, statusFilter } = req.query;
    const data = await fetchReportDataset(type, fiscalYearId, req.user, statusFilter);

    // Standard A4 Dimensions: 595.28 x 841.89 pt
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 36,
      bufferPages: true 
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Register Fonts
    registerThaiFonts(doc);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const contentWidth = pageWidth - (margin * 2);

    const getReportTitleTh = (t) => {
      switch (t) {
        case 'project': return 'รายงานติดตามผลการดำเนินโครงการยุทธศาสตร์';
        case 'faculty': return 'รายงานสรุปผลงานความสำเร็จรายคณะ';
        case 'department': return 'รายงานสรุปผลงานความสำเร็จรายภาควิชา/หน่วยงาน';
        case 'budget': return 'รายงานสถานะการเบิกจ่ายและงบประมาณคงเหลือ';
        case 'university': return 'รายงานสรุปผลงานตามประเด็นยุทธศาสตร์มหาวิทยาลัย';
        default: return 'รายงานสรุปผลการดำเนินงาน';
      }
    };

    // Helper: Draw Clean Minimalist Header on page (No solid background fills)
    const drawHeader = () => {
      doc.font('ThaiBold').fontSize(14).fillColor('#0F172A');
      doc.text('มหาวิทยาลัยราชภัฏบุรีรัมย์', margin, margin);
      
      doc.font('ThaiBold').fontSize(11).fillColor('#334155');
      doc.text(getReportTitleTh(type), margin, margin + 18);
      
      doc.font('ThaiRegular').fontSize(8.5).fillColor('#64748B');
      const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`ระบบติดตามการทำงานโครงการยุทธศาสตร์ | วันที่พิมพ์รายงาน: ${dateStr} น.`, margin, margin + 34);

      // Clean horizontal rule under header
      doc.rect(margin, margin + 48, contentWidth, 1).fill('#475569');
    };

    drawHeader();
    let currentY = margin + 56;

    // Dynamic Columns layout depending on type
    let colWidths = [];
    let headers = [];

    if (type === 'project') {
      headers = ['ลำดับ', 'ชื่อโครงการ', 'หน่วยงาน/สังกัด', 'งบประมาณ (฿)', 'เป้าหมาย', 'สำเร็จ', 'ก้าวหน้า'];
      colWidths = [32, 180, 110, 80, 42, 40, 39.28];
    } else if (type === 'faculty' || type === 'department') {
      headers = ['ลำดับ', 'ชื่อหน่วยงาน / สังกัด', 'โครงการ', 'งบประมาณตั้งต้น (฿)', 'เบิกจ่ายจริง (฿)', 'ความสำเร็จ (%)'];
      colWidths = [35, 195, 48, 95, 90, 60.28];
    } else if (type === 'budget') {
      headers = ['ลำดับ', 'ชื่อโครงการ', 'หน่วยงาน', 'งบตั้งต้น (฿)', 'ใช้จริง (฿)', 'คงเหลือ (฿)', 'ใช้จ่าย (%)'];
      colWidths = [30, 160, 95, 80, 80, 80, 48.28];
    } else if (type === 'university') {
      headers = ['รหัส', 'ประเด็นยุทธศาสตร์หลัก', 'โครงการ', 'งบประมาณตั้งต้น (฿)', 'เบิกจ่ายจริง (฿)', 'เฉลี่ย (%)'];
      colWidths = [45, 205, 45, 90, 85, 53.28];
    }

    // Helper to draw clean table rows (simple white background, crisp borders)
    const drawTableRow = (row, widths, y, isHeader = false) => {
      const rowHeight = isHeader ? 22 : 18;

      if (isHeader) {
        // Top and bottom border lines for header
        doc.rect(margin, y, contentWidth, 1).fill('#334155');
        doc.rect(margin, y + rowHeight, contentWidth, 1).fill('#334155');
      } else {
        // Thin bottom border line for row
        doc.rect(margin, y + rowHeight, contentWidth, 0.5).fill('#CBD5E1');
      }

      let currentX = margin;
      doc.font(isHeader ? 'ThaiBold' : 'ThaiRegular');
      doc.fontSize(isHeader ? 8.5 : 8);

      row.forEach((text, i) => {
        const cleanText = text !== undefined ? String(text).replace(/[\r\n]+/g, ' ') : '';
        const align = (isHeader || i === 0 || i >= widths.length - 3) ? (i === 0 ? 'center' : (i >= widths.length - 2 ? 'center' : 'right')) : 'left';
        
        doc.fillColor(isHeader ? '#0F172A' : '#1E293B');
        doc.text(cleanText, currentX + 3, y + (isHeader ? 5 : 4), { 
          width: widths[i] - 6, 
          align: isHeader ? 'center' : align,
          lineBreak: false 
        });
        currentX += widths[i];
      });
    };

    // Draw table header
    drawTableRow(headers, colWidths, currentY, true);
    currentY += 24;

    // Draw table data rows
    data.forEach((item, index) => {
      // Check page break
      if (currentY > pageHeight - 70) {
        doc.addPage();
        drawHeader();
        currentY = margin + 56;
        drawTableRow(headers, colWidths, currentY, true);
        currentY += 24;
      }

      let rowData = [];
      if (type === 'project') {
        rowData = [
          index + 1,
          item.name,
          item.department || item.faculty || 'ส่วนกลาง',
          item.totalBudget ? item.totalBudget.toLocaleString('th-TH') : '0',
          item.targetCount || 0,
          item.completedCount || 0,
          `${item.progress || 0}%`
        ];
      } else if (type === 'faculty' || type === 'department') {
        rowData = [
          index + 1,
          item.name,
          item.projectsCount || 0,
          item.totalBudget ? item.totalBudget.toLocaleString('th-TH') : '0',
          item.actualSpent ? item.actualSpent.toLocaleString('th-TH') : '0',
          `${item.avgProgress || 0}%`
        ];
      } else if (type === 'budget') {
        rowData = [
          index + 1,
          item.projectName,
          item.department || 'ส่วนกลาง',
          item.totalBudget ? item.totalBudget.toLocaleString('th-TH') : '0',
          item.actualSpent ? item.actualSpent.toLocaleString('th-TH') : '0',
          item.remainingBudget ? item.remainingBudget.toLocaleString('th-TH') : '0',
          `${item.usagePercentage || 0}%`
        ];
      } else if (type === 'university') {
        rowData = [
          item.code,
          item.name,
          item.projectsCount || 0,
          item.totalBudget ? item.totalBudget.toLocaleString('th-TH') : '0',
          item.actualSpent ? item.actualSpent.toLocaleString('th-TH') : '0',
          `${item.avgProgress || 0}%`
        ];
      }

      drawTableRow(rowData, colWidths, currentY, false);
      currentY += 19;
    });

    // Summary calculation
    const totalProjCount = data.reduce((sum, item) => sum + (item.projectsCount !== undefined ? item.projectsCount : 1), 0);
    const totalBudSum = data.reduce((sum, item) => sum + (item.totalBudget || 0), 0);
    const totalSpentSum = data.reduce((sum, item) => sum + (item.actualSpent || 0), 0);

    // Summary Section
    if (currentY > pageHeight - 80) {
      doc.addPage();
      drawHeader();
      currentY = margin + 56;
    } else {
      currentY += 10;
    }

    // Clean summary border outline (white background)
    doc.rect(margin, currentY, contentWidth, 42).stroke('#94A3B8');

    doc.font('ThaiBold').fontSize(8.5).fillColor('#0F172A');
    doc.text('สรุปภาพรวมผลการดำเนินงาน', margin + 10, currentY + 6);

    doc.font('ThaiRegular').fontSize(8).fillColor('#334155');
    const summaryColWidth = (contentWidth - 20) / 3;
    doc.text(`จำนวนรายการรวม: ${totalProjCount} รายการ`, margin + 10, currentY + 22, { width: summaryColWidth });
    doc.text(`งบประมาณรวม: ${totalBudSum.toLocaleString('th-TH')} บาท`, margin + 10 + summaryColWidth, currentY + 22, { width: summaryColWidth });
    doc.text(`เบิกจ่ายจริงรวม: ${totalSpentSum.toLocaleString('th-TH')} บาท`, margin + 10 + (summaryColWidth * 2), currentY + 22, { width: summaryColWidth });

    // Page Numbering Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font('ThaiRegular').fontSize(7.5).fillColor('#94A3B8');
      doc.text(`หน้า ${i + 1} จาก ${range.count} | ระบบติดตามการทำงานโครงการยุทธศาสตร์ มหาวิทยาลัยราชภัฏบุรีรัมย์`, margin, pageHeight - 24, {
        width: contentWidth,
        align: 'center'
      });
    }

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Failed to export PDF', error: error.message });
  }
};

const exportMasterDataPDF = async (req, res) => {
  try {
    const { tab } = req.query;
    const activeTab = tab || 'user';

    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 36,
      bufferPages: true 
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="master-data-${activeTab}-${Date.now()}.pdf"`);
    doc.pipe(res);

    registerThaiFonts(doc);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const contentWidth = pageWidth - (margin * 2);

    let tabName = 'ผู้ใช้งาน';
    let headers = [];
    let colWidths = [];
    let rows = [];

    if (activeTab === 'user') {
      tabName = 'ข้อมูลบัญชีผู้ใช้งานระบบ';
      headers = ['ลำดับ', 'ชื่อ-นามสกุล', 'บัญชีผู้ใช้', 'สิทธิ์', 'สังกัดคณะ', 'ภาควิชา'];
      colWidths = [30, 130, 80, 55, 115, 113.28];
      const users = await prisma.user.findMany({
        include: { department: { include: { faculty: true } } },
        orderBy: { id: 'asc' }
      });
      rows = users.map((u, i) => [
        i + 1,
        u.name,
        u.username,
        u.role,
        u.department?.faculty?.name || 'ส่วนกลาง',
        u.department?.name || 'ไม่มีสังกัด'
      ]);
    } else if (activeTab === 'faculty') {
      tabName = 'ข้อมูลคณะและหน่วยงานหลัก';
      headers = ['ลำดับ', 'ชื่อคณะ', 'จำนวนภาควิชา', 'จำนวนโครงการ'];
      colWidths = [40, 260, 110, 113.28];
      const faculties = await prisma.faculty.findMany({
        include: { _count: { select: { departments: true, projects: true } } },
        orderBy: { id: 'asc' }
      });
      rows = faculties.map((f, i) => [
        i + 1,
        f.name,
        `${f._count.departments} ภาควิชา`,
        `${f._count.projects} โครงการ`
      ]);
    } else if (activeTab === 'department') {
      tabName = 'ข้อมูลภาควิชาและสาขาวิชา';
      headers = ['ลำดับ', 'ชื่อภาควิชา/สาขาวิชา', 'สังกัดคณะ'];
      colWidths = [40, 260, 223.28];
      const depts = await prisma.department.findMany({
        include: { faculty: true },
        orderBy: { id: 'asc' }
      });
      rows = depts.map((d, i) => [
        i + 1,
        d.name,
        d.faculty?.name || 'ส่วนกลาง'
      ]);
    } else if (activeTab === 'strategy') {
      tabName = 'ข้อมูลประเด็นยุทธศาสตร์หลัก';
      headers = ['รหัส', 'ประเด็นยุทธศาสตร์หลัก'];
      colWidths = [60, 463.28];
      const strats = await prisma.strategy.findMany({ orderBy: { code: 'asc' } });
      rows = strats.map(s => [s.code, s.name]);
    } else if (activeTab === 'indicator') {
      tabName = 'ข้อมูลตัวชี้วัดความสำเร็จ (KPIs)';
      headers = ['รหัส', 'ชื่อตัวชี้วัด', 'ยุทธศาสตร์ย่อย'];
      colWidths = [60, 260, 203.28];
      const indicators = await prisma.indicator.findMany({
        include: { subStrategy: true },
        orderBy: { code: 'asc' }
      });
      rows = indicators.map(ind => [ind.code, ind.name, ind.subStrategy?.name || '']);
    } else {
      tabName = 'ข้อมูลโครงสร้างระบบ';
      headers = ['ลำดับ', 'รายการ'];
      colWidths = [50, 473.28];
      rows = [[1, 'ข้อมูลพื้นฐานระบบ']];
    }

    const drawHeader = () => {
      doc.font('ThaiBold').fontSize(14).fillColor('#0F172A');
      doc.text('มหาวิทยาลัยราชภัฏบุรีรัมย์', margin, margin);
      doc.font('ThaiBold').fontSize(11).fillColor('#334155');
      doc.text(`รายงานข้อมูลพื้นฐานระบบ: ${tabName}`, margin, margin + 18);
      doc.font('ThaiRegular').fontSize(8.5).fillColor('#64748B');
      const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`ระบบติดตามการทำงานโครงการยุทธศาสตร์ | ข้อมูล ณ วันที่: ${dateStr} น.`, margin, margin + 34);

      doc.rect(margin, margin + 48, contentWidth, 1).fill('#475569');
    };

    drawHeader();
    let currentY = margin + 56;

    // Draw table header
    doc.rect(margin, currentY, contentWidth, 1).fill('#334155');
    doc.rect(margin, currentY + 22, contentWidth, 1).fill('#334155');

    let hX = margin;
    doc.font('ThaiBold').fontSize(8.5).fillColor('#0F172A');
    headers.forEach((h, idx) => {
      doc.text(h, hX + 3, currentY + 6, { width: colWidths[idx] - 6, align: idx === 0 ? 'center' : 'left', lineBreak: false });
      hX += colWidths[idx];
    });
    currentY += 24;

    // Draw rows
    rows.forEach((r) => {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader();
        currentY = margin + 56;
        doc.rect(margin, currentY, contentWidth, 1).fill('#334155');
        doc.rect(margin, currentY + 22, contentWidth, 1).fill('#334155');
        let thX = margin;
        doc.font('ThaiBold').fontSize(8.5).fillColor('#0F172A');
        headers.forEach((h, idx) => {
          doc.text(h, thX + 3, currentY + 6, { width: colWidths[idx] - 6, align: idx === 0 ? 'center' : 'left', lineBreak: false });
          thX += colWidths[idx];
        });
        currentY += 24;
      }

      doc.rect(margin, currentY + 18, contentWidth, 0.5).fill('#CBD5E1');

      let cX = margin;
      doc.font('ThaiRegular').fontSize(8).fillColor('#1E293B');
      r.forEach((cell, cIdx) => {
        doc.text(String(cell ?? ''), cX + 3, currentY + 4, { 
          width: colWidths[cIdx] - 6, 
          align: cIdx === 0 ? 'center' : 'left',
          lineBreak: false 
        });
        cX += colWidths[cIdx];
      });
      currentY += 19;
    });

    // Page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font('ThaiRegular').fontSize(7.5).fillColor('#94A3B8');
      doc.text(`หน้า ${i + 1} จาก ${range.count} | รายงานข้อมูลพื้นฐาน มหาวิทยาลัยราชภัฏบุรีรัมย์`, margin, pageHeight - 24, {
        width: contentWidth,
        align: 'center'
      });
    }

    doc.end();
  } catch (error) {
    console.error('Export Master Data PDF error:', error);
    res.status(500).json({ message: 'Failed to export PDF', error: error.message });
  }
};

module.exports = {
  getReport,
  exportCSV,
  exportExcel,
  exportPDF,
  exportMasterDataPDF
};
