from pathlib import Path
import re

PATH = Path('ui-v2.html')
text = PATH.read_text(encoding='utf-8')
original = text
VERSION = 'v1.8 focus-standard'

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

text = text.replace('<!-- Orbital8- baseline V9b -->', '<!-- Orbital8 UI · v1.8 focus-standard -->', 1)
text = re.sub(r'<span class="footer-baseline">[^<]*</span>', f'<span class="footer-baseline">Orbital8 UI · {VERSION}</span>', text)
replace_once("const VERSION = 'v1.7 clean-table-explore';", f"const VERSION = '{VERSION}';", 'final runtime version')

focus_css_anchor = '''/* Explore inspection deliberately reuses the REAL Focus chrome. */'''
focus_css = '''/* Explore/Table use the REAL Focus chrome. Legacy surface controls never render. */
#spatial-gallery-folder,
#spatial-gallery-details,
#spatial-gallery-count,
#spatial-gallery-delete,
#photo-table-folder,
#photo-table-details,
#photo-table-count,
#photo-table-delete,
.photo-table__favorite { display:none !important; }
body.orbital-explore-active #focus-stack-name,
body.orbital-explore-active #focus-image-count,
body.orbital-explore-active #focus-favorite-btn,
body.orbital-explore-active #focus-delete-btn,
body.orbital-explore-active #details-button,
body.orbital-table-standard #focus-stack-name,
body.orbital-table-standard #focus-image-count,
body.orbital-table-standard #focus-favorite-btn,
body.orbital-table-standard #focus-delete-btn,
body.orbital-table-standard #details-button { display:flex !important; position:fixed !important; z-index:12960 !important; }
body.orbital-explore-active #focus-stack-name,
body.orbital-table-standard #focus-stack-name { top:max(20px,env(safe-area-inset-top)) !important; left:max(20px,env(safe-area-inset-left)) !important; }
body.orbital-explore-active #details-button,
body.orbital-table-standard #details-button { top:max(20px,env(safe-area-inset-top)) !important; right:max(20px,env(safe-area-inset-right)) !important; }
body.orbital-explore-active #focus-image-count,
body.orbital-table-standard #focus-image-count { bottom:max(20px,env(safe-area-inset-bottom)) !important; left:max(20px,env(safe-area-inset-left)) !important; }
body.orbital-explore-active #focus-favorite-btn,
body.orbital-table-standard #focus-favorite-btn { bottom:max(20px,env(safe-area-inset-bottom)) !important; left:50% !important; transform:translateX(-50%) !important; }
body.orbital-explore-active #focus-delete-btn,
body.orbital-table-standard #focus-delete-btn { bottom:max(20px,env(safe-area-inset-bottom)) !important; right:max(20px,env(safe-area-inset-right)) !important; }
body.orbital-explore-active #back-button,
body.orbital-explore-active #normal-image-count,
body.orbital-explore-active #center-trash-btn,
body.orbital-explore-active .pill-counter,
body.orbital-table-standard #back-button,
body.orbital-table-standard #normal-image-count,
body.orbital-table-standard #center-trash-btn,
body.orbital-table-standard .pill-counter { display:none !important; }
'''
replace_once(focus_css_anchor, focus_css, 'canonical Focus chrome CSS')
regex_once(r'''\n/\* v1\.7: hide surface-specific duplicate decorations; use the actual Focus controls\. \*/.*?body\.orbital-table-standard #focus-delete-btn \{ bottom:max\(20px,env\(safe-area-inset-bottom\)\) !important; right:max\(20px,env\(safe-area-inset-right\)\) !important; \}\n''','\n','remove old v1.7 Focus/Table CSS')

