from pathlib import Path
import re

PATH = Path('ui-v2.html')
text = PATH.read_text(encoding='utf-8')
original = text


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 exact match, found {count}')
    text = text.replace(old, new, 1)


def regex_once(pattern, replacement, label, flags=re.S):
    global text
    text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 regex match, found {count}')


# Remove the late v1.6 runtime block. It duplicates earlier controllers and can fail before
# the main app reaches its first interactive surface.
text, v16_count = re.subn(
    r'\n?<!-- Orbital8 v1\.6 standard-chrome -->\s*<style id="orbital8-v16-standard-chrome-style">.*?</style>\s*<script id="orbital8-v16-standard-chrome-script">.*?</script>\s*',
    '\n', text, count=1, flags=re.S
)
if v16_count != 1:
    raise SystemExit(f'v1.6 removal: expected 1 block, found {v16_count}')

# Defensive cleanup if the abandoned observer-based stabilization block is ever present.
text, _ = re.subn(
    r'\n?<!-- Orbital8 v1\.6\.1 stable-chrome -->\s*<style id="orbital8-v161-stable-chrome-style">.*?</style>\s*<script id="orbital8-v161-stable-chrome-script">.*?</script>\s*',
    '\n', text, count=1, flags=re.S
)

# EXPLORE: medium inspection is image-only. No fake X, hint, heart, trash or Details.
regex_once(
    r'''preview\.innerHTML = `\s*<button type="button" class="orbital-explore-close" aria-label="Back to sphere">×</button>\s*<div class="orbital-explore-inspect__stage">\s*<img alt="" draggable="false">\s*</div>\s*<div class="orbital-explore-inspect__hint">.*?</div>`;''',
    '''preview.innerHTML = `\n          <div class="orbital-explore-inspect__stage">\n            <img alt="" draggable="false">\n          </div>`;''',
    'Explore medium markup'
)

regex_once(
    r'''\s*preview\.querySelector\('\.orbital-explore-close'\)\?\.addEventListener\('click', event => \{\s*event\.preventDefault\(\); event\.stopPropagation\(\); this\.closePreview\(\);\s*\}\);''',
    '',
    'Explore medium fake close listener'
)

replace_once(
    """        const stage = preview.querySelector('.orbital-explore-inspect__stage');\n        const img = stage?.querySelector('img');\n        this.installZoom(stage, img, () => this.openFull());""",
    """        const stage = preview.querySelector('.orbital-explore-inspect__stage');\n        const img = stage?.querySelector('img');\n        this.installZoom(stage, img, () => this.openFull());\n        preview.addEventListener('click', event => {\n          if (event.target !== preview) return;\n          event.preventDefault(); event.stopPropagation(); this.closePreview();\n        });\n        stage?.addEventListener('click', event => {\n          if (event.target !== stage) return;\n          event.preventDefault(); event.stopPropagation(); this.closePreview();\n        });""",
    'Explore medium outside-click behavior'
)

# EXPLORE: full inspection keeps only the image and its X. The actual Focus controls sit around it.
regex_once(
    r'''full\.innerHTML = `\s*<button type="button" class="orbital-explore-close" aria-label="Back to 720 inspection">×</button>\s*<button type="button" class="orbital-explore-action details">Details</button>\s*<span class="orbital-explore-position" aria-live="polite"></span>\s*<button type="button" class="orbital-explore-action favorite"[^>]*>♥</button>\s*<button type="button" class="orbital-explore-action delete"[^>]*>🗑</button>\s*<div class="orbital-explore-full__stage"><img alt="" draggable="false"></div>`;''',
    '''full.innerHTML = `\n          <button type="button" class="orbital-explore-close" aria-label="Back to medium inspection">×</button>\n          <div class="orbital-explore-full__stage"><img alt="" draggable="false"></div>`;''',
    'Explore full fake controls'
)

# Full-screen X sits top-center so it cannot collide with Focus Details at top-right.
replace_once(
    """@media(max-width:640px){\n  .photo-table__stack{padding:10px 16px !important;font-size:16px !important;min-width:46px !important;}\n  .orbital-explore-inspect__stage{width:94vw;height:min(72vh,720px)}\n}\n\n</style>\n<script id=\"orbital8-v14-inspection-physics-script\">""",
    """.orbital-explore-full .orbital-explore-close {\n  top:max(12px,env(safe-area-inset-top)) !important;\n  left:50% !important;\n  right:auto !important;\n  transform:translateX(-50%) !important;\n}\n@media(max-width:640px){\n  .photo-table__stack{padding:10px 16px !important;font-size:16px !important;min-width:46px !important;}\n  .orbital-explore-inspect__stage{width:94vw;height:min(72vh,720px)}\n}\n\n</style>\n<script id=\"orbital8-v14-inspection-physics-script\">""",
    'Explore full X placement'
)

# TABLE: target drag must not change pill geometry. Reserve the border width at rest.
replace_once(
    "border:none !important;\n  border-radius:20px !important;",
    "border:3px solid transparent !important;\n  box-sizing:border-box !important;\n  border-radius:20px !important;",
    'Table target stable geometry'
)

# TABLE: remove only image-to-image collision execution. Bank shots, rim interactions,
# target capture, suction/vacuum animations and wall bounce remain untouched.
replace_once(
    """  const oldTableAnimateV14 = PhotoTable.animate.bind(PhotoTable);\n  PhotoTable.animate = function() {\n    this.resolveMovingCollisionsV14();\n    return oldTableAnimateV14();\n  };""",
    """  // v1.7: no image-to-image collision pass. All target/rim/bank physics remain in PhotoTable.animate.\n""",
    'Disable image-to-image collision execution'
)

