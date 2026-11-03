import { AppState } from '../types';
import evidenceData from '../data/evidence.json';

export const SAVE_KEY = 'sentinel_codex_save_v6';

export const INITIAL_STATE: AppState = {
  sceneIndex: -1,
  foundEvidence: [],
  observerDecision: null,
  finalObserverChoice: null,
  comparedRecords: [],
};

const validEvidenceIds = new Set(Object.keys(evidenceData));

export function loadSavedState(maxScenes: number): AppState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...INITIAL_STATE };
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      return { ...INITIAL_STATE };
    }

    const savedIndex = Number.isInteger(saved.sceneIndex) ? saved.sceneIndex : -1;
    const sceneIndex = Math.max(-1, Math.min(maxScenes, savedIndex));

    const foundEvidence: string[] = Array.isArray(saved.foundEvidence)
      ? Array.from(new Set<string>(saved.foundEvidence.filter((id: unknown): id is string => typeof id === 'string' && validEvidenceIds.has(id))))
      : [];

    const observerDecision = (saved.observerDecision === 'transmit' || saved.observerDecision === 'withhold')
      ? saved.observerDecision
      : null;

    const finalObserverChoice = (saved.finalObserverChoice === 'preserve' || saved.finalObserverChoice === 'protect')
      ? saved.finalObserverChoice
      : null;

    const comparedRecords: string[] = Array.isArray(saved.comparedRecords)
      ? Array.from(new Set<string>(saved.comparedRecords.filter((pair: unknown): pair is string => typeof pair === 'string' && pair.includes('|'))))
      : [];

    return {
      sceneIndex,
      foundEvidence,
      observerDecision,
      finalObserverChoice,
      comparedRecords,
    };
  } catch (e) {
    console.warn('Save load failed; starting with a clean reading state.', e);
    return { ...INITIAL_STATE };
  }
}

export function saveState(
  state: AppState,
  replayMode: boolean,
  replayReturnIndex: number | null
) {
  // Replays are a temporary viewing mode: persist the reader's original position,
  // never the chapter currently being revisited.
  const persisted: AppState = replayMode && Number.isInteger(replayReturnIndex)
    ? { ...state, sceneIndex: replayReturnIndex as number }
    : state;

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(persisted));
  } catch (e) {
    console.warn('Could not save state to localStorage:', e);
  }
}
