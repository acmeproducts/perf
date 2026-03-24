import { getProviderAdapter } from './pic-v1-providers.js';

export const createBrowserModule = () => {
  const getAdapter = (providerId) => getProviderAdapter(providerId);

  const listRoots = async (providerId) => {
    const adapter = getAdapter(providerId);
    return adapter.listRoots();
  };

  const listFolder = async (providerId, folderId) => {
    const adapter = getAdapter(providerId);
    return adapter.listFolder(folderId);
  };

  const searchFolders = async (providerId, query) => {
    const adapter = getAdapter(providerId);
    return adapter.searchFolders(query);
  };

  const getFolder = async (providerId, folderId) => {
    const adapter = getAdapter(providerId);
    return adapter.getFolder(folderId);
  };

  return { listRoots, listFolder, searchFolders, getFolder };
};
