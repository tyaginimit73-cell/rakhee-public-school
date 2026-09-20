// Every place in the backend that needs "which student(s) does this
// account have access to" goes through this file — never reads
// user.students or user.student directly. That's what makes the
// backward-compatibility guarantee real: there is exactly one place that
// knows how the legacy single `student` field and the new `students[]`
// array relate, so it can't drift out of sync between call sites.
//
// Resolution rule: if `students` has any entries, it wins outright (once
// an account has been touched by the new multi-child flow, that's the
// source of truth). Otherwise, fall back to the legacy `student` field —
// this is what makes every pre-existing single-child parent account keep
// working with zero migration ever having been run against the database.

export const getLinkedStudentIds = (user) => {
  if (user.students?.length) return user.students.map((s) => String(s?._id || s));
  if (user.student) return [String(user.student?._id || user.student)];
  return [];
};

export const hasLinkedStudent = (user, studentId) =>
  getLinkedStudentIds(user).includes(String(studentId));

// Called the one time a record actually needs to move from the legacy
// single-link shape to the array — an admin adding a second child to a
// previously single-child parent. Mutates the in-memory document (caller
// still needs to .save() it) rather than writing to the DB itself, so it
// composes cleanly with whatever else that admin action is doing in the
// same request. Never invoked as a bulk/background job — see
// PROJECT_AUDIT.md for why a batch migration script was deliberately not
// written.
export const migrateLegacyStudentIfNeeded = (user) => {
  if (!user.students?.length && user.student) {
    user.students = [user.student];
  }
};
