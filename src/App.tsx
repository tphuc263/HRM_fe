import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import EmployeeListPage from './pages/employees/EmployeeListPage'
import DailyAttendancePage from './pages/attendance/DailyAttendancePage'
import MonthlyAttendancePage from './pages/attendance/MonthlyAttendancePage'
import OvertimeRegistrationPage from './pages/attendance/OvertimeRegistrationPage'
import LeaveRequestPage from './pages/attendance/LeaveRequestPage'
import AbsenceManagementPage from './pages/attendance/AbsenceManagementPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/attendance/daily" element={<DailyAttendancePage />} />
          <Route path="/attendance/monthly" element={<MonthlyAttendancePage />} />
          <Route path="/attendance/overtime" element={<OvertimeRegistrationPage />} />
          <Route path="/attendance/leave-request" element={<LeaveRequestPage />} />
          <Route path="/attendance/absence" element={<AbsenceManagementPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
