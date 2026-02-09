const { chromium } = require('playwright');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HOMEPAGE_URL = 'https://extranet.infarmed.pt/INFOMED-fo/';

async function createBrowserContext(options = {}) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    acceptDownloads: true,
    ...options
  });
  const page = await context.newPage();
  return { browser, context, page };
}

async function gotoHomepage(page) {
  await page.goto(HOMEPAGE_URL, { waitUntil: 'domcontentloaded' });
}

module.exports = {
  createBrowserContext,
  gotoHomepage
};
