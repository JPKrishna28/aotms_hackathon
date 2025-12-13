/**
 * Shared session storage (in-memory)
 * In production, this would be stored in Redis or a database
 */

const sessions = new Map();

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function setSession(sessionId, sessionData) {
  sessions.set(sessionId, sessionData);
}

export function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.set(sessionId, { ...session, ...updates });
  }
  return sessions.get(sessionId);
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

export function getAllSessions() {
  return Array.from(sessions.values());
}

export function getSessionIds() {
  return Array.from(sessions.keys());
}

export function getSessionCount() {
  return sessions.size;
}

export function clearExpiredSessions(maxAge = 3600000) {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.uploadedAt && now - session.uploadedAt.getTime() > maxAge) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  
  return cleaned;
}
