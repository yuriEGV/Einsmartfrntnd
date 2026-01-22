import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnnotationsPage from './pages/AnnotationsPage';
import GradesPage from './pages/GradesPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentsPage from './pages/PaymentsPage';
import StudentsPage from './pages/StudentsPage';
import UsersPage from './pages/UsersPage';
import EventsPage from './pages/EventsPage';
import AuditLogPage from './pages/AuditLogPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import TenantsPage from './pages/TenantsPage';
import SchoolSettingsPage from './pages/SchoolSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import CoursesPage from './pages/CoursesPage';
import SubjectsPage from './pages/SubjectsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import AttendancePage from './pages/AttendancePage';
import TariffsPage from './pages/TariffsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/enrollments" element={<EnrollmentsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/annotations" element={<AnnotationsPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/settings" element={<SchoolSettingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/tariffs" element={<TariffsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
