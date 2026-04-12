import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import EmployeeListPage from './pages/employees/EmployeeListPage'
import DailyAttendancePage from './pages/attendance/DailyAttendancePage'
import MonthlyAttendancePage from './pages/attendance/MonthlyAttendancePage'
import OvertimeRegistrationPage from './pages/attendance/OvertimeRegistrationPage'

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
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
