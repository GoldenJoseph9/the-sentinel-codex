// THE SENTINEL CODEX - Core Engine v4.5
// Evidence Graph encoded; scroll-to-top fixed; chapter breaks dynamic;
// End screen summarizes the Observer choice made in Chapter Fourteen.

const $ = id => document.getElementById(id);
const SAVE_KEY = "sentinel_codex_save_v6";

// 1. DATA & STATE INITIALIZATION
let allScenes = [];
let chapterMap = [];

const releaseConfig = window.SENTINEL_RELEASE || {};
const manifestChapterIds = Array.isArray(window.SENTINEL_MANIFEST)
  ? window.SENTINEL_MANIFEST.map(chapter => Number(chapter.id)).filter(Number.isFinite)
  : Object.keys(window.SENTINEL_CHAPTERS || {}).map(Number).filter(Number.isFinite);
const finalManifestChapter = manifestChapterIds.length ? Math.max(...manifestChapterIds) : 0;
const publishedThrough = Number.isInteger(Number(releaseConfig.publishedThrough))
  ? Math.max(1, Number(releaseConfig.publishedThrough))
  : finalManifestChapter;
const isArcFullyPublished = finalManifestChapter > 0 && publishedThrough >= finalManifestChapter;

if (window.SENTINEL_CHAPTERS) {
  const chapterIds = Object.keys(window.SENTINEL_CHAPTERS)
    .filter(id => Number(id) <= publishedThrough)
    .sort((a, b) => a - b);
  chapterIds.forEach(id => {
    const chapterData = window.SENTINEL_CHAPTERS[id];
    const startIndex = allScenes.length;
    chapterData.scenes.forEach((scene, index) => {
      allScenes.push(scene);
      chapterMap.push({
        chapterId: id,
        chapterTitle: chapterData.title,
        sceneIndex: startIndex + index
      });
    });
  });
} else {
  console.error("Critical Error: Chapter data failed to load.");
}

const evidenceDb = window.SENTINEL_EVIDENCE || {};
const sceneArt = window.SENTINEL_SCENE_ART || {};

let replayMode = false;
let replayReturnIndex = null;
let lastFocusedBeforeChapterNav = null;
let skipChapterBreak = false; // Flag to bypass break screen when clicking "Continue"

let state = {
  sceneIndex: -1,
  foundEvidence: [],
  observerDecision: null,
  finalObserverChoice: null,
  comparedRecords: []
};

try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    const savedIndex = Number.isInteger(saved.sceneIndex) ? saved.sceneIndex : -1;
    state.sceneIndex = Math.max(-1, Math.min(allScenes.length, savedIndex));
    const validEvidenceIds = new Set(Object.keys(evidenceDb));
    state.foundEvidence = Array.isArray(saved.foundEvidence)
      ? [...new Set(saved.foundEvidence.filter(id => typeof id === "string" && validEvidenceIds.has(id)))]
      : [];
    state.observerDecision = ["transmit", "withhold"].includes(saved.observerDecision) ? saved.observerDecision : null;
    state.finalObserverChoice = ["preserve", "protect"].includes(saved.finalObserverChoice) ? saved.finalObserverChoice : null;
    state.comparedRecords = Array.isArray(saved.comparedRecords)
      ? [...new Set(saved.comparedRecords.filter(pair => typeof pair === "string" && pair.includes("|")))]
      : [];
  }
} catch (e) { console.warn("Save load failed; starting with a clean reading state."); }

function saveState() {
  // Replays are a temporary viewing mode: persist the reader's original position,
  // never the chapter currently being revisited.
  const persisted = replayMode && Number.isInteger(replayReturnIndex)
    ? { ...state, sceneIndex: replayReturnIndex }
    : state;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(persisted)); } catch (e) {}
}

function updateReplayUI() {
  const notice = $("replayNotice");
  const returnButton = $("returnProgressButton");
  if (notice) notice.classList.toggle("hidden", !replayMode);
  if (returnButton) returnButton.classList.toggle("hidden", !replayMode);
  const chaptersButton = $("chaptersButton");
  if (chaptersButton) chaptersButton.setAttribute("aria-label", replayMode ? "Choose another chapter to replay" : "Open chapter index");
}

function getReachedChapters() {
  const savedIndex = replayMode && Number.isInteger(replayReturnIndex) ? replayReturnIndex : state.sceneIndex;
  const maxIndex = Math.max(0, Math.min(savedIndex, allScenes.length - 1));
  const maxChapter = chapterMap[maxIndex] ? Number(chapterMap[maxIndex].chapterId) : 1;
  return [...new Set(chapterMap.filter(row => Number(row.chapterId) <= maxChapter).map(row => Number(row.chapterId)))];
}

