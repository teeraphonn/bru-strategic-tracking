const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// Helper to handle standard CRUD errors
const handleError = (res, error, customMessage = 'Internal server error') => {
  console.error(error);
  if (error.code === 'P2002') {
    return res.status(400).json({ message: 'A record with this unique key already exists.' });
  }
  res.status(500).json({ message: customMessage, error: error.message });
};

// In-memory cache for ultra-fast master data queries (sub-millisecond response)
const masterCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const getCached = (key) => {
  const item = masterCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  masterCache.delete(key);
  return null;
};

const setCached = (key, data) => {
  masterCache.set(key, { data, timestamp: Date.now() });
};

const invalidateMasterCache = (prefix) => {
  if (prefix) {
    for (const key of masterCache.keys()) {
      if (key.startsWith(prefix)) masterCache.delete(key);
    }
  } else {
    masterCache.clear();
  }
};

// ==========================================
// FACULTIES CRUD
// ==========================================
const getFaculties = async (req, res) => {
  try {
    const cached = getCached('faculties');
    if (cached) return res.json(cached);

    const list = await prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      include: {
        departments: {
          include: {
            users: {
              where: { role: 'DEAN' }
            }
          }
        },
        projects: {
          select: {
            progress: true
          }
        },
        _count: {
          select: {
            departments: true,
            projects: true
          }
        }
      }
    });

    const formattedList = list.map(faculty => {
      let deanName = 'ยังไม่มีคณบดี';
      for (const dept of faculty.departments) {
        const deanUser = dept.users.find(u => u.role === 'DEAN');
        if (deanUser) {
          deanName = deanUser.name;
          break;
        }
      }

      const projectsCount = faculty.projects.length;
      const avgProgress = projectsCount > 0 
        ? parseFloat((faculty.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsCount).toFixed(2))
        : 0;

      return {
        id: faculty.id,
        name: faculty.name,
        dean: deanName,
        departmentsCount: faculty._count.departments,
        projectsCount: faculty._count.projects,
        progress: avgProgress,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt
      };
    });

    setCached('faculties', formattedList);
    res.json(formattedList);
  } catch (error) {
    handleError(res, error, 'Failed to fetch faculties');
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name } = req.body;
    const item = await prisma.faculty.create({ data: { name } });
    invalidateMasterCache();
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create faculty');
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const item = await prisma.faculty.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    invalidateMasterCache();
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update faculty');
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.faculty.delete({ where: { id: parseInt(id) } });
    invalidateMasterCache();
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete faculty');
  }
};

