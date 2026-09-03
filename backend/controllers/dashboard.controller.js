const prisma = require('../config/prisma');

const extractRecentPhotos = (projects, req, targetFacultyId = null) => {
  const photos = [];
  projects.forEach(p => {
    // Strict isolation: verify project belongs to target faculty
    const pFacId = p.facultyId || p.department?.facultyId;
    if (targetFacultyId && pFacId && pFacId !== targetFacultyId) {
      return;
    }
    p.activities.forEach(a => {
      if (a.images && a.images.length > 0) {
        a.images.forEach(img => {
          if (!img.filePath) return;
          // If filePath is already a full URL (Cloudinary, http, https, data:), use as-is
          // Otherwise prepend the backend host (legacy local /uploads/... paths)
          let imageUrl;
          if (
            img.filePath.startsWith('http://') ||
            img.filePath.startsWith('https://') ||
            img.filePath.startsWith('data:')
          ) {
            imageUrl = img.filePath;
          } else {
            const cleanPath = img.filePath.replace(/\\/g, '/');
            const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
            imageUrl = `${req.protocol}://${req.get('host')}${normalized}`;
          }
          photos.push({
            id: img.id,
            imageUrl,
            activityName: a.name,
            description: a.description || '',
            projectName: p.name,
            facultyId: p.facultyId || p.department?.facultyId || p.faculty?.id,
            facultyName: p.faculty?.name || 'ส่วนกลาง',
            departmentName: p.department?.name || 'ส่วนกลาง',
            createdAt: img.createdAt
          });
        });
      }
    });
  });
  return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    
    // Determine project scope based on role
    const projectWhere = {};
    
    // Parse query filters
    const { fiscalYearId, facultyId, departmentId, strategyId, responsibleId, budgetSourceId } = req.query;

    if (fiscalYearId) {
      projectWhere.fiscalYearId = parseInt(fiscalYearId);
    }
    if (budgetSourceId) {
      projectWhere.budgetSourceId = parseInt(budgetSourceId);
    }
    if (facultyId) {
      projectWhere.facultyId = parseInt(facultyId);
    }
    if (departmentId) {
      projectWhere.departmentId = parseInt(departmentId);
    }
    if (strategyId) {
      projectWhere.subStrategy = {
        strategyId: parseInt(strategyId)
      };
    }
    if (responsibleId) {
      projectWhere.users = {
        some: {
          userId: parseInt(responsibleId)
        }
      };
    }

    if (user.role === 'ADMIN' || user.role === 'PRESIDENT') {
      // Full view
    } else if (user.role === 'DEAN') {
      let userFacultyId = user.department?.facultyId;
      if (!userFacultyId) {
        const matchedFaculty = await prisma.faculty.findFirst();
        userFacultyId = matchedFaculty ? matchedFaculty.id : 1;
      }
      // Match projects that directly set facultyId OR belong to a dept in this faculty
      projectWhere.OR = [
        { facultyId: userFacultyId },
        { department: { facultyId: userFacultyId } }
      ];
    } else if (user.role === 'TEACHER') {
      projectWhere.OR = [
        { creatorId: user.id },
        { users: { some: { userId: user.id } } }
      ];
    }

    // 1. Projects in scope
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        activities: {
          include: {
            images: true
          }
        },
        subStrategy: { 
          include: { 
            strategy: { 
              include: { localIssue: true } 
            } 
          } 
        },
        indicator: true,
        department: true,
        faculty: true
      }
    });

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progress >= 100 || (p.targetCount > 0 && p.completedCount >= p.targetCount)).length;
    const inProgressProjects = totalProjects - completedProjects;

    // Calculate project budget totals
    const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.totalBudget || 0), 0);

    // Get all activities for these projects
    const allActivities = [];
    projects.forEach(p => {
      p.activities.forEach(a => {
        allActivities.push({
          ...a,
          projectName: p.name,
          projectCode: p.id
        });
      });
    });

    const totalActivities = allActivities.length;
    const completedActivities = allActivities.filter(a => a.success).length;
    const remainingActivities = totalActivities - completedActivities;

    const totalActualBudget = allActivities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);

    // Percentages
    const budgetPercentage = totalBudget > 0 ? parseFloat(((totalActualBudget / totalBudget) * 100).toFixed(2)) : 0;
    
    // Overall accomplishment target progress
    const totalTarget = projects.reduce((sum, p) => sum + p.targetCount, 0);
    const totalCompleted = projects.reduce((sum, p) => sum + p.completedCount, 0);
    const totalRemainingTarget = Math.max(0, totalTarget - totalCompleted);
    const targetProgressPercentage = totalTarget > 0 ? parseFloat(((totalCompleted / totalTarget) * 100).toFixed(2)) : 0;

    const successActivityPercentage = totalActivities > 0 ? parseFloat(((completedActivities / totalActivities) * 100).toFixed(2)) : 0;

    // 2. Recent Projects (Latest 5)
    const recentProjects = await prisma.project.findMany({
      where: projectWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
        fiscalYear: true
      }
    });

    // 3. Recent Activities (Latest 5)
    const projectIds = projects.map(p => p.id);
    const recentActivities = await prisma.activity.findMany({
      where: {
        projectId: { in: projectIds }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true } }
      }
    });

    // 4. Latest Images (Latest 6)
    const latestImages = await prisma.activityImage.findMany({
      where: {
        activity: {
          projectId: { in: projectIds }
        }
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        activity: {
          select: {
            name: true,
            project: { select: { name: true } }
          }
        }
      }
    });

    // 5. Chart Data: Project progress categories (Pie Chart)
    const progressBuckets = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };

    projects.forEach(p => {
      const prog = p.progress;
      if (prog <= 25) progressBuckets['0-25%']++;
      else if (prog <= 50) progressBuckets['26-50%']++;
      else if (prog <= 75) progressBuckets['51-75%']++;
      else progressBuckets['76-100%']++;
    });

    // 6. Chart Data: Budget vs Actual Budget by Unit (Bar Chart)
    // If admin or president, aggregate by Faculty. If faculty level (Dean/Head), aggregate by Department.
    const barChartData = [];
    const unitMap = {};

    if (user.role === 'ADMIN' || user.role === 'PRESIDENT') {
      projects.forEach(p => {
        const key = p.faculty?.name || 'มหาวิทยาลัย (ส่วนกลาง)';
        if (!unitMap[key]) {
          unitMap[key] = { budget: 0, actual: 0 };
        }
        unitMap[key].budget += parseFloat(p.totalBudget || 0);
        p.activities.forEach(a => {
          unitMap[key].actual += parseFloat(a.actualBudget || 0);
        });
      });
    } else {
      projects.forEach(p => {
        const key = p.department?.name || 'ไม่มีหน่วยงาน';
        if (!unitMap[key]) {
          unitMap[key] = { budget: 0, actual: 0 };
        }
        unitMap[key].budget += parseFloat(p.totalBudget || 0);
        p.activities.forEach(a => {
          unitMap[key].actual += parseFloat(a.actualBudget || 0);
        });
      });
    }

    Object.keys(unitMap).forEach(key => {
      barChartData.push({
        unit: key,
        budget: parseFloat(unitMap[key].budget.toFixed(2)),
        actual: parseFloat(unitMap[key].actual.toFixed(2))
      });
    });

    // 7. Chart Data: Spending timeline (Line Chart)
    // Aggregate budget spending by month over the past 6 months
    const monthlySpending = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear() + 543}`; // Thai year
      monthlySpending[label] = 0;
    }

    allActivities.forEach(a => {
      if (a.actualBudget) {
        const date = new Date(a.activityDate);
        const label = `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
        if (monthlySpending[label] !== undefined) {
          monthlySpending[label] += parseFloat(a.actualBudget);
        }
      }
    });

    const lineChartData = Object.keys(monthlySpending).map(key => ({
      period: key,
      spent: parseFloat(monthlySpending[key].toFixed(2))
    }));

    res.json({
      summary: {
        totalProjects,
        completedProjects,
        inProgressProjects,
        totalActivities,
        completedActivities,
        remainingActivities,
        totalTarget,
        totalCompleted,
        totalRemainingTarget,
        totalBudget: parseFloat(totalBudget.toFixed(2)),
        totalActualBudget: parseFloat(totalActualBudget.toFixed(2)),
        budgetPercentage,
        targetProgressPercentage,
        successActivityPercentage
      },
      recentProjects,
      recentActivities,
      latestImages,
      charts: {
        pie: Object.keys(progressBuckets).map(k => ({ status: k, count: progressBuckets[k] })),
        bar: barChartData,
        line: lineChartData
      }
    });
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard statistics', error: error.message });
  }
};

