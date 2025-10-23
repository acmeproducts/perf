Explicit Timestamp Synchronization Architecture
Developer Documentation: Multi-Device Metadata Sync

OVERVIEW
This system uses explicit application-controlled timestamps rather than provider-supplied modification times to determine data freshness across devices. The core principle: cloud is always source of truth, IndexedDB is local cache, RAM is working memory. We NEVER display cached data without first verifying it's current.

TIMESTAMP STRATEGY
Two Timestamp Types

folderVersion - Folder-level timestamp (milliseconds since epoch)

Stored in: IndexedDB and Cloud
Updated: Every time ANY file metadata changes in the folder
Purpose: Quick staleness check - "has anything changed?"


itemTimestamp - Per-file timestamp (milliseconds since epoch)

Stored in: IndexedDB and Cloud with each file's metadata
Updated: Every time that specific file's metadata changes
Purpose: Determine which specific files need refreshing



Why Explicit Timestamps?

Google Drive: modifiedTime doesn't change when only appProperties are updated
OneDrive: lastModifiedDateTime is unreliable for metadata-only changes
Solution: We maintain our own timestamps that increment with EVERY metadata change


DATA STRUCTURES
IndexedDB Schema
javascript// Store 1: folderCache
{
    keyPath: 'folderId',
    structure: {
        folderId: 'folder-123',
        folderVersion: 1696789234567,  // Last change timestamp
        files: [
            {
                id: 'file-abc',
                name: 'image1.png',
                size: 1048576,
                createdTime: '2024-01-15T10:30:00Z',
                modifiedTime: '2024-01-15T10:30:00Z'
                // No metadata here, just file list
            }
        ],
        cached: 1696789234567  // When this cache entry was created
    }
}

// Store 2: metadata
{
    keyPath: 'fileId',
    indexes: ['folderId'],
    structure: {
        fileId: 'file-abc',
        folderId: 'folder-123',
        metadata: {
            stack: 'in',
            tags: ['#favorite', '#landscape'],
            notes: 'Beautiful sunset photo',
            qualityRating: 5,
            contentRating: 4,
            stackSequence: 1696789234567,
            favorite: true,
            itemTimestamp: 1696789234567  // THIS IS CRITICAL
        },
        cached: 1696789234567  // Local cache timestamp
    }
}

// Store 3: folderVersions (NEW - for staleness checking)
{
    keyPath: 'folderId',
    structure: {
        folderId: 'folder-123',
        folderVersion: 1696789234567,  // Last known folder version
        lastChecked: 1696789234567     // When we last checked cloud
    }
}

// Store 4: folderListings (provider + path snapshots)
{
    keyPath: 'listingKey',
    structure: {
        listingKey: 'onedrive::root/downloads',
        providerType: 'onedrive',
        parentId: 'folder-123',
        pathSegments: ['root', 'downloads'],
        breadcrumb: [{ id: 'root', name: 'Root' }, { id: 'folder-123', name: 'Downloads' }],
        folders: [ /* serialized folder entries shown in UI */ ],
        updatedAt: 1696789234567,
        refreshDeferred: false,          // first visit uses cache, next visit fetches cloud
        requiresRefresh: false,          // marker forcing immediate refresh next load
        lastPresentedAt: 1696789234567,  // when we last rendered this snapshot
        markerVersion: 42                // optional provider marker version if available
    }
}

// Store 5: folderSummaries (per-folder counts and markers)
{
    keyPath: 'folderKey',
    structure: {
        folderKey: 'googledrive::folder-123',
        providerType: 'googledrive',
        folderId: 'folder-123',
        itemCount: 128,
        stackCounts: { in: 64, out: 32, priority: 20, trash: 12 },
        cloudVersion: 1696789234567,
        localVersion: 1696789234560,
        updatedAt: 1696789234567,
        lastVisitedAt: 1696789234567,
        lastPresentedAt: 1696789234567,
        lastReason: 'sync-folder'        // why the summary was updated
    }
}
Google Drive Cloud Storage
Location: appProperties directly on each image file
javascript// File: image1.png
// appProperties (hidden metadata attached to file):
{
    slideboxStack: 'in',
    tags: '#favorite,#landscape',
    notes: 'Beautiful sunset photo',
    qualityRating: '5',
    contentRating: '4',
    stackSequence: '1696789234567',
    favorite: 'true',
    itemTimestamp: '1696789234567'  // Our explicit timestamp
}

