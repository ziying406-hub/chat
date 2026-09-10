import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Local isolated fixtures only: no admin token, no production URL override.
const API = 'http://localhost:10002';
const CHAT = 'http://localhost:10008';
const pagination = { pageNumber: 1, showNumber: 100 };
let checks = 0;
const findings = [];
async function request(base, path, body, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', operationID: randomUUID(), ...(token ? { token } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200, `${path}: HTTP transport failure`);
  return response.json();
}
async function ok(user, path, body) {
  const result = await request(API, `/group/${path}`, body, user.imToken);
  assert.equal(result.errCode, 0, `${path}: ${result.errMsg} ${result.errDlt || ''}`);
  return result.data;
}
async function account(index) {
  const phoneNumber = `139${String(Date.now()).slice(-7)}${index}`;
  const result = await request(CHAT, '/account/register', {
    verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
    user: { areaCode: '+86', phoneNumber, password: randomUUID(), nickname: `permission-api-${index}` },
  });
  assert.equal(result.errCode, 0, `fixture registration: ${result.errMsg}`);
  return result.data;
}
assert.ok(process.env.TEST_VERIFY_CODE, 'Set TEST_VERIFY_CODE to the local test verification code');
const [owner, admin, member, outsider] = await Promise.all([0, 1, 2, 3].map(account));
let groupID;
let currentOwner = owner;
async function state() {
  const group = (await ok(currentOwner, 'get_groups_info', { groupIDs: [groupID] })).groupInfos[0];
  const { members } = await ok(currentOwner, 'get_group_member_list', { groupID, pagination, filter: 0 });
  const { groupRequests = [] } = await ok(currentOwner, 'get_recv_group_applicationList', { fromUserID: currentOwner.userID, pagination });
  return {
    group: { name: group.groupName, notification: group.notification, introduction: group.introduction,
      faceURL: group.faceURL, needVerification: group.needVerification, owner: group.ownerUserID, status: group.status },
    members: members.map(m => ({ id: m.userID, role: m.roleLevel, nickname: m.nickname, mute: m.muteEndTime })).sort((a, b) => a.id.localeCompare(b.id)),
    requests: groupRequests.filter(r => r.groupInfo.groupID === groupID).map(r => ({ id: r.userInfo.userID, result: r.handleResult })).sort((a, b) => a.id.localeCompare(b.id)),
  };
}
async function denied(label, user, path, body) {
  const before = await state();
  const result = await request(API, `/group/${path}`, body, user?.imToken);
  if (result.errCode === 0) {
    const changed = JSON.stringify(await state()) !== JSON.stringify(before);
    findings.push(label);
    console.error(`FAIL ${label}: allowed; persisted state changed=${changed}; returned requests=${result.data?.groupRequests?.length ?? 'n/a'}`);
    return;
  }
  // This OpenIM version returns 1004 when the caller's membership is absent.
  if (result.errCode === 1004) {
    assert.ok(user && !before.members.some(m => m.id === user.userID), `${label}: unexpected missing record for joined caller`);
  } else {
    assert.match(`${result.errMsg} ${result.errDlt || ''}`, /permission|access|owner|admin|token|not.*group|not.*member/i, `${label}: not an authorization rejection`);
  }
  assert.deepEqual(await state(), before, `${label}: rejected operation changed persisted state`);
  checks++;
  console.log(`PASS ${label} (errCode=${result.errCode}, state unchanged)`);
}
const setMember = (userID, values) => ({ members: [{ groupID, userID, ...values }] });
try {
  ({ groupInfo: { groupID } } = await ok(owner, 'create_group', {
    ownerUserID: owner.userID, adminUserIDs: [admin.userID], memberUserIDs: [member.userID],
    groupInfo: { groupName: `API权限验证-${Date.now()}`, groupType: 2, needVerification: 1 },
  }));
  console.log(`Fixture group: ${groupID}`);
  await ok(outsider, 'join_group', { groupID, inviterUserID: outsider.userID, reqMessage: 'permission test', joinSource: 3 });
  await denied('member: read owner approval inbox', member, 'get_recv_group_applicationList', { fromUserID: owner.userID, pagination });
  await denied('member: read applicant history', member, 'get_user_req_group_applicationList', { userID: outsider.userID, pagination });
  await denied('member: read batch applications', member, 'get_group_users_req_application_list', { groupID, userIDs: [outsider.userID] });
  await denied('outsider: read group members', outsider, 'get_group_member_list', { groupID, pagination, filter: 0 });
  assert.equal((await ok(outsider, 'get_user_req_group_applicationList', { userID: outsider.userID, pagination })).groupRequests.length, 1);
  assert.equal((await ok(admin, 'get_recv_group_applicationList', { fromUserID: admin.userID, pagination })).groupRequests.length, 1);
  assert.equal((await ok(admin, 'get_group_users_req_application_list', { groupID, userIDs: [outsider.userID] })).groupRequests.length, 1);
  for (const [role, user] of [['member', member], ['outsider', outsider]]) {
    await denied(`${role}: legacy group edit`, user, 'set_group_info', { groupInfoForSet: { groupID, introduction: 'unauthorized' } });
    await denied(`${role}: group edit`, user, 'set_group_info_ex', { groupID, notification: 'unauthorized', faceURL: 'https://example.invalid/avatar.png', needVerification: 2 });
    await denied(`${role}: mute group`, user, 'mute_group', { groupID });
    await denied(`${role}: unmute group`, user, 'cancel_mute_group', { groupID });
    await denied(`${role}: mute member`, user, 'mute_group_member', { groupID, userID: admin.userID, mutedSeconds: 60 });
    await denied(`${role}: unmute member`, user, 'cancel_mute_group_member', { groupID, userID: admin.userID });
    await denied(`${role}: kick`, user, 'kick_group', { groupID, kickedUserIDs: [admin.userID], reason: 'test' });
    await denied(`${role}: self promotion`, user, 'set_group_member_info', setMember(user.userID, { roleLevel: 60 }));
    for (const handleResult of [-1, 1]) {
      await denied(`${role}: approval ${handleResult}`, user, 'group_application_response', { groupID, fromUserID: outsider.userID, handleResult, handledMsg: 'test' });
    }
    await denied(`${role}: forged owner transfer`, user, 'transfer_group', { groupID, oldOwnerUserID: owner.userID, newOwnerUserID: admin.userID });
    await denied(`${role}: dismiss`, user, 'dismiss_group', { groupID });
    await denied(`${role}: force another user quit`, user, 'quit_group', { groupID, userID: owner.userID });
  }
  await denied('anonymous edit', null, 'set_group_info_ex', { groupID, introduction: 'unauthorized' });
  await denied('admin: promote self to owner', admin, 'set_group_member_info', setMember(admin.userID, { roleLevel: 100 }));
  await denied('admin: promote ordinary member', admin, 'set_group_member_info', setMember(member.userID, { roleLevel: 60 }));
  await ok(owner, 'set_group_member_info', setMember(member.userID, { roleLevel: 20 }));
  await denied('admin: mixed nickname and promotion batch', admin, 'set_group_member_info', {
    members: [{ groupID, userID: admin.userID, nickname: 'must not persist' }, { groupID, userID: member.userID, roleLevel: 60 }],
  });
  await ok(owner, 'set_group_member_info', setMember(member.userID, { roleLevel: 20 }));
  await denied('admin: mute owner', admin, 'mute_group_member', { groupID, userID: owner.userID, mutedSeconds: 60 });
  await denied('admin: kick owner', admin, 'kick_group', { groupID, kickedUserIDs: [owner.userID], reason: 'test' });
  await denied('admin: transfer', admin, 'transfer_group', { groupID, oldOwnerUserID: owner.userID, newOwnerUserID: admin.userID });
  await denied('admin: dismiss', admin, 'dismiss_group', { groupID });

  await ok(owner, 'set_group_member_info', setMember(member.userID, { roleLevel: 60 }));
  await denied('admin: mute peer', admin, 'mute_group_member', { groupID, userID: member.userID, mutedSeconds: 60 });
  await denied('admin: kick peer', admin, 'kick_group', { groupID, kickedUserIDs: [member.userID], reason: 'test' });
  await denied('admin: demote peer', admin, 'set_group_member_info', setMember(member.userID, { roleLevel: 20 }));
  await ok(owner, 'set_group_member_info', setMember(member.userID, { roleLevel: 20 }));
  await ok(admin, 'set_group_info_ex', { groupID, introduction: 'authorized admin edit' });
  assert.equal((await state()).group.introduction, 'authorized admin edit');
  await ok(member, 'set_group_member_info', setMember(member.userID, { nickname: '自己的群昵称' }));
  assert.equal((await state()).members.find(m => m.id === member.userID).nickname, '自己的群昵称');
  await ok(admin, 'mute_group', { groupID });
  assert.equal((await state()).group.status, 3);
  await ok(admin, 'cancel_mute_group', { groupID });
  assert.equal((await state()).group.status, 0);
  await ok(admin, 'mute_group_member', { groupID, userID: member.userID, mutedSeconds: 60 });
  assert.ok((await state()).members.find(m => m.id === member.userID).mute > 0);
  await ok(admin, 'cancel_mute_group_member', { groupID, userID: member.userID });
  assert.equal((await state()).members.find(m => m.id === member.userID).mute, 0);
  await ok(admin, 'group_application_response', { groupID, fromUserID: outsider.userID, handleResult: 1, handledMsg: 'approved' });
  assert.ok((await state()).members.some(m => m.id === outsider.userID));
  await ok(admin, 'kick_group', { groupID, kickedUserIDs: [outsider.userID], reason: 'fixture test' });
  assert.ok(!(await state()).members.some(m => m.id === outsider.userID));
  await denied('kicked user: invite', outsider, 'invite_user_to_group', { groupID, invitedUserIDs: [outsider.userID], reason: 'test' });
  await ok(owner, 'set_group_member_info', setMember(admin.userID, { roleLevel: 20 }));
  await denied('demoted admin: old token edit', admin, 'set_group_info_ex', { groupID, introduction: 'stale privileges' });
  await ok(owner, 'transfer_group', { groupID, oldOwnerUserID: owner.userID, newOwnerUserID: member.userID });
  currentOwner = member;
  assert.equal((await state()).group.owner, member.userID);
  await denied('previous owner: dismiss with old token', owner, 'dismiss_group', { groupID });
  await ok(owner, 'quit_group', { groupID, userID: owner.userID });
  assert.ok(!(await state()).members.some(m => m.id === owner.userID));
  await denied('exited owner: invite with old token', owner, 'invite_user_to_group', { groupID, invitedUserIDs: [outsider.userID], reason: 'test' });
  assert.deepEqual(findings, [], 'Server authorization gaps');
  console.log(`PASS: ${checks} authorization rejections with persisted-state checks; positive admin and owner workflows`);
} finally {
  if (groupID) {
    await ok(currentOwner, 'dismiss_group', { groupID });
    assert.equal((await ok(currentOwner, 'get_groups_info', { groupIDs: [groupID] })).groupInfos[0].status, 2);
    console.log(`Fixture group dismissed: ${groupID}; four isolated test accounts retained`);
  }
}
