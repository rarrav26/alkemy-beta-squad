export function getSessionUser(session) {
  if (!session || typeof session !== 'object') return null
  return session.user ?? null
}
