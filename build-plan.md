# Orbital8 V10 Modular Construction Plan

## CRITICAL CONTEXT

**BASE FILE**: refactor-module-a.html (1257 lines) - THIS WORKS, DO NOT TOUCH

**SOURCE FILE**: ui-v10.html (7436 lines) - Extract functionality from here

**REFERENCE**: 5_steps.txt - Architecture philosophy

**Target File**: performance.html

## begin #$
insert module A into target
build module B,C,D,E into target
pay special attention to the smartdata, dumb report concept

do not make assumptions. not sure? ask!!



## WHAT EXISTS (Module A - WORKING)
- Lines 1-154: Complete CSS (DO NOT MODIFY)
- Lines 156-259: Provider/Auth/Folder selection screens (DO NOT MODIFY)
- Lines 268-862: Provider classes (GoogleDriveProvider, OneDriveProvider) (DO NOT MODIFY)
- Lines 878-1225: ModuleA state, initialization, folder loading (DO NOT MODIFY)
- Lines 1236-1244: Framework placeholder that says "FRAMEWORK LOADED ✅"

## WHAT TO ADD (4 Modules B/C/D/E)

### Module B: Sort Mode (Swipe/Flick/Tap/Stack Management)
### Module C: Grid Mode (Selection/Search/Bulk Actions)
### Module D: Detail Mode (Info/Tags/Notes/Metadata)
### Module E: Focus Mode (Keyboard/Favorites/Navigation)

---

## EXTRACTION MAP FROM V10

### CSS Additions Needed (from V10 lines 1-800)
```
Source: ui-v10.html lines 200-600
Target: Insert after line 154 in refactored file
Elements:
- .app-container, .image-viewport, .center-image
- .gesture-layer, .stage, .tri, .half, .hub
- .edge-glow (top/bottom/left/right)
- .pill-counter styles
- .modal, .modal-content, .modal-header styles
- .grid-container, .grid-item, .grid-item-overlay
- .tab-nav, .tab-button, .tab-content
- .star-rating, .tag-chip styles
- Focus mode UI styles
```

### HTML Additions Needed (from V10 lines 900-1140)
```
Source: ui-v10.html lines 900-1140
Target: Replace line 265 (<div id="app-root" class="hidden"></div>)
Elements:
- Main app container (#app-container)
- Image viewport with gesture layers
- Edge glows (4 directions)
- Pill counters (priority/trash/in/out)
- Focus mode buttons/overlays
- Grid modal with toolbar
- Details modal with tabs
- Action modal
```

### JavaScript Module B: Sort Mode
```
Source: ui-v10.html lines 6167-6572 (Gestures module)
Source: ui-v10.html lines 6894-7001 (UI + Events modules)
Target: Insert after line 1244 in refactored file

Key Components:
1. Gestures class
   - setupPointerHandlers()
   - detectTriangle(x, y) - quadrant detection
   - handleFlick(startX, startY, endX, endY)
   - handleDoubleTap()
   
2. Stack management
   - moveToStack(fileId, stack)
   - updatePillCounters()
   - showEdgeGlow(direction)
   
3. Image display
   - loadCurrentImage()
   - preloadNext()
   - handleImageNav(direction)
```

### JavaScript Module C: Grid Mode
```
Source: ui-v10.html lines 5370-5671 (Grid module)
Target: Insert after Module B

Key Components:
1. Grid rendering
   - renderGrid(files, containerSize)
   - createGridItem(file)
   - updateGridLayout()
   
2. Selection system
   - toggleSelection(fileId)
   - selectAll() / deselectAll()
   - getSelectedFiles()
   
3. Search/Filter
   - parseOmniSearch(query)
   - filterFiles(files, query)
   - matchModifiers(file, modifiers)
   
4. Bulk actions
   - bulkTag(), bulkNotes(), bulkMove()
   - bulkDelete(), bulkExport()
```

### JavaScript Module D: Detail Mode  
```
Source: ui-v10.html lines 5671-5863 (Details module)
Source: ui-v10.html lines 1565-1820 (TagService)
Source: ui-v10.html lines 1820-2030 (TagEditor)
Source: ui-v10.html lines 2030-2166 (NotesEditor)
Target: Insert after Module C

Key Components:
1. Details modal
   - openDetails(fileId)
   - populateInfoTab()
   - setupTabSwitching()
   
2. Tag system
   - TagService.normalizeTagValue()
   - TagService.addTagToFiles()
   - TagEditor.render()
   
3. Notes system
   - NotesEditor.open()
   - NotesEditor.save()
   
4. Star ratings
   - setupStarRating(type)
   - updateRating(fileId, type, value)
   
5. Metadata display
   - populateMetadataTable(file)
```