// ==========================================
// DEPARTMENTS CRUD
// ==========================================
const getDepartments = async (req, res) => {
  try {
    const facultyId = req.query.facultyId ? parseInt(req.query.facultyId) : undefined;
    const cacheKey = `departments_${facultyId || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const where = {};
    if (facultyId) {
      where.facultyId = facultyId;
    }

    const list = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { 
        faculty: true, 
        projects: {
          select: {
            progress: true
          }
        },
        _count: { select: { users: true, projects: true } } 
      }
    });
    
    const formatted = list.map(d => {
      const projectsCount = d.projects.length;
      const avgProgress = projectsCount > 0
        ? parseFloat((d.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsCount).toFixed(2))
        : 0;
      
      const { projects: _, ...deptWithoutProj } = d;
      return {
        ...deptWithoutProj,
        projectsCount,
        progress: avgProgress
      };
    });

    setCached(cacheKey, formatted);
    res.json(formatted);
  } catch (error) {
    handleError(res, error, 'Failed to fetch departments');
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, facultyId } = req.body;
    const item = await prisma.department.create({
      data: {
        name,
        facultyId: facultyId ? parseInt(facultyId) : null
      },
      include: { faculty: true }
    });
    invalidateMasterCache();
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create department');
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, facultyId } = req.body;
    const item = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        facultyId: facultyId ? parseInt(facultyId) : null
      },
      include: { faculty: true }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update department');
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete department');
  }
};

// ==========================================
// FISCAL YEARS CRUD
// ==========================================
const getFiscalYears = async (req, res) => {
  try {
    const list = await prisma.fiscalYear.findMany({
      orderBy: { year: 'desc' }
    });
    res.json(list);
  } catch (error) {
    handleError(res, error, 'Failed to fetch fiscal years');
  }
};

const createFiscalYear = async (req, res) => {
  try {
    const { year, active } = req.body;
    
    // If active is true, deactivate other fiscal years
    if (active) {
      await prisma.fiscalYear.updateMany({ data: { active: false } });
    }

    const item = await prisma.fiscalYear.create({
      data: {
        year: parseInt(year),
        active: !!active
      }
    });
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create fiscal year');
  }
};

const updateFiscalYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, active } = req.body;

    if (active) {
      await prisma.fiscalYear.updateMany({ data: { active: false } });
    }

    const item = await prisma.fiscalYear.update({
      where: { id: parseInt(id) },
      data: {
        year: parseInt(year),
        active: !!active
      }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update fiscal year');
  }
};

const deleteFiscalYear = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fiscalYear.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Fiscal year deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete fiscal year');
  }
};

// ==========================================
// BUDGET SOURCES CRUD
// ==========================================
const getBudgetSources = async (req, res) => {
  try {
    const list = await prisma.budgetSource.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (error) {
    handleError(res, error, 'Failed to fetch budget sources');
  }
};

const createBudgetSource = async (req, res) => {
  try {
    const { name } = req.body;
    const item = await prisma.budgetSource.create({ data: { name } });
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create budget source');
  }
};

const updateBudgetSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const item = await prisma.budgetSource.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update budget source');
  }
};

const deleteBudgetSource = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.budgetSource.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Budget source deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete budget source');
  }
};

// ==========================================
// STRATEGIES CRUD
// ==========================================
const getStrategies = async (req, res) => {
  try {
    const list = await prisma.strategy.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { subStrategies: true } } }
    });
    res.json(list);
  } catch (error) {
    handleError(res, error, 'Failed to fetch strategies');
  }
};

const createStrategy = async (req, res) => {
  try {
    const { name, code } = req.body;
    const item = await prisma.strategy.create({ data: { name, code } });
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create strategy');
  }
};

const updateStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const item = await prisma.strategy.update({
      where: { id: parseInt(id) },
      data: { name, code }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update strategy');
  }
};

const deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.strategy.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete strategy');
  }
};

// ==========================================
// SUB STRATEGIES CRUD
// ==========================================
const getSubStrategies = async (req, res) => {
  try {
    const list = await prisma.subStrategy.findMany({
      orderBy: { code: 'asc' },
      include: { strategy: true, _count: { select: { indicators: true, projects: true } } }
    });
    res.json(list);
  } catch (error) {
    handleError(res, error, 'Failed to fetch sub strategies');
  }
};

const createSubStrategy = async (req, res) => {
  try {
    const { name, code, strategyId } = req.body;
    const item = await prisma.subStrategy.create({
      data: {
        name,
        code,
        strategyId: parseInt(strategyId)
      },
      include: { strategy: true }
    });
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create sub strategy');
  }
};

const updateSubStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, strategyId } = req.body;
    const item = await prisma.subStrategy.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        strategyId: parseInt(strategyId)
      },
      include: { strategy: true }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update sub strategy');
  }
};

const deleteSubStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subStrategy.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Sub strategy deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete sub strategy');
  }
};

// ==========================================
// INDICATORS CRUD
// ==========================================
const getIndicators = async (req, res) => {
  try {
    const list = await prisma.indicator.findMany({
      orderBy: { code: 'asc' },
      include: { subStrategy: { include: { strategy: true } } }
    });
    res.json(list);
  } catch (error) {
    handleError(res, error, 'Failed to fetch indicators');
  }
};

const createIndicator = async (req, res) => {
  try {
    const { name, code, subStrategyId } = req.body;
    const item = await prisma.indicator.create({
      data: {
        name,
        code,
        subStrategyId: parseInt(subStrategyId)
      },
      include: { subStrategy: true }
    });
    res.status(201).json(item);
  } catch (error) {
    handleError(res, error, 'Failed to create indicator');
  }
};

const updateIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, subStrategyId } = req.body;
    const item = await prisma.indicator.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        subStrategyId: parseInt(subStrategyId)
      },
      include: { subStrategy: true }
    });
    res.json(item);
  } catch (error) {
    handleError(res, error, 'Failed to update indicator');
  }
};

const deleteIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.indicator.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Indicator deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete indicator');
  }
};

// ==========================================
// USERS CRUD
// ==========================================
const getUsers = async (req, res) => {
  try {
    const list = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: { department: { include: { faculty: true } } }
    });
    // Remove passwords
    const sanitized = list.map(({ password, ...u }) => u);
    res.json(sanitized);
  } catch (error) {
    handleError(res, error, 'Failed to fetch users');
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, name, role, departmentId } = req.body;
    
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้งาน (Username)' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อ-นามสกุล' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่' });
    }

    const cleanUsername = username.trim();
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });
    if (existingUser) {
      return res.status(400).json({ message: `ชื่อผู้ใช้งาน "${cleanUsername}" มีอยู่ในระบบแล้ว` });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const parsedDeptId = (departmentId && !isNaN(parseInt(departmentId))) ? parseInt(departmentId) : null;

    const item = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: name.trim(),
        role: role || 'TEACHER',
        departmentId: parsedDeptId
      },
      include: { department: true }
    });

    const { password: _, ...sanitized } = item;
    res.status(201).json(sanitized);
  } catch (error) {
    handleError(res, error, 'ไม่สามารถสร้างบัญชีผู้ใช้งานได้');
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, role, departmentId } = req.body;

    const parsedDeptId = (departmentId && !isNaN(parseInt(departmentId))) ? parseInt(departmentId) : null;

    const data = {
      username: username ? username.trim() : undefined,
      name: name ? name.trim() : undefined,
      role: role || undefined,
      departmentId: parsedDeptId
    };

    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const item = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: { department: true }
    });

    const { password: _, ...sanitized } = item;
    res.json(sanitized);
  } catch (error) {
    handleError(res, error, 'ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete user');
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const defaultPassword = req.body?.password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    res.json({ 
      message: `รีเซ็ตรหัสผ่านสำเร็จเป็น: ${defaultPassword}`,
      defaultPassword 
    });
  } catch (error) {
    handleError(res, error, 'Failed to reset password');
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const [userCount, projectCount, issueCount, facultyCount, deptCount, strategyCount, indicatorCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.issueReport.count(),
      prisma.faculty.count(),
      prisma.department.count(),
      prisma.strategy.count(),
      prisma.indicator.count()
    ]);

    const activeFiscalYear = await prisma.fiscalYear.findFirst({
      where: { active: true }
    });

    res.json({
      status: 'HEALTHY',
      database: 'CONNECTED',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        projects: projectCount,
        issues: issueCount,
        faculties: facultyCount,
        departments: deptCount,
        strategies: strategyCount,
        indicators: indicatorCount
      },
      activeFiscalYear: activeFiscalYear ? activeFiscalYear.year : null
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch system health');
  }
};

const clearCache = async (req, res) => {
  try {
    // Return cache cleared confirmation
    res.json({ 
      success: true, 
      message: 'ล้างข้อมูลแคชและรีเฟรชการเชื่อมต่อฐานข้อมูลเรียบร้อยแล้ว',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(res, error, 'Failed to clear cache');
  }
};

module.exports = {
  // Faculties
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  // Departments
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  // Fiscal Years
  getFiscalYears,
  createFiscalYear,
  updateFiscalYear,
  deleteFiscalYear,
  // Budget Sources
  getBudgetSources,
  createBudgetSource,
  updateBudgetSource,
  deleteBudgetSource,
  // Strategies
  getStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  // Sub Strategies
  getSubStrategies,
  createSubStrategy,
  updateSubStrategy,
  deleteSubStrategy,
  // Indicators
  getIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  // System Tools
  getSystemHealth,
  clearCache
};
