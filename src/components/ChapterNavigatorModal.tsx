import React, { useEffect } from 'react';
import { ChapterMapItem } from '../types';

interface ChapterNavigatorModalProps {
  isOpen: boolean;
  chapterMap: ChapterMapItem[];
  currentSceneIndex: number;
  savedSceneIndex: number;
  replayMode: boolean;
  onClose: () => void;
  onSelectChapter: (chapterId: number, sceneIndex: number) => void;
}

export const ChapterNavigatorModal: React.FC<ChapterNavigatorModalProps> = ({
  isOpen,
  chapterMap,
  currentSceneIndex,
  savedSceneIndex,
  replayMode,
  onClose,
  onSelectChapter,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Reached chapters determined by saved reading position
  const effectiveIndex = Math.max(0, Math.min(savedSceneIndex, chapterMap.length - 1));
  const maxChapter = chapterMap[effectiveIndex] ? Number(chapterMap[effectiveIndex].chapterId) : 1;

  // Chapter starts
  const chapterStarts = new Map<number, { sceneIndex: number; title: string }>();
  chapterMap.forEach((row) => {
    if (!chapterStarts.has(row.chapterId)) {
      chapterStarts.set(row.chapterId, { sceneIndex: row.sceneIndex, title: row.chapterTitle });
    }
  });

  const currentChapterId =
    currentSceneIndex >= 0 && currentSceneIndex < chapterMap.length
      ? chapterMap[currentSceneIndex].chapterId
      : null;

  return (
    <aside
      id="chapterNavigator"
      className="chapter-navigator"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapterNavigatorTitle"
      aria-describedby="chapterNavigatorHelp"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="chapter-navigator-card">
        <div className="chapter-navigator-head">
          <div>
            <div className="eyebrow">ARCHIVE INDEX</div>
            <h2 id="chapterNavigatorTitle">RETURN TO A CHAPTER</h2>
          </div>
          <button
            id="closeChapterNavigator"
            className="close"
            aria-label="Close chapter index"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p id="chapterNavigatorHelp" className="micro">
          Revisit chapters you've reached. Replay does not overwrite your saved position or change recorded decisions.
        </p>
        <div id="chapterList" className="chapter-list">
          {Array.from(chapterStarts.entries()).map(([chapterId, { sceneIndex, title }]) => {
            const isReached = chapterId <= maxChapter;
            const isCurrent = replayMode && currentChapterId === chapterId;

            return (
              <button
                key={chapterId}
                type="button"
                className="chapter-list-item"
                disabled={!isReached}
                aria-label={`Replay chapter ${chapterId}: ${title}`}
                onClick={() => {
                  if (isReached) {
                    onSelectChapter(chapterId, sceneIndex);
                  }
                }}
              >
                <span className="chapter-list-number">
                  {String(chapterId).padStart(2, '0')}
                </span>
                <span className="chapter-list-copy">
                  <strong>{title}</strong>
                  <small>{isReached ? 'AVAILABLE TO REPLAY' : 'NOT YET REACHED'}</small>
                </span>
                <span className="chapter-list-arrow">{isCurrent ? 'NOW' : '↗'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