### JavaScript Module E: Focus Mode
```
Source: ui-v10.html lines 6894-7001 (UI module focus functions)
Source: ui-v10.html lines 6572-6894 (Folders module)
Target: Insert after Module D

Key Components:
1. Focus display
   - enterFocusMode()
   - exitFocusMode()
   - loadFocusImage()
   
2. Keyboard navigation
   - handleKeyPress(event)
   - nextImage() / prevImage()
   
3. Focus actions
   - toggleFavorite()
   - quickStack(stackName)
   - deleteFromFocus()
```

---

## INCREMENTAL DELIVERY PLAN

### PHASE 1: CSS + HTML Structure (Test: Visual layout correct)
**File**: `orbital8-v10-phase1.html`
**Action**: 
1. Copy entire `orbital8-refactored__1_.html` → new file
2. Insert CSS additions after line 154
3. Replace line 265 with complete app container HTML
4. Test: Load in browser, should show "FRAMEWORK LOADED ✅" with proper layout

**Validation**:
- ModuleA still works (can authenticate, select folder)
- New HTML structure visible but not functional
- No console errors

---

### PHASE 2: Module B - Sort Mode (Test: Can swipe to move files)
**File**: `orbital8-v10-phase2.html`
**Action**:
1. Start with Phase 1 file
2. After line 1244, add complete Module B code
3. Replace Framework.start() with Module B initialization

**Module B Code Structure**:
```javascript
const ModuleB_Sort = {
    state: {
        currentIndex: 0,
        isDragging: false,
        startX: 0, startY: 0
    },
    
    init() {
        this.setupGestureHandlers();
        this.setupKeyboardNav();
        this.loadImage(0);
    },
    
    setupGestureHandlers() {
        // Extract from ui-v10.html Gestures module
        // Lines 6200-6350 approximately
    },
    
    detectTriangle(x, y) {
        // Quadrant detection logic
        // Lines 6250-6280 from V10
    },
    
    handleFlick(deltaX, deltaY) {
        const stack = this.determineStack(deltaX, deltaY);
        this.moveToStack(stack);
    },
    
    moveToStack(stack) {
        const file = ModuleA.state.files[this.state.currentIndex];
        ModuleA.state.provider.updateUserMetadata(file.id, { stack });
        this.updatePillCounters();
        this.next();
    },
    
    updatePillCounters() {
        // Count files in each stack
        // Update pill counter displays
    },
    
    loadImage(index) {
        const file = ModuleA.state.files[index];
        const img = document.getElementById('center-image');
        img.src = this.getImageUrl(file);
    },
    
    getImageUrl(file) {
        if (ModuleA.state.providerType === 'googledrive') {
            return file.thumbnailLink?.replace('=s220', '=s1000') || 
                   `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`;
        } else {
            return file.thumbnails?.large?.url || file.downloadUrl;
        }
    },
    
    next() {
        if (this.state.currentIndex < ModuleA.state.files.length - 1) {
            this.state.currentIndex++;
            this.loadImage(this.state.currentIndex);
        }
    },
    
    previous() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.loadImage(this.state.currentIndex);
        }
    }
};
```

**Update Framework**:
```javascript
const Framework = {
    start() {
        console.log('🚀 Framework starting');
        document.getElementById('app-container').classList.remove('hidden');
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        ModuleB_Sort.init();
    }
};
```

**Validation**:
- Can load folder, see first image
- Can swipe/flick to move to stacks
- Pill counters update
- Arrow keys navigate
- No console errors

---

### PHASE 3: Module C - Grid Mode (Test: Can view grid, search, select)
**File**: `orbital8-v10-phase3.html`
**Action**:
1. Start with Phase 2 file
2. Add Module C after Module B
3. Add grid modal toggle button

