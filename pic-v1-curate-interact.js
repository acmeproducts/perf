// ===== pic-v1-curate-interact.js =====
// Gestures, Details, Modal, UI, DraggableResizable
// Extracted verbatim from ui-v1.html (Orbital8 Goji V1 Canonical)

const Gestures = {
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    startTimestamp: 0,
    gestureStarted: false,
    edgeElements: [],
    hubPressActive: false,
    overlay: null,
    lastHubTap: { time: 0, x: 0, y: 0 },
    tapHandled: false,
    DOUBLE_TAP_MAX_INTERVAL: 320,
    DOUBLE_TAP_MAX_DISTANCE: 28,
    TAP_DISTANCE_THRESHOLD: 26,
    TAP_DURATION_THRESHOLD: 260,
    TRAIL_INTERVAL_MS: 12,
    TRAIL_LIFETIME_MS: 1050,
    trailThrottle: null,
    ignoreMouseEvents: false,
    init() {
        this.edgeElements = [Utils.elements.edgeTop, Utils.elements.edgeBottom, Utils.elements.edgeLeft, Utils.elements.edgeRight];
        this.setupEventListeners();
        this.setupPinchZoom();
        this.initGestureOverlay();
    },
    setupEventListeners() {
        Utils.elements.imageViewport.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        Utils.elements.imageViewport.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.handleEnd.bind(this), { passive: false });
    },
    setupPinchZoom() {
        Utils.elements.centerImage.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        Utils.elements.centerImage.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        Utils.elements.centerImage.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        Utils.elements.centerImage.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    },
    initGestureOverlay() {
        this.overlay = {
            layer: Utils.elements.gestureLayer,
            screenA: Utils.elements.gestureScreenA,
            screenB: Utils.elements.gestureScreenB,
            tri: {
                up: Utils.elements.gestureTriUp,
                right: Utils.elements.gestureTriRight,
                down: Utils.elements.gestureTriDown,
                left: Utils.elements.gestureTriLeft
            },
            half: {
                left: Utils.elements.gestureHalfLeft,
                right: Utils.elements.gestureHalfRight
            }
        };
        this.updateGestureOverlayMode();
    },
    spawnTrail(clientX, clientY) {
        if (!this.overlay?.layer) return;
        const rect = this.overlay.layer.getBoundingClientRect();
        const trail = document.createElement('div');
        trail.className = 'comet-trail';
        trail.style.left = `${clientX - rect.left}px`;
        trail.style.top = `${clientY - rect.top}px`;
        this.overlay.layer.appendChild(trail);
        setTimeout(() => trail.remove(), this.TRAIL_LIFETIME_MS);
    },
    spawnRipple(clientX, clientY) {
        if (!this.overlay?.layer) return;
        const rect = this.overlay.layer.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'tap-ripple';
        ripple.style.left = `${clientX - rect.left}px`;
        ripple.style.top = `${clientY - rect.top}px`;
        this.overlay.layer.appendChild(ripple);
        setTimeout(() => ripple.remove(), 560);
    },
    queueTrail(clientX, clientY) {
        if (this.trailThrottle) return;
        this.spawnTrail(clientX, clientY);
        this.trailThrottle = setTimeout(() => { this.trailThrottle = null; }, this.TRAIL_INTERVAL_MS);
    },
    flashElement(el) {
        if (!el) return;
        if (el._glowTimeout) clearTimeout(el._glowTimeout);
        if (el._deglowTimeout) clearTimeout(el._deglowTimeout);
        el.classList.add('glow');
        el.classList.remove('deglow');
        el._glowTimeout = setTimeout(() => {
            el.classList.remove('glow');
            el.classList.add('deglow');
            el._deglowTimeout = setTimeout(() => { el.classList.remove('deglow'); }, 260);
        }, 220);
    },
    highlightSortDirection(direction) {
        if (!this.overlay || !this.overlay.tri) return;
        this.flashElement(this.overlay.tri[direction]);
    },
    highlightFocusDirection(direction) {
        if (!this.overlay || !this.overlay.half) return;
        this.flashElement(this.overlay.half[direction]);
    },
    updateGestureOverlayMode() {
        if (!this.overlay) return;
        const focus = state.isFocusMode;
        if (this.overlay.screenA) {
            this.overlay.screenA.toggleAttribute('hidden', focus);
            this.overlay.screenA.setAttribute('aria-hidden', focus ? 'true' : 'false');
        }
        if (this.overlay.screenB) {
            this.overlay.screenB.toggleAttribute('hidden', !focus);
            this.overlay.screenB.setAttribute('aria-hidden', focus ? 'false' : 'true');
        }
    },
    isInHub(clientX, clientY) {
        const viewport = Utils.elements.imageViewport;
        if (!viewport) return false;
        const rect = viewport.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const radius = Math.min(rect.width, rect.height) * 0.12;
        return Math.hypot(clientX - cx, clientY - cy) <= radius;
    },
    pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        const v0x = cx - ax, v0y = cy - ay;
        const v1x = bx - ax, v1y = by - ay;
        const v2x = px - ax, v2y = py - ay;
        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;
        const invDen = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDen;
        const v = (dot00 * dot12 - dot01 * dot02) * invDen;
        return (u >= 0) && (v >= 0) && (u + v <= 1);
    },
    hitTriangle(clientX, clientY) {
        const viewport = Utils.elements.imageViewport;
        if (!viewport) return null;
        const rect = viewport.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const fx = (clientX - rect.left) / rect.width;
        const fy = (clientY - rect.top) / rect.height;
        const clamp = (val) => Math.max(0, Math.min(1, val));
        const px = clamp(fx);
        const py = clamp(fy);
        const cx = 0.5, cy = 0.5;
        const inUp = this.pointInTriangle(px, py, 0, 0, 1, 0, cx, cy);
        const inRight = this.pointInTriangle(px, py, 1, 0, 1, 1, cx, cy);
        const inDown = this.pointInTriangle(px, py, 0, 1, 1, 1, cx, cy);
        const inLeft = this.pointInTriangle(px, py, 0, 0, 0, 1, cx, cy);
        if (inUp && !inRight && !inDown && !inLeft) return 'up';
        if (inRight && !inUp && !inDown && !inLeft) return 'right';
        if (inDown && !inUp && !inRight && !inLeft) return 'down';
        if (inLeft && !inUp && !inRight && !inDown) return 'left';
        if (inUp || inRight || inDown || inLeft) {
            const dx = px - 0.5;
            const dy = py - 0.5;
            if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
            return dy > 0 ? 'down' : 'up';
        }
        return null;
    },
    handleTap(clientX, clientY) {
        if (state.isFocusMode) {
            const viewport = Utils.elements.imageViewport;
            if (!viewport) return;
            const rect = viewport.getBoundingClientRect();
            if (!rect.width) return;
            const fx = (clientX - rect.left) / rect.width;
            const direction = fx < 0.5 ? 'left' : 'right';
            this.highlightFocusDirection(direction);
            if (direction === 'left') { this.prevImage(); }
            else { this.nextImage(); }
            return;
        }
        const dir = this.hitTriangle(clientX, clientY);
        if (!dir) return;
        this.highlightSortDirection(dir);
        const mapped = dir === 'up' ? 'top' : dir === 'down' ? 'bottom' : dir;
        const targetStack = this.directionToStack(mapped);
        if (targetStack) this.executeFlick(targetStack);
    },
    showEdgeGlow(direction) {
        this.edgeElements.forEach(edge => edge.classList.remove('active'));
        if (Utils.elements[`edge${direction.charAt(0).toUpperCase() + direction.slice(1)}`]) {
            Utils.elements[`edge${direction.charAt(0).toUpperCase() + direction.slice(1)}`].classList.add('active');
        }
    },
    hideAllEdgeGlows() { this.edgeElements.forEach(edge => edge.classList.remove('active')); },
    determineSwipeDirection(deltaX, deltaY) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) { return deltaX > 0 ? 'right' : 'left'; } else { return deltaY > 0 ? 'bottom' : 'top'; }
    },
    directionToStack(direction) {
        const mapping = { 'top': 'priority', 'bottom': 'trash', 'left': 'in', 'right': 'out', 'up': 'priority', 'down': 'trash' };
        return mapping[direction];
    },
    async executeFlick(targetStack) {
        if (state.stacks[state.currentStack].length === 0) return;
        try {
            UI.acknowledgePillCounter(targetStack);
            if (state.haptic) { state.haptic.triggerFeedback('swipe'); }
            await Core.moveToStack(targetStack, { source: 'gesture:flick' });
            this.hideAllEdgeGlows();
        } catch(error) {
            Utils.showToast(`Flick failed: ${error.message}`, 'error', true);
        }
    },
    handleStart(e) {
        const isTouchEvent = e.type && e.type.startsWith('touch');
        if (isTouchEvent) {
            this.ignoreMouseEvents = true;
        } else if (this.ignoreMouseEvents) {
            return;
        }
        this.tapHandled = false;
        if (e.touches && (e.touches.length > 1 || state.isPinching)) return;
        if (state.currentScale > 1.1) return;
        const point = e.touches ? e.touches[0] : e;
        const hubInteraction = this.isInHub(point.clientX, point.clientY);
        if (!hubInteraction && state.stacks[state.currentStack].length === 0) return;
        this.startPos = { x: point.clientX, y: point.clientY };
        this.currentPos = { x: point.clientX, y: point.clientY };
        this.startTimestamp = performance.now();
        this.gestureStarted = false;
        state.isDragging = true;
        this.hubPressActive = hubInteraction;
        if (!hubInteraction) {
            Utils.elements.centerImage.classList.add('dragging');
        }
        this.spawnRipple(point.clientX, point.clientY);
        this.queueTrail(point.clientX, point.clientY);
    },
    handleMove(e) {
        if (!state.isDragging) return;
        if (e.touches && e.touches.length > 1) {
            state.isDragging = false; Utils.elements.centerImage.classList.remove('dragging');
            this.hideAllEdgeGlows(); return;
        }
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        this.currentPos = { x: point.clientX, y: point.clientY };
        this.queueTrail(point.clientX, point.clientY);
        if (this.hubPressActive) { return; }
        if (state.imageFiles.length === 0) return;
        const deltaX = this.currentPos.x - this.startPos.x;
        const deltaY = this.currentPos.y - this.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > 30) {
            this.gestureStarted = true;
            if(!state.isFocusMode) {
                const direction = this.determineSwipeDirection(deltaX, deltaY);
                if (direction) { this.hideAllEdgeGlows(); this.showEdgeGlow(direction); }
            }
        } else {
            if(!state.isFocusMode) this.hideAllEdgeGlows();
        }
    },
    handleEnd(e) {
        const isTouchEvent = e.type && e.type.startsWith('touch');
        if (isTouchEvent) {
            setTimeout(() => { this.ignoreMouseEvents = false; }, 400);
        }
        if (!state.isDragging) return;
        state.isDragging = false;
        Utils.elements.centerImage.classList.remove('dragging');
        const point = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;
        if (point) { this.currentPos = { x: point.clientX, y: point.clientY }; }
        this.spawnTrail(this.currentPos.x, this.currentPos.y);
        const deltaX = this.currentPos.x - this.startPos.x;
        const deltaY = this.currentPos.y - this.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const now = performance.now();
        const duration = now - this.startTimestamp;
        const isTap = distance < this.TAP_DISTANCE_THRESHOLD && duration < this.TAP_DURATION_THRESHOLD;

        if (this.hubPressActive) {
            if (isTap) {
                if (this.lastHubTap.time && (now - this.lastHubTap.time) <= this.DOUBLE_TAP_MAX_INTERVAL) {
                    const tapDistance = Math.hypot(this.lastHubTap.x - this.currentPos.x, this.lastHubTap.y - this.currentPos.y);
                    if (tapDistance <= this.DOUBLE_TAP_MAX_DISTANCE) {
                        this.spawnRipple(this.currentPos.x, this.currentPos.y);
                        this.toggleFocusMode();
                        if (state.haptic) { state.haptic.triggerFeedback('buttonPress'); }
                        this.lastHubTap = { time: 0, x: 0, y: 0 };
                    } else {
                        this.lastHubTap = { time: now, x: this.currentPos.x, y: this.currentPos.y };
                    }
                } else {
                    this.lastHubTap = { time: now, x: this.currentPos.x, y: this.currentPos.y };
                }
            } else {
                this.lastHubTap = { time: 0, x: 0, y: 0 };
            }
            this.hideAllEdgeGlows();
            this.hubPressActive = false;
            this.gestureStarted = false;
            return;
        }

        if (distance > 80) {
            if (state.isFocusMode) {
                const direction = deltaX > 0 ? 'right' : 'left';
                this.highlightFocusDirection(direction);
                if (deltaX > 0) { this.nextImage(); }
                else { this.prevImage(); }
            } else {
                const direction = this.determineSwipeDirection(deltaX, deltaY);
                const targetStack = this.directionToStack(direction);
                if (targetStack && direction) {
                    const triDir = direction === 'top' ? 'up' : direction === 'bottom' ? 'down' : direction;
                    this.highlightSortDirection(triDir);
                    this.executeFlick(targetStack);
                }
            }
        } else if (!this.gestureStarted && isTap) {
            if (!this.tapHandled) {
                this.tapHandled = true;
                this.spawnRipple(this.currentPos.x, this.currentPos.y);
                this.handleTap(this.currentPos.x, this.currentPos.y);
            }
        }
        this.hideAllEdgeGlows();
        this.hubPressActive = false;
        this.gestureStarted = false;
    },
    getDistance(touch1, touch2) { const dx = touch1.clientX - touch2.clientX; const dy = touch1.clientY - touch2.clientY; return Math.sqrt(dx * dx + dy * dy); },
    getCenter(touch1, touch2) { return { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 }; },
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            e.preventDefault(); state.isPinching = true;
            state.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            state.lastTouchPos = this.getCenter(e.touches[0], e.touches[1]);
        } else if (e.touches.length === 1 && state.currentScale > 1) { state.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    },
    handleTouchMove(e) {
        if (e.touches.length === 2 && state.isPinching) {
            e.preventDefault();
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scaleFactor = currentDistance / state.initialDistance;
            let newScale = state.currentScale * scaleFactor;
            newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
            state.currentScale = newScale; state.initialDistance = currentDistance; Core.applyTransform();
        } else if (e.touches.length === 1 && state.currentScale > 1) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - state.lastTouchPos.x;
            const deltaY = e.touches[0].clientY - state.lastTouchPos.y;
            state.panOffset.x += deltaX / state.currentScale;
            state.panOffset.y += deltaY / state.currentScale;
            state.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; Core.applyTransform();
        }
    },
    handleTouchEnd(e) {
        if (e.touches.length < 2) { state.isPinching = false; }
        if (state.currentScale < 1.1) { state.currentScale = 1; state.panOffset = { x: 0, y: 0 }; Core.applyTransform(); }
    },
    handleWheel(e) {
        e.preventDefault();
        const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
        let newScale = state.currentScale * scaleChange;
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
        state.currentScale = newScale;
        if (state.currentScale <= 1.1) { state.currentScale = 1; state.panOffset = { x: 0, y: 0 }; }
        Core.applyTransform();
    },
    toggleFocusMode() {
        state.isFocusMode = !state.isFocusMode;
        Utils.elements.appContainer.classList.toggle('focus-mode', state.isFocusMode);
        this.updateGestureOverlayMode();
        if (!state.isFocusMode) {
            const currentStackArray = state.stacks[state.currentStack];
            if (currentStackArray && currentStackArray.length > 0) {
                if (state.currentStackPosition >= currentStackArray.length) {
                    state.currentStackPosition = currentStackArray.length - 1;
                } else if (state.currentStackPosition < 0) {
                    state.currentStackPosition = 0;
                }
            } else {
                state.currentStackPosition = 0;
            }
            Core.displayCurrentImage();
        }
        Core.updateImageCounters();
        this.lastHubTap = { time: 0, x: 0, y: 0 };
    },
    async nextImage() {
        const stack = state.stacks[state.currentStack];
        if (stack.length === 0) return;
        state.currentStackPosition = (state.currentStackPosition + 1) % stack.length;
        await Core.displayCurrentImage();
    },
    async prevImage() {
        const stack = state.stacks[state.currentStack];
        if (stack.length === 0) return;
        state.currentStackPosition = (state.currentStackPosition - 1 + stack.length) % stack.length;
        await Core.displayCurrentImage();
    },
    async deleteCurrentImage() {
        await Core.deleteCurrentImage({ exitFocusIfEmpty: true, source: 'gesture:shortcut' });
    }
};

