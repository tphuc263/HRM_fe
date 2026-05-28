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
  let createdEmployeeCode = '';

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
    await driver.executeScript("localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light');");
    await humanDelay(driver);
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    await loginPage.login(adminUser, adminPass);
    await loginPage.waitForDashboard();

    // Cuộn xuống xem dashboard
    await simulateHumanScroll(driver, 300);
    await simulateHumanScrollUp(driver, 100);
  });

  it('2. Quản lý Nhân sự: Tạo mới nhân viên', async () => {
    // Navigate to employees
    await driver.get(`${getAppUrl()}/admin/employees`);
    await humanDelay(driver, 500, 1000); // Đợi tải trang

    // Tạo mới 1 nhân viên
    await employeePage.clickCreateEmployee();
    await humanDelay(driver, 300, 500);

    const uniqueEmail = `new.employee.${Date.now()}@example.com`;
    await employeePage.fillCreateEmployeeForm('Nhân viên mới từ Admin Workflow', uniqueEmail, '0123456789', '123 Đường ABC, TP HCM', '1995-01-01', '2026-06-01');

    let generatedPassword = 'password';
    try {
      const successMsg = await driver.wait(until.elementLocated(By.xpath('//p[contains(text(), "Đã tạo nhân viên thành công")]')), 10000);
      expect(await successMsg.isDisplayed()).toBeTruthy();
      generatedPassword = await employeePage.getGeneratedPassword();
    } catch (e) {
      const errorEls = await driver.findElements(By.css('.text-destructive'));
      if (errorEls.length > 0) {
        const errText = await errorEls[0].getText();
        throw new Error(`Form submission failed with error: ${errText}`);
      }
      throw e;
    }
    await humanDelay(driver, 200, 500); // Đọc thông báo
    await employeePage.closeSuccessModal();

    // Lấy mã nhân viên vừa tạo
    await driver.get(`${getAppUrl()}/admin/employees`);
    await humanDelay(driver, 200, 500);
    createdEmployeeCode = await employeePage.getEmployeeCodeByEmail(uniqueEmail);
    const credentialsPath = path.join(__dirname, '../helpers/temp_credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify({ username: createdEmployeeCode, password: generatedPassword }));
  });

  it('3. Bảng lương: Duyệt 1 phiếu lương', async () => {
    await payrollPage.navigateList();
    await humanDelay(driver);

    // Lọc theo phòng ban
    try {
      const deptFilter = await driver.wait(until.elementLocated(By.xpath('//select[contains(., "Tất cả phòng ban")]')), 1500);
      await driver.executeScript(`
        var select = arguments[0];
        if (select.options.length > 1) {
          select.selectedIndex = 2;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `, deptFilter);
      await humanDelay(driver, 500);
    } catch (e) { }
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
    } catch (e) { }

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
    await humanDelay(driver, 1000, 2000); // Cho page load hẳn và fetch API employees
    await simulateHumanScroll(driver, 400);

    // Cấp phép cho nhân viên vừa tạo (nếu có)
    if (createdEmployeeCode) {
      try {
        const empSelect = await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "Quản lý số dư phép (Admin)")]/following-sibling::div//select')), 5000);
        await driver.executeScript(`
          var select = arguments[0];
          var code = arguments[1];
          for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(code)) {
              select.selectedIndex = i;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        `, empSelect, createdEmployeeCode);
        await humanDelay(driver, 500);

        const initBalanceBtn = await driver.findElement(By.xpath('//button[contains(., "Khởi tạo phép")]'));
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", initBalanceBtn);
        await humanDelay(driver, 500);
        await initBalanceBtn.click();
        await humanDelay(driver, 500);

        const confirmInitBtn = await driver.wait(until.elementLocated(By.xpath('//div[contains(@class, "fixed inset-0")]//button[text()="Khởi tạo" or contains(., "Khởi tạo") and not(contains(., "phép"))]')), 2000);
        await driver.executeScript("arguments[0].click();", confirmInitBtn);
        await humanDelay(driver, 2000); // Đợi báo thành công
      } catch (e) {
        console.warn('Không thể khởi tạo phép cho nhân viên mới:', e);
      }
    }

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

    // Click "Khởi tạo vắng mặt" hoặc "Đánh vắng mặt"
    const markBtns = await driver.findElements(By.xpath('//button[contains(., "Khởi tạo") or contains(., "Đánh vắng mặt")]'));
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
