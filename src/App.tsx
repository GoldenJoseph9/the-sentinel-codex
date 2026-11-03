import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Scene, ChapterMapItem, EvidenceItem, SceneArtItem, AppState } from './types';
import rawChapters from './data/chapters.json';
import rawEvidence from './data/evidence.json';
import rawSceneArt from './data/sceneArt.json';
import rawManifest from './data/manifest.json';

import { loadSavedState, saveState, INITIAL_STATE } from './utils/storage';
import { checkConnections } from './utils/deductions';
import { ensureAudio, startAmbience, stopAmbience, playSceneCue } from './utils/audio';

import { Topbar } from './components/Topbar';
import { CoverScreen } from './components/CoverScreen';
import { ReaderScreen } from './components/ReaderScreen';
import { ChapterBreakScreen } from './components/ChapterBreakScreen';
import { ArcEndScreen } from './components/ArcEndScreen';
import { CodexModal } from './components/CodexModal';
import { EvidenceModal } from './components/EvidenceModal';
import { ChapterNavigatorModal } from './components/ChapterNavigatorModal';

const evidenceDb: Record<string, EvidenceItem> = rawEvidence as Record<string, EvidenceItem>;
const sceneArtDb: Record<string, SceneArtItem> = rawSceneArt as Record<string, SceneArtItem>;