replace_once('''                this.elements.root.hidden = false;\n                this.buildCards();''','''                this.elements.root.hidden = false;\n                document.body.classList.add('orbital-explore-active');\n                this.buildCards();''','Explore active class open')
replace_once('''                this.elements.root.hidden = true;\n                this.loadGeneration++;''','''                this.elements.root.hidden = true;\n                document.body.classList.remove('orbital-explore-active');\n                this.loadGeneration++;''','Explore active class close')
replace_once('''            select(index) {\n                this.selectedIndex = index;\n                this.cards.forEach((card, cardIndex) => { card.element.classList.toggle('selected', cardIndex === index); card.element.setAttribute('aria-pressed', cardIndex === index ? 'true' : 'false'); });\n                this.updateChrome();\n                this.requestFrame();\n            },''','''            select(index) {\n                this.selectedIndex = index;\n                this.cards.forEach((card, cardIndex) => { card.element.classList.toggle('selected', cardIndex === index); card.element.setAttribute('aria-pressed', cardIndex === index ? 'true' : 'false'); });\n                const selected = this.files[index];\n                const stack = state.stacks[state.currentStack] || [];\n                const stackIndex = stack.findIndex(file => file.id === selected?.id);\n                if (stackIndex >= 0) state.currentStackPosition = stackIndex;\n                Core.updateImageCounters?.();\n                Core.updateFavoriteButton?.();\n                this.updateChrome();\n                this.requestFrame();\n            },''','Explore Focus selection sync')
replace_once('''                this.updateChrome();\n                ModeNavigation.show('explore');''','''                this.updateChrome();\n                const selectedFile = this.files[this.selectedIndex];\n                const selectedStackIndex = stack.findIndex(file => file.id === selectedFile?.id);\n                if (selectedStackIndex >= 0) state.currentStackPosition = selectedStackIndex;\n                Core.updateImageCounters?.();\n                Core.updateFavoriteButton?.();\n                ModeNavigation.show('explore');''','Explore initial Focus sync')
replace_once('''  UI.switchToStack = async function(stackName) {\n    if (!ExploreFocusChromeV141.isInspecting()) {\n      return oldSwitchToStackV141(stackName);\n    }\n    const keepFull = ExploreFocusChromeV141.isFullOpen();\n    const result = await oldSwitchToStackV141(stackName);\n    await ExploreFocusChromeV141.reopenCurrent({ keepFull });\n    return result;\n  };''','''  UI.switchToStack = async function(stackName) {\n    const exploreActive = document.body.classList.contains('orbital-explore-active');\n    if (!exploreActive) return oldSwitchToStackV141(stackName);\n    const inspecting = ExploreFocusChromeV141.isInspecting();\n    const keepFull = ExploreFocusChromeV141.isFullOpen();\n    const result = await oldSwitchToStackV141(stackName);\n    const stack = state.stacks[state.currentStack] || [];\n    const file = stack[state.currentStackPosition] || stack[0];\n    if (!file) return result;\n    SpatialGallery.close({ restoreFocus:false });\n    SpatialGallery.open({ stackName:state.currentStack, fileId:file.id });\n    if (inspecting) {\n      const index = SpatialGallery.files.findIndex(item => item.id === file.id);\n      if (index >= 0) ExploreInspectV14.openPreview(index);\n      if (keepFull) ExploreInspectV14.openFull();\n    }\n    Core.updateImageCounters?.();\n    Core.updateFavoriteButton?.();\n    return result;\n  };''','Explore Focus stack switch')

replace_once('''        .spatial-gallery__adjust { display: none; width: 34px; height: 30px; padding: 0; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: #fff; background: rgba(30,41,59,.95); font: 700 20px/1 system-ui; cursor: pointer; }\n        .spatial-gallery__stepper.expanded .spatial-gallery__adjust { display: block; }''','''        .spatial-gallery__adjust { display: block; width: 34px; height: 30px; padding: 0; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: #fff; background: rgba(30,41,59,.95); font: 700 20px/1 system-ui; cursor: pointer; }\n        .spatial-gallery__value { cursor: grab; }\n        .spatial-gallery__controls.dragging .spatial-gallery__value { cursor: grabbing; }''','Explore selector fixed geometry')
regex_once(r'''\s*this\.elements\.controls\?\.querySelectorAll\('\.spatial-gallery__value'\)\.forEach\(button => button\.addEventListener\('click', event => \{\s*event\.stopPropagation\(\); button\.closest\('\.spatial-gallery__stepper'\)\.classList\.toggle\('expanded'\);\s*\}\)\);''','', 'remove selector expand toggle')
replace_once("                if (event.target.closest('button')) return;","                if (event.target.closest('.spatial-gallery__adjust')) return;",'selector drag from value/body')

