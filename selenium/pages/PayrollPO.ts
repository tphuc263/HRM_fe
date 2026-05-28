import { By, WebDriver, until } from 'selenium-webdriver';
import { getAppUrl } from '../helpers/base';

export class PayrollPO {
  constructor(private driver: WebDriver) {}

  async navigateList() {
    await this.driver.get(`${getAppUrl()}/admin/payroll/manage`);
  }

  async navigateMyPayroll(userId: number) {
    await this.driver.get(`${getAppUrl()}/employees/${userId}/payroll/my-salary`);
  }

  async generatePayroll() {
    const openBtn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(., "Tạo bảng lương tháng")]')), 5000);
    await openBtn.click();
    
    // Modal submit button
    const submitBtn = await this.driver.wait(until.elementLocated(By.xpath('//form//button[contains(., "Tạo bảng lương") and @type="submit"]')), 5000);
    await submitBtn.click();
  }

  async verifyPayrollListLoaded() {
    const tableRows = await this.driver.wait(until.elementsLocated(By.css('tbody tr')), 5000);
    return tableRows.length > 0;
  }
}
