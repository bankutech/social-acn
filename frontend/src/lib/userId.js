/** Compare Mongo/user ids whether populated doc or string. */
export function sameUser(a, b) {
  if (a == null || b == null) return false;
  const idA = typeof a === 'object' ? (a._id ?? a.id) : a;
  const idB = typeof b === 'object' ? (b._id ?? b.id) : b;
  return String(idA) === String(idB);
}

export function currentUserId(user) {
  return user?._id ?? user?.id ?? null;
}
