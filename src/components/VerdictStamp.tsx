import type { Verdict, CheckStatus } from '../lib/types';
import { VERDICT_LABEL } from '../lib/evidence';

const STAMP_CLASS: Record<string, string> = {
  condition_matches: 'stamp--matches',
  material_damage: 'stamp--damage',
  inconclusive: 'stamp--inconclusive',
};

export function VerdictStamp({ verdict, status }: { verdict: Verdict; status?: CheckStatus }) {
  if (status === 'voided') {
    return <span className="stamp stamp--inconclusive">Voided — could not be judged</span>;
  }
  if (!verdict) {
    return <span className="stamp stamp--pending">Awaiting jury</span>;
  }
  return <span className={`stamp ${STAMP_CLASS[verdict] ?? 'stamp--pending'}`}>{VERDICT_LABEL[verdict]}</span>;
}
