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
import DepartmentListPage from './pages/departments/DepartmentListPage'
import LeaveTypeListPage from './pages/settings/LeaveTypeListPage'
import ShiftListPage from './pages/settings/ShiftListPage'
import HolidayListPage from './pages/settings/HolidayListPage'
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
  return <Navigate to={`/employees/${user?.userId}/attendance/daily`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><HomeRedirect /></RequireAuth>} />

        <Route path="/admin" element={<ProtectedPage allowedRoles={['ADMIN']}><DashboardPage /></ProtectedPage>} />
        <Route path="/admin/employees" element={<ProtectedPage allowedRoles={['ADMIN']}><EmployeeListPage /></ProtectedPage>} />
        <Route path="/admin/employees/:id" element={<ProtectedPage allowedRoles={['ADMIN']}><EmployeeListPage /></ProtectedPage>} />
        <Route path="/admin/attendance/daily" element={<ProtectedPage allowedRoles={['ADMIN']}><DailyAttendancePage /></ProtectedPage>} />
        <Route path="/admin/attendance/monthly" element={<ProtectedPage allowedRoles={['ADMIN']}><MonthlyAttendancePage /></ProtectedPage>} />
        <Route path="/admin/attendance/overtime" element={<ProtectedPage allowedRoles={['ADMIN']}><OvertimeRegistrationPage /></ProtectedPage>} />
        <Route path="/admin/attendance/leave-request" element={<ProtectedPage allowedRoles={['ADMIN']}><LeaveRequestPage /></ProtectedPage>} />
        <Route path="/admin/attendance/absence" element={<ProtectedPage allowedRoles={['ADMIN']}><AbsenceManagementPage /></ProtectedPage>} />
        <Route path="/admin/payroll/manage" element={<ProtectedPage allowedRoles={['ADMIN']}><PayrollListPage /></ProtectedPage>} />
        <Route path="/admin/departments" element={<ProtectedPage allowedRoles={['ADMIN']}><DepartmentListPage /></ProtectedPage>} />
        <Route path="/admin/leave-types" element={<ProtectedPage allowedRoles={['ADMIN']}><LeaveTypeListPage /></ProtectedPage>} />
        <Route path="/admin/shifts" element={<ProtectedPage allowedRoles={['ADMIN']}><ShiftListPage /></ProtectedPage>} />
        <Route path="/admin/holidays" element={<ProtectedPage allowedRoles={['ADMIN']}><HolidayListPage /></ProtectedPage>} />

        <Route path="/employees/:userId/attendance/daily" element={<ProtectedPage><DailyAttendancePage /></ProtectedPage>} />
        <Route path="/employees/:userId/attendance/monthly" element={<ProtectedPage><MonthlyAttendancePage /></ProtectedPage>} />
        <Route path="/employees/:userId/attendance/overtime" element={<ProtectedPage><OvertimeRegistrationPage /></ProtectedPage>} />
        <Route path="/employees/:userId/attendance/leave-request" element={<ProtectedPage><LeaveRequestPage /></ProtectedPage>} />
        <Route path="/employees/:userId/attendance/absence" element={<ProtectedPage><AbsenceManagementPage /></ProtectedPage>} />
        <Route path="/employees/:userId/payroll/my-salary" element={<ProtectedPage><MyPayrollPage /></ProtectedPage>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
