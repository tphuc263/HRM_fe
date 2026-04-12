-- ==========================================
-- 1. TẠO BẢNG (TABLES)
-- ==========================================

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  department_id INTEGER,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  birthday DATE,
  address TEXT,
  join_date DATE NOT NULL,
  status VARCHAR DEFAULT 'ACTIVE', -- Note: 'ACTIVE, INACTIVE, RESIGNED'
  resignation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  contract_type VARCHAR(50) NOT NULL, -- Note: 'PROBATION, DEFINITE_1YR, INDEFINITE'
  start_date DATE NOT NULL,
  end_date DATE, -- Null cho hợp đồng vô thời hạn
  basic_salary DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- Note: 'DRAFT, ACTIVE, EXPIRED, TERMINATED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR DEFAULT 'EMPLOYEE', -- Note: 'ADMIN, EMPLOYEE'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR, -- Note: 'ON_TIME, LATE, EARLY_LEAVE, ABSENT, HALF_DAY'
  overtime_hours DECIMAL(4, 2) DEFAULT 0,
  work_hours DECIMAL(4, 2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  description TEXT
);

CREATE TABLE leave_balances (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_days DECIMAL(4, 1) DEFAULT 0,
  used_days DECIMAL(4, 1) DEFAULT 0,
  carry_over_days DECIMAL(4, 1) DEFAULT 0
);

CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(4, 1) NOT NULL,
  reason TEXT NOT NULL,
  attachment_url VARCHAR(255),
  status VARCHAR DEFAULT 'PENDING', -- Note: 'PENDING, APPROVED, REJECTED, CANCELLED'
  approved_by INTEGER,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  month VARCHAR(7) NOT NULL, -- Note: 'YYYY-MM'
  basic_salary DECIMAL(12, 2) NOT NULL,
  allowances JSONB,
  total_allowances DECIMAL(12, 2) DEFAULT 0,
  overtime_pay DECIMAL(12, 2) DEFAULT 0,
  gross_salary DECIMAL(12, 2) NOT NULL,
  deductions JSONB,
  total_deductions DECIMAL(12, 2) DEFAULT 0,
  net_salary DECIMAL(12, 2) NOT NULL,
  work_days DECIMAL(4, 1),
  actual_days DECIMAL(4, 1),
  status VARCHAR DEFAULT 'DRAFT', -- Note: 'DRAFT, CALCULATED, APPROVED, PAID'
  approved_by INTEGER,
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TẠO INDEXES & UNIQUE CONSTRAINTS
-- ==========================================

ALTER TABLE attendance_records ADD CONSTRAINT unique_employee_date UNIQUE (employee_id, date);
ALTER TABLE leave_balances ADD CONSTRAINT unique_employee_leave_year UNIQUE (employee_id, leave_type_id, year);
ALTER TABLE payroll ADD CONSTRAINT unique_employee_month UNIQUE (employee_id, month);

-- ==========================================
-- 3. TẠO FOREIGN KEYS (RELATIONSHIPS)
-- ==========================================

ALTER TABLE departments ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES employees(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE contracts ADD CONSTRAINT fk_contracts_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE attendance_records ADD CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE leave_balances ADD CONSTRAINT fk_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE leave_balances ADD CONSTRAINT fk_leave_balances_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id);

ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id);
ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE payroll ADD CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE payroll ADD CONSTRAINT fk_payroll_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL;