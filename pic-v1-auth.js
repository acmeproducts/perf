const SESSION_STORAGE_KEY = 'pic_v1_auth_sessions';

const DEFAULT_GOOGLE_CLIENT_ID = '567988062464-fa6c1ovesqeudqs5398vv4mbo6q068p9.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const ONEDRIVE_SCOPES = ['Files.Read.All', 'User.Read'];

const sessions = new Map();

const loadStoredSessions = () => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return;
  Object.entries(parsed).forEach(([providerId, value]) => {
    if (value && typeof value === 'object') {
      sessions.set(providerId, value);
    }
  });
};

const persistSessions = () => {
  const obj = {};
  sessions.forEach((value, key) => {
    obj[key] = value;
  });
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(obj));
};

const waitForPopupHash = (popup) => new Promise((resolve, reject) => {
  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - startedAt > 120000) {
      clearInterval(timer);
      reject(new Error('Google authentication timed out'));
      return;
    }

    if (popup.closed) {
      clearInterval(timer);
      reject(new Error('Google authentication popup was closed'));
      return;
    }

    try {
      const hash = popup.location.hash;
      if (!hash) return;
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const expiresIn = Number(params.get('expires_in') || '3600');
      if (!accessToken) return;

      clearInterval(timer);
      popup.close();
      resolve({ accessToken, expiresAt: Date.now() + (expiresIn * 1000) });
    } catch (_error) {
      // Ignore cross-origin access errors until redirect completes.
    }
  }, 250);
});

const connectGoogle = async (options = {}) => {
  const clientId = options.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google client id is required');
  }
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', GOOGLE_SCOPE);
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'consent');

  const popup = window.open(authUrl.toString(), 'pic-v1-google-auth', 'width=520,height=640,resizable=yes,scrollbars=yes');
  if (!popup) {
    throw new Error('Popup blocked. Allow popups for this page and retry.');
  }

  const tokenData = await waitForPopupHash(popup);
  return {
    providerId: 'google-drive',
    clientId,
    connectedAt: new Date().toISOString(),
    ...tokenData
  };
};

const connectOneDrive = async () => {
  if (!window.msal?.PublicClientApplication) {
    throw new Error('MSAL is not available. Check network access to the MSAL script.');
  }

  const msalApp = new window.msal.PublicClientApplication({
    auth: {
      clientId: 'b407fd45-c551-4dbb-9da5-cab3a2c5a949',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: `${window.location.origin}${window.location.pathname}`
    }
  });

  const loginResponse = await msalApp.loginPopup({ scopes: ONEDRIVE_SCOPES });
  const tokenResponse = await msalApp.acquireTokenSilent({ scopes: ONEDRIVE_SCOPES, account: loginResponse.account })
    .catch(() => msalApp.acquireTokenPopup({ scopes: ONEDRIVE_SCOPES, account: loginResponse.account }));

  return {
    providerId: 'onedrive',
    connectedAt: new Date().toISOString(),
    accessToken: tokenResponse.accessToken,
    expiresAt: tokenResponse.expiresOn?.getTime() || (Date.now() + 3600_000),
    account: {
      username: tokenResponse.account?.username || '',
      homeAccountId: tokenResponse.account?.homeAccountId || ''
    }
  };
};

export const createAuthModule = () => {
  loadStoredSessions();

  const connect = async (providerId, options = {}) => {
    let session;
    if (providerId === 'google-drive') {
      session = await connectGoogle(options);
    } else if (providerId === 'onedrive') {
      session = await connectOneDrive();
    } else {
      throw new Error(`${providerId} is a placeholder and not configured for live auth.`);
    }

    sessions.set(providerId, session);
    persistSessions();
    return session;
  };

  const disconnect = async (providerId) => {
    sessions.delete(providerId);
    persistSessions();

    if (providerId === 'onedrive' && window.msal?.PublicClientApplication) {
      const msalApp = new window.msal.PublicClientApplication({
        auth: {
          clientId: 'b407fd45-c551-4dbb-9da5-cab3a2c5a949',
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: `${window.location.origin}${window.location.pathname}`
        }
      });
      const accounts = msalApp.getAllAccounts();
      if (accounts.length) {
        await msalApp.logoutPopup({ account: accounts[0] });
      }
    }
  };

  const getSession = (providerId) => sessions.get(providerId) || null;

  const isConfigured = (providerId) => providerId === 'google-drive' || providerId === 'onedrive';

  return { connect, disconnect, getSession, isConfigured };
};
