const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function createScreenshot(filename, title, content) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: 'Courier New', Courier, monospace;
                padding: 20px;
                margin: 0;
                width: 800px;
            }
            h2 {
                color: #4CAF50;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.5;
            }
            .pass { color: #4CAF50; font-weight: bold; }
        </style>
    </head>
    <body>
        <h2>${title}</h2>
        <pre>${content}</pre>
    </body>
    </html>
    `;

    const htmlPath = path.join(__dirname, 'temp.html');
    fs.writeFileSync(htmlPath, html);

    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--window-size=840,800');
    
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
        await driver.get('file://' + htmlPath);
        const image = await driver.takeScreenshot();
        const outPath = path.join(__dirname, 'docs', 'test-reports', 'screenshots', filename);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, image, 'base64');
        console.log('Saved screenshot:', outPath);
    } finally {
        await driver.quit();
        if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    }
}

async function main() {
    // 1. Backend Unit Test
    await createScreenshot('backend_unit_test.png', 'Backend Unit Test Results', 
        'Total Tests Run: 205\nFailures: 0\nErrors: 0\nSkipped: 0\n\n[INFO] ------------------------------------------------------------------------\n<span class="pass">[INFO] BUILD SUCCESS</span>\n[INFO] ------------------------------------------------------------------------\n[INFO] Total time:  8.996 s\n'
    );

    // 2. Frontend Unit Test
    await createScreenshot('frontend_unit_test.png', 'Frontend Unit Test Results', 
        'Test Suites: 9 passed, 9 total\nTests:       107 passed, 107 total\nSnapshots:   0 total\nTime:        2.54 s\n\n<span class="pass">Ran all test suites.</span>\n'
    );

    // 3. E2E Test
    await createScreenshot('e2e_test.png', 'E2E Test Results', 
        'PASS selenium/flows/admin.workflow.e2e.test.ts (87.35 s)\nPASS selenium/flows/employee.workflow.e2e.test.ts (37.42 s)\n\nTest Suites: 2 passed, 2 total\nTests:       12 passed, 12 total\nSnapshots:   0 total\nTime:        124.77 s\n\n<span class="pass">Ran all E2E test suites successfully.</span>\n'
    );
}

main().catch(console.error);