export const App: React.FC = () => {
  // 1. Build allScenes and chapterMap across all published chapters
  const { allScenes, chapterMap, publishedThrough, isArcFullyPublished, releaseConfig } = useMemo(() => {
    const chaptersRecord = rawChapters as Record<string, { id: number; title: string; scenes: Scene[] }>;
    const release = rawManifest.release || { publishedThrough: 16 };

    // Validate publishedThrough: integer within [1, 16], fallback to 16 if missing or invalid
    const rawVal = Number(release.publishedThrough);
    const publishedMax = Number.isInteger(rawVal)
      ? Math.max(1, Math.min(16, rawVal))
      : 16;

    const sortedChapterIds = Object.keys(chaptersRecord)
      .map(Number)
      .filter((id) => Number.isFinite(id) && id >= 1 && id <= publishedMax)
      .sort((a, b) => a - b);

    const scenes: Scene[] = [];
    const map: ChapterMapItem[] = [];

    sortedChapterIds.forEach((id) => {
      const chapter = chaptersRecord[String(id)];
      if (!chapter || !Array.isArray(chapter.scenes)) return;
      const startIndex = scenes.length;
      chapter.scenes.forEach((scene, sIdx) => {
        scenes.push(scene);
        map.push({
          chapterId: id,
          chapterTitle: chapter.title,
          sceneIndex: startIndex + sIdx,
        });
      });
    });

    const isFullyPublished = publishedMax >= 16 && sortedChapterIds.length >= 16;
    return {
      allScenes: scenes,
      chapterMap: map,
      publishedThrough: publishedMax,
      isArcFullyPublished: isFullyPublished,
      releaseConfig: release,
    };
  }, []);

  // 2. Application state
  const [state, setState] = useState<AppState>(() => loadSavedState(allScenes.length));
  const [replayMode, setReplayMode] = useState<boolean>(false);
  const [replayReturnIndex, setReplayReturnIndex] = useState<number | null>(null);
  const [skipChapterBreak, setSkipChapterBreak] = useState<boolean>(false);

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [audioStatusText, setAudioStatusText] = useState<string>('Sound is off');

  // Modal dialog states
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isChapterNavOpen, setIsChapterNavOpen] = useState<boolean>(false);

  // Scroll to top helper
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.getElementById('top');
    if (mainEl) mainEl.scrollTop = 0;
    const readerEl = document.getElementById('reader');
    if (readerEl) readerEl.scrollTop = 0;
  }, []);

  // Save state on any change
  useEffect(() => {
    saveState(state, replayMode, replayReturnIndex);
  }, [state, replayMode, replayReturnIndex]);

  // Audio ambience lifecycle
  useEffect(() => {
    if (audioEnabled) {
      ensureAudio();
      startAmbience(true);
      setAudioStatusText('Sound is on · optional ambience active');
    } else {
      stopAmbience();
      setAudioStatusText('Sound is off');
    }
    return () => {
      stopAmbience();
    };
  }, [audioEnabled]);

  // Handle scene navigation
  const moveScene = useCallback(
    (newIndex: number) => {
      const clamped = Math.max(-1, Math.min(allScenes.length, newIndex));
      setState((prev) => ({ ...prev, sceneIndex: clamped }));
      setSkipChapterBreak(false);
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    },
    [allScenes.length, scrollToTop]
  );

  // Exit replay
  const handleExitReplay = useCallback(() => {
    if (!replayMode) return;
    const destination = Number.isInteger(replayReturnIndex) ? (replayReturnIndex as number) : -1;
    setReplayMode(false);
    setReplayReturnIndex(null);
    moveScene(destination);
  }, [replayMode, replayReturnIndex, moveScene]);

  // Audio toggle
  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
  }, []);

  // Play cue for current scene
  const handlePlayCue = useCallback(() => {
    if (!audioEnabled || state.sceneIndex < 0 || state.sceneIndex >= allScenes.length) return;
    const currentScene = allScenes[state.sceneIndex];
    if (currentScene && ensureAudio()) {
      playSceneCue(currentScene.title);
      setAudioStatusText('Scene cue played');
    }
  }, [audioEnabled, state.sceneIndex, allScenes]);

  // Auto-unlock observer deduction if applicable
  const handleAutoUnlockObserverDeduction = useCallback(() => {
    if (replayMode) return;
    setState((prev) => {
      if (prev.foundEvidence.includes('observer_deduction')) return prev;
      return {
        ...prev,
        foundEvidence: [...prev.foundEvidence, 'observer_deduction'],
      };
    });
  }, [replayMode]);

  // Compute deductions
  const deductions = useMemo(() => {
    return checkConnections(
      state.foundEvidence,
      state.observerDecision,
      state.finalObserverChoice,
      replayMode,
      handleAutoUnlockObserverDeduction
    );
  }, [
    state.foundEvidence,
    state.observerDecision,
    state.finalObserverChoice,
    replayMode,
    handleAutoUnlockObserverDeduction,
  ]);

  // Archiving evidence from modal
  const handleArchiveEvidence = useCallback(
    (id: string) => {
      if (replayMode) {
        setActiveEvidenceId(null);
        return;
      }
      if (!evidenceDb[id]) return;
      setState((prev) => {
        if (prev.foundEvidence.includes(id)) return prev;
        return {
          ...prev,
          foundEvidence: [...prev.foundEvidence, id],
        };
      });
      setActiveEvidenceId(null);
    },
    [replayMode]
  );

  // Record comparison
  const handleRecordComparison = useCallback(
    (pairKey: string) => {
      if (replayMode) return;
      setState((prev) => {
        if (prev.comparedRecords.includes(pairKey)) return prev;
        return {
          ...prev,
          comparedRecords: [...prev.comparedRecords, pairKey],
        };
      });
    },
    [replayMode]
  );

  // Observer Decision at Chapter One break
  const handleObserverDecision = useCallback(
    (decision: 'transmit' | 'withhold') => {
      if (replayMode) return;
      setState((prev) => ({
        ...prev,
        observerDecision: decision,
      }));
    },
    [replayMode]
  );

  // Final Observer Choice in Chapter 14
  const handleFinalObserverChoice = useCallback(
    (choiceId: 'preserve' | 'protect') => {
      if (replayMode) return;
      setState((prev) => {
        const nextEvidence = [...prev.foundEvidence];
        if (choiceId === 'preserve' && !nextEvidence.includes('record_released')) {
          nextEvidence.push('record_released');
        } else if (choiceId === 'protect' && !nextEvidence.includes('witness_protected')) {
          nextEvidence.push('witness_protected');
        }
        return {
          ...prev,
          finalObserverChoice: choiceId,
          foundEvidence: nextEvidence,
        };
      });
    },
    [replayMode]
  );

  // Reset reading progress
  const handleResetProgress = useCallback(() => {
    if (replayMode) return;
    setReplayMode(false);
    setReplayReturnIndex(null);
    setState({ ...INITIAL_STATE });
    moveScene(-1);
  }, [replayMode, moveScene]);

  // Replay select chapter
  const handleSelectReplayChapter = useCallback(
    (_chapterId: number, sceneIndex: number) => {
      if (!replayMode) {
        setReplayReturnIndex(state.sceneIndex);
        setReplayMode(true);
      }
      setIsChapterNavOpen(false);
      moveScene(sceneIndex);
    },
    [replayMode, state.sceneIndex, moveScene]
  );

  // 3. Determine current view
  const isValidScene = state.sceneIndex >= 0 && state.sceneIndex < allScenes.length;
  const currentChapter = isValidScene ? chapterMap[state.sceneIndex] : null;

  // Chapter break check: show break if we are at boundary between chapters and haven't skipped
  let isAtChapterBreak = false;
  let previousChapter: ChapterMapItem | null = null;

  if (!skipChapterBreak && isValidScene && state.sceneIndex > 0) {
    const prevRow = chapterMap[state.sceneIndex - 1];
    if (currentChapter && prevRow.chapterId !== currentChapter.chapterId) {
      isAtChapterBreak = true;
      previousChapter = prevRow;
    }
  }

  // End of arc or interim release boundary
  const isAtEndOfStory = state.sceneIndex === allScenes.length;

  // Status text in topbar
  const statusText =
    state.sceneIndex === -1
      ? 'ARCHIVE / UNREGISTERED'
      : currentChapter
      ? `CHAPTER ${currentChapter.chapterId} / ${currentChapter.chapterTitle.toUpperCase()}`
      : 'ARC ONE / COMPLETE';

  // Story progress calculation
  const progressPercent = Math.max(0, ((state.sceneIndex + 1) / allScenes.length) * 100);

  return (
    <>
      <div className="ambient" aria-hidden="true" />

      <Topbar
        statusText={statusText}
        evidenceCount={state.foundEvidence.length}
        audioEnabled={audioEnabled}
        replayMode={replayMode}
        progressPercent={progressPercent}
        onHomeClick={() => moveScene(-1)}
        onOpenChapters={() => setIsChapterNavOpen(true)}
        onReturnProgress={handleExitReplay}
        onToggleAudio={handleToggleAudio}
        onOpenCodex={() => setIsCodexOpen(true)}
      />

      <main id="top">
        {replayMode && (
          <div id="replayNotice" className="replay-notice" role="status">
            REPLAY MODE · Your saved reading position and decisions are protected.{' '}
            <button
              id="exitReplayButton"
              className="quiet"
              type="button"
              onClick={handleExitReplay}
            >
              RETURN TO SAVED PLACE
            </button>
          </div>
        )}

        {/* 1. Cover Screen */}
        {state.sceneIndex === -1 && (
          <CoverScreen
            onBegin={() => moveScene(0)}
            savedSceneIndex={state.sceneIndex}
          />
        )}

        {/* 2. Chapter Break Screen */}
        {isAtChapterBreak && previousChapter && (
          <ChapterBreakScreen
            previousChapterId={previousChapter.chapterId}
            observerDecision={state.observerDecision}
            replayMode={replayMode}
            onSelectDecision={handleObserverDecision}
            onContinue={() => {
              setSkipChapterBreak(true);
              scrollToTop();
            }}
          />
        )}

        {/* 3. Interim Release Screen (if story paused at chapter limit) */}
        {isAtEndOfStory && !isArcFullyPublished && (
          <ChapterBreakScreen
            previousChapterId={chapterMap[chapterMap.length - 1]?.chapterId || publishedThrough}
            isInterimRelease={true}
            interimHeading={releaseConfig.interimHeading}
            interimMessage={releaseConfig.interimMessage}
            observerDecision={state.observerDecision}
            replayMode={replayMode}
            onSelectDecision={handleObserverDecision}
            onContinue={() => {
              setReplayMode(false);
              setReplayReturnIndex(null);
              moveScene(-1);
            }}
          />
        )}

        {/* 4. Arc One End Screen (Final canonical ending) */}
        {isAtEndOfStory && isArcFullyPublished && (
          <ArcEndScreen
            observerDecision={state.observerDecision}
            finalObserverChoice={state.finalObserverChoice}
            replayMode={replayMode}
            onResetProgress={handleResetProgress}
          />
        )}

        {/* 5. Reader Screen */}
        {isValidScene && !isAtChapterBreak && (
          <ReaderScreen
            scene={allScenes[state.sceneIndex]}
            sceneIndex={state.sceneIndex}
            totalScenes={allScenes.length}
            artItem={sceneArtDb[String(state.sceneIndex)]}
            observerDecision={state.observerDecision}
            finalObserverChoice={state.finalObserverChoice}
            replayMode={replayMode}
            audioEnabled={audioEnabled}
            audioStatusText={audioStatusText}
            onOpenEvidence={(id) => setActiveEvidenceId(id)}
            onSelectFinalChoice={handleFinalObserverChoice}
            onPlayCue={handlePlayCue}
            onPrevious={() => moveScene(state.sceneIndex - 1)}
            onNext={() => moveScene(state.sceneIndex + 1)}
            onOpenChapters={() => setIsChapterNavOpen(true)}
          />
        )}
      </main>

      {/* Chapter Replay Navigator Modal */}
      <ChapterNavigatorModal
        isOpen={isChapterNavOpen}
        chapterMap={chapterMap}
        currentSceneIndex={state.sceneIndex}
        savedSceneIndex={replayMode && replayReturnIndex !== null ? replayReturnIndex : state.sceneIndex}
        replayMode={replayMode}
        onClose={() => setIsChapterNavOpen(false)}
        onSelectChapter={handleSelectReplayChapter}
      />

      {/* Full-screen Codex Investigation Modal */}
      <CodexModal
        isOpen={isCodexOpen}
        foundEvidence={state.foundEvidence}
        evidenceDb={evidenceDb}
        deductions={deductions}
        observerDecision={state.observerDecision}
        finalObserverChoice={state.finalObserverChoice}
        replayMode={replayMode}
        onClose={() => setIsCodexOpen(false)}
        onOpenEvidence={(id) => setActiveEvidenceId(id)}
        onRecordComparison={handleRecordComparison}
      />

      {/* Single Evidence Record Inspection Modal */}
      <EvidenceModal
        evidenceId={activeEvidenceId}
        evidence={activeEvidenceId ? evidenceDb[activeEvidenceId] || null : null}
        isFound={activeEvidenceId ? state.foundEvidence.includes(activeEvidenceId) : false}
        replayMode={replayMode}
        onClose={() => setActiveEvidenceId(null)}
        onArchive={handleArchiveEvidence}
      />

      <footer>
        THE SENTINEL CODEX <span>·</span> READER EDITION
      </footer>
    </>
  );
};

export default App;