// Helper to calculate RAG Flag for Executive Exception Management
const calculateProjectRAG = (project) => {
  const target = project.targetCount || 1;
  const completed = project.completedCount || 0;
  const progressPct = target > 0 ? (completed / target) * 100 : 0;
  
  const budget = parseFloat(project.totalBudget || 0);
  const activities = project.activities || [];
  const actualSpent = activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
  const burnRatePct = budget > 0 ? (actualSpent / budget) * 100 : 0;

  const overBudgetItem = activities.find(a => parseFloat(a.actualBudget || 0) > parseFloat(a.budget || 0));

  if (progressPct < 40 || (burnRatePct > 90 && progressPct < 50) || overBudgetItem) {
    let reason = 'ความก้าวหน้าโครงการล่าช้ากว่ากำหนดมาก (น้อยกว่า 40%)';
    if (overBudgetItem) {
      reason = `มีกิจกรรมย่อย (${overBudgetItem.name}) เบิกจ่ายเกินงบแผนที่ตั้งไว้`;
    } else if (burnRatePct > 90 && progressPct < 50) {
      reason = `งบประมาณถูกใช้ไปแล้วกว่า ${burnRatePct.toFixed(1)}% แต่ความก้าวหน้าผลงานได้เพียง ${progressPct.toFixed(1)}%`;
    }

    return { 
      status: 'RED', 
      label: 'วิกฤต/ช้ากว่าแผนมาก', 
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', 
      isCritical: true,
      reason
    };
  } else if (progressPct < 75 || Math.abs(burnRatePct - progressPct) > 25) {
    let reason = 'ความก้าวหน้าโครงการอยู่ในระดับปานกลาง (40% - 74%)';
    if (Math.abs(burnRatePct - progressPct) > 25) {
      reason = 'อัตราการเบิกจ่ายงบประมาณไม่สอดคล้องกับความก้าวหน้าผลงาน';
    }

    return { 
      status: 'YELLOW', 
      label: 'เฝ้าระวัง/ช้าเล็กน้อย', 
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', 
      isCritical: false,
      reason
    };
  }

  return { 
    status: 'GREEN', 
    label: 'ปกติ/เป็นไปตามแผน', 
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    isCritical: false,
    reason: 'การดำเนินงานและเบิกจ่ายงบประมาณเป็นไปตามแผนที่กำหนด'
  };
};

