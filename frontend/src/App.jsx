/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/App.jsx
 * หน้าที่: ตัวจัดการ Routing หลักของระบบ (Client-Side Router & Role Resolvers)
 *          - รองรับการโหลดหน้าเว็บแบบ Lazy Loading (React.lazy + Suspense)
 *          - ระบบ Dynamic Role Resolvers: สลับหน้าจออัตโนมัติตามสิทธิ์ผู้ใช้ (ADMIN, DEAN, TEACHER, PRESIDENT)
 *          - มิดเดิลแวร์หน้าบ้าน: ProtectedRoute (ตรวจการ Login), AdminRoute (ตรวจสิทธิ์ Admin)
 *          - โครงสร้างเส้นทางทั้งหมดของระบบ (Dashboard, Projects, Reports, MasterData, Issues)
 * ============================================================================
 */

import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';

// ─── Component โหลดหน้าระหว่างรอ Dynamic Chunk (PageLoader) ───────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-xs font-bold text-slate-400 animate-pulse">กำลังโหลดข้อมูล...</span>
    </div>
  </div>
);

// ─── หน้าสำหรับการยืนยันตัวตน (โหลดทันที) ──────────────────────────────────
import Login from './pages/auth/Login';

// ─── หน้าจอสำหรับผู้ดูแลระบบ (Admin Role: Lazy Loaded) ─────────────────────
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProjects = lazy(() => import('./pages/admin/Projects'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const MasterData = lazy(() => import('./pages/admin/MasterData'));
const AdminIssues = lazy(() => import('./pages/admin/Issues'));
const AdminActivities = lazy(() => import('./pages/admin/AdminActivities'));

// ─── หน้าจอสำหรับอาจารย์และเจ้าหน้าที่ (Teacher Role: Lazy Loaded) ─────────
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherProjects = lazy(() => import('./pages/teacher/Projects'));
const ActivitiesList = lazy(() => import('./pages/teacher/ActivitiesList'));
const ProjectForm = lazy(() => import('./pages/teacher/ProjectForm'));
const ProjectDetails = lazy(() => import('./pages/teacher/ProjectDetails'));
const Gallery = lazy(() => import('./pages/teacher/Gallery'));

// ─── หน้าจอสำหรับคณบดี (Dean Role: Lazy Loaded) ───────────────────────────
const DeanDashboard = lazy(() => import('./pages/dean/Dashboard'));
const DeanProjects = lazy(() => import('./pages/dean/Projects'));
const DeanReports = lazy(() => import('./pages/dean/Reports'));

// ─── หน้าจอสำหรับอธิการบดี (President Role: Lazy Loaded) ───────────────────
const PresidentDashboard = lazy(() => import('./pages/president/Dashboard'));
const PresidentProjects = lazy(() => import('./pages/president/Projects'));
const PresidentReports = lazy(() => import('./pages/president/Reports'));

// ─── หน้าจอรายละเอียดโครงการสำหรับผู้บริหาร (Executive Project Detail) ─────
const ExecutiveProjectDetail = lazy(() => import('./pages/executive/ProjectDetail'));

/**
 * ตัวสลับหน้ากิจกรรมอัตโนมัติตามบทบาท (Dynamic Activities Resolver)
 * - Admin: แสดงหน้า AdminActivities (กำกับติดตามกิจกรรมทุกโครงการ)
 * - บทบาทอื่น: แสดงหน้า ActivitiesList (กิจกรรมในโครงการที่ตนเองรับผิดชอบ)
 */
const ActivitiesResolver = () => {
  const { user } = useContext(AuthContext);
  switch (user?.role) {
    case 'ADMIN':
      return <AdminActivities />;
    default:
      return <ActivitiesList />;
  }
};

/**
 * ตัวป้องกันเส้นทางสำหรับผู้ใช้ที่เข้าสู่ระบบแล้วเท่านั้น (Protected Route Guard)
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * ตัวป้องกันเส้นทางสงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only Guard)
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * ตัวสลับหน้าแดชบอร์ดอัตโนมัติตามบทบาท (Dynamic Dashboard Resolver)
 * - ADMIN -> AdminDashboard
 * - TEACHER -> TeacherDashboard
 * - DEAN -> DeanDashboard
 * - PRESIDENT -> PresidentDashboard
 */
const DashboardResolver = () => {
  const { user } = useContext(AuthContext);
  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'DEAN':
      return <DeanDashboard />;
    case 'PRESIDENT':
      return <PresidentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

/**
 * ตัวสลับหน้ารายการโครงการอัตโนมัติตามบทบาท (Dynamic Projects Resolver)
 */
const ProjectsResolver = () => {
  const { user } = useContext(AuthContext);
  switch (user?.role) {
    case 'ADMIN':
      return <AdminProjects />;
    case 'TEACHER':
      return <TeacherProjects />;
    case 'DEAN':
      return <DeanProjects />;
    case 'PRESIDENT':
      return <PresidentProjects />;
    default:
      return <Navigate to="/login" replace />;
  }
};

/**
 * ตัวสลับหน้ารายงานสรุปตามบทบาท (Dynamic Reports Resolver)
 */
const ReportsResolver = () => {
  const { user } = useContext(AuthContext);
  switch (user?.role) {
    case 'ADMIN':
      return <AdminReports />;
    case 'TEACHER':
      return <Navigate to="/" replace />;
    case 'DEAN':
      return <DeanReports />;
    case 'PRESIDENT':
      return <PresidentReports />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* เส้นทางสาธารณะ: เข้าสู่ระบบ */}
            <Route path="/login" element={<Login />} />

            {/* เส้นทางที่ต้องยืนยันตัวตนภายใต้ AppLayout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* หน้าหลัก: สลับแดชบอร์ดตาม Role */}
              <Route index element={<DashboardResolver />} />
              
              {/* แดชบอร์ดเฉพาะ Admin */}
              <Route 
                path="dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
              {/* วงจรการจัดการโครงการ (Projects Lifecycle) */}
              <Route path="projects" element={<ProjectsResolver />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="projects/:id/edit" element={<ProjectForm />} />
              <Route path="executive-projects/:id" element={<ExecutiveProjectDetail />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="activities" element={<ActivitiesResolver />} />
              
              {/* หน้ารายงานสรุปผล (Reports) */}
              <Route path="reports" element={<ReportsResolver />} />

              {/* การจัดการข้อมูลพื้นฐาน (เฉพาะ Admin) */}
              <Route 
                path="master-data" 
                element={
                  <AdminRoute>
                    <MasterData />
                  </AdminRoute>
                } 
              />

              {/* ศูนย์จัดการปัญหาการใช้งานระบบ (เฉพาะ Admin) */}
              <Route 
                path="admin/issues" 
                element={
                  <AdminRoute>
                    <AdminIssues />
                  </AdminRoute>
                } 
              />
            </Route>

            {/* ดักจับเส้นทางไม่ถูกต้อง (Redirect กลับหน้าแรก) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
