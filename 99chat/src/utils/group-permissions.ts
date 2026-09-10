type Member = { userID: string; roleLevel: number };

export function groupPermissions(ownerUserID: string | undefined, userID: string | undefined, members: Member[]) {
  const self = members.find((member) => member.userID === userID);
  const isOwner = Boolean(userID && ownerUserID && userID === ownerUserID);
  const canManage = isOwner || self?.roleLevel === 60;
  return {
    isOwner,
    canManage,
    canInvite: isOwner || Boolean(self),
    canManageMember: (target: Member) => Boolean(userID && target.userID !== userID && target.roleLevel < 100 &&
      (isOwner || (canManage && target.roleLevel < 60))),
  };
}