// GET /api/dashboard/dean - Faculty Executive Health Check & Exception Management
const getDeanDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    let userFacultyId = user.department?.facultyId;

    if (!userFacultyId && user.role === 'DEAN') {
      const matchedFaculty = await prisma.faculty.findFirst();
      userFacultyId = matchedFaculty ? matchedFaculty.id : 1;
    }

    // Determine strict target faculty ID
    let targetFacultyId = null;
    if (user.role === 'DEAN') {
      targetFacultyId = userFacultyId;
    } else if (req.query.facultyId) {
      targetFacultyId = parseInt(req.query.facultyId);
    } else if (userFacultyId) {
      targetFacultyId = userFacultyId;
    } else {
      const firstFac = await prisma.faculty.findFirst();
      targetFacultyId = firstFac ? firstFac.id : 1;
    }

    const whereClause = {
      OR: [
        { facultyId: targetFacultyId },
        { department: { facultyId: targetFacultyId } }
      ]
    };

    if (req.query.fiscalYearId) {
      whereClause.fiscalYearId = parseInt(req.query.fiscalYearId);
    }
    if (req.query.budgetSourceId) {
      whereClause.budgetSourceId = parseInt(req.query.budgetSourceId);
    }

    // Fetch Faculty info
    const faculty = targetFacultyId ? await prisma.faculty.findUnique({
      where: { id: targetFacultyId },
      include: { departments: true }
    }) : null;

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        department: true,
        faculty: true,
        creator: { select: { id: true, name: true, username: true } },
        fiscalYear: true,
        subStrategy: { 
          include: { 
            strategy: { 
              include: { localIssue: true } 
            } 
          } 
        },
        indicator: true,
        activities: {
          include: {
            images: true
          }
        }
      }
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let totalTarget = 0;
    let totalCompleted = 0;
    let redCount = 0;
    let yellowCount = 0;
    let greenCount = 0;

    const processedProjects = projects.map(p => {
      const pBudget = parseFloat(p.totalBudget || 0);
      const pSpent = p.activities.reduce((s, a) => s + parseFloat(a.actualBudget || 0), 0);
      const pTarget = p.targetCount || 0;
      const pCompleted = p.completedCount || 0;
      const pProgress = pTarget > 0 ? parseFloat(((pCompleted / pTarget) * 100).toFixed(2)) : 0;
      const pBurnRate = pBudget > 0 ? parseFloat(((pSpent / pBudget) * 100).toFixed(2)) : 0;

      totalBudget += pBudget;
      totalSpent += pSpent;
      totalTarget += pTarget;
      totalCompleted += pCompleted;

      const rag = calculateProjectRAG(p);
      if (rag.status === 'RED') redCount++;
      else if (rag.status === 'YELLOW') yellowCount++;
      else greenCount++;

      return {
        ...p,
        totalSpent: pSpent,
        progressPct: pProgress,
        burnRatePct: pBurnRate,
        rag
      };
    });

    const overallProgress = totalTarget > 0 ? parseFloat(((totalCompleted / totalTarget) * 100).toFixed(2)) : 0;
    const overallBurnRate = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(2)) : 0;

    // Filter Red Flags for Exception Management Panel
    const redFlagProjects = processedProjects.filter(p => p.rag.status === 'RED');

    // Aggregate by Department inside Faculty
    const departmentStats = {};
    if (faculty?.departments) {
      faculty.departments.forEach(dept => {
        departmentStats[dept.id] = {
          id: dept.id,
          name: dept.name,
          projectCount: 0,
          totalBudget: 0,
          totalSpent: 0,
          totalTarget: 0,
          totalCompleted: 0,
          redCount: 0,
          yellowCount: 0,
          greenCount: 0
        };
      });
    }

    processedProjects.forEach(p => {
      if (p.departmentId && departmentStats[p.departmentId]) {
        const d = departmentStats[p.departmentId];
        d.projectCount++;
        d.totalBudget += parseFloat(p.totalBudget || 0);
        d.totalSpent += p.totalSpent;
        d.totalTarget += (p.targetCount || 0);
        d.totalCompleted += (p.completedCount || 0);

        if (p.rag.status === 'RED') d.redCount++;
        else if (p.rag.status === 'YELLOW') d.yellowCount++;
        else d.greenCount++;
      }
    });

    // Compute progress % and burn rate % and overall RAG status for departments
    Object.values(departmentStats).forEach(d => {
      d.progressPct = d.totalTarget > 0 ? parseFloat(((d.totalCompleted / d.totalTarget) * 100).toFixed(2)) : 0;
      d.burnRatePct = d.totalBudget > 0 ? parseFloat(((d.totalSpent / d.totalBudget) * 100).toFixed(2)) : 0;
      
      let overallStatus = 'GREEN';
      if (d.redCount > 0 || d.progressPct < 40) overallStatus = 'RED';
      else if (d.yellowCount > 0 || d.progressPct < 75) overallStatus = 'YELLOW';
      d.overallStatus = overallStatus;
    });

    const strategies = await prisma.strategy.findMany({
      include: { subStrategies: true, localIssue: true },
      orderBy: { code: 'asc' }
    });

    const localIssues = await prisma.localIssue.findMany({
      orderBy: { code: 'asc' }
    });

    // 1. Local Issues for this Faculty (Level 1: 4 ด้าน)
    const localIssueStats = localIssues.map(li => {
      const liProjects = processedProjects.filter(p => p.subStrategy?.strategy?.localIssueId === li.id);
      let liBudget = 0;
      let liSpent = 0;
      let liTarget = 0;
      let liCompleted = 0;

      liProjects.forEach(p => {
        liBudget += parseFloat(p.totalBudget || 0);
        liSpent += (p.totalSpent || 0);
        liTarget += (p.targetCount || 0);
        liCompleted += (p.completedCount || 0);
      });

      const progressPct = liTarget > 0 ? parseFloat(((liCompleted / liTarget) * 100).toFixed(2)) : 0;

      return {
        localIssueId: li.id,
        localIssueCode: li.code,
        localIssueName: li.name,
        totalProjects: liProjects.length,
        totalBudget: parseFloat(liBudget.toFixed(2)),
        totalSpent: parseFloat(liSpent.toFixed(2)),
        progressPct
      };
    });

    // 2. Strategic Pillars for this Faculty (Level 2: 4 แผนงานหลัก)
    const pillarStats = strategies.map(s => {
      const sProjects = processedProjects.filter(p => p.subStrategy?.strategyId === s.id);
      let sBudget = 0;
      let sSpent = 0;
      let sTarget = 0;
      let sCompleted = 0;

      sProjects.forEach(p => {
        sBudget += parseFloat(p.totalBudget || 0);
        sSpent += (p.totalSpent || 0);
        sTarget += (p.targetCount || 0);
        sCompleted += (p.completedCount || 0);
      });

      const progressPct = sTarget > 0 ? parseFloat(((sCompleted / sTarget) * 100).toFixed(2)) : 0;

      return {
        strategyId: s.id,
        strategyCode: s.code,
        strategyName: s.name,
        localIssueId: s.localIssueId,
        localIssueCode: s.localIssue?.code,
        localIssueName: s.localIssue?.name,
        totalProjects: sProjects.length,
        totalBudget: parseFloat(sBudget.toFixed(2)),
        totalSpent: parseFloat(sSpent.toFixed(2)),
        progressPct
      };
    });

    res.json({
      facultyName: faculty?.name || 'คณะวิทยาศาสตร์',
      healthCheck: {
        totalProjects: processedProjects.length,
        overallProgress,
        overallBurnRate,
        totalBudget: parseFloat(totalBudget.toFixed(2)),
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        kpiFulfillmentPct: overallProgress,
        redCount,
        yellowCount,
        greenCount
      },
      localIssues: localIssueStats,
      strategicPillars: pillarStats,
      redFlagProjects,
      departmentPerformance: Object.values(departmentStats),
      allProjects: processedProjects,
      recentPhotos: extractRecentPhotos(projects, req, targetFacultyId)
    });
  } catch (error) {
    console.error('Dean dashboard error:', error);
    res.status(500).json({ message: 'Failed to retrieve Dean dashboard statistics', error: error.message });
  }
};

