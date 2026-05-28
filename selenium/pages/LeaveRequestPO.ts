import { By, WebDriver, until } from 'selenium-webdriver';
import { getAppUrl } from '../helpers/base';

export class LeaveRequestPO {
  constructor(private driver: WebDriver) {}

  async navigate() {
    await this.driver.get(`${getAppUrl()}/admin/leave/requests`);
  }

  async navigateAdmin() {
    await this.driver.get(`${getAppUrl()}/admin/attendance/leave-request`);
  }

  async navigateEmployee(userId: number) {
    await this.driver.get(`${getAppUrl()}/employees/${userId}/attendance/leave-request`);
  }

  async clickCreateLeave() {
    const btn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(., "Tạo đơn nghỉ mới")] | //button[contains(., "Tạo đơn mới")]')), 5000);
    await btn.click();
  }

  async fillCreateLeaveForm(startDate: string, endDate: string, reason: string) {
    const startDateInput = await this.driver.wait(until.elementLocated(By.xpath('//label[text()="Từ ngày"]/following-sibling::input')), 5000);
    await startDateInput.sendKeys(startDate);

    const endDateInput = await this.driver.findElement(By.xpath('//label[text()="Đến ngày"]/following-sibling::input'));
    await endDateInput.sendKeys(endDate);

    const reasonInput = await this.driver.findElement(By.xpath('//label[text()="Lý do"]/following-sibling::input'));
    await reasonInput.sendKeys(reason);

    const submitBtn = await this.driver.findElement(By.xpath('//button[contains(., "Gửi đơn")] | //button[@type="submit"]'));
    await submitBtn.click();
  }

  async approveFirstRequest() {
    const btn = await this.driver.wait(until.elementLocated(By.xpath('//button[text()="Duyệt"] | //button[@title="Duyệt"]')), 5000);
    await btn.click();
  }
}
