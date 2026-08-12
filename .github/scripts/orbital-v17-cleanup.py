from pathlib import Path
import subprocess

PATH = Path('ui-v2.html')
BASE_COMMIT = '18bde1535fa3af41e1421ec6376d34616ede48fc'
OLD_VERSION = 'v1.8 focus-standard'
VERSION = 'v1.9 final-requirements'

# Rebuild from the last requirements-validated application source. The later
# ce58eac snapshot removed 1,121 lines and is intentionally not used as source.
text = subprocess.check_output(
    ['git', 'show', f'{BASE_COMMIT}:ui-v2.html'],
    text=True,
    encoding='utf-8'
)

if OLD_VERSION not in text:
    raise SystemExit(f'validated base is missing expected version marker: {OLD_VERSION}')

text = text.replace(OLD_VERSION, VERSION)

# Final requirements: Explore uses Focus-surface chrome and three-step image
# sizing; Table is Inbox-scattered triage with draggable YES/MAYBE/NO targets,
# target physics/effects retained, exact Sort trails, and no image-image collision pass.
required = [
    f"const VERSION = '{VERSION}';",
    f'Orbital8 UI · {VERSION}',
    "const targetLabels={priority:'YES',out:'MAYBE',trash:'NO'};",
    "return [...(state.stacks.in||[])]",
    "document.body.classList.add('orbital-explore-active')",
    "document.body.classList.add('orbital-table-standard')",
    "body.orbital-explore-active #focus-stack-name",
    "body.orbital-explore-active #details-button",
    "body.orbital-explore-active #focus-image-count",
    "body.orbital-explore-active #focus-favorite-btn",
    "body.orbital-explore-active #focus-delete-btn",
    "body.orbital-table-standard #focus-stack-name",
    ".photo-table .comet-trail",
    "tableTargetGeometryV14().filter(target => target.el.dataset.tablePile !== 'in'",
    'aria-label="Back to medium inspection"',
    "ExploreInspectV14.openFull()",
    "this.cardScale = Math.max(0.62, Math.min(1.65, this.pinchStartScale * (distance / this.pinchStartDistance)))",
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'missing final requirement marker: {marker}')

for forbidden in [
    "favorite.textContent='♥'",
    "classList.toggle('expanded')",
    "this.resolveMovingCollisionsV14();",
    OLD_VERSION,
    "Tap image for full size · pinch to inspect",
    "orbital8-v16-standard-chrome-script",
    "orbital8-v161-stable-chrome-script",
]:
    if forbidden in text:
        raise SystemExit(f'forbidden/obsolete marker remains: {forbidden}')

PATH.write_text(text, encoding='utf-8')
print(f'Orbital8 {VERSION} rebuilt from validated source {BASE_COMMIT}')
