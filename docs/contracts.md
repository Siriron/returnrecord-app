# Smart Contract Reference

Contract: `contracts/ReturnRecord.py`
Deployed: StudioNet `0x06544f617B49BcA2b3b131198aB0734879Fb9c5e`

## Write methods

| Method | Caller | Preconditions | Effect |
|---|---|---|---|
| `open_rental(renter, item_title, item_category, item_description, reference_url, reference_commitment)` | Owner | None | Creates a rental in `OPEN` status; locks the reference image immutably. |
| `lock_return(rental_id, return_url, return_commitment)` | Renter only | Rental is `OPEN` | Locks the return image; rental moves to `RETURNED`. |
| `file_condition_check(rental_id)` | Owner or renter | Rental is `RETURNED`; no check yet exists | Opens a `ConditionCheck` in `filed` status. |
| `resolve_check(check_id)` | Anyone | Check is `filed` | Nondet: runs the visual jury, escrows the verdict (or voids the check) for a 48h challenge window. |
| `open_challenge(check_id, reason_code, statement)` | Owner or renter | Check is `verdict_escrowed`; within the challenge window | Opens a `Challenge` in `open` status; check moves to `challenged`. |
| `resolve_challenge(challenge_id)` | Anyone | Challenge is `open` | Nondet: a second, independent jury re-review; can uphold, overturn, or reject. `final_verdict` is now structurally forced to equal the original verdict for `UPHOLD`/`REJECT` — only `OVERTURN` may differ, and it must genuinely differ (fixed Sep 2026, see Changelog below). |
| `finalize_check(check_id)` | Anyone | Check is `verdict_escrowed`; window closed OR a challenge was resolved | Writes the verdict permanently to both parties' `reputation` entries, **under the role each party actually held in this rental** (fixed Sep 2026, see Changelog below). |

## View methods

| Method | Returns |
|---|---|
| `get_rental(rental_id)` | Full rental record, including both evidence URLs and commitments. |
| `get_check(check_id)` | Full condition check record, including verdict, reason codes, and reasoning summary. |
| `get_challenge(challenge_id)` | Full challenge record, including original and final verdict. |
| `get_reputation(party_address)` | A party's condition-check history, split by role: `owner_condition_matches_count`, `owner_material_damage_count`, `owner_inconclusive_count`, and the matching `renter_*` set, plus `last_verdict`, `last_verdict_role`, `last_finalized_at`. **Now exposed in the frontend** at `/reputation` (fixed Sep 2026, see Changelog below) — previously implemented but never called anywhere in the app. |
| `get_next_rental_id()` | The next rental ID to be assigned. |

## Verdict shape

Three-way: `condition_matches`, `material_damage`, `inconclusive`. A check can also resolve to `voided` (decided by the same consensus mechanism, with a reason code: `SOURCE_UNAVAILABLE`, `STALE_RENDER`, or `INVALID_JURY_OUTPUT`), which is not a verdict — it means no verdict could be honestly reached, and no reputation entry is affected.

## Changelog (Sep 2026, steward-requested corrections)

- **Reputation is now role-specific.** `ReputationEntry` previously tracked one shared `condition_matches_count`/`material_damage_count`/`inconclusive_count` set per address, regardless of whether that address was the owner or the renter in a given rental. This meant a renter who damages items and an owner who files false damage claims were indistinguishable on the ledger, and the same address playing both roles across different rentals had its history collapsed into one number. Now split into `owner_*` and `renter_*` counters, each incremented only under the role actually held in that specific rental. See `tests/test_lifecycle_model.py::test_same_address_different_roles_across_two_rentals_tracked_separately` for the regression test.
- **Challenge decision/verdict consistency is now structurally enforced.** `resolve_challenge`'s `leader_fn` previously trusted the LLM's own `final_verdict` field even when `decision` was `UPHOLD` or `REJECT` — both of which mean "the original verdict stands" — so an internally inconsistent pair (e.g. `UPHOLD` paired with a changed `final_verdict`) was structurally possible if the model produced it, since `decision` and `final_verdict` were only checked for cross-model agreement independently, never against each other. `final_verdict` is now forced deterministically to the original verdict for `UPHOLD`/`REJECT`; only `OVERTURN` may carry a different value, and an `OVERTURN` with no genuine change is rejected outright. `validator_fn` independently re-enforces this same invariant. See `tests/test_contract_static.py::test_challenge_decision_verdict_consistency_enforced`.
- **`get_reputation` is now called from the frontend.** The view method existed in the original contract but nothing in the app ever queried it — a reviewer using the live app had no way to see the reputation ledger the whole concept is built around. A new `/reputation` page (linked from the nav and from a finalized check's detail page) now exposes it.
- **Added a reproducible test suite** — `tests/test_contract_static.py` (source-level safety/regression checks, run via plain Python, no pytest required) and `tests/test_lifecycle_model.py` (a pure-Python state-machine model of the full lifecycle: lock_return, condition checks, challenges — upheld/overturned/rejected — voided outcomes, and finalization). Both were actually run and confirmed passing (26/26 combined) before this update, not merely written. Neither is a live-consensus test — see Known Gaps below.

## Known, deliberate gaps

- No automated proof that the wallet addresses transacting on-chain are the actual humans handling the item physically.
- `reasoning_summary` content validation is a length threshold (≥20 chars), not full criteria-based validation — the verdict token itself is fully re-derived and compared by every validator, which is the primary content check; the free-text explanation is not independently judged for internal consistency with the images.
- No deadline automation forcing a return to happen — `lock_return` is an explicit, renter-triggered action with no expiry.
