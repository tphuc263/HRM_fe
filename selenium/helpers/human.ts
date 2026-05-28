import { WebDriver } from 'selenium-webdriver';

/**
 * Creates a random delay between min and max milliseconds to simulate human reading/thinking time.
 * @param driver The WebDriver instance
 * @param min Minimum delay in ms (default: 1000)
 * @param max Maximum delay in ms (default: 2500)
 */
export async function humanDelay(driver: WebDriver, min: number = 1000, max: number = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  await driver.sleep(delay);
}

/**
 * Simulates a human scrolling down the page.
 * @param driver The WebDriver instance
 * @param pixels The amount of pixels to scroll (default: 500)
 */
export async function simulateHumanScroll(driver: WebDriver, pixels: number = 500) {
  // Smoothly scroll down
  await driver.executeScript(`
    window.scrollBy({
      top: arguments[0],
      behavior: 'smooth'
    });
  `, pixels);
  // Wait for the scroll to finish and user to "read"
  await humanDelay(driver, 800, 1000);
}

/**
 * Simulates a human scrolling up the page.
 * @param driver The WebDriver instance
 */
export async function simulateHumanScrollUp(driver: WebDriver, pixels: number = 500) {
  await driver.executeScript(`
    window.scrollBy({
      top: -arguments[0],
      behavior: 'smooth'
    });
  `, pixels);
  await humanDelay(driver, 1000, 1500);
}

/**
 * Simulates human typing.
 * @param driver The WebDriver instance
 * @param element The input element to type into
 * @param text The text to type
 */
export async function humanType(driver: WebDriver, element: any, text: string) {
  for (const char of text) {
    await element.sendKeys(char);
    await driver.sleep(Math.floor(Math.random() * 100) + 40); // 50-150ms per char
  }
}