**Module C Code Structure**:
```javascript
const ModuleC_Grid = {
    state: {
        isOpen: false,
        selectedIds: new Set(),
        searchQuery: '',
        gridSize: 4
    },
    
    init() {
        this.setupModalHandlers();
        this.setupSearchHandlers();
        this.setupBulkActionHandlers();
    },
    
    open() {
        this.state.isOpen = true;
        document.getElementById('grid-modal').classList.remove('hidden');
        this.render();
    },
    
    close() {
        this.state.isOpen = false;
        document.getElementById('grid-modal').classList.add('hidden');
    },
    
    render() {
        const files = this.getFilteredFiles();
        const container = document.getElementById('grid-container');
        
        container.innerHTML = files.map(file => this.createGridItemHTML(file)).join('');
        
        // Attach click handlers
        container.querySelectorAll('.grid-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.grid-item-checkbox')) {
                    this.toggleSelection(item.dataset.id);
                } else {
                    ModuleD_Detail.open(item.dataset.id);
                }
            });
        });
    },
    
    createGridItemHTML(file) {
        const isSelected = this.state.selectedIds.has(file.id);
        const imageUrl = ModuleB_Sort.getImageUrl(file);
        
        return `
            <div class="grid-item ${isSelected ? 'selected' : ''}" data-id="${file.id}">
                <img src="${imageUrl}" alt="${file.name}">
                <div class="grid-item-overlay">
                    ${file.stack ? `<span class="grid-item-badge">${file.stack}</span>` : ''}
                    ${file.favorite ? '<span class="grid-item-favorite">★</span>' : ''}
                </div>
                <div class="grid-item-checkbox"></div>
            </div>
        `;
    },
    
    getFilteredFiles() {
        let files = [...ModuleA.state.files];
        
        if (this.state.searchQuery) {
            files = files.filter(f => this.matchesSearch(f, this.state.searchQuery));
        }
        
        return files;
    },
    
    matchesSearch(file, query) {
        const q = query.toLowerCase();
        
        // Check modifiers
        if (q.includes('#favorite') && file.favorite) return true;
        
        const qualityMatch = q.match(/#quality:(\d)/);
        if (qualityMatch && file.qualityRating === parseInt(qualityMatch[1])) return true;
        
        const contentMatch = q.match(/#content:(\d)/);
        if (contentMatch && file.contentRating === parseInt(contentMatch[1])) return true;
        
        // Regular search
        const searchText = q.replace(/#\w+:?\d?/g, '').trim();
        if (!searchText) return false;
        
        const name = (file.name || '').toLowerCase();
        const tags = (file.tags || []).join(' ').toLowerCase();
        
        return name.includes(searchText) || tags.includes(searchText);
    },
    
    toggleSelection(fileId) {
        if (this.state.selectedIds.has(fileId)) {
            this.state.selectedIds.delete(fileId);
        } else {
            this.state.selectedIds.add(fileId);
        }
        this.render();
    },
    
    bulkTag() {
        // Implementation from V10 lines 5500-5550
    },
    
    bulkMove() {
        // Implementation from V10 lines 5550-5600
    },
    
    bulkDelete() {
        // Implementation from V10 lines 5600-5650
    }
};
```

**Add Grid Toggle Button**:
```javascript
// In ModuleB_Sort.init(), add:
document.getElementById('details-button').addEventListener('click', () => {
    ModuleC_Grid.open();
});
```

**Validation**:
- Click "Details" button opens grid
- Grid displays all images
- Can select/deselect images
- Search filters correctly
- Bulk actions work
- Can close grid and return to sort mode

---

### PHASE 4: Module D - Detail Mode (Test: Can edit tags, notes, ratings)
**File**: `orbital8-v10-phase4.html`
**Action**:
1. Start with Phase 3 file
2. Add TagService, TagEditor, NotesEditor helper modules
3. Add Module D after Module C