// Folder-level version marker
// Special file: .orbital8-folder-version.json in the folder
{
    folderId: 'folder-123',
    folderVersion: 1696789234567,  // Increments with ANY metadata change
    lastUpdatedBy: 'device-A',
    lastUpdatedAt: '2024-01-15T10:30:00Z'
}
OneDrive Cloud Storage
Location: approot:/${fileId}.json (one JSON file per image)
javascript// File: /me/drive/special/approot/file-abc.json
{
    stack: 'in',
    tags: ['#favorite', '#landscape'],
    notes: 'Beautiful sunset photo',
    qualityRating: 5,
    contentRating: 4,
    stackSequence: 1696789234567,
    favorite: true,
    itemTimestamp: 1696789234567,  // Our explicit timestamp
    lastUpdated: '2024-01-15T10:30:00Z'
}

// Folder-level version marker
// File: /me/drive/special/approot/folder-versions/folder-123.json
{
    folderId: 'folder-123',
    folderVersion: 1696789234567,  // Increments with ANY metadata change
    lastUpdatedBy: 'device-A',
    lastUpdatedAt: '2024-01-15T10:30:00Z'
}

FOLDER LOAD FLOW (NEVER SHOW STALE DATA)
Device A Opens Folder
┌─────────────────────────────────────────────────────┐
│ Step 1: Check Cloud for Folder Version             │
└─────────────────────────────────────────────────────┘

READ: Cloud folder version file
  - GDrive: GET /files?q=name='.orbital8-folder-version.json' and parents='folder-123'
  - OneDrive: GET /me/drive/special/approot:/folder-versions/folder-123.json:/content
  
RETURNS: { folderVersion: 1696789234567 }

┌─────────────────────────────────────────────────────┐
│ Step 2: Compare with Local Cached Version          │
└─────────────────────────────────────────────────────┘

READ: IndexedDB.folderVersions.get('folder-123')
RETURNS: { folderVersion: 1696789234567, lastChecked: 1696789200000 }

DECISION:
  IF cloudVersion === localVersion:
    → Cache is current, proceed to Step 3
  ELSE IF cloudVersion > localVersion:
    → Cache is stale, SKIP to Step 5 (full refresh)
  ELSE IF no localVersion:
    → First time opening, SKIP to Step 5

┌─────────────────────────────────────────────────────┐
│ Step 3: Load File List from Cloud                  │
└─────────────────────────────────────────────────────┘

READ: Cloud file list (only file info, not metadata yet)
  - GDrive: GET /files?q='folder-123' in parents and mimeType contains 'image/'
            &fields=files(id,name,size,createdTime,modifiedTime)
  - OneDrive: GET /me/drive/items/folder-123/children
              filter: file.mimeType startsWith 'image/'

RETURNS: Array of file objects
[
  { id: 'file-abc', name: 'img1.png', size: 1048576, ... },
  { id: 'file-def', name: 'img2.png', size: 2097152, ... }
]

WRITE: IndexedDB.folderCache.put({
  folderId: 'folder-123',
  folderVersion: 1696789234567,
  files: [...file list...],
  cached: Date.now()
})

┌─────────────────────────────────────────────────────┐
│ Step 4: Batch Load Metadata from Cloud             │
└─────────────────────────────────────────────────────┘

