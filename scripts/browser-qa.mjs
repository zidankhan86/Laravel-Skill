import {chromium,expect} from '@playwright/test';
import {randomUUID,randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {pool,query} from '../server/db.mjs';
if(!process.env.DB_NAME?.endsWith('_test'))throw Error('Isolated database required');
const owner=randomUUID(),email=owner+'@example.test',password=randomBytes(20).toString('hex');
await query('INSERT INTO users(id,email,password_hash) VALUES (?,?,?)',[owner,email,await bcrypt.hash(password,12)]);
const b=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});const errors=[];const slug='browser-'+randomUUID();
try{
 for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await b.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000',{waitUntil:'domcontentloaded'});await expect(page.locator('h1')).toContainText('Md Tanvir Hossain');await page.waitForTimeout(1800);
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}window.scrollTo(0,0);});await page.waitForTimeout(600);
 await page.screenshot({path:`docs/screenshots/cms-${name}.png`,fullPage:true});
 if(name==='mobile'){await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.getByRole('button',{name:'Close navigation'})).toBeVisible();await page.getByRole('button',{name:'Close navigation'}).click();}
 await page.goto('http://localhost:3000/blog',{waitUntil:'domcontentloaded'});await expect(page.getByText('No articles published yet. Please check back soon.')).toBeVisible();
 await page.goto('http://localhost:3000/services',{waitUntil:'domcontentloaded'});await expect(page.locator('h1')).toContainText('Expert Services');await page.reload();await expect(page.locator('h1')).toContainText('Expert Services');
 await page.close();
 }
 const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/admin',{waitUntil:'domcontentloaded'});await p.getByLabel('Email',{exact:true}).fill(email);await p.getByLabel('Password',{exact:true}).fill(password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await expect(p.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();await p.screenshot({path:'docs/screenshots/admin-desktop.png',fullPage:true});
 await p.getByRole('button',{name:'Services',exact:true}).click();await p.getByRole('button',{name:'Create',exact:true}).click();await p.getByLabel('Title',{exact:true}).fill('Browser QA service');await p.getByLabel('Slug',{exact:true}).fill(slug);await p.getByLabel('Summary',{exact:true}).fill('বাংলা browser QA');await p.getByLabel('Status',{exact:true}).selectOption('published');await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.getByText('Saved',{exact:true})).toBeVisible();
 const detail=await b.newPage();await detail.goto('http://localhost:3000/services/'+slug,{waitUntil:'domcontentloaded'});await expect(detail.locator('h1')).toHaveText('Browser QA service');await expect(detail.getByText('বাংলা browser QA')).toBeVisible();await detail.close();
 await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Admin menu',exact:false}).click();await expect(p.getByRole('button',{name:'Account & Security',exact:true})).toBeVisible();await p.screenshot({path:'docs/screenshots/admin-mobile.png',fullPage:true});
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));console.log('Browser QA passed: desktop/mobile, navigation, refresh, blog empty state, admin login and service publish → public detail.');
}finally{await b.close();await query('DELETE FROM content WHERE slug=? AND collection=?',[slug,'services']);await query('DELETE FROM users WHERE id=?',[owner]);await pool.end();}