# Focus is the single canonical decoration set for both Explore inspection and Table.
focus_table_css = r'''
/* v1.7: hide surface-specific duplicate decorations; use the actual Focus controls. */
body.orbital-explore-inspecting #spatial-gallery-folder,
body.orbital-explore-inspecting #spatial-gallery-details,
body.orbital-explore-inspecting #spatial-gallery-count,
body.orbital-explore-inspecting #spatial-gallery-delete,
body.orbital-table-standard #photo-table-folder,
body.orbital-table-standard #photo-table-details,
body.orbital-table-standard #photo-table-count,
body.orbital-table-standard #photo-table-delete,
body.orbital-table-standard .photo-table__favorite {
  display:none !important;
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
'''
replace_once(
    '</style>\n<script id="orbital8-v141-focus-chrome-script">',
    focus_table_css + '\n</style>\n<script id="orbital8-v141-focus-chrome-script">',
    'Focus standard CSS insertion'
)

# TABLE: only Inbox is the loose workspace. YES/MAYBE/NO are destinations.
replace_once(
    "const VERSION = 'v1.5 triage-table';",
    "const VERSION = 'v1.7 clean-table-explore';",
    'v1.7 version marker'
)
replace_once(
    "const targetLabels={priority:'KEEP',out:'MAYBE',trash:'TRASH'};",
    "const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};",
    'Table YES/MAYBE/NO labels'
)
regex_once(
    r'''PhotoTable\.triageFilesV15=function\(\)\{\s*const seen=new Set\(\);\s*return \[\.\.\.\(state\.stacks\.in\|\|\[\]\),\.\.\.\(state\.stacks\.out\|\|\[\]\)\]\.filter\(file=>\{\s*if\(!file\?\.id\|\|seen\.has\(file\.id\)\)return false;\s*seen\.add\(file\.id\);return true;\s*\}\);\s*\};''',
    '''PhotoTable.triageFilesV15=function(){\n    const seen=new Set();\n    return [...(state.stacks.in||[])].filter(file=>{\n      if(!file?.id||seen.has(file.id))return false;\n      seen.add(file.id);return true;\n    });\n  };''',
    'Table Inbox-only workspace'
)
text = text.replace('images remaining in Inbox and Maybe', 'images remaining in Inbox')

# Toggle the Table standard Focus chrome directly from the existing v1.5 open/close lifecycle.
replace_once(
    """  PhotoTable.open=function(options={}){\n    const result=oldTableOpenV15(options);\n    if(this.elements?.root?.hidden)return result;\n    this.triageModeV15=true;""",
    """  PhotoTable.open=function(options={}){\n    const result=oldTableOpenV15(options);\n    if(this.elements?.root?.hidden)return result;\n    document.body.classList.add('orbital-table-standard');\n    this.triageModeV15=true;""",
    'Table standard chrome open'
)
replace_once(
    "PhotoTable.close=function(options={}){this.triageModeV15=false;return oldTableCloseV15(options);};",
    "PhotoTable.close=function(options={}){document.body.classList.remove('orbital-table-standard');this.triageModeV15=false;return oldTableCloseV15(options);};",
    'Table standard chrome close'
)

# TABLE: reuse Sort's exact comet-trail element/class, cadence and lifetime. Existing target/rim
# impact effects stay in FlingFX; only the trail rendering path is redirected.
trail_patch = r'''

  const originalFlingTrailV17 = FlingFX.trail.bind(FlingFX);
  FlingFX.trail = function(surface, x, y, vx = 0, vy = 0) {
    if (surface !== 'table') return originalFlingTrailV17(surface, x, y, vx, vy);
    const root = PhotoTable.elements?.root;
    if (!root || root.hidden) return;
    const now = performance.now();
    const interval = Number(Gestures.TRAIL_INTERVAL_MS) || 12;
    if (now - (this._tableSortTrailAt || 0) < interval) return;
    this._tableSortTrailAt = now;
    const trail = document.createElement('div');
    trail.className = 'comet-trail';
    trail.style.position = 'fixed';
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.zIndex = '1490';
    trail.style.pointerEvents = 'none';
    root.appendChild(trail);
    setTimeout(() => trail.remove(), Number(Gestures.TRAIL_LIFETIME_MS) || 1050);
  };
'''
replace_once(
    '  window.SwitcherShieldV15=SwitcherShieldV15;\n',
    '  window.SwitcherShieldV15=SwitcherShieldV15;\n' + trail_patch,
    'Sort trail reuse in Table'
)

# Update the v1.5 log wording to reflect the final surface semantics.
text = text.replace(
    'Table triages Inbox + Maybe into KEEP/MAYBE/TRASH; target tap opens Grid; quick switcher outside taps are shielded.',
    'Table scatters Inbox into YES/MAYBE/NO; target tap opens Grid; Sort comet trails reused; image-image collisions disabled.'
)

# Final safety assertions.
required = [
    "const VERSION = 'v1.7 clean-table-explore';",
    "const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};",
    "document.body.classList.add('orbital-table-standard')",
    "originalFlingTrailV17",
    "body.orbital-explore-inspecting #focus-stack-name",
    "aria-label=\"Back to medium inspection\"",
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'missing required marker: {marker}')

for forbidden in [
    'orbital8-v16-standard-chrome-script',
    'orbital8-v161-stable-chrome-script',
    'this.resolveMovingCollisionsV14();',
    'Tap image for full size · pinch to inspect',
    'images remaining in Inbox and Maybe',
]:
    if forbidden in text:
        raise SystemExit(f'forbidden marker still present: {forbidden}')

if text == original:
    raise SystemExit('patch made no changes')

PATH.write_text(text, encoding='utf-8')
print('Orbital8 v1.7 cleanup applied')
