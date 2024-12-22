const SESSION_ID_KEY = 'mattress_ai_session_id';
export const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};
export const getSessionId = () => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
};
