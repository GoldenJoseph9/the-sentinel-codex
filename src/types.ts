export interface EvidenceItem {
  type?: 'terminal' | 'photograph' | 'artifact' | string;
  title: string;
  img?: string;
  body: string;
  established?: string;
  note: string;
  systemOnly?: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
  resultText: string;
}

export interface ChoiceBlock {
  prompt: string;
  options: ChoiceOption[];
}

export type SceneTextBlock =
  | string
  | { terminal: string }
  | { reveal: string }
  | { quote?: string }
  | { beat?: string }
  | { choice: ChoiceBlock }
  | { condition: string; text: string | string[] };

export interface Scene {
  label: string;
  clock: string;
  title: string;
  text: SceneTextBlock[];
}

export interface Chapter {
  id: number;
  title: string;
  scenes: Scene[];
}

export interface ChapterMapItem {
  chapterId: number;
  chapterTitle: string;
  sceneIndex: number;
}

export interface SceneArtItem {
  img: string;
  cap?: string;
}

export interface AppState {
  sceneIndex: number;
  foundEvidence: string[];
  observerDecision: 'transmit' | 'withhold' | null;
  finalObserverChoice: 'preserve' | 'protect' | null;
  comparedRecords: string[];
}
