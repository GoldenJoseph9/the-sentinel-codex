# The Sentinel Codex — Phase Three: Reader Experience

## Implemented
- Added a chapter index that lists the 16 chapters and enables replay of chapters reached in the reader's saved progression.
- Added an explicit Replay Mode banner and a persistent “Return to Saved Place” control.
- Replay preserves the original saved scene index while the reader moves through earlier chapters. Reloading during replay returns to the original saved position.
- Replay does not change the Chapter One Observer directive or the final Observer choice.
- Replay does not allow newly discovered records to be added to the saved evidence archive. Existing evidence can still be inspected.
- Replay does not permit an unmade Observer decision to be made early.
- Added Escape-to-close and backdrop-click behavior for the chapter index, plus focus restoration when it closes.
- Improved narrow-screen chapter index and top-bar wrapping, and limited text measure for reading comfort.

## Intended behavior
The chapter index is available after the reader has begun and saved story progress. Chapters beyond the saved progress are disabled. Replaying is a temporary viewing mode, not a second playthrough and not a branch editor. To make different decisions, a reader must use the explicit full reset on the Arc One end screen; replay alone never changes those decisions.

## Verification performed
- JavaScript syntax check on all application JS files.
- Static checks for the new chapter navigator elements and replay event handlers.
- ZIP archive integrity check.

## Not yet verified
Browser-level behavior, keyboard screen-reader experience, and responsive layout on physical devices still require manual browser testing. The build is not described as externally tested.
