import { createProviderRegistry } from './pic-v1-providers.js';

export const createBrowserModule = (options) => {
  const registry = createProviderRegistry(options.getSession);
  const getAdapter = (providerId) => registry.getProviderAdapter(providerId);

  const listRoots = async (providerId) => getAdapter(providerId).listRoots();
  const listFolder = async (providerId, folderId) => getAdapter(providerId).listFolder(folderId);
  const searchFolders = async (providerId, query) => getAdapter(providerId).searchFolders(query);
  const getFolder = async (providerId, folderId) => getAdapter(providerId).getFolder(folderId);

  return { listRoots, listFolder, searchFolders, getFolder };
};