// GET /api/dashboard/president - University Executive Health Check & Strategic Heatmap
const getPresidentDashboardStats = async (req, res) => {
  try {
    const { fiscalYearId, budgetSourceId } = req.query;
    const whereClause = {};
    if (fiscalYearId) {
      whereClause.fiscalYearId = parseInt(fiscalYearId);
    }
    if (budgetSourceId) {
      whereClause.budgetSourceId = parseInt(budgetSourceId);
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        faculty: true,
        department: true,
        creator: { select: { id: true, name: true, username: true } },
        fiscalYear: true,
        subStrategy: { 
          include: { 
            strategy: { 
              include: { localIssue: true } 
            } 
          } 
        },
        indicator: true,
        activities: {
          include: {
            images: true
          }
        }
      }
    });

    const faculties = await prisma.faculty.findMany({
      orderBy: { name: 'asc' }
    });

    const strategies = await prisma.strategy.findMany({
      include: { subStrategies: true, localIssue: true },
      orderBy: { code: 'asc' }
    });

    const localIssues = await prisma.localIssue.findMany({
      orderBy: { code: 'asc' }
    });

    // 1. Cross-Faculty Strategic Heatmap Matrix
    const facultyMatrix = faculties.map(f => {
      const fProjects = projects.filter(p => p.facultyId === f.id);
      let fBudget = 0;
      let fSpent = 0;
      let fTarget = 0;
      let fCompleted = 0;
      let fRed = 0;
      let fYellow = 0;
      let fGreen = 0;

      fProjects.forEach(p => {
        const b = parseFloat(p.totalBudget || 0);
        const s = p.activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
        fBudget += b;
        fSpent += s;
        fTarget += (p.targetCount || 0);
        fCompleted += (p.completedCount || 0);

        const rag = calculateProjectRAG(p);
        if (rag.status === 'RED') fRed++;
        else if (rag.status === 'YELLOW') fYellow++;
        else fGreen++;
      });

      const progressPct = fTarget > 0 ? parseFloat(((fCompleted / fTarget) * 100).toFixed(2)) : 0;
      const burnRatePct = fBudget > 0 ? parseFloat(((fSpent / fBudget) * 100).toFixed(2)) : 0;

      let overallStatus = 'GREEN';
      if (fRed > 0 || progressPct < 40) overallStatus = 'RED';
      else if (fYellow > 0 || progressPct < 75) overallStatus = 'YELLOW';

      return {
        facultyId: f.id,
        facultyName: f.name,
        totalProjects: fProjects.length,
        totalBudget: parseFloat(fBudget.toFixed(2)),
        totalSpent: parseFloat(fSpent.toFixed(2)),
        progressPct,
        burnRatePct,
        redCount: fRed,
        yellowCount: fYellow,
        greenCount: fGreen,
        overallStatus
      };
    });

    // 2.1 Local Issues Accomplishment (Level 1: 4 ด้านการพัฒนาท้องถิ่น)
    const localIssueStats = localIssues.map(li => {
      const liProjects = projects.filter(p => p.subStrategy?.strategy?.localIssueId === li.id);
      let liBudget = 0;
      let liSpent = 0;
      let liTarget = 0;
      let liCompleted = 0;

      liProjects.forEach(p => {
        liBudget += parseFloat(p.totalBudget || 0);
        liSpent += p.activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
        liTarget += (p.targetCount || 0);
        liCompleted += (p.completedCount || 0);
      });

      const progressPct = liTarget > 0 ? parseFloat(((liCompleted / liTarget) * 100).toFixed(2)) : 0;

      return {
        localIssueId: li.id,
        localIssueCode: li.code,
        localIssueName: li.name,
        totalProjects: liProjects.length,
        totalBudget: parseFloat(liBudget.toFixed(2)),
        totalSpent: parseFloat(liSpent.toFixed(2)),
        progressPct
      };
    });

    // 2.2 Strategic Pillars Accomplishment (Level 2: แผนงานหลัก)
    const pillarStats = strategies.map(s => {
      const sProjects = projects.filter(p => p.subStrategy?.strategyId === s.id);
      let sBudget = 0;
      let sSpent = 0;
      let sTarget = 0;
      let sCompleted = 0;

      sProjects.forEach(p => {
        sBudget += parseFloat(p.totalBudget || 0);
        sSpent += p.activities.reduce((sum, a) => sum + parseFloat(a.actualBudget || 0), 0);
        sTarget += (p.targetCount || 0);
        sCompleted += (p.completedCount || 0);
      });

      const progressPct = sTarget > 0 ? parseFloat(((sCompleted / sTarget) * 100).toFixed(2)) : 0;

      return {
        strategyId: s.id,
        strategyCode: s.code,
        strategyName: s.name,
        localIssueId: s.localIssueId,
        localIssueCode: s.localIssue?.code,
        localIssueName: s.localIssue?.name,
        totalProjects: sProjects.length,
        totalBudget: parseFloat(sBudget.toFixed(2)),
        totalSpent: parseFloat(sSpent.toFixed(2)),
        progressPct
      };
    });

    // 3. Top Flagship Critical Bottlenecks (Red projects)
    const allProcessed = projects.map(p => {
      const pBudget = parseFloat(p.totalBudget || 0);
      const pSpent = p.activities.reduce((s, a) => s + parseFloat(a.actualBudget || 0), 0);
      const pTarget = p.targetCount || 0;
      const pCompleted = p.completedCount || 0;
      const progressPct = pTarget > 0 ? parseFloat(((pCompleted / pTarget) * 100).toFixed(2)) : 0;
      const burnRatePct = pBudget > 0 ? parseFloat(((pSpent / pBudget) * 100).toFixed(2)) : 0;
      const rag = calculateProjectRAG(p);

      // Extract all activity photos for this project
      const projectPhotos = [];
      p.activities.forEach(a => {
        if (a.images && a.images.length > 0) {
          a.images.forEach(img => {
            projectPhotos.push({
              id: img.id,
              imageUrl: `${req.protocol}://${req.get('host')}${img.filePath.replace(/\\/g, '/')}`,
              activityName: a.name,
              createdAt: img.createdAt
            });
          });
        }
      });

      return {
        ...p,
        totalSpent: pSpent,
        progressPct,
        burnRatePct,
        rag,
        projectPhotos
      };
    });

    const criticalBottlenecks = allProcessed
      .filter(p => p.rag.status === 'RED')
      .sort((a, b) => parseFloat(b.totalBudget) - parseFloat(a.totalBudget));

    // Summary Totals
    const totalUnivProjects = projects.length;
    const totalUnivBudget = projects.reduce((s, p) => s + parseFloat(p.totalBudget || 0), 0);
    const totalUnivSpent = projects.reduce((s, p) => s + p.activities.reduce((actSum, a) => actSum + parseFloat(a.actualBudget || 0), 0), 0);
    const univTarget = projects.reduce((s, p) => s + p.targetCount, 0);
    const univCompleted = projects.reduce((s, p) => s + p.completedCount, 0);
    const univProgressPct = univTarget > 0 ? parseFloat(((univCompleted / univTarget) * 100).toFixed(2)) : 0;
    const univBurnRatePct = totalUnivBudget > 0 ? parseFloat(((totalUnivSpent / totalUnivBudget) * 100).toFixed(2)) : 0;

    res.json({
      universityHealth: {
        totalProjects: totalUnivProjects,
        totalBudget: parseFloat(totalUnivBudget.toFixed(2)),
        totalSpent: parseFloat(totalUnivSpent.toFixed(2)),
        overallProgress: univProgressPct,
        overallBurnRate: univBurnRatePct,
        totalRed: criticalBottlenecks.length,
        totalYellow: allProcessed.filter(p => p.rag.status === 'YELLOW').length,
        totalGreen: allProcessed.filter(p => p.rag.status === 'GREEN').length
      },
      crossFacultyMatrix: facultyMatrix,
      localIssues: localIssueStats,
      strategicPillars: pillarStats,
      criticalBottlenecks,
      recentPhotos: extractRecentPhotos(projects, req)
    });
  } catch (error) {
    console.error('President dashboard error:', error);
    res.status(500).json({ message: 'Failed to retrieve President dashboard statistics', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getDeanDashboardStats,
  getPresidentDashboardStats
};

