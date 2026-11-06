
const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testCarePlus() {
    let options = new chrome.Options().addArguments("--headless=new");

    let driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    try {
        await driver.get("http://localhost:3000");

        let title = await driver.getTitle();

        console.log("Page Title:", title);
        console.log("CarePlus Test Passed!");
    } catch (error) {
        console.log("Test Failed:", error.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
}

testCarePlus();
