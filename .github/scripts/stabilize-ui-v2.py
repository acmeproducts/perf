from pathlib import Path
import re

PATH = Path('ui-v2.html')
text = PATH.read_text(encoding='utf-8')

# Replace the fragile v1.6 runtime block with one guarded, deterministic block.
text = re.sub(
    r'\n?<!-- Orbital8 v1\.6 standard-chrome -->.*?<script id="orbital8-v16-standard-chrome-script">.*?</script>\s*',
    '\n',
    text,
    flags=re.S,
)

if 'orbital8-v161-stable-chrome-script' in text:
    raise SystemExit('v1.6.1 stable chrome already installed')

block = r'''
<!-- Orbital8 v1.6.1 stable-chrome -->
<style id="orbital8-v161-stable-chrome-style">
/* Focus is the canonical chrome for inspection surfaces. */
body.orbital-explore-inspecting #spatial-gallery-folder,
body.orbital-explore-inspecting #spatial-gallery-details,
body.orbital-explore-inspecting #spatial-gallery-count,
body.orbital-explore-inspecting #spatial-gallery-delete,
body.orbital-explore-inspecting #back-button,
body.orbital-explore-inspecting #normal-image-count,
body.orbital-explore-inspecting #center-trash-btn,
body.orbital-explore-inspecting .pill-counter,
body.orbital-table-standard #photo-table-folder,
body.orbital-table-standard #photo-table-details,
body.orbital-table-standard #photo-table-count,
body.orbital-table-standard #photo-table-delete,
body.orbital-table-standard #back-button,
body.orbital-table-standard #normal-image-count,
body.orbital-table-standard #center-trash-btn,
body.orbital-table-standard .pill-counter { display:none!important; }

body.orbital-explore-inspecting #focus-stack-name,
body.orbital-explore-inspecting #focus-image-count,
body.orbital-explore-inspecting #focus-favorite-btn,
body.orbital-explore-inspecting #focus-delete-btn,
body.orbital-explore-inspecting #details-button,
body.orbital-table-standard #focus-stack-name,
body.orbital-table-standard #focus-image-count,
body.orbital-table-standard #focus-favorite-btn,
body.orbital-table-standard #focus-delete-btn,
body.orbital-table-standard #details-button {
  display:flex!important;
  position:fixed!important;
  z-index:15020!important;
}
body.orbital-explore-inspecting #focus-stack-name,
body.orbital-table-standard #focus-stack-name { top:max(16px,env(safe-area-inset-top))!important; left:max(16px,env(safe-area-inset-left))!important; }
body.orbital-explore-inspecting #details-button,
body.orbital-table-standard #details-button { top:max(16px,env(safe-area-inset-top))!important; right:max(16px,env(safe-area-inset-right))!important; }
body.orbital-explore-inspecting #focus-image-count,
body.orbital-table-standard #focus-image-count { bottom:max(20px,env(safe-area-inset-bottom))!important; left:max(16px,env(safe-area-inset-left))!important; }
body.orbital-explore-inspecting #focus-favorite-btn,
body.orbital-table-standard #focus-favorite-btn { bottom:max(20px,env(safe-area-inset-bottom))!important; left:50%!important; transform:translateX(-50%)!important; }
body.orbital-explore-inspecting #focus-delete-btn,
body.orbital-table-standard #focus-delete-btn { bottom:max(20px,env(safe-area-inset-bottom))!important; right:max(16px,env(safe-area-inset-right))!important; }

/* Inbox is the loose Table workspace. The only sorting targets are YES/MAYBE/NO. */
body.orbital-table-standard #photo-table [data-table-pile="in"],
body.orbital-table-standard #photo-table [data-table-stack="in"] { display:none!important; }
body.orbital-table-standard #photo-table [data-table-pile="priority"],
body.orbital-table-standard #photo-table [data-table-stack="priority"] { top:72px!important; bottom:auto!important; left:50%!important; right:auto!important; transform:translateX(-50%)!important; }
body.orbital-table-standard #photo-table [data-table-pile="trash"],
body.orbital-table-standard #photo-table [data-table-stack="trash"] { bottom:82px!important; top:auto!important; left:50%!important; right:auto!important; transform:translateX(-50%)!important; }
body.orbital-table-standard #photo-table [data-table-pile="out"],
body.orbital-table-standard #photo-table [data-table-stack="out"] { right:18px!important; left:auto!important; top:50%!important; bottom:auto!important; transform:translateY(-50%)!important; }
</style>
<script id="orbital8-v161-stable-chrome-script">
(() => {
  'use strict';
  const VERSION = 'v1.6.1 stable-chrome';
  window.__ORBITAL8_BUILD = VERSION;

  // Version marker is set first and cannot be prevented by later optional wiring.
  const stampVersion = () => {
    document.querySelectorAll('.footer-baseline').forEach(el => {
      if (el.textContent.includes('Orbital8 UI')) el.textContent = `Orbital8 UI · ${VERSION}`;
    });
  };
  stampVersion();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stampVersion, { once:true });

  const tableRoot = () => document.getElementById('photo-table');
  const tableVisible = () => {
    const root = tableRoot();
    return !!root && !root.hidden && getComputedStyle(root).display !== 'none';
  };
  const syncFocusChrome = () => {
    try { window.Core?.updateImageCounters?.(); } catch (_) {}
    try { window.Core?.updateFavoriteButton?.(); } catch (_) {}
  };
  const relabelTable = () => {
    const root = tableRoot();
    if (!root) return;
    const labels = { priority:'YES', out:'MAYBE', trash:'NO' };
    root.querySelectorAll('[data-table-pile],[data-table-stack]').forEach(el => {
      const name = el.dataset.tablePile || el.dataset.tableStack;
      if (name === 'in') { el.hidden = true; return; }
      if (!labels[name]) return;
      el.hidden = false;
      const count = window.state?.stacks?.[name]?.length || 0;
      el.innerHTML = `<span class="orbital-target-label">${labels[name]}</span><span class="orbital-target-count">${count}</span>`;
      el.setAttribute('aria-label', `${labels[name]} stack, ${count} images`);
      el.title = `${labels[name]} · ${count}`;
    });
  };
  const syncSurface = () => {
    if (tableVisible()) document.body.classList.add('orbital-table-standard');
    else document.body.classList.remove('orbital-table-standard');
    relabelTable();
    syncFocusChrome();
    stampVersion();
  };

  // DOM observation avoids fragile early .bind() calls against controllers that may not exist yet.
  const start = () => {
    syncSurface();
    const observer = new MutationObserver(() => queueMicrotask(syncSurface));
    observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['hidden','class'] });

    document.addEventListener('click', event => {
      const target = event.target.closest?.('#photo-table [data-table-pile], #photo-table [data-table-stack]');
      if (!target) return;
      const name = target.dataset.tablePile || target.dataset.tableStack;
      if (!['priority','out','trash'].includes(name)) return;
      if (target._targetMoved || target.classList.contains('target-moving')) return;
      if (!window.Grid?.open) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.Grid.open(name);
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncSurface();
    }, true);
    window.addEventListener('pageshow', syncSurface, true);
    window.addEventListener('focus', syncSurface, true);

    try { window.state?.syncLog?.log?.({ event:'ui:v161-installed', level:'info', details:'Stable guarded chrome initialization; Focus standard; Table YES/MAYBE/NO.' }); } catch (_) {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
</script>
'''

idx = text.rfind('</body>')
if idx < 0:
    raise SystemExit('closing </body> not found')
text = text[:idx] + block + '\n' + text[idx:]

PATH.write_text(text, encoding='utf-8')