const Details = {
    tagEditor: null,
    notesEditor: null,
    currentTab: 'info',
    async show() {
        try {
            const currentFile = state.stacks[state.currentStack][state.currentStackPosition];
            if (!currentFile) return;
            if (currentFile.metadataStatus !== 'loaded') {
                this.populateMetadataTab(currentFile);
                await App.processFileMetadata(currentFile);
            }
            this.populateAllTabs(currentFile);
            Utils.showModal('details-modal');
            this.switchTab('info');
        } catch (error) {
            Utils.showToast(`Error showing details: ${error.message}`, 'error', true);
        }
    },
    hide() { Utils.hideModal('details-modal'); },
    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => { btn.classList.toggle('active', btn.dataset.tab === tabName); });
        document.querySelectorAll('.tab-content').forEach(content => { content.classList.toggle('active', content.id === `tab-${tabName}`); });
        this.currentTab = tabName;
    },
    populateAllTabs(file) {
        this.populateInfoTab(file); this.populateTagsTab(file); this.populateNotesTab(file); this.populateMetadataTab(file);
    },
    populateInfoTab(file) {
        const filename = file.name || 'Unknown';
        Utils.elements.detailFilename.textContent = filename;
        if (state.providerType === 'googledrive') { Utils.elements.detailFilenameLink.href = DriveLinkHelper.resolveAssetUrls(file).viewUrl || '#';
        } else { Utils.elements.detailFilenameLink.href = file.downloadUrl || '#'; }
        Utils.elements.detailFilenameLink.style.display = 'inline';
        const date = file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Unknown';
        Utils.elements.detailDate.textContent = date;
        const size = file.size ? Utils.formatFileSize(file.size) : 'Unknown';
        Utils.elements.detailSize.textContent = size;
    },
    getTargetFileIds(baseId) {
        const selected = state.grid.selected && state.grid.selected.length > 0 ? [...state.grid.selected] : [];
        if (baseId && !selected.includes(baseId)) { selected.push(baseId); }
        return TagService.normalizeIds(selected);
    },
    populateTagsTab(file) {
        const container = Utils.elements.detailTags;
        if (!container) return;
        if (this.tagEditor) { this.tagEditor.destroy(); this.tagEditor = null; }
        const targetIds = this.getTargetFileIds(file?.id);
        container.classList.add('tag-editor-container');
        container.innerHTML = '';
        const assignedSection = document.createElement('div');
        assignedSection.className = 'tag-section';
        const assignedTitle = document.createElement('div');
        assignedTitle.className = 'tag-section-title';
        assignedTitle.textContent = 'Assigned Tags';
        const chipList = document.createElement('div');
        chipList.className = 'tag-chip-list';
        assignedSection.appendChild(assignedTitle);
        assignedSection.appendChild(chipList);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tag-input';
        input.placeholder = 'Enter tags separated by commas - non-# tags are auto-prefixed when you press Enter';
        const recentSection = document.createElement('div');
        recentSection.className = 'tag-section';
        const recentTitle = document.createElement('div');
        recentTitle.className = 'tag-section-title';
        recentTitle.textContent = 'Recently Used Tags';
        const recentList = document.createElement('div');
        recentList.className = 'tag-chip-list';
        recentSection.appendChild(recentTitle);
        recentSection.appendChild(recentList);
        const message = document.createElement('div');
        message.className = 'tag-editor-note';
        message.textContent = targetIds.length > 1 ? `Changes apply to ${targetIds.length} selected images.` : 'Changes apply to this image.';
        container.appendChild(assignedSection);
        container.appendChild(input);
        container.appendChild(recentSection);
        container.appendChild(message);
        this.tagEditor = TagEditor.create({
            container: chipList, input, recentContainer: recentList,
            targetIds, placeholder: input.placeholder
        });
        input.focus();
    },
    populateNotesTab(file) {
        const tab = document.getElementById('tab-notes');
        if (!tab) return;
        if (this.notesEditor) { this.notesEditor.destroy(); this.notesEditor = null; }
        const targetIds = this.getTargetFileIds(file?.id);
        let message = tab.querySelector('.tag-editor-note');
        if (!message) {
            message = document.createElement('div');
            message.className = 'tag-editor-note';
            message.style.marginBottom = '12px';
            tab.insertBefore(message, tab.firstChild);
        }
        message.textContent = targetIds.length > 1 ? `Changes apply to ${targetIds.length} selected images.` : 'Changes apply to this image.';
        this.notesEditor = NotesEditor.create({
            root: tab, targetIds, mode: 'immediate',
            initialValues: { notes: file.notes || '', qualityRating: file.qualityRating || 0, contentRating: file.contentRating || 0 }
        });
    },
    populateMetadataTab(file) {
        Utils.elements.metadataTable.innerHTML = '';
        if (file.metadataStatus !== 'loaded' && file.metadataStatus !== 'error') {
            Utils.elements.metadataTable.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>';
            return;
        }
        const metadata = file.extractedMetadata || {};
        if (Object.keys(metadata).length === 0) {
            this.addMetadataRow('Status', 'No embedded metadata found', false);
            return;
        }
        const priorityFields = ['prompt', 'Prompt', 'model', 'Model', 'seed', 'Seed', 'negative_prompt', 'Negative_Prompt', 'steps', 'Steps', 'cfg_scale', 'CFG_Scale', 'sampler', 'Sampler', 'scheduler', 'Scheduler', 'api_call', 'API_Call'];
        priorityFields.forEach(field => { if (metadata[field]) { this.addMetadataRow(field, metadata[field], true); } });
        const remainingFields = Object.entries(metadata).filter(([key, value]) => !priorityFields.includes(key) && !priorityFields.includes(key.toLowerCase()) && value);
        if (priorityFields.some(field => metadata[field]) && remainingFields.length > 0) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = '<td colspan="2" style="padding: 8px; background: #f0f0f0; text-align: center; font-size: 12px; color: #666; font-weight: bold;">Other Metadata</td>';
            Utils.elements.metadataTable.appendChild(separatorRow);
        }
        remainingFields.forEach(([key, value]) => { this.addMetadataRow(key, value, false); });
        if (Object.keys(metadata).length > 0) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = '<td colspan="2" style="padding: 8px; background: #f0f0f0; text-align: center; font-size: 12px; color: #666; font-weight: bold;">File Information</td>';
            Utils.elements.metadataTable.appendChild(separatorRow);
        }
        this.addMetadataRow('File Name', file.name || 'Unknown', false);
        this.addMetadataRow('File Size', file.size ? Utils.formatFileSize(file.size) : 'Unknown', false);
        this.addMetadataRow('MIME Type', file.mimeType || 'Unknown', false);
        this.addMetadataRow('Created', file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Unknown', false);
        this.addMetadataRow('Modified', file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown', false);
        this.addMetadataRow('Provider', state.providerType === 'googledrive' ? 'Google Drive' : 'OneDrive', false);
    },
    addMetadataRow(key, value, needsCopyButton = false) {
        const row = document.createElement('tr');
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let formattedValue = String(value);
        if (formattedValue.length > 200) { formattedValue = formattedValue.replace(/,\s+/g, ',\n').replace(/\.\s+/g, '.\n').replace(/;\s+/g, ';\n').trim();
        } else if (formattedValue.length > 100) { formattedValue = formattedValue.replace(/\s+/g, ' ').trim(); }
        const keyCell = document.createElement('td');
        keyCell.className = 'key-cell'; keyCell.textContent = formattedKey;
        const valueCell = document.createElement('td');
        valueCell.className = 'value-cell';
        if (formattedValue.length > 500) { valueCell.style.maxHeight = '120px'; valueCell.style.overflowY = 'auto'; valueCell.style.fontSize = '12px'; valueCell.style.lineHeight = '1.4'; }
        valueCell.textContent = formattedValue;
        if (needsCopyButton) {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button copy-metadata'; copyButton.textContent = 'Copy';
            copyButton.dataset.value = String(value); copyButton.title = `Copy ${formattedKey} to clipboard`;
            valueCell.appendChild(copyButton);
        }
        row.appendChild(keyCell); row.appendChild(valueCell);
        Utils.elements.metadataTable.appendChild(row);
    },
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => { Utils.showToast('Copied to clipboard', 'success', true);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = text; textArea.style.position = 'fixed'; textArea.style.opacity = '0';
            document.body.appendChild(textArea); textArea.select();
            try { document.execCommand('copy'); Utils.showToast('Copied to clipboard', 'success', true);
            } catch (err) { Utils.showToast('Failed to copy', 'error', true); }
            document.body.removeChild(textArea);
        });
    }
};

