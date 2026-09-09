const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `群昵称验证群-${Date.now()}`;
const NICKNAME = `群昵称-${Date.now()}`;
async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, {waitUntil:'domcontentloaded'}); await page.waitForTimeout(1800);
  if(phone) await page.getByPlaceholder('请输入手机号').fill(phone); if(password) await page.getByPlaceholder('请输入密码').fill(password);
  await page.getByRole('button',{name:'登录',exact:true}).click(); await page.waitForURL(/#\/messages/,{timeout:60000}); await page.waitForTimeout(1200);
}
(async()=>{const b=await chromium.launch({headless:true});const c1=await b.newContext(),c2=await b.newContext();const p1=await c1.newPage(),p2=await c2.newPage();
 await login(p1); await p1.goto(`${BASE_URL}/#/contact/create-group`); await p1.waitForTimeout(500); await p1.getByRole('button',{name:'suxia',exact:true}).last().click(); await p1.getByPlaceholder('群名称').fill(GROUP_NAME); await p1.getByRole('button',{name:/完成（1）/}).click(); await p1.waitForURL(/#\/contact\/groups/,{timeout:60000}); await p1.getByText(GROUP_NAME,{exact:true}).click();
 await p1.getByText('我的群昵称',{exact:true}).click(); await p1.getByPlaceholder('输入群昵称').fill(NICKNAME); await p1.getByRole('button',{name:'保存',exact:true}).last().click(); await p1.waitForTimeout(700);
 await login(p2,'13700137000','test123456'); await p2.getByText('linwan', {exact:true}).waitFor({state:'visible', timeout:45000}); await p2.goto(`${BASE_URL}/#/contact/groups`); await p2.getByText(GROUP_NAME,{exact:true}).click(); await p2.waitForTimeout(700);
 if(!await p2.getByText(NICKNAME,{exact:true}).count()) throw new Error('Group nickname did not reach another group member.');
 console.log('Group nickname persists and is visible to other members.'); await b.close();})().catch(e=>{console.error(e);process.exit(1)});