function renderChapterNavigator() {
  const list = $("chapterList");
  if (!list) return;
  list.replaceChildren();
  const reached = new Set(getReachedChapters());
  const starts = new Map();
  chapterMap.forEach(row => { if (!starts.has(Number(row.chapterId))) starts.set(Number(row.chapterId), row.sceneIndex); });
  [...starts.entries()].forEach(([chapterId, sceneIndex]) => {
    const row = chapterMap[sceneIndex];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-list-item";
    const current = replayMode && chapterMap[state.sceneIndex] && Number(chapterMap[state.sceneIndex].chapterId) === chapterId;
    button.innerHTML = `<span class="chapter-list-number">${String(chapterId).padStart(2, "0")}</span><span class="chapter-list-copy"><strong>${escapeHtml(row.chapterTitle)}</strong><small>${reached.has(chapterId) ? "AVAILABLE TO REPLAY" : "NOT YET REACHED"}</small></span><span class="chapter-list-arrow">${current ? "NOW" : "↗"}</span>`;
    button.disabled = !reached.has(chapterId);
    button.setAttribute("aria-label", `Replay chapter ${chapterId}: ${row.chapterTitle}`);
    button.onclick = () => {
      if (!reached.has(chapterId)) return;
      if (!replayMode) { replayReturnIndex = state.sceneIndex; replayMode = true; }
      $("chapterNavigator").classList.add("hidden");
      moveScene(sceneIndex);
      updateReplayUI();
    };
    list.appendChild(button);
  });
}

function openChapterNavigator() {
  if (state.sceneIndex < 0 || state.sceneIndex >= allScenes.length) {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } })();
    if (!saved || !Number.isInteger(saved.sceneIndex) || saved.sceneIndex < 0) return;
  }
  lastFocusedBeforeChapterNav = document.activeElement;
  renderChapterNavigator();
  $("chapterNavigator").classList.remove("hidden");
  const firstAvailable = $("chapterList").querySelector("button:not(:disabled)");
  if (firstAvailable) firstAvailable.focus();
}

function exitReplay() {
  if (!replayMode) return;
  const destination = Number.isInteger(replayReturnIndex) ? replayReturnIndex : -1;
  replayMode = false;
  replayReturnIndex = null;
  state.sceneIndex = destination;
  saveState();
  moveScene(destination);
  updateReplayUI();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

// 3. AUDIO ENGINE
let audioEnabled = false;
let ctx = null;
let ambience = null;
let noiseNode = null;

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try { ctx = ctx || new AC(); ctx.resume(); return true; } catch (e) { return false; }
}

function oscillator(freq, duration, volume = .07, type = "sine", delay = 0, endFreq = null) {
  if (!ctx) return;
  const start = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);
  g.gain.setValueAtTime(.0001, start); g.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), start + .02);
  g.gain.exponentialRampToValueAtTime(.0001, start + duration);
  o.connect(g).connect(ctx.destination); o.start(start); o.stop(start + duration + .02);
}