const Modal = {
    currentAction: null,
    tagEditor: null,
    notesEditor: null,
    show(type, options = {}) {
        this.currentAction = type;
        const { title, content, confirmText = 'Confirm', confirmClass = 'btn-primary', cancelText = 'Cancel', hideConfirm = false } = options;
        Utils.elements.actionTitle.textContent = title || 'Action';
        Utils.elements.actionContent.innerHTML = content || '';
        Utils.elements.actionConfirm.textContent = confirmText;
        Utils.elements.actionConfirm.className = `btn ${confirmClass}`;
        Utils.elements.actionConfirm.disabled = false;
        Utils.elements.actionConfirm.style.display = hideConfirm ? 'none' : 'inline-flex';
        Utils.elements.actionCancel.textContent = cancelText;
        Utils.showModal('action-modal');
    },
    hide() {
        Utils.hideModal('action-modal');
        this.currentAction = null;
        if (this.tagEditor) { this.tagEditor.destroy(); this.tagEditor = null; }
        if (this.notesEditor) { this.notesEditor.destroy(); this.notesEditor = null; }
    },
    setupMoveAction() {
        this.show('move', {
            title: 'Move to Stack',
            content: `<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">${STACKS.map(stack => `<button class="move-option" data-stack="${stack}" style="width: 100%; text-align: left; padding: 8px 16px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: background-color 0.2s;">${STACK_NAMES[stack]}</button>`).join('')}</div>`,
            confirmText: 'Cancel'
        });
        document.querySelectorAll('.move-option').forEach(option => {
            option.addEventListener('click', () => { this.executeMove(option.dataset.stack); });
        });
    },
    setupFocusStackSwitch() {
        const availableStacks = STACKS.filter(stack => stack !== state.currentStack && state.stacks[stack].length > 0);
        let content = '<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">';
        if (availableStacks.length > 0) {
            content += availableStacks.map(stack => `<button class="move-option" data-stack="${stack}" style="width: 100%; text-align: left; padding: 8px 16px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: background-color 0.2s;">${STACK_NAMES[stack]} (${state.stacks[stack].length})</button>`).join('');
        } else {
            content += '<p style="color: #4b5563; text-align: center;">No other stacks have images.</p>';
        }
        content += '</div>';
        this.show('focus-stack-switch', { title: 'Switch Stack', content, confirmText: 'Cancel' });
        document.querySelectorAll('.move-option').forEach(option => {
            option.addEventListener('click', () => {
                const targetStack = option.dataset.stack;
                UI.switchToStack(targetStack);
                Core.updateImageCounters();
                this.hide();
            });
        });
    },
    setupTagAction() {
        const selectedIds = state.grid.selected.length > 0 ? [...state.grid.selected] : [];
        const total = selectedIds.length;
        const scopeText = total > 1 ? `Changes apply to ${total} selected images.` : 'Changes apply to the selected image.';
        this.show('tag', {
            title: 'Edit Tags',
            content: `<div class="tag-editor-container">
                        <div class="tag-section"><div class="tag-section-title">Assigned Tags</div><div id="bulk-tag-chips" class="tag-chip-list"></div></div>
                        <input type="text" id="bulk-tag-input" class="tag-input" placeholder="Enter tags separated by commas - non-# tags are auto-prefixed when you press Enter">
                        <div class="tag-section"><div class="tag-section-title">Recently Used Tags</div><div id="bulk-tag-recents" class="tag-chip-list"></div></div>
                        <div class="tag-editor-note">${scopeText}</div>
                     </div>`,
            hideConfirm: true, cancelText: 'Close'
        });
        const chipsContainer = document.getElementById('bulk-tag-chips');
        const input = document.getElementById('bulk-tag-input');
        const recents = document.getElementById('bulk-tag-recents');
        if (this.tagEditor) { this.tagEditor.destroy(); this.tagEditor = null; }
        this.tagEditor = TagEditor.create({ container: chipsContainer, input, recentContainer: recents, targetIds: selectedIds, placeholder: input ? input.placeholder : undefined });
        if (input) input.focus();
    },
    setupDeleteAction() {
        const selectedCount = state.grid.selected.length;
        const providerName = state.providerType === 'googledrive' ? 'Google Drive' : 'OneDrive';
        const message = `Are you sure you want to move ${selectedCount} image(s) to your ${providerName} trash? This can be recovered from the provider's website.`;
        this.show('delete', { title: 'Confirm Delete', content: `<p style="color: #4b5563; margin-bottom: 16px;">${message}</p>`, confirmText: `Move to ${providerName} Trash`, confirmClass: 'btn-danger' });
    },
    setupNotesAction() {
        const selectedIds = state.grid.selected.length > 0 ? [...state.grid.selected] : [];
        const total = selectedIds.length;
        if (total === 0) return;
        const files = TagService.getFiles(selectedIds);
        const sharedNotes = files.length && files.every(file => (file.notes || '') === (files[0].notes || '')) ? (files[0].notes || '') : '';
        const sharedQuality = files.length && files.every(file => (file.qualityRating || 0) === (files[0].qualityRating || 0)) ? (files[0].qualityRating || 0) : 0;
        const sharedContent = files.length && files.every(file => (file.contentRating || 0) === (files[0].contentRating || 0)) ? (files[0].contentRating || 0) : 0;
        const scopeText = total > 1 ? `Changes apply to ${total} selected images.` : 'Changes apply to the selected image.';
        this.show('notes', {
            title: 'Edit Notes & Ratings',
            content: `<div class="tag-editor-container"><div class="tag-editor-note">${scopeText}</div><div id="bulk-notes-editor"></div></div>`,
            confirmText: 'Save', cancelText: 'Cancel'
        });
        const mount = document.getElementById('bulk-notes-editor');
        if (!mount) return;
        mount.innerHTML = '';
        const editorElement = createNotesEditorElement({ textareaId: 'bulk-notes-input' });
        mount.appendChild(editorElement);
        if (this.notesEditor) { this.notesEditor.destroy(); this.notesEditor = null; }
        this.notesEditor = NotesEditor.create({
            root: editorElement, targetIds: selectedIds, mode: 'deferred',
            initialValues: { notes: sharedNotes, qualityRating: sharedQuality, contentRating: sharedContent }
        });
        const textarea = editorElement.querySelector('.notes-textarea');
        if (textarea) textarea.focus();
    },
    setupExportAction() {
        this.show('export', {
            title: 'Export to Spreadsheet',
            content: `<p style="color: #4b5563; margin-bottom: 16px;">This will start the new Live Export process for ${state.grid.selected.length} selected image(s).</p><p style="color: #4b5563; margin-bottom: 16px;">It will fetch fresh data directly from the cloud to ensure 100% accuracy.</p>`,
            confirmText: 'Begin Export'
        });
    },
    setupFolderMoveAction() {
        this.show('folder-move', {
            title: 'Move to Different Folder',
            content: `<p style="color: #4b5563; margin-bottom: 16px;">This will move ${state.grid.selected.length} image${state.grid.selected.length > 1 ? 's' : ''} to a different folder. The images will be removed from this stack and their metadata will move with them.</p><div style="margin-bottom: 16px;"><strong>Note:</strong> This action requires provider support and may not be available for all cloud storage providers.</div>`,
            confirmText: 'Choose Destination Folder'
        });
    },
    async executeBulkAction(options) {
        const { action, successMessage, updateGridOnSuccess = true } = options;
        const confirmBtn = Utils.elements.actionConfirm;
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true; confirmBtn.textContent = 'Processing...';
        try {
            const affectedIds = [...state.grid.selected];
            const visibleFiles = state.grid.filtered.length > 0 ? [...state.grid.filtered] : [...(state.stacks[state.grid.stack] || [])];
            const firstAffectedIndex = visibleFiles.findIndex(file => affectedIds.includes(file.id));
            let nextSelectedId = null;
            if (firstAffectedIndex !== -1) {
                const remainingVisibleFiles = visibleFiles.filter(file => !affectedIds.includes(file.id));
                if (remainingVisibleFiles.length > 0) {
                    const preferredIndex = Math.min(firstAffectedIndex, remainingVisibleFiles.length - 1);
                    nextSelectedId = remainingVisibleFiles[preferredIndex]?.id || null;
                }
            }
            const promises = affectedIds.map(fileId => action(fileId));
            await Promise.all(promises);
            Utils.showToast(successMessage.replace('{count}', promises.length), 'success', true);
            this.hide();
            Core.updateStackCounts();
            await Core.displayCurrentImage();
            if (updateGridOnSuccess && state.grid.stack) {
                Grid.syncWithStack(state.grid.stack, { removedIds: affectedIds, selectedId: nextSelectedId, preselectFirst: !nextSelectedId });
            } else if (updateGridOnSuccess) { Grid.deselectAll(); } else { Grid.deselectAll(); }
            return true;
        } catch (error) {
            Utils.showToast(`Failed to process some images: ${error.message}`, 'error', true);
            return false;
        } finally { confirmBtn.disabled = false; confirmBtn.textContent = originalText; }
    },
    async executeMove(targetStack) {
        await this.executeBulkAction({
            action: async (fileId) => {
                const file = state.imageFiles.find(f => f.id === fileId);
                if (file) {
                    const currentStack = file.stack;
                    const newSequence = Date.now();
                    const fromLabel = currentStack ? (STACK_NAMES[currentStack] || currentStack) : 'unknown';
                    const toLabel = STACK_NAMES[targetStack] || targetStack;
                    state.syncLog?.log({ event: targetStack === 'trash' ? 'ui:stack-recycle' : 'ui:stack-move', level: targetStack === 'trash' ? 'warn' : 'info', fileId, details: `Bulk move ${file.name || fileId} from ${fromLabel} to ${toLabel} (grid selection).`, data: { from: currentStack, to: targetStack, stackSequence: newSequence, source: 'grid:bulk-move' } });
                    await App.updateUserMetadata(fileId, { stack: targetStack, stackSequence: newSequence }, { skipDebounce: true, operationType: 'stack:move' });
                    const currentStackIndex = state.stacks[currentStack].findIndex(f => f.id === fileId);
                    if (currentStackIndex !== -1) { state.stacks[currentStack].splice(currentStackIndex, 1); }
                    file.stack = targetStack; file.stackSequence = newSequence;
                    state.stacks[targetStack].unshift(file);
                    state.stacks[targetStack] = Core.sortFiles(state.stacks[targetStack]);
                }
            },
            successMessage: `Moved {count} images to ${STACK_NAMES[targetStack]}`
        });
    },
    async executeNotes() {
        if (!this.notesEditor) { this.hide(); return; }
        const pending = this.notesEditor.getPendingUpdates();
        if (Object.keys(pending).length === 0) { this.hide(); return; }
        await this.executeBulkAction({
            action: async (fileId) => {
                const file = state.imageFiles.find(f => f.id === fileId);
                if (!file) return;
                const updates = {};
                if ('notes' in pending && (file.notes || '') !== pending.notes) { updates.notes = pending.notes; }
                if ('qualityRating' in pending && (file.qualityRating || 0) !== pending.qualityRating) { updates.qualityRating = pending.qualityRating; }
                if ('contentRating' in pending && (file.contentRating || 0) !== pending.contentRating) { updates.contentRating = pending.contentRating; }
                if (Object.keys(updates).length > 0) { await App.updateUserMetadata(fileId, updates); }
            },
            successMessage: 'Updated notes & ratings for {count} images',
            updateGridOnSuccess: false
        });
    },
    async executeDelete() {
        await this.executeBulkAction({
            action: async (fileId) => {
                const file = state.imageFiles.find(f => f.id === fileId);
                await App.deleteFile(fileId, { source: 'grid:bulk-delete', originStack: file?.stack || null, name: file?.name || null });
            },
            successMessage: 'Moved {count} images to provider recycle bin'
        });
    },
    async executeExport() {
        const fileIds = [...state.grid.selected];
        const filesToExport = fileIds.map(id => state.imageFiles.find(f => f.id === id)).filter(f => f);
        const total = filesToExport.length; const results = []; let failures = 0;
        Utils.elements.actionTitle.textContent = `Live Export: 0 of ${total}`;
        Utils.elements.actionContent.innerHTML = '<div style="background: #111; border: 1px solid #333; color: #eee; font-family: monospace; font-size: 12px; height: 250px; overflow-y: scroll; padding: 8px; white-space: pre-wrap;" id="export-log"></div>';
        const logEl = document.getElementById('export-log');
        Utils.elements.actionConfirm.disabled = true; Utils.elements.actionCancel.textContent = "Close";
        const log = (message) => { logEl.textContent += message + '\n'; logEl.scrollTop = logEl.scrollHeight; };
        log(`Starting export for ${total} images...`);
        for (let i = 0; i < filesToExport.length; i++) {
            const file = filesToExport[i];
            Utils.elements.actionTitle.textContent = `Live Export: ${i + 1} of ${total}`;
            log(`\n[${i+1}/${total}] Processing: ${file.name}`);
            let extractedMetadata = {}; let success = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const metadata = await state.metadataExtractor.fetchMetadata(file, true);
                    if (metadata.error) throw new Error(metadata.error);
                    extractedMetadata = metadata; log('  Success'); success = true; break;
                } catch (error) {
                    log(`  Attempt ${attempt} failed: ${error.message}`);
                    if (attempt < 3) { const delay = 1000 * attempt; log(`     Retrying in ${delay / 1000}s...`); await new Promise(res => setTimeout(res, delay)); }
                    else { log('  FAILED permanently after 3 attempts.'); failures++; }
                }
            }
            results.push({ ...file, extractedMetadata: extractedMetadata });
        }
        log('\n-------------------------------------');
        log('Export process complete.'); log(`Successfully processed: ${total - failures} files.`); log(`Failed: ${failures} files.`);
        if (results.length > 0) { state.export.exportData(results); log('CSV file has been generated and downloaded.'); }
        else { log('No data to export.'); }
        Utils.elements.actionTitle.textContent = 'Export Complete';
        Utils.elements.actionConfirm.disabled = true; Utils.elements.actionCancel.textContent = "Close";
    },
    executeFolderMove() {
        state.folderMoveMode = { active: true, files: [...state.grid.selected] };
        this.hide(); Grid.close(); App.returnToFolderSelection();
        Utils.showToast(`Select destination folder for ${state.folderMoveMode.files.length} images`, 'info', true);
    }
};

