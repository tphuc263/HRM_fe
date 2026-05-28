import { WebDriver, By, until } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';
import { setupDriver, teardownDriver, clearSession, getAppUrl } from '../helpers/base';
import { LoginPO } from '../pages/LoginPO';
import { LeaveRequestPO } from '../pages/LeaveRequestPO';
import { PayrollPO } from '../pages/PayrollPO';
import { simulateHumanScroll, simulateHumanScrollUp, humanDelay, humanType } from '../helpers/human';

const API_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Helper: Call backend API to initialize leave balance for employee.
 * Uses admin credentials to get JWT, then calls POST /api/v1/leave-balances/init
 */
async function ensureLeaveBalanceInitialized(employeeId: number, year: number): Promise<void> {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    // 1. Login as admin to get JWT token
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass }),
    });
    if (!loginRes.ok) {
      console.warn('Failed to login as admin for leave init:', loginRes.status);
      return;
    }
    const loginData: any = await loginRes.json();
    const token = loginData.data?.accessToken || loginData.accessToken;
    if (!token) {
      console.warn('No token returned from admin login');
      return;
    }

    // 2. Call init balance API
    const initRes = await fetch(
      `${API_URL}/api/v1/leave-balances/init?employeeId=${employeeId}&year=${year}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (initRes.ok) {
      console.log(`Leave balance initialized for employee ${employeeId}, year ${year}`);
    } else {
      console.warn('Init balance API returned:', initRes.status, await initRes.text());
    }
  } catch (e) {
    console.warn('ensureLeaveBalanceInitialized error:', e);
  }
}

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
    await driver.executeScript("localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light');");
    await humanDelay(driver);

    let usernameToLogin = 'emp00015';
    let passwordToLogin = 'password';
    try {
      const credsPath = path.join(__dirname, '../helpers/temp_credentials.json');
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (creds.username) {
          usernameToLogin = creds.username;
        }
        if (creds.password) {
          passwordToLogin = creds.password;
        }
      }
    } catch (e) { }

    await loginPage.login(usernameToLogin, passwordToLogin);
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
    const checkinBtns = await driver.findElements(By.xpath('//button[contains(., "Check-in") or contains(., "Chấm công vào")]'));
    if (checkinBtns.length > 0 && await checkinBtns[0].isEnabled()) {
      await checkinBtns[0].click();
      await humanDelay(driver, 1000, 1500);
    }

    // Thử bấm Check-out (nếu có)
    const checkoutBtns = await driver.findElements(By.xpath('//button[contains(., "Check-out") or contains(., "Chấm công ra")]'));
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
    // Ensure leave balance is initialized for this employee before creating a leave request
    const currentYear = new Date().getFullYear();
    await ensureLeaveBalanceInitialized(userId, currentYear);
    // Also init for next year in case the leave date falls in the next year
    await ensureLeaveBalanceInitialized(userId, currentYear + 1);

    await leavePage.navigateEmployee(userId);
    await humanDelay(driver);

    // Thử filter
    const statusSelect = await driver.wait(until.elementLocated(By.xpath('//select | //button[contains(., "Trạng thái")]')), 5000);
    await statusSelect.click();
    await humanDelay(driver, 500, 1000);

    // Generate a unique future date to avoid "already have leave request in this period" error
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + 3);
    baseDate.setDate(baseDate.getDate() + (Date.now() % 20) + 1);
    // Ensure it's a weekday (Mon-Fri) — backend rejects weekend leave requests
    const dayOfWeek = baseDate.getDay();
    if (dayOfWeek === 0) baseDate.setDate(baseDate.getDate() + 1);
    if (dayOfWeek === 6) baseDate.setDate(baseDate.getDate() + 2);
    const leaveDate = baseDate.toISOString().split('T')[0];
    console.log('Using leave date:', leaveDate);

    // Tạo đơn nghỉ mới - click "Tạo đơn nghỉ mới" button
    await leavePage.clickCreateLeave();
    await humanDelay(driver, 1000, 1500);

    // Verify modal is open
    const modalTitle = await driver.wait(until.elementLocated(By.xpath('//h3[text()="Tạo đơn xin nghỉ mới"]')), 5000);
    expect(await modalTitle.isDisplayed()).toBeTruthy();

    // Helper to set React controlled input value by directly invoking React's onChange handler
    const setReactInputValue = async (xpath: string, value: string) => {
      const input = await driver.wait(until.elementLocated(By.xpath(xpath)), 5000);
      await driver.executeScript(`
        var input = arguments[0];
        var value = arguments[1];

        // Set the DOM value
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, value);

        // Method 1: Directly invoke React's onChange via __reactProps$
        var reactPropsKey = Object.keys(input).find(function(k) { return k.startsWith('__reactProps$'); });
        if (reactPropsKey && input[reactPropsKey] && input[reactPropsKey].onChange) {
          input[reactPropsKey].onChange({ target: input, currentTarget: input });
          return 'reactProps';
        }

        // Method 2: Fallback with tracker reset + native events
        var tracker = input._valueTracker;
        if (tracker) { tracker.setValue(''); }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return 'fallback';
      `, input, value);
      await humanDelay(driver, 300, 500);
    };

    // Fill in dates within the modal
    await setReactInputValue('//h3[text()="Tạo đơn xin nghỉ mới"]/ancestor::div[contains(@class,"fixed")]//label[text()="Từ ngày"]/following-sibling::input', leaveDate);
    await setReactInputValue('//h3[text()="Tạo đơn xin nghỉ mới"]/ancestor::div[contains(@class,"fixed")]//label[text()="Đến ngày"]/following-sibling::input', leaveDate);

    // Fill reason
    const reasonInput = await driver.findElement(By.xpath('//h3[text()="Tạo đơn xin nghỉ mới"]/ancestor::div[contains(@class,"fixed")]//label[text()="Lý do"]/following-sibling::input'));
    await humanType(driver, reasonInput, 'Nghỉ việc riêng E2E');

    await humanDelay(driver, 500, 800);

    // Click submit button inside the modal
    const submitBtn = await driver.findElement(By.xpath('//h3[text()="Tạo đơn xin nghỉ mới"]/ancestor::div[contains(@class,"fixed")]//button[contains(., "Gửi đơn")]'));
    await submitBtn.click();

    // Wait for success: either toast OR modal closes (both indicate success)
    // On success, the modal closes (setShowCreateForm(false)) and toast appears
    let success = false;
    try {
      await driver.wait(async () => {
        // Check if modal closed = success
        const modals = await driver.findElements(By.xpath('//h3[text()="Tạo đơn xin nghỉ mới"]'));
        if (modals.length === 0) {
          success = true;
          return true;
        }
        // Check for success toast
        const toasts = await driver.findElements(By.xpath('//*[contains(@class, "Toastify")]//div[contains(text(), "thành công")]'));
        if (toasts.length > 0) {
          success = true;
          return true;
        }
        return false;
      }, 10000);
    } catch (e) {
      // On failure, gather debug info
      const debugInfo: string[] = [];
      try {
        const toastHtml = await driver.executeScript('var el = document.querySelector(".Toastify"); return el ? el.innerHTML : "NO TOASTIFY CONTAINER";') as string;
        debugInfo.push('Toast HTML: ' + toastHtml.substring(0, 500));
      } catch { /* ignore */ }
      try {
        const errorEls = await driver.findElements(By.css('.text-destructive'));
        for (const el of errorEls) {
          debugInfo.push('Error text: ' + await el.getText());
        }
      } catch { /* ignore */ }
      try {
        const modalStillOpen = await driver.findElements(By.xpath('//h3[text()="Tạo đơn xin nghỉ mới"]'));
        debugInfo.push('Modal still open: ' + (modalStillOpen.length > 0));
      } catch { /* ignore */ }

      throw new Error(`Leave Request failed. Debug info:\n${debugInfo.join('\n')}`);
    }

    expect(success).toBeTruthy();
    await humanDelay(driver, 500, 1000);
  });

  it('5. Phiếu lương: Xem và thử tải về', async () => {
    await payrollPage.navigateMyPayroll(userId);
    await humanDelay(driver);
    await simulateHumanScroll(driver, 600);

    // Thử bấm Tải PDF (nếu có phiếu lương)
    const downloadBtns = await driver.findElements(By.xpath('//button[contains(., "Tải PDF") or contains(., "Download")]'));
    if (downloadBtns.length > 0) {
      await downloadBtns[0].click();
      await humanDelay(driver, 1000, 2000); // Đợi file tải
    }

    await simulateHumanScrollUp(driver, 400);
  });
});
