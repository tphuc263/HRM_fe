import { WebDriver, By, until, WebElement } from 'selenium-webdriver';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for element to be located and visible
 */
export const waitForElement = async (driver: WebDriver, by: By, timeout = 10000): Promise<WebElement> => {
  const el = await driver.wait(until.elementLocated(by), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

/**
 * Wait for URL to contain specific string
 */
export const waitForUrl = async (driver: WebDriver, partialUrl: string, timeout = 10000) => {
  await driver.wait(until.urlContains(partialUrl), timeout);
};

/**
 * Wait for toast message to appear
 */
export const waitForToast = async (driver: WebDriver, text?: string, timeout = 5000) => {
  const toastContainer = By.css('.Toastify__toast-body'); // Assuming react-toastify or similar
  await waitForElement(driver, toastContainer, timeout);
  
  if (text) {
    // Wait until the text is inside the toast
    await driver.wait(async () => {
      const el = await driver.findElement(toastContainer);
      const content = await el.getText();
      return content.includes(text);
    }, timeout);
  }
};
