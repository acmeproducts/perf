// pic-v1-providers.js — provider contract + Google Drive / OneDrive adapters
// OAuth placeholders are clearly marked; real credential wiring drops in here.

import { STORAGE_KEYS } from './pic-v1-state.js';

// ─── Normalized item shape ────────────────────────────────────────────────────
// { id, provider, name, kind, parentId, size, modifiedAt, createdAt, path, hasChildren, imageCount }

function normalizeGDriveFolder(raw, parentId) {
  return {
    id:          raw.id,
    provider:    'googledrive',
    name:        raw.name,
    kind:        'folder',
    parentId:    parentId || 'root',
    size:        null,
    modifiedAt:  raw.modifiedTime  || null,
    createdAt:   raw.createdTime   || null,
    path:        null,
    hasChildren: true,
    imageCount:  raw._imageCount   ?? null,
  };
}

function normalizeOneDriveFolder(raw, parentId) {
  return {
    id:          raw.id,
    provider:    'onedrive',
    name:        raw.name,
    kind:        'folder',
    parentId:    parentId || 'root',
    size:        null,
    modifiedAt:  raw.lastModifiedDateTime || null,
    createdAt:   raw.createdDateTime      || null,
    path:        raw.parentReference?.path || null,
    hasChildren: (raw.folder?.childCount || 0) > 0,
    imageCount:  raw._imageCount ?? null,
  };
}

// ─── Google Drive Provider ────────────────────────────────────────────────────

export class GoogleDriveProvider {
  constructor() {
    this.name        = 'googledrive';
    // ── GOOGLE OAUTH PLACEHOLDER ──────────────────────────────────────────────
    // Replace clientId with your approved Google OAuth app credentials.
    // The redirect URI must be registered in Google Cloud Console.
    this.clientId    = '567988062464-fa6c1ovesqeudqs5398vv4mbo6q068p9.apps.googleusercontent.com';
    this.redirectUri = window.location.origin + window.location.pathname;
    this.scope       = 'https://www.googleapis.com/auth/drive.readonly';
    this.apiBase     = 'https://www.googleapis.com/drive/v3';
    // ─────────────────────────────────────────────────────────────────────────

    this.accessToken  = localStorage.getItem(STORAGE_KEYS.googleToken)   || null;
    this.refreshToken = localStorage.getItem(STORAGE_KEYS.googleRefresh)  || null;
    this.clientSecret = localStorage.getItem(STORAGE_KEYS.googleSecret)   || null;

    this._breadcrumb = [{ id: 'root', name: 'My Drive' }];
  }

  // ── Contract ────────────────────────────────────────────────────────────────

  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  getSession() {
    if (!this.accessToken) return null;
    return { providerType: 'googledrive', accessToken: this.accessToken };
  }

  async connect(clientSecret) {
    if (clientSecret) {
      this.clientSecret = clientSecret;
      localStorage.setItem(STORAGE_KEYS.googleSecret, clientSecret);
    }
    if (!this.clientSecret) throw new Error('Client secret required');

    // Try existing token first
    if (this.accessToken && this.refreshToken) {
      try { await this._apiCall('/files?pageSize=1'); return true; } catch (_) {}
    }

    return new Promise((resolve, reject) => {
      const url    = this._authUrl();
      const popup  = window.open(url, 'gdrive-auth', 'width=520,height=640,scrollbars=yes');
      if (!popup) { reject(new Error('Popup blocked — allow popups and retry')); return; }

      const timer = setInterval(() => { if (popup.closed) { clearInterval(timer); reject(new Error('Auth cancelled')); } }, 800);

      const handler = async (ev) => {
        if (ev.origin !== window.location.origin) return;
        if (ev.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(timer); window.removeEventListener('message', handler); popup.close();
          try { await this._exchange(ev.data.code); resolve(true); } catch (e) { reject(e); }
        } else if (ev.data?.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(timer); window.removeEventListener('message', handler); popup.close();
          reject(new Error(ev.data.error || 'Auth failed'));
        }
      };
      window.addEventListener('message', handler);
    });
  }

  async disconnect() {
    this.accessToken = this.refreshToken = null;
    [STORAGE_KEYS.googleToken, STORAGE_KEYS.googleRefresh].forEach(k => localStorage.removeItem(k));
  }

  async listRoots() {
    this._breadcrumb = [{ id: 'root', name: 'My Drive' }];
    return this._listFolders('root');
  }

