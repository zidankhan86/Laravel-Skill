import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});
try {
 for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:3002',{waitUntil:'domcontentloaded',timeout:60000});await page.locator('h1').waitFor();await page.waitForTimeout(4000);
  // Scroll through once to reveal viewport-triggered animations before full-page capture.
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}window.scrollTo(0,0);});await page.waitForTimeout(1000);
  await page.screenshot({path:`docs/screenshots/baseline-${name}.png`,fullPage:true});await page.close();
 }
} finally {await browser.close();}