function noiseBurst(delay = 0, duration = .1, volume = .12, cutoff = 500) {
  if (!ctx) return;
  const len = Math.max(1, Math.round(ctx.sampleRate * duration)), b = ctx.createBuffer(1, len, ctx.sampleRate), arr = b.getChannelData(0);
  for (let i = 0; i < len; i++) arr[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = "lowpass"; f.frequency.value = cutoff;
  const start = ctx.currentTime + delay;
  g.gain.setValueAtTime(.0001, start); g.gain.linearRampToValueAtTime(volume, start + .015);
  g.gain.exponentialRampToValueAtTime(.0001, start + duration);
  s.connect(f).connect(g).connect(ctx.destination); s.start(start); s.stop(start + duration);
}

function stopAmbience() {
  if (ambience) { try { ambience.stop(); } catch (e) {} ambience.disconnect(); ambience = null; }
  if (noiseNode) { try { noiseNode.stop(); } catch (e) {} noiseNode.disconnect(); noiseNode = null; }
}

function startAmbience() {
  stopAmbience();
  if (!audioEnabled || !ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.value = 54; g.gain.value = .012;
  o.connect(g).connect(ctx.destination); o.start(); ambience = o;
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
  n.buffer = b; n.loop = true; f.type = "lowpass"; f.frequency.value = 400; ng.gain.value = .017;
  n.connect(f).connect(ng).connect(ctx.destination); n.start(); noiseNode = n;
}

// 4. CORE RENDER LOGIC
function render() {
  updateReplayUI();
  const scene = allScenes[state.sceneIndex];
  const isValidScene = state.sceneIndex >= 0 && state.sceneIndex < allScenes.length;

  $("cover").classList.toggle("hidden", state.sceneIndex !== -1);
  $("count").textContent = state.foundEvidence.length;

  let currentChapter = null;
  if (isValidScene) currentChapter = chapterMap[state.sceneIndex];

  const progress = Math.max(0, (state.sceneIndex + 1) / allScenes.length * 100);
  $("progressFill").style.width = progress + "%";
  $("progressBar").setAttribute("aria-valuenow", String(Math.round(progress)));
  $("replaySound").disabled = !audioEnabled || !isValidScene;

  // --- CHAPTER BREAK HANDLING ---
  let isAtChapterBreak = false;
  let previousChapter = null;

  // We only show the break if we are entering a new chapter, and we haven't
  // just clicked "Continue" to bypass this specific break screen.
  if (!skipChapterBreak && isValidScene && state.sceneIndex > 0) {
    const previousChapterData = chapterMap[state.sceneIndex - 1];
    if (currentChapter && previousChapterData.chapterId !== currentChapter.chapterId) {
      isAtChapterBreak = true;
      previousChapter = previousChapterData;
    }
  }

  if (isAtChapterBreak) {
    $("reader").classList.add("hidden");
    $("chapterBreak").classList.remove("hidden");
    if ($("end")) $("end").classList.add("hidden");

    $("breakChapterTitle").textContent = `CHAPTER ${previousChapter.chapterId} · COMPLETE`;
    $("breakHeading").textContent = "THE RECORD CONTINUES.";
    $("continueChapterTwo").textContent = "CONTINUE";

    // The first Observer directive appears only after Chapter One
    if (Number(previousChapter.chapterId) === 1) {
      $("breakText").textContent = "Before the story continues, decide what the Codex may learn from your recovered evidence.";
      $("observerDecision").classList.remove("hidden");

      if (!state.observerDecision && replayMode) {
        $("transmit").disabled = true;
        $("withhold").disabled = true;
        $("continueChapterTwo").disabled = false;
        $("decisionResult").textContent = "REPLAY ONLY · This decision is not changed during chapter replay.";
      } else if (!state.observerDecision) {
        $("transmit").disabled = false;
        $("withhold").disabled = false;
        $("continueChapterTwo").disabled = true;
        $("transmit").onclick = () => {
          state.observerDecision = "transmit";
          $("decisionResult").textContent = "ACCESS GRANTED.";
          $("transmit").disabled = true;
          $("withhold").disabled = true;
          $("continueChapterTwo").disabled = false;
          saveState();
        };
        $("withhold").onclick = () => {
          state.observerDecision = "withhold";
          $("decisionResult").textContent = "ACCESS DENIED.";
          $("transmit").disabled = true;
          $("withhold").disabled = true;
          $("continueChapterTwo").disabled = false;
          saveState();
        };
      } else {
        $("transmit").disabled = true;
        $("withhold").disabled = true;
        $("continueChapterTwo").disabled = false;
        $("decisionResult").textContent = state.observerDecision === "transmit" ? "ACCESS GRANTED." : "ACCESS DENIED.";
      }
    } else {
      $("breakText").textContent = `You have reached the end of Chapter ${previousChapter.chapterId}. The next chapter awaits.`;
      $("observerDecision").classList.add("hidden");
      $("continueChapterTwo").disabled = false;
    }

    $("continueChapterTwo").onclick = () => {
      $("chapterBreak").classList.add("hidden");
      skipChapterBreak = true; // Tell the renderer to bypass the break
      moveScene(state.sceneIndex);
    };
    // Persist chapter-break positions too; otherwise closing the app here can
    // resume from the previous scene instead of this boundary.
    saveState();
    return;
  }

  // --- END OF CURRENT RELEASE OR FINAL END OF ARC ONE ---
  if (state.sceneIndex === allScenes.length && !isArcFullyPublished) {
    // This is a publication boundary, not the canonical ending of Arc One.
    // Reuse the existing chapter-break surface to avoid changing index.html.
    const lastChapter = chapterMap.length ? chapterMap[chapterMap.length - 1] : null;
    $("reader").classList.add("hidden");
    if ($("end")) $("end").classList.add("hidden");
    $("chapterBreak").classList.remove("hidden");
    $("breakChapterTitle").textContent = lastChapter
      ? `CHAPTER ${lastChapter.chapterId} · CURRENT RELEASE COMPLETE`
      : "CURRENT RELEASE";
    $("breakHeading").textContent = releaseConfig.interimHeading || "THE ARCHIVE REMAINS OPEN.";
    $("breakText").textContent = releaseConfig.interimMessage ||
      "You have reached the end of the currently available records. The investigation continues in a future release.";
    $("observerDecision").classList.add("hidden");
    $("continueChapterTwo").textContent = "RETURN TO COVER";
    $("continueChapterTwo").disabled = false;
    $("continueChapterTwo").onclick = () => {
      replayMode = false;
      replayReturnIndex = null;
      moveScene(-1);
    };
    saveState();
    return;
  }

  // --- FINAL END OF ARC ONE ---
  if (state.sceneIndex === allScenes.length && isArcFullyPublished) {
    $("reader").classList.add("hidden");
    if ($("chapterBreak")) $("chapterBreak").classList.add("hidden");
    $("end").classList.remove("hidden");

    // Display the cumulative outcome of the Observer choices.
    const finalResult = $("finalDecisionResult");
    if (finalResult) {
      if (state.finalObserverChoice === "preserve") {
        finalResult.innerHTML =
          "<strong style='color: var(--gold);'>YOU PRESERVED THE CONTRADICTION.</strong><br>" +
          getObserverOutcomeSummary();
      } else if (state.finalObserverChoice === "protect") {
        finalResult.innerHTML =
          "<strong style='color: var(--gold);'>YOU PROTECTED THE WITNESS RECORD.</strong><br>" +
          getObserverOutcomeSummary();
      } else {
        finalResult.innerHTML = "<em>No complete Observer directive was recorded.</em>";
      }
    }

    // Wire the end-screen buttons every time we arrive here
    const feedbackBtn = $("feedback");
    if (feedbackBtn) {
      feedbackBtn.onclick = () => {
        const template = [
          "THE SENTINEL CODEX — READER TEST NOTES",
          "Date:",
          "Device / browser:",
          "Time spent reading:",
          "Where did you feel most curious?",
          "Where did you feel confused or lose interest?",
          "Which evidence did you inspect or compare, and why?",
          "What did you think the Chapter One decision would change?",
          "Did the Chapter Fourteen intervention feel connected to that earlier decision? Why / why not?",
          "Did your final choice feel consequential? What consequence did you notice?",
          "Any broken controls, missing images, sound issues, or save problems:",
          "Would you continue reading? (Yes / No / Unsure)",
          "Would you pay for an experience like this? (Yes / No / Unsure)",
          "What would need to improve before you paid?",
          "Anything else:",
          ""
        ].join("\n");
        const blob = new Blob([template], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sentinel-codex-reader-test-notes.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }

    const resetBtn = $("reset");
    if (resetBtn) {
      resetBtn.disabled = replayMode;
      resetBtn.title = replayMode ? "Reset is unavailable during chapter replay." : "Reset reading progress";
      resetBtn.onclick = () => {
        if (replayMode) return;
        if (confirm("Reset reading progress? This will clear all saved evidence and return to the cover screen.")) {
          replayMode = false;
          replayReturnIndex = null;
          state = {
            sceneIndex: -1,
            foundEvidence: [],
            observerDecision: null,
            finalObserverChoice: null,
            comparedRecords: []
          };
          saveState();
          moveScene(-1);
        }
      };
    }

    // The end screen is a valid saved position, not an unsaved transition.
    saveState();
    return;
  }

  // Normal Scene Rendering
  skipChapterBreak = false; // Reset the bypass flag now that we are rendering a scene
  $("reader").classList.remove("hidden");
  if ($("chapterBreak")) $("chapterBreak").classList.add("hidden");
  if ($("end")) $("end").classList.add("hidden");

  if (isValidScene) {
    $("status").textContent = `CHAPTER ${currentChapter.chapterId} / ${currentChapter.chapterTitle.toUpperCase()}`;
    $("sceneLabel").textContent = scene.label || "";
    $("clock").textContent = scene.clock || "";
    $("story").innerHTML = `<h2>${scene.title}</h2>` + formatSceneText(scene.text);

    // Missing artwork is intentional while the illustrator fills named slots.
    // A load token prevents an earlier scene's delayed image event from appearing later.
    const art = sceneArt[state.sceneIndex];
    const visual = $("sceneVisual"), image = $("sceneImage"), caption = $("sceneCaption");
    const artToken = String(state.sceneIndex) + ":" + String(Date.now()) + ":" + Math.random();
    visual.dataset.artToken = artToken;
    visual.classList.add("hidden");
    image.onload = null;
    image.onerror = null;
    image.removeAttribute("src");
    image.alt = "";
    caption.textContent = "";
    if (art && art.img) {
      image.onload = () => {
        if (visual.dataset.artToken !== artToken) return;
        image.alt = art.cap || scene.title || "Scene illustration";
        caption.textContent = art.cap || "";
        visual.classList.remove("hidden");
      };
      image.onerror = () => {
        if (visual.dataset.artToken !== artToken) return;
        visual.classList.add("hidden");
        image.removeAttribute("src");
      };
      image.src = art.img;
    }

    attachInteractions();
  }

  saveState();
}

function formatSceneText(textArray) {
  return textArray.map(t => {
    if (typeof t === "string") return `<p>${t}</p>`;
    if (t.terminal) return `<div class="terminal">${t.terminal}</div>`;
    if (t.reveal) return `<p class="reveal">${t.reveal}</p>`;
    if (t.choice) return renderChoiceBlock(t.choice);

    if (t.condition) {
      const conditions = String(t.condition).split('+');
      const matches = conditions.every(condition =>
        state.observerDecision === condition || state.finalObserverChoice === condition
      );
      if (!matches) return "";
      const paragraphs = Array.isArray(t.text) ? t.text : [t.text];
      return paragraphs.map(paragraph => `<p class="observer-consequence">${paragraph}</p>`).join('');
    }
    return "";
  }).join("");
}

// 5. INTERACTION & INVESTIGATION SYSTEMS
function attachInteractions() {
  document.querySelectorAll('.inspect-inline').forEach(btn => {
    btn.onclick = () => openEvidenceModal(btn.dataset.record);
  });
  document.querySelectorAll('.observer-btn').forEach(btn => {
    btn.onclick = () => handleObserverChoice(btn.dataset.choice);
  });
}

function openEvidenceModal(id) {
  if (!evidenceDb[id]) {
    console.warn("Missing evidence record:", id);
    return;
  }
  const ev = evidenceDb[id];

  const visualContainer = $("modalVisualContainer");
  if (ev.img) {
    $("modalImage").src = ev.img;
    visualContainer.classList.remove("hidden");
  } else {
    visualContainer.classList.add("hidden");
  }

  $("modalCard").setAttribute("data-type", ev.type || "terminal");
  $("modalTypeLabel").textContent =
    ev.type === "photograph" ? "RECOVERED IMAGE" :
    ev.type === "artifact" ? "UNREGISTERED ARTIFACT" :
    "RESTRICTED RECORD";
  $("modalTitle").textContent = ev.title;
  $("modalBody").textContent = ev.body;
  const analysis = $("modalAnalysis");
  if (analysis) {
    analysis.replaceChildren();
    for (const [label, value] of [["ESTABLISHED", ev.established]]) {
      if (!value) continue;
      const row = document.createElement("p");
      const heading = document.createElement("strong");
      heading.textContent = label + ": ";
      row.append(heading, document.createTextNode(value));
      analysis.appendChild(row);
    }
  }

  const saveBtn = $("saveEvidence");
  if (replayMode) {
    saveBtn.textContent = state.foundEvidence.includes(id) ? "RECORDED ✓" : "REPLAY ONLY";
    saveBtn.disabled = true;
  } else if (state.foundEvidence.includes(id)) {
    saveBtn.textContent = "RECORDED ✓";
    saveBtn.disabled = true;
  } else {
    saveBtn.textContent = "ARCHIVE FINDING +";
    saveBtn.disabled = false;
  }

  window.currentModalEvidenceId = id;
  $("modal").classList.remove("hidden");
}

function saveEvidence(id) {
  if (replayMode) {
    $("modal").classList.add("hidden");
    return;
  }
  if (!evidenceDb[id]) return;
  if (!state.foundEvidence.includes(id)) {
    state.foundEvidence.push(id);
    saveState();
    render();
  }
  $("modal").classList.add("hidden");
}

function renderChoiceBlock(choiceData) {
  const isAlreadyChosen = state.finalObserverChoice !== null;
  const replayWithoutChoice = replayMode && !isAlreadyChosen;

  let html = `<div class="decision" id="observerChoiceBlock" style="margin: 40px 0; padding: 30px; border: 1px solid var(--gold); background: rgba(213, 173, 101, 0.05);">`;
  html += `<div class="eyebrow" style="color: var(--gold); margin-bottom: 10px;">OBSERVER DIRECTIVE</div>`;
  html += `<p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">${choiceData.prompt}</p>`;

  if (!isAlreadyChosen && !replayWithoutChoice) {
    html += `<div class="decision-buttons" style="flex-direction: column; gap: 15px;">`;
    choiceData.options.forEach(opt => {
      html += `<button type="button" class="primary observer-btn" data-choice="${opt.id}" style="text-align: left; padding: 15px;">${opt.label}</button>`;
    });
    html += `</div>`;
  } else if (replayWithoutChoice) {
    html += `<p class="micro">REPLAY ONLY · This decision is unavailable during replay and will not be recorded.</p>`;
  } else {
    const chosenOpt = choiceData.options.find(o => o.id === state.finalObserverChoice);
    html += `<div id="decisionResult" style="color: var(--gold); font-weight: bold; margin-top: 20px;">${chosenOpt ? chosenOpt.resultText : ""}</div>`;
  }
  html += `</div>`;
  return html;
}

function handleObserverChoice(choiceId) {
  if (replayMode) return;
  state.finalObserverChoice = choiceId;

  if (choiceId === "preserve" && !state.foundEvidence.includes("record_released")) {
    state.foundEvidence.push("record_released");
  } else if (choiceId === "protect" && !state.foundEvidence.includes("witness_protected")) {
    state.foundEvidence.push("witness_protected");
  }

  saveState();
  render();
}

// 7. NAVIGATION
function moveScene(n) {
  state.sceneIndex = Math.max(-1, Math.min(allScenes.length, n));
  render();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.getElementById('top');
    if (mainEl) mainEl.scrollTop = 0;
    const readerEl = document.getElementById('reader');
    if (readerEl) readerEl.scrollTop = 0;
  };

  scrollToTop();
  requestAnimationFrame(scrollToTop);
  setTimeout(scrollToTop, 0);
}

$("begin").onclick = () => moveScene(0);
$("previous").onclick = () => moveScene(state.sceneIndex - 1);
$("next").onclick = () => moveScene(state.sceneIndex + 1);

$("chaptersButton").onclick = openChapterNavigator;
$("readerChaptersButton").onclick = openChapterNavigator;
$("closeChapterNavigator").onclick = () => {
  $("chapterNavigator").classList.add("hidden");
  if (lastFocusedBeforeChapterNav && typeof lastFocusedBeforeChapterNav.focus === "function") lastFocusedBeforeChapterNav.focus();
};
$("chapterNavigator").addEventListener("click", event => {
  if (event.target === $("chapterNavigator")) $("closeChapterNavigator").click();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("chapterNavigator").classList.contains("hidden")) $("closeChapterNavigator").click();
});
$("returnProgressButton").onclick = exitReplay;
$("exitReplayButton").onclick = exitReplay;

$("audioButton").onclick = () => {
  audioEnabled = !audioEnabled;
  $("audioButton").textContent = audioEnabled ? "SOUND ON" : "SOUND OFF";
  $("audioButton").setAttribute("aria-pressed", String(audioEnabled));
  $("audioStatus").textContent = audioEnabled ? "Sound is on · optional ambience active" : "Sound is off";
  if (audioEnabled) { ensureAudio(); startAmbience(); } else { stopAmbience(); }
  $("replaySound").disabled = !audioEnabled || state.sceneIndex < 0 || state.sceneIndex >= allScenes.length;
};

function playSceneCue() {
  const scene = allScenes[state.sceneIndex];
  if (!audioEnabled || !scene || !ensureAudio()) return;
  const title = (scene.title || "").toLowerCase();
  // Short, low-volume synthesized cues; no external audio files or downloads.
  if (/observer|codex|memory|weaver|thread|witness/.test(title)) {
    oscillator(523.25, .14, .035, "sine");
    oscillator(783.99, .20, .025, "sine", .12);
  } else if (/correction|order|record|terminal|override|report/.test(title)) {
    oscillator(196, .13, .035, "triangle");
    noiseBurst(.10, .07, .018, 650);
  } else {
    oscillator(329.63, .12, .025, "sine");
  }
  $("audioStatus").textContent = "Scene cue played";
}

$("replaySound").onclick = playSceneCue;

$("closeModal").onclick = () => $("modal").classList.add("hidden");

// --- PHASE 2 & 3: EVIDENCE BOARD & CONSEQUENCES ---
function openCodex() {
  const grid = $("evidenceGrid");
  const emptyState = $("emptyState");
  const deductionsList = $("deductionsList");

  grid.innerHTML = "";

  if (state.foundEvidence.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");

    state.foundEvidence.forEach(id => {
      const ev = evidenceDb[id];
      if (!ev || ev.systemOnly) return;

      const card = document.createElement("div");
      card.className = "evidence-card";
      card.innerHTML = `
        ${ev.img ? `<img src="${ev.img}" class="evidence-card-img" alt="">` : ""}
        <div class="evidence-card-info">
          <div class="ev-title">${ev.title}</div>
          <div class="ev-note">${ev.note}</div>
        </div>
      `;
      card.onclick = () => {
        $("codex-screen").classList.add("hidden");
        openEvidenceModal(id);
      };
      grid.appendChild(card);
    });
  }

  const deductions = checkConnections();
  if (deductions.length > 0) {
    deductionsList.innerHTML = deductions.map(d => `<div class="deduction-item">${d}</div>`).join("");
  } else {
    deductionsList.innerHTML = `<p class="micro">No connections established yet.</p>`;
  }

  renderInvestigation();
  $("codex-screen").classList.remove("hidden");
}

// Optional investigation: no story progress or existing deductions are gated by comparison.
const investigationPairs = window.SENTINEL_INVESTIGATIONS || {};

function getObserverOutcomeSummary() {
  const early = state.observerDecision;
  const later = state.finalObserverChoice;
  if (!early || !later) return 'The Observer’s full intervention record is incomplete.';
  if (early === 'transmit' && later === 'preserve') return 'Earlier findings were transmitted; the contradiction is now also released. The case has the strongest public evidence of these routes, and the combined submissions increase the chance that the Observer’s source can be traced.';
  if (early === 'withhold' && later === 'preserve') return 'Earlier findings stayed local, but the contradictory observation was later released. This creates the first external trail to that independent record; source exposure is possible, not guaranteed.';
  if (early === 'transmit' && later === 'protect') return 'Earlier findings were transmitted, but the contradictory witness record remains sealed. The earlier transmission cannot be recalled; the protected observation is not added to that evidence chain.';
  return 'Earlier findings stayed local and the contradictory witness record remains sealed. This offers the strongest separation of the Observer’s source from the external case, but investigators must rely on physical measurements and testimony.';
}

function renderInvestigation() {
  const first = $("compareFirst"), second = $("compareSecond");
  const result = $("comparisonResult");
  const observer = $("codexObserverRecord");
  if (!first || !second || !result || !observer) return;
  const previousFirst = first.value, previousSecond = second.value;
  for (const select of [first, second]) {
    select.replaceChildren(new Option("Select recovered record", ""));
    state.foundEvidence.filter(id => evidenceDb[id] && !evidenceDb[id].systemOnly).forEach(id => {
      select.add(new Option(evidenceDb[id].title, id));
    });
  }
  if (state.foundEvidence.includes(previousFirst)) first.value = previousFirst;
  if (state.foundEvidence.includes(previousSecond)) second.value = previousSecond;
  result.textContent = "Select two recovered records to inspect their relationship.";
  const decisionText = state.observerDecision === "transmit"
    ? "Chapter 1: Findings transmitted for external correlation. Transmission may create an exposure trail; no outcome is presumed."
    : state.observerDecision === "withhold"
    ? "Chapter 1: External transmission withheld. Recovered records and private comparisons remain on this device."
    : "Chapter 1: No directive recorded yet.";
  const route = $("observerRouteResult");
  const iterationRecovered = state.foundEvidence.includes("iteration");
  if (route) {
    route.classList.toggle("hidden", !iterationRecovered || !state.observerDecision);
    if (iterationRecovered && state.observerDecision === "transmit") {
      route.textContent = "TRANSMITTED FINDINGS CORRELATED · The Codex has cross-referenced Iteration 017 against the findings you authorized for transmission. The receiving system has the transmitted material; what it will do with it remains unknown.";
    } else if (iterationRecovered && state.observerDecision === "withhold") {
      route.textContent = "LOCAL ARCHIVE · No external correlation was requested. Case 0017 and Iteration 017 can still be compared privately below; this comparison is not transmitted.";
    }
  }
  observer.textContent = decisionText + (state.finalObserverChoice ? " Later directive: " + state.finalObserverChoice + ". " + getObserverOutcomeSummary() : "");
}
$("compareEvidence").onclick = () => {
  const first = $("compareFirst").value, second = $("compareSecond").value;
  const result = $("comparisonResult");
  if (!first || !second || first === second) { result.textContent = "Choose two different recovered records."; return; }
  if (![first, second].every(id => state.foundEvidence.includes(id) && evidenceDb[id])) {
    result.textContent = "Both records must be recovered first."; return;
  }
  const key = [first, second].sort().join("|");
  // The withheld route permits a private, on-device comparison instead of
  // the transmitted route's automatic system correlation. Both need evidence.
  const privatePair = key === "case|iteration" && state.observerDecision === "withhold";
  const connection = privatePair
    ? "LOCAL COMPARISON · NOT TRANSMITTED\n\nCASE 0017 — SUBJECT: JAVIS / STATUS: DECEASED / TERMINATION: 17 OCTOBER, 02:14\n\nITERATION 017 — SUBJECT: J-17 / STATUS: UNRESOLVED / CORRECTION: PENDING\n\nThese records use different status fields. No cause or intent is established."
    : investigationPairs[key];
  result.textContent = connection || "No shared indexed fields for this pair.";
  if (connection && !replayMode && !state.comparedRecords.includes(key)) {
    state.comparedRecords.push(key);
    saveState();
  }
};

$("notesButton").onclick = openCodex;
$("closeCodex").onclick = () => $("codex-screen").classList.add("hidden");

// ==========================================
// THE DEDUCTION ENGINE
// Encoded from the Arc One Evidence Graph.
// Each rule fires once when all required IDs are present.
// The observer_deduction auto-unlock is handled inside the rule itself.
// ==========================================
function checkConnections() {
  const found = state.foundEvidence;
  const has = (...ids) => ids.every(id => found.includes(id));
  let deductions = [];

  // ---------- CHAPTER 1–3 ----------
  if (has("case", "attempts")) {
    deductions.push("Thorne is named in Case 0017 and the earlier recovery history. His involvement is documented; his motives are not.");
  }
  if (has("family", "tablet")) {
    deductions.push("The tablet claims to remember Javis while his family records change. Whether the two events are causally linked remains unknown.");
  }
  if (has("revisions", "photo")) {
    deductions.push("The revisions describe another Javis; the photograph appears to show a matching figure. The image alone cannot establish identity.");
  }
  if (has("spindle", "family")) {
    deductions.push("The spindle and altered family records both concern Elara. The reason for the changes is not established by these records alone.");
  }
  if (has("watch", "tablet")) {
    deductions.push("The watch stopped at 02:14, matching the termination time recorded in Case 0017. The significance of that match remains unresolved.");
  }
  if (has("brass_wheel", "tablet")) {
    deductions.push("The wheel's change coincides with a Codex exchange reading. The exact mechanism cannot be confirmed from these two records alone.");
  }
  if (has("notebook", "family")) {
    deductions.push("The notebook's handwriting resembles writing associated with Elara. Its provenance remains uncertain.");
  }

  // ---------- OBSERVER CORRELATION (auto-unlock) ----------
  if (state.observerDecision === "transmit" && found.includes("iteration")) {
    if (!replayMode && !found.includes("observer_deduction")) {
      state.foundEvidence.push("observer_deduction");
      saveState();
    }
    deductions.push("CODEX CORRELATION: Because you transmitted your findings, the system cross-referenced Iteration 017. The fragment and the recovered records describe conflicting states. The Continuum's intent cannot yet be established.");
  }

  // ---------- CHAPTER 6–9 ----------
  if (has("nightingale", "watch")) {
    deductions.push("Nightingale measures exchange effects; the stopped watch may be relevant, but it has not been independently identified as an exchange signature.");
  }
  if (has("annex_shipment", "demolition")) {
    deductions.push("A shipment record names a site the demolition record says no longer exists. The records conflict; neither establishes what happened on site.");
  }
  if (has("reed_report", "reed_statement")) {
    deductions.push("Reed's official report differs from his private statement. The discrepancy requires explanation; his statement remains subject to his consent.");
  }
  if (has("reconciliation_request", "cas_shipment")) {
    deductions.push("HR-017 cites the Cassius Vale shipment. The relationship between the authorization and correction process warrants examination.");
  }

  // ---------- CHAPTER 11–13 ----------
  if (has("admission_register", "plate")) {
    deductions.push("The admission register and brass plate both distinguish two subjects. Their identifiers correspond.");
  }
  if (has("cassius_letter", "admission_register")) {
    deductions.push("Cassius's letter predates the second registration and alludes to two children. It does not establish what he knew with certainty.");
  }
  if (has("cassius_recording", "plate")) {
    deductions.push("The recording depicts two children; the plate records one retained and one transferred. The records are consistent on that limited point.");
  }
  if (has("correction_logs", "attempts")) {
    deductions.push("Correction logs record removals followed by unregistered returns. The repeated pattern raises questions about whether the underlying condition was resolved.");
  }
  if (has("exchange_indicator", "tablet")) {
    deductions.push("The exchange indicator responds in the presence of both Javis and Aren. The readings alone do not identify the cause.");
  }

  // ---------- CHAPTER 14 ----------
  if (has("portable_unit", "station_nine_archive")) {
    deductions.push("The portable unit and Station Nine archive contain complementary reference data. Their combined use still requires validation.");
  }

  // ---------- OBSERVER DIRECTIVE ----------
  if (state.finalObserverChoice === "preserve") {
    deductions.push("DIRECTIVE ACTIVE: You released the contradictory observation. The public case gains independent historical evidence, but the source may be traced.");
    if (state.observerDecision === "transmit") deductions.push("CUMULATIVE CONSEQUENCE: Earlier transmitted findings and the released observation now form a broader evidence trail. Source-tracing risk is increased, though exposure is not guaranteed.");
    if (state.observerDecision === "withhold") deductions.push("CUMULATIVE CONSEQUENCE: The earlier findings stayed local, but this release creates an external trail for the independent observation.");
  }
  if (state.finalObserverChoice === "protect") {
    deductions.push("DIRECTIVE ACTIVE: You kept the contradictory witness record sealed. The investigation must proceed without that record in open proceedings.");
    if (state.observerDecision === "transmit") deductions.push("CUMULATIVE CONSEQUENCE: The witness record remains protected, but the earlier transmission cannot be recalled. The Observer is not guaranteed to be untraceable.");
    if (state.observerDecision === "withhold") deductions.push("CUMULATIVE CONSEQUENCE: Both directives keep their respective records out of the external evidence chain. This best protects the source, at the cost of a weaker public case.");
  }

  return deductions;
}

$("saveEvidence").onclick = () => {
  if (window.currentModalEvidenceId) {
    saveEvidence(window.currentModalEvidenceId);
  }
};

// Boot
render();