FOR EACH file in batches of 10:
  
  READ: Cloud metadata
    GDrive:
      GET /files/file-abc?fields=appProperties
      RETURNS: { appProperties: { slideboxStack: 'in', itemTimestamp: '1696789234567', ... } }
    
    OneDrive:
      GET /me/drive/special/approot:/file-abc.json:/content
      RETURNS: { stack: 'in', itemTimestamp: 1696789234567, ... }
  
  WRITE: IndexedDB.metadata.put({
    fileId: 'file-abc',
    folderId: 'folder-123',
    metadata: {
      stack: 'in',
      tags: [...],
      itemTimestamp: 1696789234567  // Cloud timestamp
    },
    cached: Date.now()
  })

┌─────────────────────────────────────────────────────┐
│ Step 5: Construct RAM State (Working Memory)       │
└─────────────────────────────────────────────────────┘

MERGE file list + metadata into RAM:

state.imageFiles = [
  {
    // File info from cloud
    id: 'file-abc',
    name: 'img1.png',
    size: 1048576,
    createdTime: '...',
    modifiedTime: '...',
    
    // Metadata from cloud (now cached in IndexedDB)
    stack: 'in',
    tags: ['#favorite'],
    notes: 'Photo description',
    qualityRating: 5,
    contentRating: 4,
    stackSequence: 1696789234567,
    favorite: true,
    itemTimestamp: 1696789234567  // Explicit timestamp
  },
  ...
]

┌─────────────────────────────────────────────────────┐
│ Step 6: Display UI                                  │
└─────────────────────────────────────────────────────┘

NOW we show the UI with guaranteed current data.
NO background refresh needed - we just loaded from cloud.

METADATA UPDATE FLOW (USER CHANGES DATA)
User on Device A moves image to "priority" stack
┌─────────────────────────────────────────────────────┐
│ Step 1: Update RAM Immediately (Instant UI)        │
└─────────────────────────────────────────────────────┘

BEFORE:
  state.imageFiles.find(f => f.id === 'file-abc').stack = 'in'

UPDATE IN RAM:
  const timestamp = Date.now(); // 1696789250000
  const file = state.imageFiles.find(f => f.id === 'file-abc');
  file.stack = 'priority';
  file.stackSequence = timestamp;
  file.itemTimestamp = timestamp;  // NEW EXPLICIT TIMESTAMP

RESULT:
  UI updates instantly (image moves to priority stack)

┌─────────────────────────────────────────────────────┐
│ Step 2: Update IndexedDB Cache                     │
└─────────────────────────────────────────────────────┘

WRITE: IndexedDB.metadata.put({
  fileId: 'file-abc',
  folderId: 'folder-123',
  metadata: {
    stack: 'priority',           // NEW VALUE
    tags: file.tags,
    notes: file.notes,
    qualityRating: file.qualityRating,
    contentRating: file.contentRating,
    stackSequence: 1696789250000,  // NEW VALUE
    favorite: file.favorite,
    itemTimestamp: 1696789250000   // NEW TIMESTAMP
  },
  cached: Date.now()
})

┌─────────────────────────────────────────────────────┐
│ Step 3: Update Cloud (Source of Truth)             │
└─────────────────────────────────────────────────────┘

GOOGLE DRIVE:
  PATCH /files/file-abc
  Body: {
    appProperties: {
      slideboxStack: 'priority',
      tags: '#favorite,#landscape',
      notes: 'Beautiful sunset photo',
      qualityRating: '5',
      contentRating: '4',
      stackSequence: '1696789250000',
      favorite: 'true',
      itemTimestamp: '1696789250000'  // CRITICAL: NEW TIMESTAMP
    }
  }

ONEDRIVE:
  PUT /me/drive/special/approot:/file-abc.json:/content
  Body: {
    stack: 'priority',
    tags: ['#favorite', '#landscape'],
    notes: 'Beautiful sunset photo',
    qualityRating: 5,
    contentRating: 4,
    stackSequence: 1696789250000,
    favorite: true,
    itemTimestamp: 1696789250000,  // CRITICAL: NEW TIMESTAMP
    lastUpdated: new Date().toISOString()
  }

┌─────────────────────────────────────────────────────┐
│ Step 4: Update Folder Version in Cloud             │
└─────────────────────────────────────────────────────┘

