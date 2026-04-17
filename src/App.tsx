import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import EmployeeListPage from './pages/employees/EmployeeListPage'
import DailyAttendancePage from './pages/attendance/DailyAttendancePage'
import MonthlyAttendancePage from './pages/attendance/MonthlyAttendancePage'
import OvertimeRegistrationPage from './pages/attendance/OvertimeRegistrationPage'
import LeaveRequestPage from './pages/attendance/LeaveRequestPage'
import AbsenceManagementPage from './pages/attendance/AbsenceManagementPage'
import RequireAuth from './components/auth/RequireAuth'
import LoginPage from './pages/auth/LoginPage'
import PayrollListPage from './pages/payroll/PayrollListPage'
import MyPayrollPage from './pages/payroll/MyPayrollPage'
import { useAuth } from './context/useAuth'

function ProtectedPage({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  return (
    <RequireAuth allowedRoles={allowedRoles}>
      <Layout>{children}</Layout>
    </RequireAuth>
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }
  return <Navigate to="/attendance/daily" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><HomeRedirect /></RequireAuth>} />

        <Route path="/admin" element={<ProtectedPage allowedRoles={['ADMIN']}><DashboardPage /></ProtectedPage>} />
        <Route path="/admin/employees" element={<ProtectedPage allowedRoles={['ADMIN']}><EmployeeListPage /></ProtectedPage>} />
        <Route path="/admin/attendance/daily" element={<ProtectedPage allowedRoles={['ADMIN']}><DailyAttendancePage /></ProtectedPage>} />
        <Route path="/admin/attendance/monthly" element={<ProtectedPage allowedRoles={['ADMIN']}><MonthlyAttendancePage /></ProtectedPage>} />
        <Route path="/admin/attendance/overtime" element={<ProtectedPage allowedRoles={['ADMIN']}><OvertimeRegistrationPage /></ProtectedPage>} />
        <Route path="/admin/attendance/leave-request" element={<ProtectedPage allowedRoles={['ADMIN']}><LeaveRequestPage /></ProtectedPage>} />
        <Route path="/admin/attendance/absence" element={<ProtectedPage allowedRoles={['ADMIN']}><AbsenceManagementPage /></ProtectedPage>} />
        <Route path="/admin/payroll/manage" element={<ProtectedPage allowedRoles={['ADMIN']}><PayrollListPage /></ProtectedPage>} />

        <Route path="/employees" element={<ProtectedPage allowedRoles={['ADMIN']}><EmployeeListPage /></ProtectedPage>} />
        <Route path="/attendance/daily" element={<ProtectedPage><DailyAttendancePage /></ProtectedPage>} />
        <Route path="/attendance/monthly" element={<ProtectedPage><MonthlyAttendancePage /></ProtectedPage>} />
        <Route path="/attendance/overtime" element={<ProtectedPage><OvertimeRegistrationPage /></ProtectedPage>} />
        <Route path="/attendance/leave-request" element={<ProtectedPage><LeaveRequestPage /></ProtectedPage>} />
        <Route path="/attendance/absence" element={<ProtectedPage><AbsenceManagementPage /></ProtectedPage>} />
        <Route path="/payroll/manage" element={<ProtectedPage allowedRoles={['ADMIN']}><PayrollListPage /></ProtectedPage>} />

        <Route path="/payroll/my-salary" element={<ProtectedPage><MyPayrollPage /></ProtectedPage>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
