import React from 'react';

interface ChapterBreakScreenProps {
  previousChapterId: number;
  isInterimRelease?: boolean;
  interimHeading?: string;
  interimMessage?: string;
  observerDecision: 'transmit' | 'withhold' | null;
  replayMode: boolean;
  onSelectDecision: (decision: 'transmit' | 'withhold') => void;
  onContinue: () => void;
}

export const ChapterBreakScreen: React.FC<ChapterBreakScreenProps> = ({
  previousChapterId,
  isInterimRelease,
  interimHeading,
  interimMessage,
  observerDecision,
  replayMode,
  onSelectDecision,
  onContinue,
}) => {
  if (isInterimRelease) {
    return (
      <section id="chapterBreak" className="end">
        <div className="eyebrow" id="breakChapterTitle">
          CHAPTER {previousChapterId} · CURRENT RELEASE COMPLETE
        </div>
        <div className="end-mark">◈</div>
        <h2 id="breakHeading">{interimHeading || 'THE ARCHIVE REMAINS OPEN.'}</h2>
        <p id="breakText">
          {interimMessage ||
            'You have reached the end of the currently available records. The investigation continues in a future release.'}
        </p>
        <button
          id="continueChapterTwo"
          className="primary"
          type="button"
          onClick={onContinue}
        >
          RETURN TO COVER
        </button>
      </section>
    );
  }

  const isChapterOne = previousChapterId === 1;
  const isDecisionMade = observerDecision !== null;
  const continueDisabled = isChapterOne && !isDecisionMade && !replayMode;

  return (
    <section id="chapterBreak" className="end">
      <div className="eyebrow" id="breakChapterTitle">
        CHAPTER {previousChapterId} · COMPLETE
      </div>
      <div className="end-mark">◈</div>
      <h2 id="breakHeading">THE RECORD CONTINUES.</h2>
      <p id="breakText">
        {isChapterOne
          ? 'Before the story continues, decide what the Codex may learn from your recovered evidence.'
          : `You have reached the end of Chapter ${previousChapterId}. The next chapter awaits.`}
      </p>

      {isChapterOne && (
        <div id="observerDecision" className="decision">
          <div className="eyebrow">UNREGISTERED OBSERVER · ACCESS REQUEST</div>
          <p>
            The Codex requests access to the records you recovered. Transmitting lets it correlate these
            findings with later evidence. Withholding keeps your archive on this device, leaving any
            connections for you to make privately. This changes what the Codex can establish—not
            Javis’s actions or anyone’s right to exist.
          </p>
          <div className="decision-buttons">
            <button
              className="primary"
              id="transmit"
              type="button"
              disabled={isDecisionMade || replayMode}
              onClick={() => onSelectDecision('transmit')}
            >
              TRANSMIT FINDINGS
            </button>
            <button
              className="quiet"
              id="withhold"
              type="button"
              disabled={isDecisionMade || replayMode}
              onClick={() => onSelectDecision('withhold')}
            >
              WITHHOLD FINDINGS
            </button>
          </div>
          <div id="decisionResult" aria-live="polite">
            {replayMode && !isDecisionMade && (
              'REPLAY ONLY · This decision is not changed during chapter replay.'
            )}
            {isDecisionMade && (
              observerDecision === 'transmit' ? 'ACCESS GRANTED.' : 'ACCESS DENIED.'
            )}
          </div>
        </div>
      )}

      <button
        id="continueChapterTwo"
        className="primary"
        type="button"
        disabled={continueDisabled}
        onClick={onContinue}
      >
        CONTINUE
      </button>
    </section>
  );
};
