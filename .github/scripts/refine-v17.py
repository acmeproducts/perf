from pathlib import Path
import re

path = Path('ui-v2.html')
text = path.read_text(encoding='utf-8')
original = text


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)

# Remove the failed late v1.6 override entirely. The behavior is integrated into v1.4/v1.5 below.
text, count = re.subn(
    r'\n?<!-- Orbital8 v1\.6 standard-chrome -->.*?<script id="orbital8-v16-standard-chrome-script">.*?</script>\s*',
    '\n',
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'v1.6 removal: expected 1 block, found {count}')

# Explore medium/full inspection markup: no fake controls, only full-size X.
old_preview = '''        preview.innerHTML = `
          <button type="button" class="orbital-explore-close" aria-label="Back to sphere">×</button>
          <div class="orbital-explore-inspect__stage">
            <img alt="" draggable="false">
          </div>
          <div class="orbital-explore-inspect__hint">Tap image for full size · pinch to inspect</div>`;'''
new_preview = '''        preview.innerHTML = `
          <div class="orbital-explore-inspect__stage">
            <img alt="" draggable="false">
          </div>`;'''
replace_once(old_preview, new_preview, 'Explore medium markup')

old_preview_close = '''        preview.querySelector('.orbital-explore-close')?.addEventListener('click', event => {
          event.preventDefault(); event.stopPropagation(); this.closePreview();
        });
        const stage = preview.querySelector('.orbital-explore-inspect__stage');'''
new_preview_close = '''        preview.addEventListener('click', event => {
          if (event.target !== preview) return;
          event.preventDefault();
          event.stopPropagation();
          this.closePreview();
        });
        const stage = preview.querySelector('.orbital-explore-inspect__stage');'''
replace_once(old_preview_close, new_preview_close, 'Explore medium outside-click')

old_full = '''        full.innerHTML = `
          <button type="button" class="orbital-explore-close" aria-label="Back to 720 inspection">×</button>
          <button type="button" class="orbital-explore-action details">Details</button>
          <span class="orbital-explore-position" aria-live="polite"></span>
          <button type="button" class="orbital-explore-action favorite" aria-label="Favorite image" aria-pressed="false">♥</button>
          <button type="button" class="orbital-explore-action delete" aria-label="Move image to provider recycle bin">🗑</button>
          <div class="orbital-explore-full__stage"><img alt="" draggable="false"></div>`;'''
new_full = '''        full.innerHTML = `
          <button type="button" class="orbital-explore-close" aria-label="Back to medium inspection">×</button>
          <div class="orbital-explore-full__stage"><img alt="" draggable="false"></div>`;'''
replace_once(old_full, new_full, 'Explore full markup')

old_full_handlers = '''        full.querySelector('.details')?.addEventListener('click', event => {
          event.preventDefault(); event.stopPropagation(); SpatialGallery.showFocusedDetails();
        });
        full.querySelector('.favorite')?.addEventListener('click', event => {
          event.preventDefault(); event.stopPropagation(); this.toggleFavorite();
        });
        full.querySelector('.delete')?.addEventListener('click', async event => {
          event.preventDefault(); event.stopPropagation(); await this.deleteCurrent();
        });
        const stage = full.querySelector('.orbital-explore-full__stage');'''
replace_once(old_full_handlers, '''        const stage = full.querySelector('.orbital-explore-full__stage');''', 'Explore fake handler removal')

# X belongs only to full format and must sit left of Details.
css_anchor = '''.orbital-explore-inspect .orbital-explore-close { z-index:12520; }
.orbital-explore-action { padding:9px 14px; font:700 13px/1 system-ui,sans-serif; }'''
css_replacement = '''.orbital-explore-inspect .orbital-explore-close { display:none !important; }
.orbital-explore-full .orbital-explore-close {
  top:max(20px,env(safe-area-inset-top));
  right:max(92px,calc(env(safe-area-inset-right) + 92px));
  z-index:12970;
}
.orbital-explore-action { padding:9px 14px; font:700 13px/1 system-ui,sans-serif; }'''
replace_once(css_anchor, css_replacement, 'Explore X placement')

