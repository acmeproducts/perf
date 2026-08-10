from pathlib import Path
import re

TARGET = Path('ui-v2.html')
SOURCE = Path('.github/workflows/zz-ui-v2-table-cache-patch.yml')
MARKER = '<!-- Orbital8 v1.2 table/cache interaction patch -->'

text = TARGET.read_text(encoding='utf-8')
if MARKER in text:
    raise SystemExit('v1.2 patch already present')

source = SOURCE.read_text(encoding='utf-8')
match = re.search(r"override='''(.*?)'''\n\s*if text\.count\('</body>'\)", source, re.S)
if not match:
    raise SystemExit('could not extract v1.2 override payload')
override = match.group(1)

close_at = text.rfind('</body>')
if close_at < 0:
    raise SystemExit('missing document </body>')
text = text[:close_at] + override + '\n' + text[close_at:]

required = [
    MARKER,
    'photo-table__stacks',
    'loadStable=async function',
    'SpatialGallery.dealCard=async function',
    'PhotoTable.commitToPile=async function',
    'PhotoTable.openFullSize=function',
    "ExploreThumbnailCache.releaseUnused=function(){}"
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit(f'missing required markers: {missing}')

TARGET.write_text(text, encoding='utf-8')
print('ui-v2 v1.2 override installed')
