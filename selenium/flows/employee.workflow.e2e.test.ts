import { WebDriver, By, until } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';
import { setupDriver, teardownDriver, clearSession, getAppUrl } from '../helpers/base';
import { LoginPO } from '../pages/LoginPO';
import { LeaveRequestPO } from '../pages/LeaveRequestPO';
import { PayrollPO } from '../pages/PayrollPO';
import { simulateHumanScroll, simulateHumanScrollUp, humanDelay, humanType } from '../helpers/human';

describe('Employee Workflow E2E Test', () => {
  let driver: WebDriver;
  let loginPage: LoginPO;
  let leavePage: LeaveRequestPO;
  let payrollPage: PayrollPO;
  let userId = 2; // Default fallback

  beforeAll(async () => {
    driver = await setupDriver();
    loginPage = new LoginPO(driver);
    leavePage = new LeaveRequestPO(driver);
    payrollPage = new PayrollPO(driver);
  });

  afterAll(async () => {
    await clearSession(driver);
    await teardownDriver(driver);
  });

  it('1. Đăng nhập và xem Dashboard', async () => {
    await loginPage.navigate();
    await humanDelay(driver);
    
    let usernameToLogin = 'emp00015';
    try {
      const credsPath = path.join(__dirname, '../helpers/temp_credentials.json');
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (creds.username) {
          usernameToLogin = creds.username;
        }
      }
    } catch (e) {}

    await loginPage.login(usernameToLogin, 'password');
    await loginPage.waitForEmployeeDashboard();

    // Extract user id from url if possible
    const currentUrl = await driver.getCurrentUrl();
    const match = currentUrl.match(/\/employees\/(\d+)\//);
    if (match) {
      userId = parseInt(match[1]);
    }

    await simulateHumanScroll(driver, 500);
    await simulateHumanScrollUp(driver, 300);
  });

  it('2. Chấm công: Check-in / Check-out', async () => {
    await driver.get(`${getAppUrl()}/employees/${userId}/attendance/daily`);
    await humanDelay(driver);
    
    // Thử bấm Check-in (nếu có)
    const checkinBtns = await driver.findElements(By.xpath('//button[contains(., "Check in") or contains(., "Chấm công vào")]'));
    if (checkinBtns.length > 0 && await checkinBtns[0].isEnabled()) {
      await checkinBtns[0].click();
      await humanDelay(driver, 1000, 1500);
    }

    // Thử bấm Check-out (nếu có)
    const checkoutBtns = await driver.findElements(By.xpath('//button[contains(., "Check out") or contains(., "Chấm công ra")]'));
    if (checkoutBtns.length > 0 && await checkoutBtns[0].isEnabled()) {
      await checkoutBtns[0].click();
      await humanDelay(driver, 1000, 1500);
    }
  });

  it('3. Đăng ký tăng ca', async () => {
    await driver.get(`${getAppUrl()}/employees/${userId}/attendance/overtime`);
    await humanDelay(driver);
    
    const createBtn = await driver.wait(until.elementLocated(By.xpath('//button[contains(., "Đăng ký tăng ca") or contains(., "Tạo mới")]')), 5000);
    await createBtn.click();
    await humanDelay(driver);

    // Điền form tăng ca (thử điền ngày và số giờ)
    const dateInput = await driver.findElement(By.xpath('//input[@type="date"] | //label[contains(text(), "Ngày")]/following-sibling::input'));
    await driver.executeScript(`
      var input = arguments[0];
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "2026-06-05");
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `, dateInput);

    // Không có input số giờ, form sử dụng startTime và endTime mặc định
    // Chỉ cần điền lý do
    const reasonInput = await driver.findElement(By.xpath('//textarea[contains(@placeholder, "lý do")] | //label[contains(text(), "Lý do")]/following-sibling::textarea'));
    await humanType(driver, reasonInput, 'OT E2E Test');

    const submitBtn = await driver.findElement(By.xpath('//form//button[@type="submit" and (contains(., "Gửi") or contains(., "Tạo") or contains(., "Lưu"))]'));
    await submitBtn.click();
    
    await humanDelay(driver, 1500, 2000);
  });

  it('4. Đơn xin nghỉ: Tạo đơn mới & Filter', async () => {
    await leavePage.navigateEmployee(userId);
    await humanDelay(driver);
    
    // Thử filter
    const statusSelect = await driver.wait(until.elementLocated(By.xpath('//select | //button[contains(., "Trạng thái")]')), 5000);
    await statusSelect.click(); // giả vờ bấm dropdown nếu có
    await humanDelay(driver, 500, 1000);

    // Tạo đơn nghỉ mới
    await leavePage.clickCreateLeave();
    await humanDelay(driver);
    
    // Vì LeaveRequestPO sử dụng hàm sendKeys cho date, ta có thể cần override nếu nó không bắt event.
    // Dùng xpath nội bộ của LeaveRequestPO:
    const startDateInput = await driver.wait(until.elementLocated(By.xpath('//label[text()="Từ ngày"]/following-sibling::input')), 5000);
    await driver.executeScript(`
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(arguments[0], "2026-06-10");
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `, startDateInput);

    const endDateInput = await driver.findElement(By.xpath('//label[text()="Đến ngày"]/following-sibling::input'));
    await driver.executeScript(`
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(arguments[0], "2026-06-11");
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `, endDateInput);

    const reasonInput = await driver.findElement(By.xpath('//label[text()="Lý do"]/following-sibling::input'));
    await humanType(driver, reasonInput, 'Nghỉ việc riêng E2E');

    const submitBtn = await driver.findElement(By.xpath('//button[contains(., "Gửi đơn")] | //button[@type="submit"]'));
    await submitBtn.click();
    
    await humanDelay(driver, 2000, 3000);
  });

  it('5. Phiếu lương: Xem và thử tải về', async () => {
    await payrollPage.navigateMyPayroll(userId);
    await humanDelay(driver);
    await simulateHumanScroll(driver, 600);
    
    // Thử bấm Tải PDF (nếu có phiếu lương)
    const downloadBtns = await driver.findElements(By.xpath('//button[contains(., "Tải PDF") or contains(., "Download")]'));
    if (downloadBtns.length > 0) {
      await downloadBtns[0].click();
      await humanDelay(driver, 2000, 3000); // Đợi file tải
    }
    
    await simulateHumanScrollUp(driver, 400);
  });
});