READ current folder version:
  - GDrive: GET folder-version file → { folderVersion: 1696789234567 }
  - OneDrive: GET folder-123.json → { folderVersion: 1696789234567 }

INCREMENT and WRITE new version:

GOOGLE DRIVE:
  PATCH .orbital8-folder-version.json
  Body: {
    folderId: 'folder-123',
    folderVersion: 1696789250000,  // INCREMENTED TO NEW TIMESTAMP
    lastUpdatedBy: 'device-A',
    lastUpdatedAt: new Date().toISOString()
  }

ONEDRIVE:
  PUT /me/drive/special/approot:/folder-versions/folder-123.json:/content
  Body: {
    folderId: 'folder-123',
    folderVersion: 1696789250000,  // INCREMENTED TO NEW TIMESTAMP
    lastUpdatedBy: 'device-A',
    lastUpdatedAt: new Date().toISOString()
  }

┌─────────────────────────────────────────────────────┐
│ Step 5: Update Local Folder Version Cache          │
└─────────────────────────────────────────────────────┘

WRITE: IndexedDB.folderVersions.put({
  folderId: 'folder-123',
  folderVersion: 1696789250000,  // NEW VERSION
  lastChecked: Date.now()
})

DEVICE B OPENS SAME FOLDER (DETECTING CHANGES)
┌─────────────────────────────────────────────────────┐
│ Step 1: Check Cloud for Folder Version             │
└─────────────────────────────────────────────────────┘

READ: Cloud folder version
  RETURNS: { folderVersion: 1696789250000 }  // Device A's update

┌─────────────────────────────────────────────────────┐
│ Step 2: Compare with Device B's Cached Version     │
└─────────────────────────────────────────────────────┘

READ: IndexedDB.folderVersions.get('folder-123')
  RETURNS: { folderVersion: 1696789234567 }  // OLD VERSION

COMPARISON:
  cloudVersion (1696789250000) > localVersion (1696789234567)
  
DECISION:
  ✅ CACHE IS STALE - Must refresh from cloud
  ❌ DO NOT display cached data
  
┌─────────────────────────────────────────────────────┐
│ Step 3: Load File List from Cloud                  │
└─────────────────────────────────────────────────────┘

READ: Cloud file list
  (Same as Device A Step 3)

WRITE: Update IndexedDB.folderCache with new file list

┌─────────────────────────────────────────────────────┐
│ Step 4: Determine Which Files Need Metadata Refresh│
└─────────────────────────────────────────────────────┘

FOR EACH file:
  READ: IndexedDB.metadata.get(fileId)
    RETURNS: { metadata: { itemTimestamp: 1696789234567 }, cached: ... }
  
  READ: Cloud metadata timestamp
    GDrive: GET /files/fileId?fields=appProperties.itemTimestamp
    OneDrive: GET approot:/fileId.json → read .itemTimestamp
    
  COMPARE:
    IF cloudTimestamp > cachedTimestamp:
      → This file changed, fetch full metadata
    ELSE:
      → No change, use cached metadata

OPTIMIZATION:
  Batch fetch only changed files
  Keep unchanged files from cache

┌─────────────────────────────────────────────────────┐
│ Step 5: Fetch Changed File Metadata                │
└─────────────────────────────────────────────────────┘

FOR EACH changed file (e.g., file-abc):
  
  READ: Full metadata from cloud
    GDrive: GET /files/file-abc?fields=appProperties
      RETURNS: {
        appProperties: {
          slideboxStack: 'priority',  // CHANGED by Device A
          itemTimestamp: '1696789250000'  // NEW TIMESTAMP
          ...
        }
      }
    
    OneDrive: GET /me/drive/special/approot:/file-abc.json:/content
      RETURNS: {
        stack: 'priority',  // CHANGED by Device A
        itemTimestamp: 1696789250000  // NEW TIMESTAMP
        ...
      }
  
  WRITE: Update IndexedDB cache
    IndexedDB.metadata.put({
      fileId: 'file-abc',
      folderId: 'folder-123',
      metadata: {
        stack: 'priority',  // NEW VALUE
        itemTimestamp: 1696789250000  // NEW TIMESTAMP
        ...
      },
      cached: Date.now()
    })

