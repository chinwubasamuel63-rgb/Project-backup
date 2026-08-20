const isSameId = (left, right) => left?.toString() === right?.toString();

export const canAccessStream = (stream, user, action = "read") => {
  if (!stream || !user) return false;

  if (user.role === "admin") {
    return true;
  }

  if (stream.visibility === "public") {
    return true;
  }

  if (!stream.project) return false;

  const project = stream.project;
  const userId = user._id || user.id;

  if (!userId) return false;

  const isOwner = isSameId(project.owner, userId);
  const isCoOwner = (project.coOwners || []).some((id) => isSameId(id, userId));
  const isMember = (project.members || []).some((id) => isSameId(id, userId));

  return isOwner || isCoOwner || isMember;
};
