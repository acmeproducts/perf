const GOOGLE_API_BASE = 'https://www.googleapis.com/drive/v3';
const ONEDRIVE_API_BASE = 'https://graph.microsoft.com/v1.0';

const normalizeGoogleNode = (node, parentId = null) => ({
  id: node.id,
  provider: 'google-drive',
  name: node.name || 'Untitled',
  kind: node.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'item',
  parentId,
  size: Number(node.size || 0),
  modifiedAt: node.modifiedTime || null,
  createdAt: node.createdTime || null,
  path: node.name || ''
});

const normalizeOneDriveNode = (node, parentId = null) => ({
  id: node.id,
  provider: 'onedrive',
  name: node.name || 'Untitled',
  kind: node.folder ? 'folder' : 'item',
  parentId,
  size: Number(node.size || 0),
  modifiedAt: node.lastModifiedDateTime || null,
  createdAt: node.createdDateTime || null,
  path: node.parentReference?.path ? `${node.parentReference.path}/${node.name}` : node.name || ''
});

const googleFetch = async (session, endpoint) => {
  if (!session?.accessToken) {
    throw new Error('Google session is missing an access token');
  }

  const response = await fetch(`${GOOGLE_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google API request failed (${response.status}): ${text}`);
  }

  return response.json();
};

const oneDriveFetch = async (session, endpoint) => {
  if (!session?.accessToken) {
    throw new Error('OneDrive session is missing an access token');
  }

  const response = await fetch(`${ONEDRIVE_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OneDrive API request failed (${response.status}): ${text}`);
  }

  return response.json();
};

const buildGoogleAdapter = (getSession) => ({
  providerId: 'google-drive',

  async listRoots() {
    const session = getSession('google-drive');
    const params = new URLSearchParams({
      q: "'root' in parents and trashed=false",
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)',
      pageSize: '200',
      orderBy: 'folder,name'
    });
    const data = await googleFetch(session, `/files?${params.toString()}`);
    return (data.files || []).map((node) => normalizeGoogleNode(node, null));
  },

  async listFolder(folderId) {
    const session = getSession('google-drive');
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)',
      pageSize: '200',
      orderBy: 'folder,name'
    });
    const data = await googleFetch(session, `/files?${params.toString()}`);
    return (data.files || []).map((node) => normalizeGoogleNode(node, folderId));
  },

  async searchFolders(query) {
    const session = getSession('google-drive');
    const escapedQuery = String(query || '').replace(/'/g, "\\'");
    const params = new URLSearchParams({
      q: `name contains '${escapedQuery}' and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents)',
      pageSize: '100',
      orderBy: 'folder,name'
    });
    const data = await googleFetch(session, `/files?${params.toString()}`);
    return (data.files || []).map((node) => normalizeGoogleNode(node, node.parents?.[0] || null));
  },

  async getFolder(folderId) {
    const session = getSession('google-drive');
    const fields = 'id,name,mimeType,size,createdTime,modifiedTime,parents';
    const node = await googleFetch(session, `/files/${folderId}?fields=${encodeURIComponent(fields)}`);
    return normalizeGoogleNode(node, node.parents?.[0] || null);
  }
});

const buildOneDriveAdapter = (getSession) => ({
  providerId: 'onedrive',

  async listRoots() {
    const session = getSession('onedrive');
    const data = await oneDriveFetch(session, '/me/drive/root/children?$top=200');
    return (data.value || []).map((node) => normalizeOneDriveNode(node, null));
  },

  async listFolder(folderId) {
    const session = getSession('onedrive');
    const data = await oneDriveFetch(session, `/me/drive/items/${folderId}/children?$top=200`);
    return (data.value || []).map((node) => normalizeOneDriveNode(node, folderId));
  },

  async searchFolders(query) {
    const session = getSession('onedrive');
    const encoded = encodeURIComponent(String(query || '').trim());
    const data = await oneDriveFetch(session, `/me/drive/root/search(q='${encoded}')?$top=100`);
    return (data.value || []).map((node) => normalizeOneDriveNode(node, node.parentReference?.id || null));
  },

  async getFolder(folderId) {
    const session = getSession('onedrive');
    const node = await oneDriveFetch(session, `/me/drive/items/${folderId}`);
    return normalizeOneDriveNode(node, node.parentReference?.id || null);
  }
});

const buildPlaceholderAdapter = (providerId) => ({
  providerId,
  async listRoots() { return []; },
  async listFolder() { return []; },
  async searchFolders() { return []; },
  async getFolder() { return null; }
});

export const PROVIDERS = [
  { id: 'google-drive', label: 'Google Drive', description: 'Live OAuth + Drive API', tier: 'Live' },
  { id: 'onedrive', label: 'OneDrive', description: 'Live MSAL + Graph API', tier: 'Live' },
  { id: 'google-oauth-placeholder', label: 'Google OAuth App', description: 'Future approved app configuration', tier: 'Placeholder' },
  { id: 'microsoft-oauth-placeholder', label: 'Microsoft OAuth App', description: 'Future approved app configuration', tier: 'Placeholder' }
];

export const createProviderRegistry = (getSession) => ({
  getProviderAdapter(providerId) {
    if (providerId === 'google-drive') return buildGoogleAdapter(getSession);
    if (providerId === 'onedrive') return buildOneDriveAdapter(getSession);
    return buildPlaceholderAdapter(providerId);
  }
});
