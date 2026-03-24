const sessions = new Map();

const createSession = (providerId) => ({
  providerId,
  connectedAt: new Date().toISOString(),
  accessToken: `demo-${providerId}-token`
});

export const createAuthModule = () => {
  const connect = async (providerId) => {
    const session = createSession(providerId);
    sessions.set(providerId, session);
    return session;
  };

  const disconnect = async (providerId) => {
    sessions.delete(providerId);
  };

  const getSession = (providerId) => sessions.get(providerId) || null;

  const isConfigured = (providerId) => !providerId.endsWith('-oauth-placeholder');

  return { connect, disconnect, getSession, isConfigured };
};
