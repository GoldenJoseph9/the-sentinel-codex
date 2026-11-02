# The Sentinel Codex — Phase Four: Technical Reliability

## Implemented in this pass

- Normalized saved state on load: scene indexes are clamped; evidence IDs are checked against the evidence database and deduplicated; Observer choices are restricted to supported values; comparison history is validated.
- Fixed a persistence defect: chapter-break and Arc One end-screen positions are now saved before rendering returns. Previously, closing the app at those screens could resume from an earlier scene.
- Strengthened replay isolation: replay cannot archive evidence, auto-unlock the Observer correlation record, write comparison history, or reset the reader's actual progress.
- Kept missing scene-art behavior graceful: a missing or failed scene illustration stays hidden rather than leaving a broken image or unrelated prior art visible.

## Checks performed

- JavaScript syntax: 19/19 files passed `node --check`.
- Data load: 16 chapters and 133 scenes registered.
- Evidence database: 30 records loaded.
- Illustration map: 94 scene mappings (30 existing illustrations plus 64 planned artwork slots).
- All 64 absent illustration files correspond to manifest entries marked `Awaiting artwork`; no unexpected missing image references were found.
- Static QA: no duplicate HTML IDs, missing script files, invalid chapter registration, missing referenced evidence IDs, or unexpected missing image assets.
- Simulated-DOM runtime smoke tests: 14/14 passed, covering startup, navigation, replay position preservation, replay write guards, chapter-break/end-screen saving, malformed-save normalization, and four distinct Observer outcomes.
- ZIP integrity checked after packaging.

## Not yet verified

This is not a substitute for a real browser session. No real-browser, physical-mobile, screen-reader, or actual audio playback test was performed in this environment. Image loading has been checked against the files present and the missing-art fallback logic, but the 64 planned illustrations are not yet generated. Once those images exist, their visual quality, crop, loading, and scene fit must be reviewed.

## Reproducible checks

From the extracted project root with Node.js installed:

```sh
node tests/static_qa.js
node tests/runtime_smoke.js
```

The runtime smoke test uses a lightweight simulated DOM. It verifies selected state transitions but does not claim full browser fidelity.