  async listFolder(folderId) {
    return this._listFolders(folderId);
  }

  async searchFolders(query) {
    const q   = `name contains '${query.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const url = `/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime,modifiedTime)&pageSize=40&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    const res = await this._apiCall(url);
    return (res.files || []).map(f => normalizeGDriveFolder(f, null));
  }

  async getFolder(folderId) {
    const res = await this._apiCall(`/files/${folderId}?fields=id,name,createdTime,modifiedTime&supportsAllDrives=true`);
    return normalizeGDriveFolder(res, null);
  }

  getBreadcrumb() { return [...this._breadcrumb]; }

  async drillInto(folder) {
    if (!this._breadcrumb.find(b => b.id === folder.id)) {
      this._breadcrumb.push({ id: folder.id, name: folder.name });
    }
    return this._listFolders(folder.id);
  }

  async navigateUp() {
    if (this._breadcrumb.length <= 1) return this.listRoots();
    this._breadcrumb.pop();
    const parent = this._breadcrumb[this._breadcrumb.length - 1];
    return this._listFolders(parent.id);
  }

  canGoUp() { return this._breadcrumb.length > 1; }

  // ── Internal ────────────────────────────────────────────────────────────────

  _authUrl() {
    const p = new URLSearchParams({
      client_id: this.clientId, redirect_uri: this.redirectUri,
      response_type: 'code', scope: this.scope,
      access_type: 'offline', prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }

  async _exchange(code) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId, client_secret: this.clientSecret,
        code, grant_type: 'authorization_code', redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) throw new Error('Token exchange failed');
    const t = await res.json();
    this.accessToken  = t.access_token;
    this.refreshToken = t.refresh_token;
    localStorage.setItem(STORAGE_KEYS.googleToken,  this.accessToken);
    localStorage.setItem(STORAGE_KEYS.googleRefresh, this.refreshToken);
  }

  async _refresh() {
    if (!this.refreshToken || !this.clientSecret) throw new Error('Cannot refresh — reconnect required');
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId, client_secret: this.clientSecret,
        refresh_token: this.refreshToken, grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) throw new Error('Token refresh failed — please reconnect');
    const t = await res.json();
    this.accessToken = t.access_token;
    localStorage.setItem(STORAGE_KEYS.googleToken, this.accessToken);
  }

  async _apiCall(endpoint, opts = {}) {
    if (!this.accessToken) throw new Error('Not authenticated');
    const url = endpoint.startsWith('https://') ? endpoint : `${this.apiBase}${endpoint}`;
    let res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', ...opts.headers } });
    if (res.status === 401 && this.refreshToken) {
      await this._refresh();
      res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', ...opts.headers } });
    }
    if (!res.ok) throw new Error(`Drive API ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async _listFolders(parentId) {
    const all = [];
    let token = null;
    const q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    do {
      let url = `/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime,modifiedTime),nextPageToken&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (token) url += `&pageToken=${token}`;
      const res = await this._apiCall(url);
      all.push(...(res.files || []));
      token = res.nextPageToken || null;
    } while (token);
    return all.map(f => normalizeGDriveFolder(f, parentId));
  }
}

// ─── OneDrive Provider ────────────────────────────────────────────────────────

export class OneDriveProvider {
  constructor() {
    this.name    = 'onedrive';
    // ── MICROSOFT OAUTH PLACEHOLDER ───────────────────────────────────────────
    // Replace clientId with your approved Azure AD / Entra app registration.
    // Requires MSAL browser library loaded in the HTML.
    this.clientId    = 'b407fd45-c551-4dbb-9da5-cab3a2c5a949';
    this.redirectUri = window.location.origin + window.location.pathname;
    this.scopes      = ['Files.Read', 'User.Read'];
    // ─────────────────────────────────────────────────────────────────────────

    this.apiBase     = 'https://graph.microsoft.com/v1.0';
    this.msalInstance  = null;
    this.activeAccount = null;
    this._breadcrumb   = [];
    this._rootId       = null;

    this._initMsal();
    this._restoreAccount();
  }

  // ── Contract ────────────────────────────────────────────────────────────────

  isConfigured() { return !!this.clientId; }

  getSession() {
    if (!this.activeAccount) return null;
    return { providerType: 'onedrive', account: this.activeAccount.username };
  }

