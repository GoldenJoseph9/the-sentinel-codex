import React from 'react';

interface CoverScreenProps {
  onBegin: () => void;
  savedSceneIndex: number;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({ onBegin, savedSceneIndex }) => {
  return (
    <section className="cover" id="cover">
      <div className="eyebrow">RESTRICTED ACCESS · CASE 0017</div>
      <div className="cover-art" aria-hidden="true">
        <div className="halo"></div>
        <div className="door"></div>
        <div className="figure"></div>
        <div className="glyph">◈</div>
      </div>
      <h1>
        THE SENTINEL<br />
        <span>CODEX</span>
      </h1>
      <p className="subtitle">
        REALITY'S EDGE <span>—</span> INTERACTIVE EDITION
      </p>
      <div className="rule"></div>
      <h2>The Man Who Never Existed</h2>
      <p className="cover-copy">Some records are not meant to survive their own history.</p>
      <button id="begin" className="primary" type="button" onClick={onBegin}>
        {savedSceneIndex > 0 ? 'RESUME INVESTIGATION' : 'ENTER THE ARCHIVE'} <span>↗</span>
      </button>
      <p className="micro">Symbolic illustrated edition · Optional sound · Progress saved on this device</p>
    </section>
  );
};
