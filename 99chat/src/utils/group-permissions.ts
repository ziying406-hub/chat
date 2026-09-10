type Member = { userID: string; roleLevel: number };

export function groupPermissions(ownerUserID: string | undefined, userID: string | undefined, members: Member[]) {
  const self = members.find((member) => member.userID === userID);
  const hasGroup = Boolean(userID && ownerUserID);
  const isOwner = Boolean(hasGroup && userID === ownerUserID && (!self || self.roleLevel === 100));
  const canManage = hasGroup && (isOwner || self?.roleLevel === 60);
  return {
    isOwner,
    canManage,
    canInvite: hasGroup && (isOwner || Boolean(self)),
    canManageMember: (target: Member) => Boolean(hasGroup && target.userID !== userID && target.roleLevel < 100 &&
      (isOwner || (canManage && target.roleLevel < 60))),
  };
}
