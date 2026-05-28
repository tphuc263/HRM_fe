import { By, WebDriver, until } from 'selenium-webdriver';
import { getAppUrl } from '../helpers/base';
import { humanType, humanDelay } from '../helpers/human';

export class EmployeePO {
  constructor(private driver: WebDriver) {}

  async navigate() {
    await this.driver.get(`${getAppUrl()}/admin/employees`);
  }

  async searchEmployee(keyword: string) {
    const searchInput = await this.driver.wait(until.elementLocated(By.css('input[placeholder*="Tìm kiếm"]')), 5000);
    await searchInput.clear();
    await searchInput.sendKeys(keyword);
    // Assuming it searches on type or has a search button. If button:
    // const btn = await this.driver.findElement(By.css('button[aria-label="Search"]'));
    // await btn.click();
  }

  async clickCreateEmployee() {
    const btn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(., "Thêm nhân viên")]')), 5000);
    await btn.click();
  }

  async fillCreateEmployeeForm(name: string, email: string, phone: string, address: string, birthday: string, joinDate: string) {
    // Wait for modal to open
    const modalTitle = await this.driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "Thêm nhân viên mới")]')), 5000);
    
    // Fill name
    const nameInput = await this.driver.findElement(By.xpath('//label[text()="Họ và tên"]/following-sibling::input'));
    await humanType(this.driver, nameInput, name);
    await humanDelay(this.driver, 200, 500);

    // Fill email
    const emailInput = await this.driver.findElement(By.xpath('//label[text()="Email"]/following-sibling::input'));
    await humanType(this.driver, emailInput, email);
    await humanDelay(this.driver, 200, 500);

    // Fill phone
    const phoneInput = await this.driver.findElement(By.xpath('//label[text()="Điện thoại"]/following-sibling::input'));
    await humanType(this.driver, phoneInput, phone);
    await humanDelay(this.driver, 200, 500);

    // Fill birthday
    const birthdayInput = await this.driver.findElement(By.xpath('//label[text()="Ngày sinh"]/following-sibling::input'));
    await this.driver.executeScript(`
      var input = arguments[0];
      var val = arguments[1];
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `, birthdayInput, birthday);

    // Fill join date
    const joinDateInput = await this.driver.findElement(By.xpath('//label[text()="Ngày vào làm"]/following-sibling::input'));
    await this.driver.executeScript(`
      var input = arguments[0];
      var val = arguments[1];
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `, joinDateInput, joinDate);

    // Select Department
    const departmentSelect = await this.driver.findElement(By.xpath('//label[text()="Phòng ban"]/following-sibling::select'));
    await this.driver.executeScript(`
      var select = arguments[0];
      if (select.options.length > 1) {
        select.selectedIndex = 1;
        var setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
        setter.call(select, select.options[1].value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `, departmentSelect);

    // Fill address
    const addressInput = await this.driver.findElement(By.xpath('//label[text()="Địa chỉ"]/following-sibling::input'));
    await humanType(this.driver, addressInput, address);
    await humanDelay(this.driver, 200, 500);

    // Submit
    const submitBtn = await this.driver.findElement(By.xpath('//button[contains(., "Thêm nhân viên") and @type="submit"]'));
    await submitBtn.click();
  }

  async closeSuccessModal() {
    const closeBtn = await this.driver.wait(until.elementLocated(By.xpath('//button[contains(., "Đóng")]')), 5000);
    await closeBtn.click();
  }

  async getEmployeeCodeByEmail(email: string): Promise<string> {
    const searchInput = await this.driver.wait(until.elementLocated(By.css('input[placeholder*="Tìm kiếm"]')), 5000);
    await searchInput.clear();
    await humanType(this.driver, searchInput, email);
    await humanDelay(this.driver, 1000, 1500); // Wait for debounce and API request

    const row = await this.driver.wait(until.elementLocated(By.xpath(`//tr[td[contains(text(), "${email}")]]`)), 10000);
    const codeCell = await row.findElement(By.xpath('./td[2]'));
    return await codeCell.getText();
  }

  async getGeneratedPassword(): Promise<string> {
    const pwdEl = await this.driver.wait(until.elementLocated(By.xpath('//p[contains(text(), "Mật khẩu mặc định:")]/strong')), 5000);
    return await pwdEl.getText();
  }
}