# Remove only creation of the fake Table heart. Its now-unreachable legacy listener remains inert and preserves syntax.
regex_once(r'''\s*const favorite=document\.createElement\('button'\);favorite\.id='photo-table-favorite';favorite\.type='button';favorite\.className='photo-table__favorite';favorite\.setAttribute\('aria-label','Favorite armed image'\);favorite\.textContent='♥';root\.appendChild\(favorite\);''','', 'remove fake Table heart creation')

replace_once('''  PhotoTable.down=function(event){\n    const photo=this.findElement?.(event);\n    if(photo?.fileId)this.syncTriageSelectionV15(photo.fileId);\n    return oldTableDownV15(event);\n  };''','''  PhotoTable.down=function(event){\n    const photo=this.findElement?.(event);\n    if(photo?.fileId)this.syncTriageSelectionV15(photo.fileId);\n    const result=oldTableDownV15(event);\n    Core.updateImageCounters?.();\n    Core.updateFavoriteButton?.();\n    return result;\n  };''','Table real Focus chrome sync')
replace_once("    const targets = tableTargetGeometryV14();","    const targets = tableTargetGeometryV14().filter(target => target.el.dataset.tablePile !== 'in' && !target.el.hidden);",'Table physics excludes Inbox')
replace_once('''        .gesture-layer .comet-trail {''','''        .gesture-layer .comet-trail,\n        .photo-table .comet-trail {''','Sort comet CSS shared with Table')
text = text.replace("const labels = { in:'INBOX', out:'MAYBE', priority:'KEEP', trash:'TRASH' };", "const labels = { in:'INBOX', out:'MAYBE', priority:'YES', trash:'NO' };")
text = text.replace("const labels = { in: 'INBOX', out: 'MAYBE', priority: 'KEEP', trash: 'TRASH' };", "const labels = { in: 'INBOX', out: 'MAYBE', priority: 'YES', trash: 'NO' };")
text = text.replace("Table scatters Inbox into YES/MAYBE/NO; target tap opens Grid; Sort comet trails reused; image-image collisions disabled.","v1.8 focus-standard: Explore and Table use real Focus chrome; Explore selector fixed/draggable; Table Inbox scatters to draggable YES/MAYBE/NO; exact Sort trails; no image-image collisions.")

required=[f"const VERSION = '{VERSION}';",f'Orbital8 UI · {VERSION}',"const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};","return [...(state.stacks.in||[])]","document.body.classList.add('orbital-explore-active')","document.body.classList.add('orbital-table-standard')","body.orbital-explore-active #focus-stack-name","body.orbital-table-standard #focus-stack-name",".photo-table .comet-trail","tableTargetGeometryV14().filter(target => target.el.dataset.tablePile !== 'in'",'aria-label="Back to medium inspection"']
for marker in required:
    if marker not in text: raise SystemExit(f'missing required marker: {marker}')
for forbidden in ["favorite.textContent='♥'","classList.toggle('expanded')","this.resolveMovingCollisionsV14();","const VERSION = 'v1.7 clean-table-explore';","Tap image for full size · pinch to inspect","orbital8-v16-standard-chrome-script","orbital8-v161-stable-chrome-script"]:
    if forbidden in text: raise SystemExit(f'forbidden legacy marker remains: {forbidden}')
if text == original: raise SystemExit('v1.8 editor made no changes')
PATH.write_text(text,encoding='utf-8')
print('Orbital8 v1.8 focus-standard applied')
