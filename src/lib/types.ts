export type RentalStatus = 'OPEN' | 'RETURNED' | 'CHECKED';

export interface Rental {
  rental_id: number;
  owner: string;
  renter: string;
  item_title: string;
  item_category: string;
  item_description: string;
  reference_url: string;
  reference_commitment: string;
  reference_locked_at: number;
  return_url: string;
  return_commitment: string;
  return_locked_at: number;
  status: RentalStatus;
  check_id: string;
}

export type CheckStatus = 'filed' | 'verdict_escrowed' | 'finalized' | 'challenged' | 'voided';
export type Verdict = 'condition_matches' | 'material_damage' | 'inconclusive' | '';

export interface ConditionCheck {
  check_id: number;
  rental_id: number;
  filer: string;
  filed_at: number;
  status: CheckStatus;
  verdict: Verdict;
  reason_codes: string[];
  reasoning_summary: string;
  escrowed_at: number;
  challenge_window_ends: number;
  finalized_at: number;
  challenge_id: string;
}

export type ChallengeStatus = 'open' | 'upheld' | 'overturned' | 'rejected';

export interface Challenge {
  challenge_id: number;
  check_id: number;
  challenger: string;
  reason_code: string;
  statement: string;
  status: ChallengeStatus;
  opened_at: number;
  resolved_at: number;
  original_verdict: Verdict;
  final_verdict: Verdict;
  resolution_summary: string;
}

export interface Reputation {
  party: string;
  condition_matches_count: number;
  material_damage_count: number;
  inconclusive_count: number;
  last_verdict: Verdict;
  last_finalized_at: number;
}

export const CHALLENGE_REASON_CODES = [
  'IMAGES_MISREAD',
  'WRONG_ITEM_COMPARED',
  'PRE_EXISTING_DAMAGE_IGNORED',
  'EVIDENCE_STALE_SINCE',
] as const;

export type ChallengeReasonCode = (typeof CHALLENGE_REASON_CODES)[number];
