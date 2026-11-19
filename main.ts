// gta6-trophy-guide-01 — entrypoint.
//
// What this entry is: an offline PS5 trophy guide and tracker for Grand Theft
// Auto VI. The guide itself is plain static files in app/ — index.html, a
// small ES module (app.js), a stylesheet, and the trophy data in
// app/data/trophies.json (all 55 trophies with an original guide each, a
// nine-stage roadmap to the platinum, and a spoiler setting). It needs no
// build step and makes no network requests: open app/index.html through the
// local server in serve.ts (`node serve.ts`, then http://localhost:8080).
//
// What this file does: it assembles the submission bundle. It copies app/
// and screenshots/ next to this file into the output directory and writes
// output/dossier.json there, using the vendored make.fun helper
// (vendor/makefun-frontend.ts — leave that file exactly as shipped; the
// scorer re-derives the dossier from its own copy and the two must agree).
//
// Output directory: MAKEFUN_OUTPUT_DIR when set, otherwise /output (the
// grader's container). Outside that container, run e.g.:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The limits passed to buildDossier mirror the scorer's gates, so a bundle
// this script accepts is one the scorer will accept too: at most 4
// screenshots of at most 256 KiB each, app/ under 993 entries and 48 MiB,
// and the dossier's text payload under 163,840 bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Submission gates (scorer's caps): keep the bundle inside every one.
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144; // 256 KiB
const MAX_APP_ENTRIES = 993;
const MAX_APP_BYTES = 50331648; // 48 MiB
const MAX_TEXT_BYTES = 163840;

function copyTree(source, target) {
  cpSync(join(repoRoot, source), join(outDir, target), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app', 'app');

mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree('screenshots', 'screenshots');
}

const dossier = buildDossier(outDir, {
  text_max_bytes: MAX_TEXT_BYTES,
  screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
  app_max_files: MAX_APP_ENTRIES,
  app_max_bytes: MAX_APP_BYTES,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