┌─────────────────────────────────────────────────────┐
│ Step 6: Construct RAM State with Fresh Data        │
└─────────────────────────────────────────────────────┘

MERGE:
  - File list from cloud
  - Changed file metadata from cloud (Step 5)
  - Unchanged file metadata from IndexedDB cache

state.imageFiles = [
  {
    id: 'file-abc',
    name: 'img1.png',
    stack: 'priority',  // ✅ NOW REFLECTS DEVICE A'S CHANGE
    itemTimestamp: 1696789250000
    ...
  },
  ...
]

┌─────────────────────────────────────────────────────┐
│ Step 7: Update Local Folder Version                │
└─────────────────────────────────────────────────────┘

WRITE: IndexedDB.folderVersions.put({
  folderId: 'folder-123',
  folderVersion: 1696789250000,  // NOW CURRENT
  lastChecked: Date.now()
})

┌─────────────────────────────────────────────────────┐
│ Step 8: Display UI                                  │
└─────────────────────────────────────────────────────┘

NOW display UI with Device A's changes visible.
Image is in "priority" stack, not "in" stack.

SCENARIO: DEVICE B OPENS FOLDER WITH NO CHANGES
┌─────────────────────────────────────────────────────┐
│ Step 1: Check Cloud for Folder Version             │
└─────────────────────────────────────────────────────┘

READ: Cloud folder version
  RETURNS: { folderVersion: 1696789234567 }

┌─────────────────────────────────────────────────────┐
│ Step 2: Compare with Device B's Cached Version     │
└─────────────────────────────────────────────────────┘

READ: IndexedDB.folderVersions.get('folder-123')
  RETURNS: { folderVersion: 1696789234567 }

COMPARISON:
  cloudVersion (1696789234567) === localVersion (1696789234567)

DECISION:
  ✅ CACHE IS CURRENT - Safe to use cached data
  ⚡ SKIP cloud metadata fetching

┌─────────────────────────────────────────────────────┐
│ Step 3: Load File List from Cloud (Still Check)    │
└─────────────────────────────────────────────────────┘

WHY STILL CHECK FILE LIST?
  - Files may have been added/deleted without metadata changes
  - File renames, new uploads, deletions

READ: Cloud file list
COMPARE with cached file list:
  - IF same files → proceed to Step 4
  - IF different → fetch metadata for new/changed files only

┌─────────────────────────────────────────────────────┐
│ Step 4: Load Metadata from IndexedDB ONLY          │
└─────────────────────────────────────────────────────┘

FOR EACH file:
  READ: IndexedDB.metadata.get(fileId)
    RETURNS: { metadata: { stack: 'in', itemTimestamp: 1696789234567, ... } }

NO CLOUD CALLS for metadata - cache is guaranteed current.

┌─────────────────────────────────────────────────────┐
│ Step 5: Construct RAM State from Cache             │
└─────────────────────────────────────────────────────┘

state.imageFiles = files with metadata from IndexedDB

┌─────────────────────────────────────────────────────┐
│ Step 6: Display UI                                  │
└─────────────────────────────────────────────────────┘

Display immediately - data is current.

CRITICAL IMPLEMENTATION DETAILS
1. Folder Version File Location
Google Drive:
javascript// Store as hidden file in the folder itself
const query = `name='.orbital8-folder-version.json' and '${folderId}' in parents and trashed=false`;
const response = await makeApiCall(`/files?q=${encodeURIComponent(query)}&fields=files(id)`);

if (response.files.length === 0) {
  // Create new version file
  await makeApiCall('/files', {
    method: 'POST',
    body: JSON.stringify({
      name: '.orbital8-folder-version.json',
      parents: [folderId],
      mimeType: 'application/json'
    })
  });
}

