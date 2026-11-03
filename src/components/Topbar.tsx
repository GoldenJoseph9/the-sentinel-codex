import React from 'react';

interface TopbarProps {
  statusText: string;
  evidenceCount: number;
  audioEnabled: boolean;
  replayMode: boolean;
  progressPercent: number;
  onHomeClick: () => void;
  onOpenChapters: () => void;
  onReturnProgress: () => void;
  onToggleAudio: () => void;
  onOpenCodex: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  statusText,
  evidenceCount,
  audioEnabled,
  replayMode,
  progressPercent,
  onHomeClick,
  onOpenChapters,
  onReturnProgress,
  onToggleAudio,
  onOpenCodex,
}) => {
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onHomeClick();
          }}
          aria-label="The Sentinel Codex home"
        >
          <span className="sigil">◈</span> THE SENTINEL <em>CODEX</em>
        </a>
        <div className="top-right">
          <span id="status">{statusText}</span>
          <button
            id="chaptersButton"
            className="quiet"
            aria-haspopup="dialog"
            aria-controls="chapterNavigator"
            aria-label={replayMode ? 'Choose another chapter to replay' : 'Open chapter index'}
            type="button"
            onClick={onOpenChapters}
          >
            CHAPTERS
          </button>
          {replayMode && (
            <button
              id="returnProgressButton"
              className="quiet"
              type="button"
              onClick={onReturnProgress}
            >
              RETURN TO SAVED PLACE
            </button>
          )}
          <button
            id="audioButton"
            className="quiet"
            aria-pressed={audioEnabled}
            title="Enable optional sound"
            type="button"
            onClick={onToggleAudio}
          >
            {audioEnabled ? 'SOUND ON' : 'SOUND OFF'}
          </button>
          <button
            id="notesButton"
            className="quiet"
            type="button"
            onClick={onOpenCodex}
          >
            EVIDENCE <span id="count">{evidenceCount}</span>
          </button>
        </div>
      </header>
      <div
        className="progress"
        id="progressBar"
        role="progressbar"
        aria-label="Story progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      >
        <div
          id="progressFill"
          style={{ width: `${progressPercent}%`, transition: 'width .4s' }}
        />
      </div>
    </>
  );
};
