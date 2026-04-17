import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
        <Route path="/employees" element={<ProtectedPage><EmployeeListPage /></ProtectedPage>} />
        <Route path="/attendance/daily" element={<ProtectedPage><DailyAttendancePage /></ProtectedPage>} />
        <Route path="/attendance/monthly" element={<ProtectedPage><MonthlyAttendancePage /></ProtectedPage>} />
        <Route path="/attendance/overtime" element={<ProtectedPage><OvertimeRegistrationPage /></ProtectedPage>} />
        <Route path="/attendance/leave-request" element={<ProtectedPage><LeaveRequestPage /></ProtectedPage>} />
        <Route path="/attendance/absence" element={<ProtectedPage><AbsenceManagementPage /></ProtectedPage>} />
        <Route path="/payroll/manage" element={<ProtectedPage><PayrollListPage /></ProtectedPage>} />
        <Route path="/payroll/my-salary" element={<ProtectedPage><MyPayrollPage /></ProtectedPage>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
