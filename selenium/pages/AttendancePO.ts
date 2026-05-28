import { By, WebDriver, until } from 'selenium-webdriver';
import { getAppUrl } from '../helpers/base';

export class AttendancePO {
  constructor(private driver: WebDriver) {}

  async navigateDaily() {
    await this.driver.get(`${getAppUrl()}/admin/attendance/daily`);
  }

  async navigateMonthly() {
    await this.driver.get(`${getAppUrl()}/admin/attendance/monthly`);
  }

  async checkIn() {
    const btn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Check In")]')), 5000);
    await btn.click();
  }

  async checkOut() {
    const btn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(text(), "Check Out")]')), 5000);
    await btn.click();
  }
}