**Helper Modules**:
```javascript
const TagService = {
    normalizeTagValue(tag) {
        const trimmed = (tag || '').trim();
        if (!trimmed) return '';
        const normalized = trimmed.toLowerCase().replace(/\s+/g, '-');
        const firstCharIndex = normalized.search(/[^#]/);
        return firstCharIndex === 0 ? '#' + normalized : normalized;
    },
    
    addTagToFiles(fileIds, tag) {
        const normalized = this.normalizeTagValue(tag);
        fileIds.forEach(id => {
            const file = ModuleA.state.files.find(f => f.id === id);
            if (!file) return;
            
            file.tags = file.tags || [];
            if (!file.tags.includes(normalized)) {
                file.tags.push(normalized);
                ModuleA.state.provider.updateUserMetadata(id, { tags: file.tags });
            }
        });
    },
    
    removeTagFromFiles(fileIds, tag) {
        const normalized = this.normalizeTagValue(tag);
        fileIds.forEach(id => {
            const file = ModuleA.state.files.find(f => f.id === id);
            if (!file) return;
            
            file.tags = (file.tags || []).filter(t => t !== normalized);
            ModuleA.state.provider.updateUserMetadata(id, { tags: file.tags });
        });
    }
};
```

**Module D Code Structure**:
```javascript
const ModuleD_Detail = {
    currentFileId: null,
    
    init() {
        this.setupTabHandlers();
        this.setupStarRatings();
        this.setupCloseHandler();
    },
    
    open(fileId) {
        this.currentFileId = fileId;
        const file = ModuleA.state.files.find(f => f.id === fileId);
        if (!file) return;
        
        this.populateInfo(file);
        this.populateTags(file);
        this.populateNotes(file);
        this.populateMetadata(file);
        
        document.getElementById('details-modal').classList.remove('hidden');
    },
    
    close() {
        document.getElementById('details-modal').classList.add('hidden');
    },
    
    populateInfo(file) {
        document.getElementById('detail-filename').textContent = file.name;
        document.getElementById('detail-filename-link').href = ModuleB_Sort.getImageUrl(file);
        document.getElementById('detail-date').textContent = new Date(file.modifiedTime).toLocaleDateString();
        document.getElementById('detail-size').textContent = this.formatFileSize(file.size);
    },
    
    populateTags(file) {
        const container = document.getElementById('detail-tags');
        const tags = file.tags || [];
        
        container.innerHTML = tags.map(tag => `
            <div class="tag-chip">
                <span>${tag}</span>
                <button onclick="ModuleD_Detail.removeTag('${tag}')">×</button>
            </div>
        `).join('');
        
        // Add tag input handler
        const input = document.getElementById('detail-tags-input');
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const newTags = input.value.split(',').map(t => t.trim()).filter(Boolean);
                newTags.forEach(tag => TagService.addTagToFiles([this.currentFileId], tag));
                this.populateTags(ModuleA.state.files.find(f => f.id === this.currentFileId));
                input.value = '';
            }
        };
    },
    
    removeTag(tag) {
        TagService.removeTagFromFiles([this.currentFileId], tag);
        this.populateTags(ModuleA.state.files.find(f => f.id === this.currentFileId));
    },
    
    populateNotes(file) {
        const textarea = document.getElementById('detail-notes');
        textarea.value = file.notes || '';
        
        // Auto-save on blur
        textarea.onblur = () => {
            file.notes = textarea.value;
            ModuleA.state.provider.updateUserMetadata(file.id, { notes: file.notes });
        };
    },
    
    setupStarRatings() {
        ['quality', 'content'].forEach(type => {
            const container = document.getElementById(`${type}-rating`);
            const stars = container.querySelectorAll('.star');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const rating = index + 1;
                    const file = ModuleA.state.files.find(f => f.id === this.currentFileId);
                    file[`${type}Rating`] = rating;
                    ModuleA.state.provider.updateUserMetadata(file.id, { [`${type}Rating`]: rating });
                    this.updateStarDisplay(type, rating);
                });
            });
        });
    },
    
    updateStarDisplay(type, rating) {
        const container = document.getElementById(`${type}-rating`);
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < rating);
        });
    },
    
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
};
```

**Validation**:
- Click on grid item opens details
- Can add/remove tags
- Can edit notes (auto-saves)
- Can set star ratings
- Metadata displays correctly
- Changes persist to provider

---

### PHASE 5: Module E - Focus Mode (Test: Keyboard nav, favorites)
**File**: `orbital8-v10-phase5-FINAL.html`
**Action**:
1. Start with Phase 4 file
2. Add Module E after Module D
3. Wire up mode switching

