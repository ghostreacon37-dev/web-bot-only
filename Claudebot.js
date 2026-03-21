/**
 * ghost-tester-ultra.js
 * * DESIGNED FOR: 
 * - Infinite Looping: Runs until Ctrl+C.
 * - Ad-Engagement: Triggers pop-unders and interacts with them.
 * - 2026 Flagship Rotation: S24 Ultra, iPhone 16 Pro Max, Pixel 9 Pro.
 * - Stealth: Bypasses common bot-detection via puppeteer-extra-stealth.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

/* ---------- Configuration ---------- */
const TARGET_URL = "https://learnblogs.online";
const REFERRER_URL = "https://x.com/GhostReacondev/status/2024921591520641247";

const DEVICE_LIBRARY = [
    { name: 'Samsung S24 Ultra', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', vw: { width: 412, height: 915 } },
    { name: 'iPhone 16 Pro Max', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1', vw: { width: 440, height: 956 } },
    { name: 'Google Pixel 9 Pro', ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', vw: { width: 412, height: 892 } },
    { name: 'Windows 11 Home - Chrome', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', vw: { width: 1920, height: 1080 } }
];

/* ---------- Human Simulation Engine ---------- */
const HumanEngine = {
    async moveNatural(page, x, y) {
        const steps = Math.floor(Math.random() * 20) + 10;
        try { await page.mouse.move(x, y, { steps }); } catch(e) {}
    },
    async humanScroll(page) {
        const distance = Math.floor(Math.random() * 500) + 150;
        await page.evaluate((d) => window.scrollBy(0, d), distance).catch(()=>{});
        await new Promise(r => setTimeout(r, Math.random() * 1000 + 500));
    },
    async microPause() {
        const ms = Math.random() * 3000 + 1000;
        return new Promise(r => setTimeout(r, ms));
    }
};

class GhostBot {
    constructor() {
        this.keepRunning = true;
        this.targetHost = new URL(TARGET_URL).hostname;
    }

    async run() {
        console.log(`🚀 Starting Ghost-Tester Ultra for: ${this.targetHost}`);
        console.log(`🛑 Press Ctrl+C to stop the loop manually.\n`);

        while (this.keepRunning) {
            await this.executeSession();
            if (this.keepRunning) {
                const interval = Math.floor(Math.random() * 15000) + 10000;
                console.log(`😴 Cool-down: Sleeping for ${interval/1000}s...`);
                await new Promise(r => setTimeout(r, interval));
            }
        }
        process.exit(0);
    }

    async executeSession() {
        const dev = DEVICE_LIBRARY[Math.floor(Math.random() * DEVICE_LIBRARY.length)];
        const profileDir = path.join('/tmp', `ghost_ultra_${Date.now()}`);
        
        const browser = await puppeteer.launch({
            headless: false,
            userDataDir: profileDir,
            args: [
                '--no-sandbox',
                '--disable-popup-blocking', // CRITICAL for Pop-under Ads
                `--window-size=${dev.vw.width},${dev.vw.height}`
            ]
        });

        try {
            const [page] = await browser.pages();
            await page.setUserAgent(dev.ua);
            await page.setViewport(dev.vw);

            // 1. Enter via Referrer (X/Twitter)
            console.log(`🔗 Navigating to Referrer: ${REFERRER_URL}`);
            await page.goto(REFERRER_URL, { waitUntil: 'networkidle2', timeout: 60000 });
            await HumanEngine.humanScroll(page);

            // 2. Locate and Click Link to Blog
            const el = await page.evaluateHandle((h) => {
                return Array.from(document.querySelectorAll('a')).find(a => a.href.includes(h));
            }, this.targetHost);

            if (el.asElement()) {
                const box = await el.asElement().boundingBox();
                if (box) {
                    await el.asElement().scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await HumanEngine.moveNatural(page, box.x + box.width/2, box.y + box.height/2);
                    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
                }
            } else {
                await page.goto(TARGET_URL, { referer: REFERRER_URL });
            }

            // 3. Ad Triggering & Multi-Tab Engagement
            await new Promise(r => setTimeout(r, 8000));
            
            // Interaction Loop: Covers the Blog AND any Ads that popped under
            const sessionEnd = Date.now() + 120000; // 2 minute session
            while (Date.now() < sessionEnd && this.keepRunning) {
                const allPages = await browser.pages();
                
                for (const p of allPages) {
                    const url = p.url();
                    if (url === "about:blank" || url.startsWith('devtools://')) continue;

                    try {
                        // Force the ad (or blog) to the front to register "view"
                        await p.bringToFront();
                        
                        // If it's the blog page, click the body to ensure ad scripts fire
                        if (url.includes(this.targetHost)) {
                            console.log("🖱️ Engaging on Blog...");
                            await p.click('body').catch(() => {}); 
                        } else {
                            console.log("✅ Interacting with Ad/Pop-under...");
                        }

                        // Scroll naturally on whatever tab is active
                        await HumanEngine.humanScroll(p);
                        await HumanEngine.microPause();
                    } catch (e) { /* Tab closed */ }
                }
            }
            console.log("✅ Session Success.");

        } catch (err) {
            console.error("⚠️ Warning:", err.message);
        } finally {
            await browser.close().catch(() => {});
            if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
        }
    }
}

/* ---------- Execution ---------- */
const bot = new GhostBot();
process.on('SIGINT', () => bot.keepRunning = false);
bot.run();
