// Force Vercel Rebuild - Timestamp: 4
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnnotationsPage from './pages/AnnotationsPage';
import GradesPage from './pages/GradesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentsPage from './pages/PaymentsPage';
import GuardianPaymentsPage from './pages/GuardianPaymentsPage';
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
import CourseStudentsPage from './pages/CourseStudentsPage';
import AttendancePage from './pages/AttendancePage';
import TariffsPage from './pages/TariffsPage';
import MessagesPage from './pages/MessagesPage';
import PayrollPage from './pages/PayrollPage'; // Importar la nueva página de Nóminas
import PayrollForm from './components/PayrollForm'; // Importar el formulario de Nóminas
import SostenedorDashboard from './pages/SostenedorDashboard';
import CollectionsPage from './pages/CollectionsPage';
import GuardiansPage from './pages/GuardiansPage';
import QuestionBankPage from './pages/QuestionBankPage';
import ProfilePage from './pages/ProfilePage';
import AdminDaysPage from './pages/AdminDaysPage';
import EventRequestsPage from './pages/EventRequestsPage';
import UnifiedClassBook from './pages/UnifiedClassBook';
import ForcePasswordReset from './pages/ForcePasswordReset';
import CareersPage from './pages/CareersPage';
import AcademicCenter from './pages/AcademicCenter';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import HojaDeVidaPage from './pages/HojaDeVidaPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password-required" element={<ForcePasswordReset />} />

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
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/my-payments" element={<GuardianPaymentsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id/students" element={<CourseStudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/tariffs" element={<TariffsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/academic" element={<AcademicCenter />} />
            <Route path="/schedules" element={<ScheduleManagementPage />} />
            <Route path="/hoja-de-vida" element={<HojaDeVidaPage />} />

            {/* Rutas para Gestión de Nóminas */}
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/finance-dashboard" element={<SostenedorDashboard />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/guardians" element={<GuardiansPage />} />
            <Route path="/class-book" element={<UnifiedClassBook />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin-days" element={<AdminDaysPage />} />
            <Route path="/event-requests" element={<EventRequestsPage />} />
            <Route path="/payroll/new" element={<PayrollForm />} />
            <Route path="/payroll/edit/:id" element={<PayrollForm isEditing={true} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