// Update content
await makeApiCall(`/upload/drive/v3/files/${fileId}?uploadType=media`, {
  method: 'PATCH',
  body: JSON.stringify({ folderVersion: Date.now(), ... })
});
OneDrive:
javascript// Store in approot under folder-versions/
const endpoint = `/me/drive/special/approot:/folder-versions/${folderId}.json:/content`;

await makeApiCall(endpoint, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    folderId,
    folderVersion: Date.now(),
    lastUpdatedBy: deviceId,
    lastUpdatedAt: new Date().toISOString()
  })
});
2. Atomic Folder Version Updates
javascript// CRITICAL: Always increment folder version AFTER item metadata succeeds

async function updateMetadataWithVersionBump(fileId, folderId, metadata) {
  const timestamp = Date.now();
  metadata.itemTimestamp = timestamp;
  
  try {
    // Step 1: Update item metadata
    await saveFileMetadata(fileId, metadata);
    
    // Step 2: Update folder version (ONLY if Step 1 succeeded)
    await updateFolderVersion(folderId, timestamp);
    
    // Step 3: Update local caches
    await dbManager.cacheMetadata(fileId, metadata, folderId);
    await dbManager.updateFolderVersion(folderId, timestamp);
    
  } catch (error) {
    // If any step fails, folder version stays old
    // Next device will detect inconsistency and do full refresh
    throw error;
  }
}
3. Race Condition Handling
javascript// Device A and Device B both update different files simultaneously

Device A updates file-abc at timestamp 1696789250000
Device B updates file-def at timestamp 1696789250100

RESULT:
  folderVersion = 1696789250100 (latest)
  file-abc.itemTimestamp = 1696789250000
  file-def.itemTimestamp = 1696789250100

NEXT DEVICE OPENING:
  Sees folderVersion 1696789250100
  Compares with its cached version
  Fetches metadata for ALL files (safe but slower)
  
OPTIMIZATION:
  Track per-file timestamps - only fetch files with newer itemTimestamp
4. Data Elements Explicitly Written
RAM → IndexedDB (metadata store):
javascript{
  fileId: string,           // WRITE
  folderId: string,         // WRITE
  metadata: {
    stack: string,          // WRITE
    tags: string[],         // WRITE
    notes: string,          // WRITE
    qualityRating: number,  // WRITE
    contentRating: number,  // WRITE
    stackSequence: number,  // WRITE
    favorite: boolean,      // WRITE
    itemTimestamp: number   // WRITE (CRITICAL)
  },
  cached: number            // WRITE (when cached locally)
}
RAM → IndexedDB (folderVersions store):
javascript{
  folderId: string,         // WRITE
  folderVersion: number,    // WRITE (CRITICAL)
  lastChecked: number       // WRITE (when last verified)
}
RAM → Cloud (Google Drive appProperties):
javascript{
  slideboxStack: string,           // WRITE
  tags: string,                    // WRITE (comma-separated)
  notes: string,                   // WRITE
  qualityRating: string,           // WRITE (stringified number)
  contentRating: string,           // WRITE (stringified number)
  stackSequence: string,           // WRITE (stringified timestamp)
  favorite: string,                // WRITE ('true' or 'false')
  itemTimestamp: string            // WRITE (CRITICAL - stringified)
}
RAM → Cloud (OneDrive fileId.json):
javascript{
  stack: string,                   // WRITE
  tags: string[],                  // WRITE
  notes: string,                   // WRITE
  qualityRating: number,           // WRITE
  contentRating: number,           // WRITE
  stackSequence: number,           // WRITE
  favorite: boolean,               // WRITE
  itemTimestamp: number,           // WRITE (CRITICAL)
  lastUpdated: string              // WRITE (ISO timestamp for debugging)
}

SUMMARY: NO STALE DATA GUARANTEE

Never display without checking cloud folder version first
If folderVersion matches cache → safe to use cached metadata
If folderVersion differs → fetch changed files based on itemTimestamp
Every metadata change increments both itemTimestamp and folderVersion
IndexedDB is ONLY a cache - cloud is source of truth
Explicit timestamps eliminate reliance on provider metadata

This ensures Device B always sees Device A's changes, and no device ever displays stale data.
