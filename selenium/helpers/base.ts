import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export const setupDriver = async (): Promise<WebDriver> => {
  const options = new chrome.Options();
  
  // You can run headless in CI
  if (process.env.HEADLESS === 'true') {
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
    
  await driver.manage().window().maximize();
  
  // Define default implicit wait
  await driver.manage().setTimeouts({ implicit: 5000 });

  return driver;
};

export const teardownDriver = async (driver: WebDriver) => {
  if (driver) {
    await driver.quit();
  }
};

export const clearSession = async (driver: WebDriver) => {
  if (driver) {
    try {
      await driver.manage().deleteAllCookies();
      await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
    } catch (e) {
      // Ignore errors if trying to clear session when page is not fully loaded or on about:blank
      console.warn('Failed to clear session', e);
    }
  }
};

export const getAppUrl = () => APP_URL;
