# Development Audit — Arc One Reader

**Build reviewed:** 22 October 2026  
**Scope:** Existing 16-chapter reader; targeted fixes only.

## Implemented

- Connected the Chapter One transmit/withhold directive to the Chapter Fourteen preserve/protect intervention.
- Made the four combinations distinct in the Codex, Chapter Fifteen, Chapter Sixteen, and the Arc One end screen.
- Converted mutually exclusive Chapter Fifteen and Sixteen route recaps into conditional content so readers see the route they selected rather than both outcomes.
- Removed absolute claims that the protected witness record guarantees the Observer cannot be traced.
- Corrected Chapter Seven's overnight timestamp.
- Reordered Chapter Sixteen's post-ruling scenes chronologically and corrected the visible scene sequence across all 133 scenes.
- Prevented an unrelated previous-scene illustration from remaining visible when a later scene has no mapped art.
- Added short, optional synthesized scene cues; synchronized sound control accessibility state; updated the progress bar's accessible value.
- Fixed reset state to initialize the record-comparison list.
- Replaced the end-screen test-notes placeholder alert with an actual downloadable feedback template.
- Updated project documentation to match the current 16-chapter build.

## Verification completed

- JavaScript syntax checks: 19/19 files passed.
- Chapter registration: 16/16 chapters load into the chapter data registry.
- Scene inventory: 133 scenes; visible scene numbering is unique and sequential.
- Within-chapter timestamps: no remaining clock reversals found by the audit.
- Referenced asset paths: no missing referenced assets.
- Direct DOM ID references: no missing IDs found.
- Inline evidence links: no missing evidence IDs found.
- Decision logic test: all four combinations (`transmit + preserve`, `transmit + protect`, `withhold + preserve`, `withhold + protect`) rendered the intended Chapter Fourteen/ Fifteen/Sixteen route text without leaking the opposite branch.

## Not yet verified / remaining work

- A full browser/mobile end-to-end test could not be run in this execution environment; the browser runner was blocked. No claim of full runtime verification is made.
- Actual sound playback, download behaviour, save/reload, reset, keyboard navigation, focus restoration, and responsive behaviour still need a normal-browser pass.
- Explicit scene artwork is currently mapped to 30 of 133 scenes. Unmapped scenes are now text-only rather than showing stale imagery. Additional chapter-appropriate illustrations still need to be created and mapped before describing the entire Arc One as fully illustrated.
- Before external testing, run the four Observer routes in a normal browser and verify the above interactions on desktop and mobile.

## Canon safeguards

- The Observer changes evidence access and exposure risk, not reality or either brother's right to exist.
- The first transmission cannot be recalled by the later protect choice.
- Releasing the contradictory observation increases trace risk; it does not prove the source has been identified.
- Protecting the witness record limits disclosure of that record; it does not guarantee that the Observer is untraceable through other evidence.

## Phase Three — Reader Experience Update (V7)
- Added chapter index and replay mode for chapters already reached.
- Replay preserves the saved main reading position, archived evidence, and Observer choices.
- Replay blocks unmade decisions and new evidence archiving so revisiting cannot silently alter the playthrough.
- Added return-to-saved-place controls and Escape/backdrop close behavior for the chapter index.
- Added responsive chapter-list and top-bar styling.
- Validation: all JavaScript files pass `node --check`; HTML IDs are unique; all 16 chapter scripts remain registered; ZIP integrity passes.
- Browser and physical-device testing remains outstanding.
