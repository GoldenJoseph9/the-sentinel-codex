# The Sentinel Codex — React Reader Edition

A full-featured React (TypeScript + Vite) interactive illustrated reader for all 16 chapters of Arc One: *The Man Who Never Existed*.

## Features Ported & Implemented
- **Complete Arc One**: All 16 chapters (133 scenes) fully playable with chronological timestamps, chapter labels, and rich scene formatting (terminals, reveals, quotes, and inspector links).
- **Interactive Evidence Codex**: Full-screen dossier for examining recovered evidence records, correlating findings, comparing records, and reviewing Observer directives.
- **Evidence Modal**: Interactive artifact viewer displaying recovered photographs, terminal logs, unregistered artifacts, established facts, and archiving capabilities.
- **Observer Decision Chain**:
  - Chapter 1 boundary: Transmit vs. Withhold findings.
  - Chapter 14 intervention: Preserve the Contradiction vs. Protect the Witness Record.
  - Cumulative 4-route outcome logic affecting conditional scene blocks in Chapters 15 and 16, deduction correlation, and the Arc One complete summary screen.
- **Chapter Replay Mode**: Revisit any reached chapter from the top bar or reader controls without overwriting saved progress or decision state.
- **Synthesized Audio Engine**: Atmospheric ambient low-frequency drone and contextual scene cues generated in real-time via the Web Audio API without external audio files.
- **Save State Persistence**: Progress, evidence records, comparisons, and Observer choices persist in `localStorage` under `sentinel_codex_save_v6`.
- **Atmospheric Visual Identity**: Deep dark palette, Cormorant Garamond and DM Sans typography, glowing gold accents, and seamless scene illustrations.

## Project Structure
- `index.html` — Application entry point with metadata and fonts.
- `src/`
  - `main.tsx` — React application mount.
  - `App.tsx` — Core reader state machine and view orchestration.
  - `types.ts` — Data models, scene interfaces, and state types.
  - `components/`
    - `Topbar.tsx` — Brand, status, chapter index trigger, audio toggle, and evidence badge.
    - `CoverScreen.tsx` — Atmosphere cover art and entrance button.
    - `ReaderScreen.tsx` — Scene reader with visual display, text renderer, and inline inspector links.
    - `ChapterBreakScreen.tsx` — Chapter completion boundary and Observer decision prompt.
    - `ArcEndScreen.tsx` — Final Arc One ending with cumulative outcome summary and notes export.
    - `ChapterNavigatorModal.tsx` — Accessible modal for replaying unlocked chapters.
    - `CodexModal.tsx` — Dossier grid, record comparison tool, and automated correlations.
    - `EvidenceModal.tsx` — Detailed evidence inspector and archiving action.
  - `utils/`
    - `audio.ts` — Real-time Web Audio API synthesizer for drone and cues.
    - `deductions.ts` — Evidence graph correlation engine and outcome summaries.
    - `storage.ts` — Validated localStorage persistence and normalization.
  - `data/` — Chapters 1–16 scene text, evidence definitions, scene artwork mappings, and manifest.
- `style.css` — Atmospheric styling and responsive design.
- `assets/` — Scene illustrations and artifact imagery.

## Running Locally
```bash
npm install
npm run dev
```
Dev server starts on `http://localhost:3000`.