# Focus chrome is canonical in Explore; also use it in Table and hide Table's custom heart/decorations.
focus_css_anchor = '''body.orbital-explore-inspecting #focus-delete-btn {
  bottom:max(20px,env(safe-area-inset-bottom)) !important;
  right:max(20px,env(safe-area-inset-right)) !important;
}
body.orbital-explore-inspecting #back-button,'''
focus_css_replacement = '''body.orbital-explore-inspecting #focus-delete-btn {
  bottom:max(20px,env(safe-area-inset-bottom)) !important;
  right:max(20px,env(safe-area-inset-right)) !important;
}
body.orbital-table-standard #focus-stack-name,
body.orbital-table-standard #focus-image-count,
body.orbital-table-standard #focus-favorite-btn,
body.orbital-table-standard #focus-delete-btn,
body.orbital-table-standard #details-button {
  display:flex !important;
  position:fixed !important;
  z-index:12960 !important;
}
body.orbital-table-standard #focus-stack-name { top:max(20px,env(safe-area-inset-top)) !important; left:max(20px,env(safe-area-inset-left)) !important; }
body.orbital-table-standard #details-button { top:max(20px,env(safe-area-inset-top)) !important; right:max(20px,env(safe-area-inset-right)) !important; }
body.orbital-table-standard #focus-image-count { bottom:max(20px,env(safe-area-inset-bottom)) !important; left:max(20px,env(safe-area-inset-left)) !important; }
body.orbital-table-standard #focus-favorite-btn { bottom:max(20px,env(safe-area-inset-bottom)) !important; left:50% !important; transform:translateX(-50%) !important; }
body.orbital-table-standard #focus-delete-btn { bottom:max(20px,env(safe-area-inset-bottom)) !important; right:max(20px,env(safe-area-inset-right)) !important; }
body.orbital-table-standard .photo-table__favorite,
body.orbital-table-standard #photo-table-folder,
body.orbital-table-standard #photo-table-details,
body.orbital-table-standard #photo-table-count,
body.orbital-table-standard #photo-table-delete,
body.orbital-table-standard #back-button,
body.orbital-table-standard #normal-image-count,
body.orbital-table-standard #center-trash-btn,
body.orbital-table-standard .pill-counter { display:none !important; }
body.orbital-explore-inspecting #back-button,'''
replace_once(focus_css_anchor, focus_css_replacement, 'Focus chrome Table integration')

# Remove only image-to-image collisions. Target/rim/bank/capture physics remain untouched.
collision_pattern = re.compile(r'''\n  PhotoTable\.resolveMovingCollisionsV14 = function\(\) \{.*?\n  \};\n\n  const oldTableAnimateV14 = PhotoTable\.animate\.bind\(PhotoTable\);\n  PhotoTable\.animate = function\(\) \{\n    this\.resolveMovingCollisionsV14\(\);\n    return oldTableAnimateV14\(\);\n  \};''', re.S)
text, count = collision_pattern.subn('''\n  // Image-to-image collisions intentionally disabled. Target/rim/bank physics remain active.\n  PhotoTable.resolveMovingCollisionsV14 = function() {};''', text, count=1)
if count != 1:
    raise SystemExit(f'collision removal: expected 1 block, found {count}')

# Table uses the exact Sort comet-trail visual (.comet-trail), throttled at the same interval/lifetime.
trail_insert_anchor = '''  const oldTableOpenV15=PhotoTable.open.bind(PhotoTable);
  PhotoTable.open=function(options={}){'''
trail_insert = '''  PhotoTable._sortTrailLastV17 = 0;
  PhotoTable.spawnSortTrailV17 = function(clientX, clientY) {
    const now = performance.now();
    if (now - (this._sortTrailLastV17 || 0) < (Gestures.TRAIL_INTERVAL_MS || 12)) return;
    this._sortTrailLastV17 = now;
    const root = this.elements?.root;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const trail = document.createElement('div');
    trail.className = 'comet-trail';
    trail.style.left = `${clientX - rect.left}px`;
    trail.style.top = `${clientY - rect.top}px`;
    trail.style.position = 'absolute';
    trail.style.zIndex = '1450';
    root.appendChild(trail);
    setTimeout(() => trail.remove(), Gestures.TRAIL_LIFETIME_MS || 1050);
  };

  const oldTableOpenV15=PhotoTable.open.bind(PhotoTable);
  PhotoTable.open=function(options={}){'''
replace_once(trail_insert_anchor, trail_insert, 'Sort trail helper')

