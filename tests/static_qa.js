const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const window = {};
const context = {window, console};
vm.createContext(context);
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), context, {filename:f});
run('js/manifest.js');
run('js/data.js');
for (let i=1;i<=16;i++) run(`js/chapter${i}.js`);
const chapters = window.SENTINEL_CHAPTERS || {};
const chapterIds = Object.keys(chapters).map(Number).sort((a,b)=>a-b);
const scenes = chapterIds.flatMap(id => chapters[id].scenes.map((scene, index)=>({chapter:id,index,scene})));
const evidence = window.SENTINEL_EVIDENCE || {};
const manifestRows = require('fs').readFileSync(path.join(root, 'ILLUSTRATION_MANIFEST.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(line => { const cols = line.split(','); return { index: Number(cols[0]), filename: cols[5], status: cols[6] }; });
const pendingArtNames = new Set(manifestRows.filter(row => row.status === 'Awaiting artwork').map(row => row.filename));
const art = window.SENTINEL_SCENE_ART || {};
const investigations = window.SENTINEL_INVESTIGATIONS || {};
const errs=[];
if (chapterIds.length!==16 || chapterIds.some((id,i)=>id!==i+1)) errs.push('Chapter registration not exactly 1–16');
if (!scenes.length) errs.push('No scenes loaded');
for (const [idx, item] of scenes.entries()) {
  if (!item.scene || !Array.isArray(item.scene.text)) errs.push(`Scene ${idx}: missing scene/text array`);
  for (const block of (item.scene?.text||[])) {
    if (block && block.choice && !Array.isArray(block.choice.options)) errs.push(`Scene ${idx}: choice missing options`);
    const html = typeof block==='string' ? block : '';
    for (const match of html.matchAll(/data-record=["']([^"']+)["']/g)) if (!evidence[match[1]]) errs.push(`Scene ${idx}: missing evidence ${match[1]}`);
  }
}
const assetRefs=[];
for (const [idx, item] of Object.entries(art)) {
  if (!scenes[Number(idx)]) errs.push(`Artwork mapped to nonexistent scene index ${idx}`);
  if (item?.img) assetRefs.push(item.img);
}
for (const [id, ev] of Object.entries(evidence)) if (ev.img) assetRefs.push(ev.img);
let pendingArtRefs = 0;
for (const rel of assetRefs) {
  const clean = rel.replace(/^\.\//,'');
  if (!fs.existsSync(path.join(root,clean))) {
    if (pendingArtNames.has(path.basename(clean))) pendingArtRefs++;
    else errs.push(`Missing referenced image asset not listed as planned artwork: ${rel}`);
  }
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) if (!fs.existsSync(path.join(root,m[1]))) errs.push(`Missing script ${m[1]}`);
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
if (dup.length) errs.push(`Duplicate HTML IDs: ${[...new Set(dup)].join(', ')}`);
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const directIds=[...app.matchAll(/\$\(\"([^\"]+)\"\)/g)].map(m=>m[1]);
const missingDomIds=[...new Set(directIds.filter(id=>!ids.includes(id)))];
if (missingDomIds.length) errs.push(`Missing direct DOM IDs: ${missingDomIds.join(', ')}`);
const checks={
 'save-state validation': app.includes('validEvidenceIds.has(id)') && app.includes('Math.min(allScenes.length, savedIndex)'),
 'replay blocks evidence writes': app.includes('if (replayMode) {\n    $("modal").classList.add("hidden");\n    return;\n  }'),
 'replay blocks comparison history writes': app.includes('if (connection && !replayMode && !state.comparedRecords.includes(key))'),
 'replay blocks auto-unlock writes': app.includes('if (!replayMode && !found.includes("observer_deduction"))'),
 'replay blocks reset action': app.includes('if (replayMode) return;\n        if (confirm("Reset reading progress?'),
 'missing artwork handled': app.includes('image.onerror = () =>') && app.includes('visual.classList.add("hidden")')
};
for (const [name, ok] of Object.entries(checks)) if (!ok) errs.push(`Guard check failed: ${name}`);
console.log(JSON.stringify({chapterCount:chapterIds.length,sceneCount:scenes.length,evidenceCount:Object.keys(evidence).length,artMappings:Object.keys(art).length,assetReferences:assetRefs.length,pendingPlannedArtworkRefs:pendingArtRefs,htmlIds:ids.length,directDomIdsChecked:directIds.length,checks,errors:errs},null,2));
if (errs.length) process.exit(1);
