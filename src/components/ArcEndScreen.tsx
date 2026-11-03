import React from 'react';
import { getObserverOutcomeSummary } from '../utils/deductions';

interface ArcEndScreenProps {
  observerDecision: 'transmit' | 'withhold' | null;
  finalObserverChoice: 'preserve' | 'protect' | null;
  replayMode: boolean;
  onResetProgress: () => void;
}

export const ArcEndScreen: React.FC<ArcEndScreenProps> = ({
  observerDecision,
  finalObserverChoice,
  replayMode,
  onResetProgress,
}) => {
  const outcomeSummary = getObserverOutcomeSummary(observerDecision, finalObserverChoice);

  const handleDownloadNotes = () => {
    const template = [
      'THE SENTINEL CODEX — READER TEST NOTES',
      'Date:',
      'Device / browser:',
      'Time spent reading:',
      'Where did you feel most curious?',
      'Where did you feel confused or lose interest?',
      'Which evidence did you inspect or compare, and why?',
      'What did you think the Chapter One decision would change?',
      'Did the Chapter Fourteen intervention feel connected to that earlier decision? Why / why not?',
      'Did your final choice feel consequential? What consequence did you notice?',
      'Any broken controls, missing images, sound issues, or save problems:',
      'Would you continue reading? (Yes / No / Unsure)',
      'Would you pay for an experience like this? (Yes / No / Unsure)',
      'What would need to improve before you paid?',
      'Anything else:',
      '',
    ].join('\n');
    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sentinel-codex-reader-test-notes.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    if (replayMode) return;
    if (window.confirm('Reset reading progress? This will clear all saved evidence and return to the cover screen.')) {
      onResetProgress();
    }
  };

  return (
    <section className="end" id="end">
      <div className="eyebrow">ARC ONE · COMPLETE</div>
      <div className="end-mark">◈</div>
      <h2>DON’T TRUST THE ONE WHO REMEMBERS.</h2>
      <p>The story pauses. The Codex has recorded your final directive.</p>

      <div id="finalObserverDecision" className="decision" style={{ maxWidth: '600px', textAlign: 'left' }}>
        <div className="eyebrow">OBSERVER DIRECTIVE · ARCHIVE CONFLICT: 009</div>
        <p style={{ fontSize: '13px', marginBottom: '20px' }}>
          Two records contradicted one another. The Continuum recognized one subject. An independent observation recorded two.
        </p>
        <div id="finalDecisionResult" aria-live="polite" style={{ fontSize: '15px', lineHeight: '1.7' }}>
          {finalObserverChoice === 'preserve' ? (
            <>
              <strong style={{ color: 'var(--gold)' }}>YOU PRESERVED THE CONTRADICTION.</strong>
              <br />
              {outcomeSummary}
            </>
          ) : finalObserverChoice === 'protect' ? (
            <>
              <strong style={{ color: 'var(--gold)' }}>YOU PROTECTED THE WITNESS RECORD.</strong>
              <br />
              {outcomeSummary}
            </>
          ) : (
            <em>No complete Observer directive was recorded.</em>
          )}
        </div>
      </div>

      <div id="endButtons" style={{ marginTop: '20px' }}>
        <button id="feedback" className="quiet" type="button" onClick={handleDownloadNotes}>
          DOWNLOAD TEST NOTES ↧
        </button>
        <button
          id="reset"
          className="quiet"
          type="button"
          disabled={replayMode}
          title={replayMode ? 'Reset is unavailable during chapter replay.' : 'Reset reading progress'}
          onClick={handleReset}
        >
          RESET READING PROGRESS
        </button>
      </div>
    </section>
  );
};
