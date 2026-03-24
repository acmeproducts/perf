const nowIso = () => new Date().toISOString();

const createNode = ({ id, provider, name, kind, parentId = null, size = 0, path = '/' }) => ({
  id,
  provider,
  name,
  kind,
  parentId,
  size,
  modifiedAt: nowIso(),
  createdAt: nowIso(),
  path
});

const googleTree = {
  root: [
    createNode({ id: 'g-folders', provider: 'google-drive', name: 'Campaigns', kind: 'folder', path: '/Campaigns' }),
    createNode({ id: 'g-assets', provider: 'google-drive', name: 'Assets', kind: 'folder', path: '/Assets' }),
    createNode({ id: 'g-hero', provider: 'google-drive', name: 'hero.jpg', kind: 'item', size: 1945000, path: '/hero.jpg' })
  ],
  'g-folders': [
    createNode({ id: 'g-q1', provider: 'google-drive', name: 'Q1 Launch', kind: 'folder', parentId: 'g-folders', path: '/Campaigns/Q1 Launch' }),
    createNode({ id: 'g-q2', provider: 'google-drive', name: 'Q2 Concept', kind: 'folder', parentId: 'g-folders', path: '/Campaigns/Q2 Concept' })
  ],
  'g-assets': [
    createNode({ id: 'g-brand', provider: 'google-drive', name: 'brand-guide.pdf', kind: 'item', parentId: 'g-assets', size: 3400000, path: '/Assets/brand-guide.pdf' }),
    createNode({ id: 'g-logo', provider: 'google-drive', name: 'logo.svg', kind: 'item', parentId: 'g-assets', size: 180000, path: '/Assets/logo.svg' })
  ],
  'g-q1': [
    createNode({ id: 'g-shoot', provider: 'google-drive', name: 'Shoot Day', kind: 'folder', parentId: 'g-q1', path: '/Campaigns/Q1 Launch/Shoot Day' }),
    createNode({ id: 'g-brief', provider: 'google-drive', name: 'brief.docx', kind: 'item', parentId: 'g-q1', size: 56000, path: '/Campaigns/Q1 Launch/brief.docx' })
  ]
};

const oneDriveTree = {
  root: [
    createNode({ id: 'o-creative', provider: 'onedrive', name: 'Creative', kind: 'folder', path: '/Creative' }),
    createNode({ id: 'o-archive', provider: 'onedrive', name: 'Archive', kind: 'folder', path: '/Archive' }),
    createNode({ id: 'o-mood', provider: 'onedrive', name: 'moodboard.png', kind: 'item', size: 890000, path: '/moodboard.png' })
  ],
  'o-creative': [
    createNode({ id: 'o-social', provider: 'onedrive', name: 'Social', kind: 'folder', parentId: 'o-creative', path: '/Creative/Social' }),
    createNode({ id: 'o-web', provider: 'onedrive', name: 'Web', kind: 'folder', parentId: 'o-creative', path: '/Creative/Web' })
  ],
  'o-social': [
    createNode({ id: 'o-reel', provider: 'onedrive', name: 'reel-cut.mp4', kind: 'item', parentId: 'o-social', size: 154002300, path: '/Creative/Social/reel-cut.mp4' }),
    createNode({ id: 'o-post', provider: 'onedrive', name: 'post-copy.txt', kind: 'item', parentId: 'o-social', size: 8000, path: '/Creative/Social/post-copy.txt' })
  ]
};

const flattenTree = (tree) => Object.values(tree).flat();

const createAdapter = (providerId, tree) => {
  const flattened = flattenTree(tree);

  return {
    async listRoots() {
      return tree.root || [];
    },

    async listFolder(folderId) {
      return tree[folderId || 'root'] || [];
    },

    async searchFolders(query) {
      const q = String(query || '').trim().toLowerCase();
      if (!q) return [];
      return flattened.filter((node) => node.name.toLowerCase().includes(q));
    },

    async getFolder(folderId) {
      return flattened.find((node) => node.id === folderId) || null;
    },

    providerId
  };
};

const googleAdapter = createAdapter('google-drive', googleTree);
const oneDriveAdapter = createAdapter('onedrive', oneDriveTree);

const placeholderAdapter = (providerId) => ({
  providerId,
  async listRoots() { return []; },
  async listFolder() { return []; },
  async searchFolders() { return []; },
  async getFolder() { return null; }
});

export const PROVIDERS = [
  { id: 'google-drive', label: 'Google Drive', description: 'Drive folders and files', tier: 'Live' },
  { id: 'onedrive', label: 'OneDrive', description: 'Microsoft cloud storage', tier: 'Live' },
  { id: 'google-oauth-placeholder', label: 'Google OAuth App', description: 'Approved app configuration placeholder', tier: 'Placeholder' },
  { id: 'microsoft-oauth-placeholder', label: 'Microsoft OAuth App', description: 'Approved app configuration placeholder', tier: 'Placeholder' }
];

export const getProviderAdapter = (providerId) => {
  if (providerId === 'google-drive') return googleAdapter;
  if (providerId === 'onedrive') return oneDriveAdapter;
  return placeholderAdapter(providerId);
};
