// Creates one independent email/phone test account. Sends one verification email.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const base = process.env.CHAT_API || 'https://999.99chat99.com/chat';
const fixture = process.env.PHONE_TEST_FIXTURE;
assert.ok(fixture && process.env.TEST_FIXTURES && process.env.TEST_CODE_READER);
async function post(path, body, token) {
  return (await fetch(`${base}${path}`, {method:'POST',headers:{'Content-Type':'application/json',operationID:randomUUID(),...(token?{token}:{})},body:JSON.stringify(body)})).json();
}
async function ok(path, body, token) {
  const r = await post(path, body, token); assert.equal(r.errCode, 0, r.errMsg); return r.data;
}
const old = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES))[1];
const login = await ok('/account/login',{email:old.email,password:old.password,platform:5});
const before = await ok('/user/contact/get',{},login.chatToken);
let user;
if (fs.existsSync(fixture)) user = JSON.parse(fs.readFileSync(fixture));
else {
  const stamp = Date.now();
  const email = `ziying406+99chatqa${stamp}-8@gmail.com`;
  const contact = {areaCode:'+86',phoneNumber:`199${String(stamp).slice(-8)}`};
  const password = randomUUID();
  await ok('/account/code/send',{email,usedFor:1});
  const verifyCode = execFileSync(process.env.TEST_CODE_READER,[email],{encoding:'utf8'}).trim();
  const auth = await ok('/account/register',{platform:5,autoLogin:true,verifyCode,contact,user:{email,password,nickname:'unique-phone-qa'}});
  user = {...auth,email,password,contact};
  fs.writeFileSync(fixture,JSON.stringify(user),{mode:0o600});
}
const auth = await ok('/account/login',{email:user.email,password:user.password,platform:5});
assert.deepEqual(await ok('/user/contact/get',{},auth.chatToken),{...user.contact,email:user.email});
const attemptedEmail = `ziying406+99chatqa${Date.now()}-9@gmail.com`;
for (const areaCode of ['+86','+086']) {
  const r=await post('/account/register',{platform:5,autoLogin:false,verifyCode:'invalid',contact:{...user.contact,areaCode},user:{email:attemptedEmail,password:'unused',nickname:'duplicate-phone-must-not-create'}});
  assert.equal(r.errCode,20003,'A different email cannot reuse the phone');
}
assert.equal((await post('/account/register',{platform:5,verifyCode:'invalid',user:{email:attemptedEmail,...user.contact,password:'unused',nickname:'duplicate-phone-must-not-create'}})).errCode,20003,'Legacy user.phoneNumber input must also enforce uniqueness');
assert.equal((await post('/user/contact/save',user.contact,login.chatToken)).errCode,20003);
assert.deepEqual(await ok('/user/contact/get',{},login.chatToken),before,'Rejected phone change must keep original profile');
await ok('/user/contact/save',user.contact,auth.chatToken); // Same owner may save again.
// Invalid verification must release reservations, so the second request reaches OTP validation again.
const available = {areaCode:'+86',phoneNumber:`198${String(Date.now()).slice(-8)}`};
const failures=await Promise.all(Array.from({length:2},(_,i)=>post('/account/register',{platform:5,verifyCode:'invalid',contact:available,user:{email:`ziying406+99chatqa${Date.now()}-${i+20}@gmail.com`,password:'unused',nickname:'failed-phone-reservation'}})));
assert.ok(failures.every(r=>r.errCode===20003 || r.errCode===20007),'Concurrent requests must be rejected by phone uniqueness or OTP verification');
assert.ok(failures.some(r=>r.errCode===20007),'The winner must reach OTP verification');
const again=await post('/account/register',{platform:5,verifyCode:'invalid',contact:available,user:{email:attemptedEmail,password:'unused',nickname:'failed-phone-reservation'}});
assert.equal(again.errCode,20007,'Failed registration must release its reserved phone');
fs.writeFileSync(`${fixture}.result`,JSON.stringify({userID:user.userID,contact:user.contact,attemptedEmail,available,passed:true}),{mode:0o600});
console.log('PASS: registration persists optional phone; other email and profile reuse rejected; concurrent reservation and failure cleanup verified');