**Module E Code Structure**:
```javascript
const ModuleE_Focus = {
    state: {
        isActive: false,
        currentIndex: 0
    },
    
    init() {
        this.setupKeyboardNav();
        this.setupHubDoubleTap();
    },
    
    enter() {
        this.state.isActive = true;
        this.state.currentIndex = ModuleB_Sort.state.currentIndex;
        
        document.getElementById('gesture-screen-a').hidden = true;
        document.getElementById('gesture-screen-b').hidden = false;
        
        this.loadImage();
        this.updateUI();
    },
    
    exit() {
        this.state.isActive = false;
        
        document.getElementById('gesture-screen-a').hidden = false;
        document.getElementById('gesture-screen-b').hidden = true;
        
        ModuleB_Sort.state.currentIndex = this.state.currentIndex;
        ModuleB_Sort.loadImage(this.state.currentIndex);
    },
    
    loadImage() {
        const file = ModuleA.state.files[this.state.currentIndex];
        const img = document.getElementById('center-image');
        img.src = ModuleB_Sort.getImageUrl(file);
    },
    
    updateUI() {
        const file = ModuleA.state.files[this.state.currentIndex];
        
        document.getElementById('focus-stack-name').textContent = file.stack || 'unassigned';
        document.getElementById('focus-image-count').textContent = 
            `${this.state.currentIndex + 1}/${ModuleA.state.files.length}`;
        
        const favIcon = document.getElementById('focus-favorite-icon');
        favIcon.style.color = file.favorite ? '#fbbf24' : 'white';
    },
    
    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (!this.state.isActive) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    this.next();
                    break;
                case 'ArrowLeft':
                case 'Backspace':
                    e.preventDefault();
                    this.previous();
                    break;
                case 'f':
                    this.toggleFavorite();
                    break;
                case 'Delete':
                    this.deleteFile();
                    break;
                case 'Escape':
                    this.exit();
                    break;
            }
        });
    },
    
    setupHubDoubleTap() {
        let lastTap = 0;
        
        document.getElementById('gesture-hub-b').addEventListener('click', () => {
            const now = Date.now();
            if (now - lastTap < 300) {
                this.exit();
            }
            lastTap = now;
        });
    },
    
    next() {
        if (this.state.currentIndex < ModuleA.state.files.length - 1) {
            this.state.currentIndex++;
            this.loadImage();
            this.updateUI();
        }
    },
    
    previous() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.loadImage();
            this.updateUI();
        }
    },
    
    toggleFavorite() {
        const file = ModuleA.state.files[this.state.currentIndex];
        file.favorite = !file.favorite;
        ModuleA.state.provider.updateUserMetadata(file.id, { favorite: file.favorite });
        this.updateUI();
    },
    
    deleteFile() {
        const file = ModuleA.state.files[this.state.currentIndex];
        file.stack = 'trash';
        ModuleA.state.provider.updateUserMetadata(file.id, { stack: 'trash' });
        this.next();
    }
};

// Wire up mode switching - add to ModuleB_Sort.init():
let lastHubTap = 0;
document.getElementById('gesture-hub-a').addEventListener('click', () => {
    const now = Date.now();
    if (now - lastHubTap < 300) {
        ModuleE_Focus.enter();
    }
    lastHubTap = now;
});
```

**Final Framework Update**:
```javascript
const Framework = {
    start() {
        console.log('🚀 Framework starting with', ModuleA.state.files.length, 'files');
        
        // Hide all screens, show app
        document.getElementById('app-container').classList.remove('hidden');
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        
        // Initialize all modules
        ModuleB_Sort.init();
        ModuleC_Grid.init();
        ModuleD_Detail.init();
        ModuleE_Focus.init();
        
        console.log('✅ All modules loaded');
    }
};
```

**Validation**:
- Double-tap hub in sort mode enters focus mode
- Arrow keys navigate in focus mode
- F key toggles favorite
- Delete moves to trash
- Double-tap hub exits focus mode
- All modes work together seamlessly

---

## CONFIGURATION FLAGS

Add at top of each module for easy toggling:

```javascript
const CONFIG = {
    SORT_MODULE: 1,
    GRID_MODULE: 1,
    DETAIL_MODULE: 1,
    FOCUS_MODULE: 1,
    VISUAL_EFFECTS: 1,
    HAPTIC_FEEDBACK: 1,
    DEBUG_TOASTS: 1
};

// Usage in Framework.start():
if (CONFIG.SORT_MODULE) ModuleB_Sort.init();
if (CONFIG.GRID_MODULE) ModuleC_Grid.init();
// etc.
```

