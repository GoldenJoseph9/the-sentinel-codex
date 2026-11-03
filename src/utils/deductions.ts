import investigationsData from '../data/investigations.json';

const investigationPairs: Record<string, string> = investigationsData;

export function getObserverOutcomeSummary(
  early: 'transmit' | 'withhold' | null,
  later: 'preserve' | 'protect' | null
): string {
  if (!early || !later) return 'The Observer’s full intervention record is incomplete.';
  if (early === 'transmit' && later === 'preserve') {
    return 'Earlier findings were transmitted; the contradiction is now also released. The case has the strongest public evidence of these routes, and the combined submissions increase the chance that the Observer’s source can be traced.';
  }
  if (early === 'withhold' && later === 'preserve') {
    return 'Earlier findings stayed local, but the contradictory observation was later released. This creates the first external trail to that independent record; source exposure is possible, not guaranteed.';
  }
  if (early === 'transmit' && later === 'protect') {
    return 'Earlier findings were transmitted, but the contradictory witness record remains sealed. The earlier transmission cannot be recalled; the protected observation is not added to that evidence chain.';
  }
  return 'Earlier findings stayed local and the contradictory witness record remains sealed. This offers the strongest separation of the Observer’s source from the external case, but investigators must rely on physical measurements and testimony.';
}

export function checkConnections(
  foundEvidence: string[],
  observerDecision: 'transmit' | 'withhold' | null,
  finalObserverChoice: 'preserve' | 'protect' | null,
  replayMode: boolean,
  onAutoUnlockObserverDeduction?: () => void
): string[] {
  const has = (...ids: string[]) => ids.every(id => foundEvidence.includes(id));
  const deductions: string[] = [];

  // ---------- CHAPTER 1–3 ----------
  if (has('case', 'attempts')) {
    deductions.push('Thorne is named in Case 0017 and the earlier recovery history. His involvement is documented; his motives are not.');
  }
  if (has('family', 'tablet')) {
    deductions.push('The tablet claims to remember Javis while his family records change. Whether the two events are causally linked remains unknown.');
  }
  if (has('revisions', 'photo')) {
    deductions.push('The revisions describe another Javis; the photograph appears to show a matching figure. The image alone cannot establish identity.');
  }
  if (has('spindle', 'family')) {
    deductions.push('The spindle and altered family records both concern Elara. The reason for the changes is not established by these records alone.');
  }
  if (has('watch', 'tablet')) {
    deductions.push('The watch stopped at 02:14, matching the termination time recorded in Case 0017. The significance of that match remains unresolved.');
  }
  if (has('brass_wheel', 'tablet')) {
    deductions.push('The wheel\'s change coincides with a Codex exchange reading. The exact mechanism cannot be confirmed from these two records alone.');
  }
  if (has('notebook', 'family')) {
    deductions.push('The notebook\'s handwriting resembles writing associated with Elara. Its provenance remains uncertain.');
  }

  // ---------- OBSERVER CORRELATION (auto-unlock) ----------
  if (observerDecision === 'transmit' && foundEvidence.includes('iteration')) {
    if (!replayMode && !foundEvidence.includes('observer_deduction')) {
      onAutoUnlockObserverDeduction?.();
    }
    deductions.push('CODEX CORRELATION: Because you transmitted your findings, the system cross-referenced Iteration 017. The fragment and the recovered records describe conflicting states. The Continuum\'s intent cannot yet be established.');
  }

  // ---------- CHAPTER 6–9 ----------
  if (has('nightingale', 'watch')) {
    deductions.push('Nightingale measures exchange effects; the stopped watch may be relevant, but it has not been independently identified as an exchange signature.');
  }
  if (has('annex_shipment', 'demolition')) {
    deductions.push('A shipment record names a site the demolition record says no longer exists. The records conflict; neither establishes what happened on site.');
  }
  if (has('reed_report', 'reed_statement')) {
    deductions.push('Reed\'s official report differs from his private statement. The discrepancy requires explanation; his statement remains subject to his consent.');
  }
  if (has('reconciliation_request', 'cas_shipment')) {
    deductions.push('HR-017 cites the Cassius Vale shipment. The relationship between the authorization and correction process warrants examination.');
  }

  // ---------- CHAPTER 11–13 ----------
  if (has('admission_register', 'plate')) {
    deductions.push('The admission register and brass plate both distinguish two subjects. Their identifiers correspond.');
  }
  if (has('cassius_letter', 'admission_register')) {
    deductions.push('Cassius\'s letter predates the second registration and alludes to two children. It does not establish what he knew with certainty.');
  }
  if (has('cassius_recording', 'plate')) {
    deductions.push('The recording depicts two children; the plate records one retained and one transferred. The records are consistent on that limited point.');
  }
  if (has('correction_logs', 'attempts')) {
    deductions.push('Correction logs record removals followed by unregistered returns. The repeated pattern raises questions about whether the underlying condition was resolved.');
  }
  if (has('exchange_indicator', 'tablet')) {
    deductions.push('The exchange indicator responds in the presence of both Javis and Aren. The readings alone do not identify the cause.');
  }

  // ---------- CHAPTER 14 ----------
  if (has('portable_unit', 'station_nine_archive')) {
    deductions.push('The portable unit and Station Nine archive contain complementary reference data. Their combined use still requires validation.');
  }

  // ---------- OBSERVER DIRECTIVE ----------
  if (finalObserverChoice === 'preserve') {
    deductions.push('DIRECTIVE ACTIVE: You released the contradictory observation. The public case gains independent historical evidence, but the source may be traced.');
    if (observerDecision === 'transmit') {
      deductions.push('CUMULATIVE CONSEQUENCE: Earlier transmitted findings and the released observation now form a broader evidence trail. Source-tracing risk is increased, though exposure is not guaranteed.');
    }
    if (observerDecision === 'withhold') {
      deductions.push('CUMULATIVE CONSEQUENCE: The earlier findings stayed local, but this release creates an external trail for the independent observation.');
    }
  }
  if (finalObserverChoice === 'protect') {
    deductions.push('DIRECTIVE ACTIVE: You kept the contradictory witness record sealed. The investigation must proceed without that record in open proceedings.');
    if (observerDecision === 'transmit') {
      deductions.push('CUMULATIVE CONSEQUENCE: The witness record remains protected, but the earlier transmission cannot be recalled. The Observer is not guaranteed to be untraceable.');
    }
    if (observerDecision === 'withhold') {
      deductions.push('CUMULATIVE CONSEQUENCE: Both directives keep their respective records out of the external evidence chain. This best protects the source, at the cost of a weaker public case.');
    }
  }

  return deductions;
}

export function compareEvidenceRecords(
  firstId: string,
  secondId: string,
  observerDecision: 'transmit' | 'withhold' | null
): string {
  if (!firstId || !secondId || firstId === secondId) {
    return 'Choose two different recovered records.';
  }
  const key = [firstId, secondId].sort().join('|');
  const privatePair = key === 'case|iteration' && observerDecision === 'withhold';
  if (privatePair) {
    return 'LOCAL COMPARISON · NOT TRANSMITTED\n\nCASE 0017 — SUBJECT: JAVIS / STATUS: DECEASED / TERMINATION: 17 OCTOBER, 02:14\n\nITERATION 017 — SUBJECT: J-17 / STATUS: UNRESOLVED / CORRECTION: PENDING\n\nThese records use different status fields. No cause or intent is established.';
  }
  return investigationPairs[key] || 'No shared indexed fields for this pair.';
}
