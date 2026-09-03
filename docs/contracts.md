# Smart Contract Reference

Contract: `contracts/ReturnRecord.py`
Deployed: StudioNet `0x1B2C516eD354EfA26EF6ad2A0258755E926a740F`

## Write methods

| Method | Caller | Preconditions | Effect |
|---|---|---|---|
| `open_rental(renter, item_title, item_category, item_description, reference_url, reference_commitment)` | Owner | None | Creates a rental in `OPEN` status; locks the reference image immutably. |
| `lock_return(rental_id, return_url, return_commitment)` | Renter only | Rental is `OPEN` | Locks the return image; rental moves to `RETURNED`. |
| `file_condition_check(rental_id)` | Owner or renter | Rental is `RETURNED`; no check yet exists | Opens a `ConditionCheck` in `filed` status. |
| `resolve_check(check_id)` | Anyone | Check is `filed` | Nondet: runs the visual jury, escrows the verdict (or voids the check) for a 48h challenge window. |
| `open_challenge(check_id, reason_code, statement)` | Owner or renter | Check is `verdict_escrowed`; within the challenge window | Opens a `Challenge` in `open` status; check moves to `challenged`. |
| `resolve_challenge(challenge_id)` | Anyone | Challenge is `open` | Nondet: a second, independent jury re-review; can uphold, overturn, or reject. |
| `finalize_check(check_id)` | Anyone | Check is `verdict_escrowed`; window closed OR a challenge was resolved | Writes the verdict permanently to both parties' `reputation` entries. |

## View methods

| Method | Returns |
|---|---|
| `get_rental(rental_id)` | Full rental record, including both evidence URLs and commitments. |
| `get_check(check_id)` | Full condition check record, including verdict, reason codes, and reasoning summary. |
| `get_challenge(challenge_id)` | Full challenge record, including original and final verdict. |
| `get_reputation(party_address)` | A party's condition-check history: counts per verdict type, last verdict, last finalized timestamp. |
| `get_next_rental_id()` | The next rental ID to be assigned. |

## Verdict shape

Three-way: `condition_matches`, `material_damage`, `inconclusive`. A check can also resolve to `voided` (decided by the same consensus mechanism, with a reason code: `SOURCE_UNAVAILABLE`, `STALE_RENDER`, or `INVALID_JURY_OUTPUT`), which is not a verdict — it means no verdict could be honestly reached, and no reputation entry is affected.

## Known, deliberate gaps

- No automated proof that the wallet addresses transacting on-chain are the actual humans handling the item physically.
- `reasoning_summary` content validation is a length threshold (≥20 chars), not full criteria-based validation — the verdict token itself is fully re-derived and compared by every validator, which is the primary content check; the free-text explanation is not independently judged for internal consistency with the images.
- No deadline automation forcing a return to happen — `lock_return` is an explicit, renter-triggered action with no expiry.
