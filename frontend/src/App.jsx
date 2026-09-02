import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';

// Common pages
import Login from './pages/auth/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProjects from './pages/admin/Projects';
import AdminReports from './pages/admin/Reports';
import MasterData from './pages/admin/MasterData';
import AdminIssues from './pages/admin/Issues';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherProjects from './pages/teacher/Projects';
import ActivitiesList from './pages/teacher/ActivitiesList';
import ProjectForm from './pages/teacher/ProjectForm';
import ProjectDetails from './pages/teacher/ProjectDetails';
import Gallery from './pages/teacher/Gallery';
import AdminActivities from './pages/admin/AdminActivities';

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



// Dean pages
import DeanDashboard from './pages/dean/Dashboard';
import DeanProjects from './pages/dean/Projects';
import DeanReports from './pages/dean/Reports';

// President pages
import PresidentDashboard from './pages/president/Dashboard';
import PresidentProjects from './pages/president/Projects';
import PresidentReports from './pages/president/Reports';

// Executive pages
import ExecutiveProjectDetail from './pages/executive/ProjectDetail';

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
      // Teachers do not have a dedicated reports page, redirect to Dashboard
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
      </Router>
    </AuthProvider>
  );
}

export default App;