---

## EXACT EXTRACTION REFERENCES

### For CSS (Phase 1):
```
Lines in ui-v10.html to extract:
- 200-250: .app-container, .image-viewport, .center-image, .zoomable
- 250-300: .gesture-layer, .stage, .tri, .half, .hub
- 300-350: .edge-glow styles
- 350-400: .pill-counter styles
- 450-550: .modal styles
- 600-650: .grid-container, .grid-item styles
- 700-750: .tab-nav, .tab-button, .tab-content
- 750-800: .star-rating, .tag-chip
```

### For HTML (Phase 1):
```
Lines in ui-v10.html to extract:
- 900-968: Complete app-container structure
- Includes: image viewport, gesture layers, edge glows, pills, focus buttons
- 971-1042: Grid modal structure
- 1045-1054: Action modal structure
- 1057-1138: Details modal structure
```

### For Module B (Phase 2):
```
Lines in ui-v10.html to extract:
- 6167-6250: Gestures class setup
- 6250-6350: Triangle detection + flick handling
- 6350-6450: Pointer event handlers
- 6450-6572: Edge glow + pill counter updates
- 6894-6950: Image loading functions
- 6950-7001: Keyboard navigation
```

### For Module C (Phase 3):
```
Lines in ui-v10.html to extract:
- 5370-5450: Grid rendering
- 5450-5520: Selection system
- 5520-5590: Search/filter with modifiers
- 5590-5671: Bulk actions (tag/move/delete/export)
```

### For Module D (Phase 4):
```
Lines in ui-v10.html to extract:
- 1565-1660: TagService methods
- 1820-1950: TagEditor implementation
- 2030-2166: NotesEditor implementation
- 5671-5750: Details modal setup
- 5750-5820: Star rating handlers
- 5820-5863: Metadata display
```

### For Module E (Phase 5):
```
Lines in ui-v10.html to extract:
- 6894-6960: Focus mode UI updates
- 6960-7001: Keyboard handlers for focus
- Integration with gesture-screen-b
- Hub double-tap detection
```

---

## TESTING PROTOCOL

### After Each Phase:
1. Open file in browser
2. Open DevTools console
3. Verify no errors
4. Test features from that phase
5. Document any issues
6. If clean, proceed to next phase

### If Phase Fails:
1. Check console for specific error
2. Verify line numbers match extraction map
3. Check ModuleA.state.files has data
4. Verify provider methods still work
5. Isolate problem function
6. Fix and re-test before proceeding

---

## HANDOFF TO NEXT SESSION

When running out of tokens, provide:

```markdown
## Session Handoff

**Current Phase Completed**: Phase X
**File Delivered**: orbital8-v10-phaseX.html
**Validation Status**: [PASS/FAIL + details]

**Next Steps**:
1. Start with orbital8-v10-phaseX.html as base
2. Implement Phase X+1 per CONSTRUCTION_PLAN.md
3. Extract specific lines from ui-v10.html as indicated
4. Test validation criteria
5. Deliver orbital8-v10-phaseX+1.html

**Known Issues**: [List any]
**Deviations from Plan**: [List any]
```

---

## FINAL DELIVERABLE REQUIREMENTS

The Phase 5 file must:
- Be single HTML file
- Have all CSS at top (lines 1-XXX)
- Have all HTML structure (lines XXX-YYY)
- Have Module A unchanged (lines YYY-1244)
- Have Module B-E after Framework (lines 1245+)
- Have CONFIG object at line 1246
- Have all functionality from V10
- Use same visual design as V10
- Maintain ModuleA provider abstraction
- Work with both Google Drive and OneDrive

**Total estimated line count**: ~3500-4000 lines
**Critical**: ModuleA must remain functional through all phases

---

## FILE NAMING CONVENTION

- `orbital8-v10-phase1.html` - CSS + HTML only
- `orbital8-v10-phase2.html` - + Module B (Sort)
- `orbital8-v10-phase3.html` - + Module C (Grid)
- `orbital8-v10-phase4.html` - + Module D (Detail)
- `orbital8-v10-phase5-FINAL.html` - + Module E (Focus) - COMPLETE

Save all phase files for rollback capability.

---

END OF CONSTRUCTION PLAN
