import React, { useEffect } from 'react';
import { EvidenceItem } from '../types';

interface EvidenceModalProps {
  evidenceId: string | null;
  evidence: EvidenceItem | null;
  isFound: boolean;
  replayMode: boolean;
  onClose: () => void;
  onArchive: (id: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  evidenceId,
  evidence,
  isFound,
  replayMode,
  onClose,
  onArchive,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!evidenceId || !evidence) return null;

  const typeLabel =
    evidence.type === 'photograph'
      ? 'RECOVERED IMAGE'
      : evidence.type === 'artifact'
      ? 'UNREGISTERED ARTIFACT'
      : 'RESTRICTED RECORD';

  let buttonText = 'ARCHIVE FINDING +';
  let buttonDisabled = false;

  if (replayMode) {
    buttonText = isFound ? 'RECORDED ✓' : 'REPLAY ONLY';
    buttonDisabled = true;
  } else if (isFound) {
    buttonText = 'RECORDED ✓';
    buttonDisabled = true;
  }

  return (
    <div
      className="modal"
      id="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" id="modalCard" data-type={evidence.type || 'terminal'}>
        <div className="modal-top">
          <span className="eyebrow" id="modalTypeLabel">
            {typeLabel}
          </span>
          <button id="closeModal" className="close" aria-label="Close record" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {evidence.img ? (
          <div id="modalVisualContainer" className="modal-visual-container">
            <img id="modalImage" src={evidence.img} alt={evidence.title || 'Evidence visual'} />
          </div>
        ) : (
          <div id="modalVisualContainer" className="modal-visual-container hidden"></div>
        )}

        <div className="modal-info">
          <h2 id="modalTitle">{evidence.title}</h2>
          <div id="modalBody" className="modal-body-content">
            {evidence.body}
          </div>
          {evidence.established && (
            <div id="modalAnalysis" className="evidence-analysis">
              <p>
                <strong>ESTABLISHED: </strong>
                {evidence.established}
              </p>
            </div>
          )}
          <button
            id="saveEvidence"
            className="primary"
            type="button"
            disabled={buttonDisabled}
            onClick={() => onArchive(evidenceId)}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
