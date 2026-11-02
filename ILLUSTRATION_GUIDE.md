# Illustration integration — Phase One (V5)

All **133 scenes** were reviewed and classified:
- **30** scenes retain their existing artwork assignments (no replacement or renaming).
- **35** high-impact scenes have reserved filenames.
- **29** additional scenes have reserved filenames, to illustrate only when worthwhile.
- **39** scenes remain intentionally text-only.

## Adding artwork

1. Open `ILLUSTRATION_MANIFEST.csv` (filter by `Essential` first).
2. Create an image for that scene, preferably landscape 16:9 or similarly wide, and export as **WebP**.
3. Give it the **exact** name from the `filename` column (case-sensitive).
4. Put it inside `assets/illustrations/`.
5. Refresh the application; the image appears automatically when that scene is shown. No code edits required.

Reserved images **do not exist yet**. Missing images are hidden instead of displaying broken-image icons or unrelated artwork. Existing images remain in `assets/` and continue to load normally.

**Note:** Scene IDs are currently tied to chapter order. Do not insert/reorder scenes without updating this manifest and the existing image map. Phase One does not change story content, saving, or decisions.

## QA status

JavaScript syntax and manifest counts are checked during packaging. Full browser rendering, file loading from your hosting setup, mobile layouts, and accessibility require subsequent verification. Some browsers restrict local `file://` behavior; use a local web server if needed.
