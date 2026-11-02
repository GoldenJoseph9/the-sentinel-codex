# The Sentinel Codex — Arc One Reader Build

A standalone, browser-based interactive illustrated reader for all 16 chapters of Arc One. It runs from local files and has no required backend or external service. The interface includes chapter navigation, evidence inspection, an evidence Codex, record comparison, Observer decisions, optional generated sound, and local save state.

## Project structure
- `index.html` — reader shell, navigation, Codex, evidence modal, and end screen.
- `style.css` — atmospheric reader styling, responsive layout, focus states, and reduced-motion handling.
- `js/app.js` — rendering, navigation, evidence handling, decision state, deductions, and local saving.
- `js/manifest.js` — chapter manifest.
- `js/chapter1.js` … `js/chapter16.js` — chapter scene data.
- `js/data.js` — evidence records, scene artwork map, and supported record comparisons.
- `assets/` — current illustration assets.

## Observer decision chain
- At the end of Chapter One, the reader chooses whether to transmit or withhold recovered findings.
- In Chapter Fourteen, the reader separately chooses whether to preserve the contradiction publicly or protect the witness record.
- The early decision changes the later choice's exposure implications; the later decision changes which evidence can be used openly. The four combinations remain distinct through Chapters Fifteen and Sixteen, the Codex, and the ending.
- Neither decision determines which brother deserves to exist or rewrites the past.

## Reader-state and evidence behaviour
- Progress, recovered evidence, record comparisons, and Observer choices are stored in browser `localStorage` under `sentinel_codex_save_v6`.
- Scene artwork is displayed only where a scene has an explicit artwork mapping. Unmapped scenes no longer retain an unrelated image from a previous scene. The current artwork map covers the opening 30 scenes; later scenes are text-only until additional illustrations are created and mapped.
- The first-decision correlation remains a limited observation about conflicting records; it does not establish the Continuum's intent.
- Optional ambience and low-volume synthesized scene cues are available without external audio files. The end-screen test-notes button downloads a real text template; it no longer displays a placeholder alert.

## Audit notes (22 October 2026)
- Corrected the Chapter Sixteen scene order and timestamps so the post-correction morning, review, ruling, and later visits progress chronologically.
- Corrected the overnight rollover for Chapter Seven's final scene.
- Normalized visible scene numbers to a unique sequence from 01 to 133.
- Made the Chapter One and Chapter Fourteen decisions cumulative, and made Chapter Fifteen/Sixteen outcome paragraphs conditional on the route actually selected.
- Removed absolute claims that protecting the witness record guarantees the Observer is untraceable.
- Checked JavaScript syntax for all JS files, all 16 chapter registrations, direct DOM ID references, inline evidence IDs, and referenced image assets.
- Automated browser/mobile end-to-end testing has **not** been completed in this environment. The browser runner was blocked by the execution environment, so no claim of full runtime verification is made.

## Before external testing
1. Run both Chapter One choices through both Chapter Fourteen choices (four combinations).
2. Verify save/reload and reset behaviour in a normal browser.
3. Test keyboard navigation, mobile layout, audio toggling, Codex comparisons, and all evidence modals.
4. Add and map illustrations for later chapters before treating the complete Arc One build as a fully illustrated experience.

## Chapter replay (Phase Three)
Use **CHAPTERS** in the top bar to revisit any chapter reached in your saved progression. Replay is temporary: the application protects your saved reading position, archived evidence, and Observer decisions. Use **RETURN TO SAVED PLACE** to leave replay. Chapters not yet reached remain unavailable. Replay does not create alternate choices or a second save slot.

See `PHASE_THREE_READER_EXPERIENCE.md` for implementation notes and verification limits.


## Phase Four — Technical Reliability
- Saved state is normalized on load to guard against malformed or stale localStorage values.
- Chapter-break and Arc One end-screen positions are now persisted before the renderer returns.
- Replay cannot add evidence, auto-unlock a record, alter comparison history, or reset actual progress.
- Missing planned scene illustrations continue to fail gracefully until the artwork is added.
- Reproducible Node checks are included in `tests/`; see `PHASE_FOUR_TECHNICAL_RELIABILITY.md` for exact scope and limitations.


## Final internal verification

Phase Five internal QA includes a regression fix for the Chapter One `TRANSMIT / WITHHOLD` decision screen. Chapter IDs are stored as strings; the previous numeric comparison prevented the screen from appearing. Both choices now persist and lock after selection, and Chapter Two cannot be entered until a choice is made. The regression is covered by `tests/runtime_smoke.js`. See `PHASE_FIVE_FINAL_VERIFICATION.md` for the full test scope and remaining limitations. Real-browser/device, real-audio/accessibility, and generated-art review remain outstanding. No story prose or canon was changed.
