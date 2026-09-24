# End-to-end acceptance suite

One run walks the whole workflow on 500 images (Pixel 7 and desktop emulation, 4x CPU slowdown):
Sort, Focus next/back, Grid search and reorder, Sort, reload, Explore taps, Focus, X, stack switch,
Table taps, Sort move, Focus delete; after every step it checks that all surfaces agree on one stack order.
Checks C1-C24 map to UI-V2-OWNER-ACCEPTANCE.md (C24: thumbnails kept on the device and reused without the network).

Start the image server from bench/ with VARIANTS_DIR set to the repo root, then:

    npx playwright test -c e2e/pw.config.ts          # UI=other.html DEVICES="Pixel 7" to narrow