const UI = {
    updateEmptyStateButtons() {
        const stacksWithImages = STACKS.filter(stack => state.stacks[stack].length > 0);
        const hasOtherStacks = stacksWithImages.some(stack => stack !== state.currentStack);
        Utils.elements.selectAnotherStackBtn.style.display = hasOtherStacks ? 'block' : 'none';
        Utils.elements.selectAnotherFolderBtn.style.display = 'block';
    },
    acknowledgePillCounter(stackName) {
        const pill = document.getElementById(`pill-${stackName}`);
        if (pill) {
            pill.classList.remove('triple-ripple', 'glow-effect');
            pill.offsetHeight; pill.classList.add('triple-ripple');
            setTimeout(() => { pill.classList.add('glow-effect'); }, 100);
            setTimeout(() => { pill.classList.remove('triple-ripple', 'glow-effect'); }, 3000);
        }
    },
    switchToStack(stackName) { return Core.displayTopImageFromStack(stackName); },
    cycleThroughPills() {
        const stackOrder = ['in', 'out', 'priority', 'trash'];
        const currentIndex = stackOrder.indexOf(state.currentStack);
        const nextIndex = (currentIndex + 1) % stackOrder.length;
        const nextStack = stackOrder[nextIndex];
        this.switchToStack(nextStack);
    }
};