# Replace Table's canvas trail calls only; impact/rim canvas effects remain.
text, table_trail_count = re.subn(r'''FlingFX\.trail\('table',\s*([^,]+),\s*([^,]+),\s*[^,]+,\s*[^\)]+\)''', r'PhotoTable.spawnSortTrailV17(\1, \2)', text)
if table_trail_count < 1:
    raise SystemExit('Table trail replacement: no FlingFX table trail calls found')

# Table is Inbox-only workspace; Maybe is now a destination rather than duplicate source material.
replace_once(
    "return [...(state.stacks.in||[]),...(state.stacks.out||[])].filter(file=>{",
    "return [...(state.stacks.in||[])].filter(file=>{",
    'Inbox-only triage source'
)

# Rename target labels only; underlying stack ids remain priority/out/trash.
replace_once(
    "const targetLabels={priority:'KEEP',out:'MAYBE',trash:'TRASH'};",
    "const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};",
    'Table YES/MAYBE/NO labels'
)

# Table opens/closes with actual Focus chrome and keeps selection synced to the armed image.
old_table_open = '''  PhotoTable.open=function(options={}){
    const result=oldTableOpenV15(options);
    if(this.elements?.root?.hidden)return result;
    this.triageModeV15=true;'''
new_table_open = '''  PhotoTable.open=function(options={}){
    const result=oldTableOpenV15(options);
    if(this.elements?.root?.hidden)return result;
    document.body.classList.add('orbital-table-standard');
    this.triageModeV15=true;'''
replace_once(old_table_open, new_table_open, 'Table standard chrome open')
replace_once(
    "PhotoTable.close=function(options={}){this.triageModeV15=false;return oldTableCloseV15(options);};",
    "PhotoTable.close=function(options={}){document.body.classList.remove('orbital-table-standard');this.triageModeV15=false;return oldTableCloseV15(options);};",
    'Table standard chrome close'
)

# Keep Focus chrome synchronized whenever a Table photo is touched/armed.
old_down = '''  PhotoTable.down=function(event){
    const photo=this.findElement?.(event);
    if(photo?.fileId)this.syncTriageSelectionV15(photo.fileId);
    return oldTableDownV15(event);
  };'''
new_down = '''  PhotoTable.down=function(event){
    const photo=this.findElement?.(event);
    if(photo?.fileId)this.syncTriageSelectionV15(photo.fileId);
    const result=oldTableDownV15(event);
    Core.updateImageCounters?.();
    Core.updateFavoriteButton?.();
    return result;
  };'''
replace_once(old_down, new_down, 'Table armed chrome sync')

# v1.7 is the visible build marker from the final executing block.
replace_once("const VERSION = 'v1.5 triage-table';", "const VERSION = 'v1.7 curate-surfaces';", 'Version marker')
replace_once(
    "details:'Table triages Inbox + Maybe into KEEP/MAYBE/TRASH; target tap opens Grid; quick switcher outside taps are shielded.'",
    "details:'Explore uses Focus chrome; Table triages Inbox into YES/MAYBE/NO with Sort comet trails; image collisions disabled.'",
    'v1.7 log detail'
)

# Remove obsolete visual collision class rule.
text = text.replace('''\n.photo-table__print.collision-hit {\n  filter:brightness(1.2) saturate(1.15);\n}\n''', '\n')

if text == original:
    raise SystemExit('No changes made')

required = [
    "const VERSION = 'v1.7 curate-surfaces';",
    "const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};",
    "return [...(state.stacks.in||[])].filter(file=>{",
    'PhotoTable.spawnSortTrailV17',
    'Image-to-image collisions intentionally disabled',
    "document.body.classList.add('orbital-table-standard')",
    'body.orbital-table-standard #focus-favorite-btn',
    'aria-label="Back to medium inspection"',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit(f'Missing required markers: {missing}')

for forbidden in [
    'orbital8-v16-standard-chrome-script',
    'orbital-explore-action details',
    'orbital-explore-action favorite',
    'orbital-explore-action delete',
    "const targetLabels={priority:'KEEP',out:'MAYBE',trash:'TRASH'};",
]:
    if forbidden in text:
        raise SystemExit(f'Forbidden legacy marker remains: {forbidden}')

path.write_text(text, encoding='utf-8')
print(f'Updated ui-v2.html; replaced {table_trail_count} Table trail calls.')
