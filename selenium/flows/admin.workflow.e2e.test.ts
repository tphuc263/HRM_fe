import { WebDriver, By, until } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';
import { setupDriver, teardownDriver, clearSession, getAppUrl } from '../helpers/base';
import { LoginPO } from '../pages/LoginPO';
import { EmployeePO } from '../pages/EmployeePO';
import { PayrollPO } from '../pages/PayrollPO';
import { AttendancePO } from '../pages/AttendancePO';
import { LeaveRequestPO } from '../pages/LeaveRequestPO';
import { simulateHumanScroll, simulateHumanScrollUp, humanDelay, humanType } from '../helpers/human';

describe('Admin Workflow E2E Test', () => {
  let driver: WebDriver;
  let loginPage: LoginPO;
  let employeePage: EmployeePO;
  let payrollPage: PayrollPO;
  let attendancePage: AttendancePO;
  let leavePage: LeaveRequestPO;

  beforeAll(async () => {
    driver = await setupDriver();
    loginPage = new LoginPO(driver);
    employeePage = new EmployeePO(driver);
    payrollPage = new PayrollPO(driver);
    attendancePage = new AttendancePO(driver);
    leavePage = new LeaveRequestPO(driver);
  });

  afterAll(async () => {
    await clearSession(driver);
    await teardownDriver(driver);
  });

  it('1. Đăng nhập và xem Dashboard', async () => {
    await loginPage.navigate();
    await humanDelay(driver);
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    await loginPage.login(adminUser, adminPass);
    await loginPage.waitForDashboard();
    
    // Cuộn xuống xem dashboard
    await simulateHumanScroll(driver, 600);
    await simulateHumanScrollUp(driver, 400);
  });

  it('2. Quản lý Nhân sự: Tạo mới nhân viên', async () => {
    // Navigate to employees
    await driver.get(`${getAppUrl()}/admin/employees`);
    await humanDelay(driver);
    
    // Lướt xem danh sách
    await simulateHumanScroll(driver, 300);
    await simulateHumanScrollUp(driver, 300);

    // Filter nhẹ theo phòng ban (Radix UI)
    try {
      const deptFilter = await driver.wait(until.elementLocated(By.xpath('//button[@role="combobox" and .//span[text()="Phòng ban"]] | //button[contains(., "Phòng ban") and @role="combobox"]')), 2000);
      await deptFilter.click();
      await humanDelay(driver, 500);
      const allDepts = await driver.wait(until.elementLocated(By.xpath('//div[@role="option" and contains(., "Tất cả phòng ban")]')), 2000);
      await allDepts.click();
    } catch (e) {
      // Bỏ qua nếu không tìm thấy filter
    }
    await humanDelay(driver, 1000, 2000);

    // Tạo mới 1 nhân viên
    await employeePage.clickCreateEmployee();
    await humanDelay(driver);
    
    const uniqueEmail = `admin.workflow.${Date.now()}@example.com`;
    await employeePage.fillCreateEmployeeForm('Nhân viên mới từ Admin Workflow', uniqueEmail, '2026-06-01');
    
    try {
      const successMsg = await driver.wait(until.elementLocated(By.xpath('//p[contains(text(), "Đã tạo nhân viên thành công")]')), 10000);
      expect(await successMsg.isDisplayed()).toBeTruthy();
    } catch (e) {
      const errorEls = await driver.findElements(By.css('.text-destructive'));
      if (errorEls.length > 0) {
        const errText = await errorEls[0].getText();
        throw new Error(`Form submission failed with error: ${errText}`);
      }
      throw e;
    }
    await humanDelay(driver, 1500, 2000); // Đọc thông báo
    await employeePage.closeSuccessModal();
    
    // Lấy mã nhân viên vừa tạo
    await driver.get(`${getAppUrl()}/admin/employees`);
    await humanDelay(driver, 1000, 2000);
    const newEmployeeCode = await employeePage.getEmployeeCodeByEmail(uniqueEmail);
    const credentialsPath = path.join(__dirname, '../helpers/temp_credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify({ username: newEmployeeCode, password: 'password' }));
  });

  it('3. Bảng lương: Duyệt 1 phiếu lương', async () => {
    await payrollPage.navigateList();
    await humanDelay(driver);
    
    // Lọc theo phòng ban
    try {
      const deptFilter = await driver.wait(until.elementLocated(By.xpath('//select[contains(., "Tất cả phòng ban")]')), 2000);
      await deptFilter.click();
      await humanDelay(driver, 500);
      await humanType(driver, deptFilter, 'ALL');
      await deptFilter.click();
    } catch(e) {}
    await humanDelay(driver, 1000, 2000);
    
    // Kiểm tra và click nút duyệt lương đầu tiên (Nếu có nút duyệt - Status CALCULATED)
    // Nếu chưa có, tạo bảng lương trước
    const approveBtns = await driver.findElements(By.xpath('//button[contains(text(), "Duyệt") or contains(., "Duyệt")]'));
    if (approveBtns.length > 0) {
      await approveBtns[0].click();
      const confirmBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Xác nhận") or contains(text(), "Đồng ý")]')), 5000);
      await confirmBtn.click();
    } else {
      // Thử tạo bảng lương mới
      await payrollPage.generatePayroll();
      await humanDelay(driver, 2000, 3000);
    }
  });

  it('4. Quản lý Chấm công', async () => {
    // 4.1 Công ngày
    await driver.get(`${getAppUrl()}/admin/attendance/daily`);
    await humanDelay(driver);
    
    // Click filter 7 ngày qua
    const filterBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "7 ngày qua")]')), 5000);
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", filterBtn);
    await humanDelay(driver, 500);
    await filterBtn.click();
    await humanDelay(driver);
    await simulateHumanScroll(driver, 500);

    // 4.2 Công tháng
    await driver.get(`${getAppUrl()}/admin/attendance/monthly`);
    await humanDelay(driver);
    await simulateHumanScroll(driver, 700);
    await simulateHumanScrollUp(driver, 500);
    await humanDelay(driver);

    // 4.3 Đăng ký tăng ca
    await driver.get(`${getAppUrl()}/admin/attendance/overtime`);
    await humanDelay(driver);
    
    // Click "Đơn đăng ký" tab if not active
    try {
      const requestTab = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Đơn đăng ký")]')), 2000);
      await requestTab.click();
      await humanDelay(driver, 1000);
    } catch(e) {}

    // Thử duyệt 1 ca
    const approveBtns = await driver.findElements(By.xpath('//button[contains(., "Duyệt") and not(contains(., "Từ chối"))] | //button[contains(@class, "bg-green-600")]'));
    if (approveBtns.length > 0) {
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", approveBtns[0]);
      await humanDelay(driver, 500);
      await approveBtns[0].click();
      // Chờ confirm modal
      try {
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Xác nhận") or contains(text(), "Đồng ý")]')), 2000);
        await confirmBtn.click();
      } catch (e) {
        // Có thể không có confirm
      }
    }
    await humanDelay(driver);
  });

  it('5. Đơn xin nghỉ: Duyệt 1 đơn', async () => {
    await leavePage.navigateAdmin();
    await humanDelay(driver);
    await simulateHumanScroll(driver, 400);
    
    // Click duyệt (Approve) đơn đầu tiên nếu có
    const approveBtns = await driver.findElements(By.xpath('//button[contains(@title, "Duyệt") or text()="Duyệt" or contains(., "Duyệt")]'));
    if (approveBtns.length > 0) {
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", approveBtns[0]);
      await humanDelay(driver, 500);
      await approveBtns[0].click();
      // Chờ confirm modal
      try {
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Đồng ý") or contains(text(), "Xác nhận")]')), 2000);
        await confirmBtn.click();
        await humanDelay(driver, 2000); // Wait for toast and animation
      } catch (e) {
        // Bỏ qua nếu ko cần confirm
      }
    }
    await humanDelay(driver);
  });

  it('6. Quản lý vắng mặt: Đánh dấu vắng', async () => {
    await driver.get(`${getAppUrl()}/admin/attendance/absence`);
    await humanDelay(driver);
    
    // Click "Khởi tạo vắng mặt" hoặc "Đánh dấu vắng mặt"
    const markBtns = await driver.findElements(By.xpath('//button[contains(., "Khởi tạo") or contains(., "Đánh dấu vắng mặt")]'));
    if (markBtns.length > 0) {
      await markBtns[0].click();
      await humanDelay(driver, 2000); // Wait for toast or confirm
      // Giả lập confirm
      try {
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Đồng ý") or contains(text(), "Xác nhận")]')), 2000);
        await confirmBtn.click();
      } catch (e) { }
    }
    await humanDelay(driver);
  });

  it('7. Cài đặt hệ thống: Tạo phòng ban', async () => {
    await driver.get(`${getAppUrl()}/admin/departments`);
    await humanDelay(driver);
    
    // Click thêm phòng ban
    const createBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(., "Thêm phòng ban") or contains(., "Tạo phòng ban")]')), 5000);
    await createBtn.click();
    await humanDelay(driver);

    // Điền thông tin
    const codeInput = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Mã phòng ban" or @name="code" or @placeholder="Nhập mã phòng ban"] | //label[contains(text(),"Mã")]/following-sibling::input')), 5000);
    await humanType(driver, codeInput, `DEP_${Date.now()}`);

    const nameInput = await driver.findElement(By.xpath('//input[@placeholder="Tên phòng ban" or @name="name" or @placeholder="Nhập tên phòng ban"] | //label[contains(text(),"Tên")]/following-sibling::input'));
    await humanType(driver, nameInput, `Phòng Ban ${Date.now()}`);

    const submitBtn = await driver.findElement(By.xpath('//button[@type="submit" and (contains(., "Lưu") or contains(., "Thêm mới"))]'));
    await submitBtn.click();

    await humanDelay(driver);
  });
});