const DraggableResizable = {
    init(modal, header) {
        if (!modal || !header) {
            const logger = (typeof state !== 'undefined' && state?.syncLog) ? state.syncLog : null;
            logger?.log({ event: 'ui:draggable:init:error', level: 'error', details: 'Draggable init skipped due to missing modal/header reference.', data: { modalPresent: Boolean(modal), headerPresent: Boolean(header), modalId: modal && modal.id ? modal.id : null, headerId: header && header.id ? header.id : null } });
            return;
        }
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;
        header.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e = e || window.event; e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY; isDragging = true;
            document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            if (!isDragging) return;
            e = e || window.event; e.preventDefault();
            pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
            let newTop = modal.offsetTop - pos2; let newLeft = modal.offsetLeft - pos1;
            const parent = modal.parentElement;
            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop + modal.offsetHeight > parent.clientHeight) newTop = parent.clientHeight - modal.offsetHeight;
            if (newLeft + modal.offsetWidth > parent.clientWidth) newLeft = parent.clientWidth - modal.offsetWidth;
            modal.style.top = newTop + "px"; modal.style.left = newLeft + "px";
        }
        function closeDragElement() { isDragging = false; document.onmouseup = null; document.onmousemove = null; }
        header.ondblclick = () => {
            if (modal.id === 'details-modal') {
                modal.style.top = '50%'; modal.style.left = '50%'; modal.style.transform = 'translate(-50%, -50%)';
                modal.style.width = '800px'; modal.style.height = '95vh';
            } else if (modal.id === 'grid-modal') {
                modal.style.top = '0px'; modal.style.left = '0px';
                modal.style.width = '100%'; modal.style.height = '100%';
                modal.style.maxHeight = '100vh'; modal.style.maxWidth = '100vw'; modal.style.transform = 'none';
                Utils.elements.gridContent.scrollTop = 0;
            }
        };
    }
};
