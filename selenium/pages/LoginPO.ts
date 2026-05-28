import { By, WebDriver, until } from 'selenium-webdriver';
import { getAppUrl } from '../helpers/base';
import { sleep } from '../helpers/wait';
import { humanType, humanDelay } from '../helpers/human';

export class LoginPO {
  constructor(private driver: WebDriver) {}

  async navigate() {
    await this.driver.get(`${getAppUrl()}/login`);
  }

  async login(username: string, password: string) {
    const usernameInput = await this.driver.wait(until.elementLocated(By.css('input[placeholder="TÊN ĐĂNG NHẬP"]')), 5000);
    const passwordInput = await this.driver.wait(until.elementLocated(By.css('input[type="password"]')), 5000);
    const submitBtn = await this.driver.findElement(By.css('button[type="submit"]'));
    
    await sleep(500);
    await usernameInput.clear();
    await humanType(this.driver, usernameInput, username);
    
    await sleep(500);
    await passwordInput.clear();
    await humanType(this.driver, passwordInput, password);
    
    await sleep(500);
    await submitBtn.click();
    await sleep(1000);
  }

  async getErrorMessage(): Promise<string> {
    const el = await this.driver.wait(until.elementLocated(By.css('.text-red-300')), 5000);
    return el.getText();
  }

  async waitForDashboard() {
    await this.driver.wait(until.urlContains('/admin'), 10000);
  }

  async waitForEmployeeDashboard() {
    await this.driver.wait(until.urlContains('/employees'), 10000);
  }
}
