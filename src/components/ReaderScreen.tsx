import React, { useState, useEffect } from 'react';
import { Scene, SceneArtItem, ChoiceBlock } from '../types';

interface ReaderScreenProps {
  scene: Scene;
  sceneIndex: number;
  totalScenes: number;
  artItem?: SceneArtItem;
  observerDecision: 'transmit' | 'withhold' | null;
  finalObserverChoice: 'preserve' | 'protect' | null;
  replayMode: boolean;
  audioEnabled: boolean;
  audioStatusText: string;
  onOpenEvidence: (id: string) => void;
  onSelectFinalChoice: (choiceId: 'preserve' | 'protect') => void;
  onPlayCue: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onOpenChapters: () => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  artItem,
  observerDecision,
  finalObserverChoice,
  replayMode,
  audioEnabled,
  audioStatusText,
  onOpenEvidence,
  onSelectFinalChoice,
  onPlayCue,
  onPrevious,
  onNext,
  onOpenChapters,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    if (artItem?.img) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = artItem.img;
    }
  }, [artItem?.img, sceneIndex]);

  const handleArticleClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement).closest('.inspect-inline') as HTMLElement | null;
    if (target && target.dataset.record) {
      e.preventDefault();
      onOpenEvidence(target.dataset.record);
    }
  };

  const renderChoiceBlock = (choiceData: ChoiceBlock) => {
    const isAlreadyChosen = finalObserverChoice !== null;
    const replayWithoutChoice = replayMode && !isAlreadyChosen;

    return (
      <div
        className="decision"
        id="observerChoiceBlock"
        style={{
          margin: '40px 0',
          padding: '30px',
          border: '1px solid var(--gold)',
          background: 'rgba(213, 173, 101, 0.05)',
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>
          OBSERVER DIRECTIVE
        </div>
        <p style={{ fontSize: '18px', fontStyle: 'italic', marginBottom: '20px' }}>
          {choiceData.prompt}
        </p>

        {!isAlreadyChosen && !replayWithoutChoice && (
          <div className="decision-buttons" style={{ flexDirection: 'column', gap: '15px' }}>
            {choiceData.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="primary observer-btn"
                data-choice={opt.id}
                style={{ textAlign: 'left', padding: '15px' }}
                onClick={() => onSelectFinalChoice(opt.id as 'preserve' | 'protect')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {replayWithoutChoice && (
          <p className="micro">
            REPLAY ONLY · This decision is unavailable during replay and will not be recorded.
          </p>
        )}

        {isAlreadyChosen && (
          <div
            id="decisionResult"
            style={{ color: 'var(--gold)', fontWeight: 'bold', marginTop: '20px' }}
          >
            {choiceData.options.find((o) => o.id === finalObserverChoice)?.resultText || ''}
          </div>
        )}
      </div>
    );
  };

  const renderContentBlock = (block: Scene['text'][number], idx: number) => {
    if (typeof block === 'string') {
      return (
        <p
          key={idx}
          dangerouslySetInnerHTML={{ __html: block }}
        />
      );
    }

    if ('terminal' in block && block.terminal) {
      return (
        <div key={idx} className="terminal">
          {block.terminal}
        </div>
      );
    }

    if ('reveal' in block && block.reveal) {
      return (
        <p key={idx} className="reveal">
          {block.reveal}
        </p>
      );
    }

    if ('quote' in block && block.quote) {
      return (
        <p key={idx} className="quote">
          {block.quote}
        </p>
      );
    }

    if ('beat' in block && block.beat) {
      return (
        <div key={idx} className="beat">
          {block.beat}
        </div>
      );
    }

    if ('choice' in block && block.choice) {
      return <React.Fragment key={idx}>{renderChoiceBlock(block.choice)}</React.Fragment>;
    }

    if ('condition' in block && block.condition) {
      const conditions = String(block.condition).split('+');
      const matches = conditions.every(
        (c) => observerDecision === c || finalObserverChoice === c
      );
      if (!matches) return null;
      const paragraphs = Array.isArray(block.text) ? block.text : [block.text];
      return (
        <React.Fragment key={idx}>
          {paragraphs.map((p, pIdx) => (
            <p key={pIdx} className="observer-consequence">
              {p}
            </p>
          ))}
        </React.Fragment>
      );
    }

    return null;
  };

  const hasVisibleArt = artItem?.img && imageLoaded && !imageError;

  return (
    <section className="reader" id="reader" aria-live="polite">
      <div className="chapter-meta">
        <span id="sceneLabel">{scene.label}</span>
        <span id="clock">{scene.clock}</span>
      </div>

      {hasVisibleArt ? (
        <figure id="sceneVisual" className="scene-visual">
          <img
            id="sceneImage"
            src={artItem.img}
            alt={artItem.cap || scene.title || 'Scene illustration'}
            loading="eager"
          />
          <figcaption id="sceneCaption">{artItem.cap || ''}</figcaption>
        </figure>
      ) : (
        <figure id="sceneVisual" className="scene-visual hidden">
          <img id="sceneImage" src="" alt="" />
          <figcaption id="sceneCaption"></figcaption>
        </figure>
      )}

      <article id="story" tabIndex={-1} onClick={handleArticleClick}>
        <h2>{scene.title}</h2>
        {scene.text.map((block, idx) => renderContentBlock(block, idx))}
      </article>

      <div className="audio-cue">
        <button
          id="replaySound"
          className="quiet"
          type="button"
          disabled={!audioEnabled}
          onClick={onPlayCue}
        >
          ↻ PLAY SCENE CUE
        </button>
        <span id="audioStatus" aria-live="polite">
          {audioStatusText}
        </span>
      </div>

      <div className="reader-controls">
        <button
          id="previous"
          className="quiet"
          type="button"
          disabled={sceneIndex <= 0}
          onClick={onPrevious}
        >
          ← PREVIOUS
        </button>
        <button
          id="readerChaptersButton"
          className="quiet"
          type="button"
          onClick={onOpenChapters}
        >
          CHAPTERS
        </button>
        <span id="pageNumber">
          {sceneIndex + 1} / {totalScenes}
        </span>
        <button
          id="next"
          className="primary"
          type="button"
          onClick={onNext}
        >
          CONTINUE →
        </button>
      </div>
    </section>
  );
};
