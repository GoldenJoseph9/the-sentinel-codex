import React, { useState, useEffect } from 'react';
import { EvidenceItem } from '../types';
import { compareEvidenceRecords, getObserverOutcomeSummary } from '../utils/deductions';

interface CodexModalProps {
  isOpen: boolean;
  foundEvidence: string[];
  evidenceDb: Record<string, EvidenceItem>;
  deductions: string[];
  observerDecision: 'transmit' | 'withhold' | null;
  finalObserverChoice: 'preserve' | 'protect' | null;
  replayMode: boolean;
  onClose: () => void;
  onOpenEvidence: (id: string) => void;
  onRecordComparison: (pairKey: string) => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  isOpen,
  foundEvidence,
  evidenceDb,
  deductions,
  observerDecision,
  finalObserverChoice,
  replayMode,
  onClose,
  onOpenEvidence,
  onRecordComparison,
}) => {
  const [firstSelected, setFirstSelected] = useState<string>('');
  const [secondSelected, setSecondSelected] = useState<string>('');
  const [comparisonText, setComparisonText] = useState<string>(
    'Select two recovered records to inspect their relationship.'
  );

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

  const validFoundEvidence = foundEvidence.filter(
    (id) => evidenceDb[id] && !evidenceDb[id].systemOnly
  );

  const handleCompare = () => {
    if (!firstSelected || !secondSelected || firstSelected === secondSelected) {
      setComparisonText('Choose two different recovered records.');
      return;
    }
    if (!validFoundEvidence.includes(firstSelected) || !validFoundEvidence.includes(secondSelected)) {
      setComparisonText('Both records must be recovered first.');
      return;
    }

    const key = [firstSelected, secondSelected].sort().join('|');
    const result = compareEvidenceRecords(firstSelected, secondSelected, observerDecision);
    setComparisonText(result);

    if (result && !result.includes('No shared indexed fields') && !replayMode) {
      onRecordComparison(key);
    }
  };

  const decisionText =
    observerDecision === 'transmit'
      ? 'Chapter 1: Findings transmitted for external correlation. Transmission may create an exposure trail; no outcome is presumed.'
      : observerDecision === 'withhold'
      ? 'Chapter 1: External transmission withheld. Recovered records and private comparisons remain on this device.'
      : 'Chapter 1: No directive recorded yet.';

  const outcomeSummary = getObserverOutcomeSummary(observerDecision, finalObserverChoice);
  const observerRecordText =
    decisionText +
    (finalObserverChoice
      ? ` Later directive: ${finalObserverChoice}. ${outcomeSummary}`
      : '');

  const iterationRecovered = foundEvidence.includes('iteration');
  const showObserverRouteResult = iterationRecovered && Boolean(observerDecision);
  const observerRouteText =
    observerDecision === 'transmit'
      ? 'TRANSMITTED FINDINGS CORRELATED · The Codex has cross-referenced Iteration 017 against the findings you authorized for transmission. The receiving system has the transmitted material; what it will do with it remains unknown.'
      : 'LOCAL ARCHIVE · No external correlation was requested. Case 0017 and Iteration 017 can still be compared privately below; this comparison is not transmitted.';

  return (
    <section className="codex-screen" id="codex-screen">
      <div className="codex-header">
        <div className="codex-title">
          <span className="sigil">◈</span>
          <h1>
            THE CODEX <span className="codex-status">// UNREGISTERED</span>
          </h1>
        </div>
        <button className="close-codex" id="closeCodex" type="button" onClick={onClose}>
          CLOSE ARCHIVE ✕
        </button>
      </div>

      <div className="codex-content">
        <div className="codex-grid-panel">
          {validFoundEvidence.length === 0 ? (
            <p className="empty-state" id="emptyState">
              No records recovered. Investigate the archive to reveal connections.
            </p>
          ) : (
            <div id="evidenceGrid" className="evidence-grid">
              {validFoundEvidence.map((id) => {
                const ev = evidenceDb[id];
                if (!ev) return null;
                return (
                  <div
                    key={id}
                    className="evidence-card"
                    tabIndex={0}
                    role="button"
                    onClick={() => {
                      onClose();
                      onOpenEvidence(id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onClose();
                        onOpenEvidence(id);
                      }
                    }}
                  >
                    {ev.img && (
                      <img src={ev.img} className="evidence-card-img" alt={ev.title} />
                    )}
                    <div className="evidence-card-info">
                      <div className="ev-title">{ev.title}</div>
                      <div className="ev-note">{ev.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="codex-deductions-panel">
          <h3>RECORD CORRELATIONS</h3>
          <p className="micro" style={{ marginBottom: '20px' }}>
            Observations supported by records you have recovered. Interpretations may remain uncertain.
          </p>

          <div id="deductionsList" className="deductions-list">
            {deductions.length > 0 ? (
              deductions.map((d, index) => (
                <div key={index} className="deduction-item">
                  {d}
                </div>
              ))
            ) : (
              <p className="micro">No connections established yet.</p>
            )}
          </div>

          <section className="investigation-tools" aria-label="Compare evidence">
            <h3>COMPARE RECORDS</h3>
            <p className="micro">Choose two recovered records. Comparison is optional.</p>

            <label htmlFor="compareFirst">First record</label>
            <select
              id="compareFirst"
              value={firstSelected}
              onChange={(e) => setFirstSelected(e.target.value)}
            >
              <option value="">Select recovered record</option>
              {validFoundEvidence.map((id) => (
                <option key={id} value={id}>
                  {evidenceDb[id]?.title}
                </option>
              ))}
            </select>

            <label htmlFor="compareSecond">Second record</label>
            <select
              id="compareSecond"
              value={secondSelected}
              onChange={(e) => setSecondSelected(e.target.value)}
            >
              <option value="">Select recovered record</option>
              {validFoundEvidence.map((id) => (
                <option key={id} value={id}>
                  {evidenceDb[id]?.title}
                </option>
              ))}
            </select>

            <button type="button" className="quiet" id="compareEvidence" onClick={handleCompare}>
              COMPARE
            </button>

            <p
              id="comparisonResult"
              className="micro"
              role="status"
              aria-live="polite"
              style={{ whiteSpace: 'pre-line', marginTop: '12px' }}
            >
              {comparisonText}
            </p>

            <h3>OBSERVER RECORD</h3>
            <p id="codexObserverRecord" className="micro">
              {observerRecordText}
            </p>

            {showObserverRouteResult && (
              <p id="observerRouteResult" className="micro" role="status" aria-live="polite">
                {observerRouteText}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};