  async connect() {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalInstance.setActiveAccount(accounts[0]);
      this.activeAccount = accounts[0];
      return true;
    }
    const res = await this.msalInstance.loginPopup({ scopes: this.scopes });
    this.activeAccount = res.account;
    this.msalInstance.setActiveAccount(this.activeAccount);
    return true;
  }

  async disconnect() {
    if (!this.activeAccount) return;
    try { await this.msalInstance.logoutPopup({ account: this.activeAccount }); } catch (_) {}
    this.activeAccount = null;
  }

  async listRoots() {
    // Start from Downloads if present, else drive root
    const root = await this._getEffectiveRoot();
    this._breadcrumb = [{ id: root.id, name: root.name }];
    return this._listFolders(root.id);
  }

  async listFolder(folderId) {
    return this._listFolders(folderId);
  }

  async searchFolders(query) {
    const res = await this._apiCall(`/me/drive/search(q='${encodeURIComponent(query)}')?$filter=folder ne null&$select=id,name,createdDateTime,lastModifiedDateTime,folder,parentReference&$top=40`);
    return (res.value || [])
      .filter(i => i.folder)
      .map(i => normalizeOneDriveFolder(i, i.parentReference?.id || null));
  }

  async getFolder(folderId) {
    const res = await this._apiCall(`/me/drive/items/${folderId}?$select=id,name,createdDateTime,lastModifiedDateTime,folder,parentReference`);
    return normalizeOneDriveFolder(res, res.parentReference?.id || null);
  }

  getBreadcrumb() { return [...this._breadcrumb]; }

  async drillInto(folder) {
    if (!this._breadcrumb.find(b => b.id === folder.id)) {
      this._breadcrumb.push({ id: folder.id, name: folder.name });
    }
    return this._listFolders(folder.id);
  }

  async navigateUp() {
    if (this._breadcrumb.length <= 1) return this.listRoots();
    this._breadcrumb.pop();
    const parent = this._breadcrumb[this._breadcrumb.length - 1];
    return this._listFolders(parent.id);
  }

  canGoUp() { return this._breadcrumb.length > 1; }

  // ── Internal ────────────────────────────────────────────────────────────────

  _initMsal() {
    if (typeof msal === 'undefined') return;
    this.msalInstance = new msal.PublicClientApplication({
      auth: { clientId: this.clientId, authority: 'https://login.microsoftonline.com/common', redirectUri: this.redirectUri },
      cache: { cacheLocation: 'localStorage' },
    });
  }

  _restoreAccount() {
    if (!this.msalInstance) return;
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.activeAccount = accounts[0];
      this.msalInstance.setActiveAccount(accounts[0]);
    }
  }

  async _token() {
    if (!this.activeAccount) throw new Error('Not authenticated');
    try {
      const res = await this.msalInstance.acquireTokenSilent({ scopes: this.scopes, account: this.activeAccount });
      return res.accessToken;
    } catch (e) {
      if (e instanceof msal.InteractionRequiredAuthError) {
        const res = await this.msalInstance.acquireTokenPopup({ scopes: this.scopes });
        return res.accessToken;
      }
      throw e;
    }
  }

  async _apiCall(endpoint) {
    const token = await this._token();
    const url   = endpoint.startsWith('https://') ? endpoint : `${this.apiBase}${endpoint}`;
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async _getEffectiveRoot() {
    try {
      const rootChildren = await this._apiCall('/me/drive/root/children?$filter=folder ne null&$select=id,name,folder&$top=100');
      const dl = (rootChildren.value || []).find(i => ['downloads','download'].includes((i.name||'').toLowerCase()));
      if (dl) return { id: dl.id, name: dl.name };
    } catch (_) {}
    const root = await this._apiCall('/me/drive/root?$select=id,name');
    return { id: root.id, name: root.name || 'OneDrive' };
  }

  async _listFolders(parentId) {
    const all = [];
    let next = parentId === 'root'
      ? `${this.apiBase}/me/drive/root/children`
      : `${this.apiBase}/me/drive/items/${parentId}/children`;
    while (next) {
      const token = await this._token();
      const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Graph API ${res.status}`);
      const data = await res.json();
      (data.value || []).filter(i => i.folder).forEach(i => all.push(normalizeOneDriveFolder(i, parentId)));
      next = data['@odata.nextLink'] || null;
    }
    return all;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createProvider(type) {
  if (type === 'googledrive') return new GoogleDriveProvider();
  if (type === 'onedrive')    return new OneDriveProvider();
  throw new Error(`Unknown provider: ${type}`);
}
