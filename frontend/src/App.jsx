import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';

// Lightweight fallback loader while lazy chunks load
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-xs font-bold text-slate-400 animate-pulse">กำลังโหลดข้อมูล...</span>
    </div>
  </div>
);

// Common pages
import Login from './pages/auth/Login';

// Lazy-loaded Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProjects = lazy(() => import('./pages/admin/Projects'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const MasterData = lazy(() => import('./pages/admin/MasterData'));
const AdminIssues = lazy(() => import('./pages/admin/Issues'));
const AdminActivities = lazy(() => import('./pages/admin/AdminActivities'));

// Lazy-loaded Teacher pages
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherProjects = lazy(() => import('./pages/teacher/Projects'));
const ActivitiesList = lazy(() => import('./pages/teacher/ActivitiesList'));
const ProjectForm = lazy(() => import('./pages/teacher/ProjectForm'));
const ProjectDetails = lazy(() => import('./pages/teacher/ProjectDetails'));
const Gallery = lazy(() => import('./pages/teacher/Gallery'));

// Lazy-loaded Dean pages
const DeanDashboard = lazy(() => import('./pages/dean/Dashboard'));
const DeanProjects = lazy(() => import('./pages/dean/Projects'));
const DeanReports = lazy(() => import('./pages/dean/Reports'));

// Lazy-loaded President pages
const PresidentDashboard = lazy(() => import('./pages/president/Dashboard'));
const PresidentProjects = lazy(() => import('./pages/president/Projects'));
const PresidentReports = lazy(() => import('./pages/president/Reports'));

// Lazy-loaded Executive pages
const ExecutiveProjectDetail = lazy(() => import('./pages/executive/ProjectDetail'));

// Dynamic Resolver for Activities page
const ActivitiesResolver = () => {
  const { user } = useContext(AuthContext);
  switch (user?.role) {
    case 'ADMIN':
      return <AdminActivities />;
    default:
      return <ActivitiesList />;
  }
};

// Protect routes requiring authentication
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

// Protect routes requiring ADMIN role
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

// Dynamic Resolver for Dashboard page
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

// Dynamic Resolver for Projects page
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

// Dynamic Resolver for Reports page
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
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Application Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<DashboardResolver />} />
              
              {/* Admin Dashboard */}
              <Route 
                path="dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
              {/* Projects lifecycle */}
              <Route path="projects" element={<ProjectsResolver />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="projects/:id/edit" element={<ProjectForm />} />
              <Route path="executive-projects/:id" element={<ExecutiveProjectDetail />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="activities" element={<ActivitiesResolver />} />
              
              {/* Report modules */}
              <Route path="reports" element={<ReportsResolver />} />

              {/* Admin only Master Data CRUDs */}
              <Route 
                path="master-data" 
                element={
                  <AdminRoute>
                    <MasterData />
                  </AdminRoute>
                } 
              />

              {/* Admin Issue Management Center */}
              <Route 
                path="admin/issues" 
                element={
                  <AdminRoute>
                    <AdminIssues />
                  </AdminRoute>
                } 
              />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
