const puppeteer = require("puppeteer");
const config = require('./helpers/config');
const fs = require("fs");

const iframe_selector = "body > div.container > div.content > div.block-video > div > div.player > div > div > iframe" // Direct selector for the iframe
// Use Chrome dig down and right click copy selector to find exact match

let page;
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        // slowMo: 50,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // Video content requires full version of Chrome
        args: [
            `--window-size=${2300}, ${1300}`,
            "--disable-features=site-per-process" // Disables some security features interfering with loading iframes
        ]
    });

    page = (await browser.pages())[0];

    await page.setDefaultNavigationTimeout(0);
    await page.setUserAgent(config.user_agent);
    await page.setViewport({ width: 1080, height: 720 });

    let srcs = []; // Push src attributes into array
    for (let i = 0; i < config.entry.length; i++) {
        console.log(`Scraping link ${i} of ${config.entry.length}`)

        await page.goto(config.entry[i], { waitUntil: 'networkidle0' }); // Important to wait or HTML not 100% loaded
        console.log("\tNetwork is idle.");

        await page.waitFor(500);
        console.log("\tTimer finished.");

        await page.waitForSelector(iframe_selector);
        console.log("\tiFrame loaded.")

        const urlSelector = "#kt_player > div.fp-player > video"; // Direct selector of video content INSIDE the iframe

        await page.waitForSelector(iframe_selector);
        const iframeElement = await page.$(iframe_selector); // Retrieving an iframe element to then evaluate inside the iframe as a sort of new DOM
        const frame = await iframeElement.contentFrame(); // Retrieve as "new" DOM

        await frame.waitForSelector(urlSelector);
        srcs.push(await frame.$eval(urlSelector, element => element.src)); // Get src attributes and push
    };

    console.log(srcs); // Print just in case

    fs.writeFile("links.json", JSON.stringify(srcs), function (err) {
        if (err) {
            return console.log(err);
        } else {
            console.log("Wrote link to > links.json");
        }
    });
})();
