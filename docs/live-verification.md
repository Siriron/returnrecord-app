# Live Verification Log

This document records the complete, real, end-to-end dispute-and-reputation
lifecycle run against the deployed StudioNet contract on **September 14,
2026**, via GenLayer Studio's Run and Debug panel. Every value below is a
direct transaction input or a raw contract return value — nothing is
paraphrased or rounded up. This closes the specific gap a steward flagged
on the prior submission: that a single `open_rental` write is not evidence
the dispute/reputation system works end to end.

**Contract under test:** `0x7e7544B55d0d905286C2eb7E6389Acd6522aCE4A` (StudioNet)
**Owner wallet (this run):** `0xb3329282aDDCD9bbC4613331E0962f43Aa1e3b89`
**Renter wallet (this run):** `0x40edE296E01e1D57b25697b07D0f1c69077843D0`

Both wallets are independently controlled — the renter address is a real,
separate wallet held by the builder, distinct from the throwaway
Studio-generated account used as owner. This matters because
`lock_return` asserts `sender == rental.renter`, so the renter steps below
could only succeed if that wallet's own key signed them.

---

## Evidence hosting note

Evidence URLs in this run point to small, self-contained HTML pages (a
single `<img>` tag with the photo embedded as a base64 `data:` URI),
pinned to Arweave — not to bare image files. This is a deliberate,
confirmed-necessary choice: `gl.nondet.web.render(mode="screenshot")`
requires a real HTML document with a DOM to render. A bare image URL
fails with `WEBPAGE_LOAD_FAILED` (visible only after the Sep 2026
diagnostic fix — see `docs/contracts.md`'s Changelog). See
`docs/deployment.md`'s Evidence Hosting Requirements section for the full
explanation.

| Role | URL | Content commitment |
|---|---|---|
| Reference (pre-rental) | `https://arweave.net/Jpp2CrBFGip2BZATTy7Oer6sVcG-YzOBS6Dh3p3SEXI` | `content:Jpp2CrBFGip2BZATTy7Oer6sVcG-YzOBS6Dh3p3SEXI` |
| Return (post-rental) | `https://arweave.net/cQOBu4FT8FUbOYwvmrxwOTlZrfpWM_BF3YIvfC2t654` | `content:cQOBu4FT8FUbOYwvmrxwOTlZrfpWM_BF3YIvfC2t654` |

Both files were uploaded via ArDrive to Arweave (a plain HTTP GET is
sufficient to confirm liveness — both returned `200` with rendered HTML
before this run began). Note that two independent attempts using
IPFS-hosted evidence (`ipfs.io`) earlier the same day produced consistent
`SOURCE_UNAVAILABLE` voids, and a direct out-of-band fetch to `ipfs.io`
was explicitly bot-blocked. Arweave was not observed to have this
problem. This is a real, load-bearing finding, not an incidental detail —
see the Evidence Hosting Requirements section in `docs/deployment.md`.

---

## Step-by-step transaction log

### 1. `open_rental` — owner wallet

**Inputs:**
```
renter:                0x40edE296E01e1D57b25697b07D0f1c69077843D0
item_title:             Canon R5 with 24-70mm lens
item_category:          EQUIPMENT
item_description:       Mirrorless camera body with zoom lens, minor
                        existing scuff on the grip noted at handoff,
                        otherwise clean.
reference_url:          https://arweave.net/Jpp2CrBFGip2BZATTy7Oer6sVcG-YzOBS6Dh3p3SEXI
reference_commitment:   content:Jpp2CrBFGip2BZATTy7Oer6sVcG-YzOBS6Dh3p3SEXI
```

**Result:** `SUCCESS`
```json
{"rental_id": 1, "status": "OPEN"}
```

### 2. `lock_return` — renter wallet (`0x40edE296...843D0`)

**Inputs:**
```
rental_id:              1
return_url:             https://arweave.net/cQOBu4FT8FUbOYwvmrxwOTlZrfpWM_BF3YIvfC2t654
return_commitment:      content:cQOBu4FT8FUbOYwvmrxwOTlZrfpWM_BF3YIvfC2t654
```

**Result:** `SUCCESS`
```json
{"rental_id": 1, "status": "RETURNED"}
```

### 3. `file_condition_check` — renter wallet

**Inputs:**
```
rental_id: 1
```

**Result:** `SUCCESS`
```json
{"check_id": 1, "status": "filed"}
```

### 4. `resolve_check` — nondet consensus call (the visual jury)

**Inputs:**
```
check_id: 1
```

**Result:** `SUCCESS` — a genuine, non-voided verdict, reached by real
multi-validator LLM consensus fetching and comparing both images:

```json
{"check_id": 1, "verdict": "material_damage", "status": "verdict_escrowed"}
```

**Equivalence Principle output (leader's full judgment, independently
re-derived by validators before consensus was reached):**
```json
{
  "outcome": "judged",
  "reason_codes": ["CLEAR_MATERIAL_DAMAGE"],
  "reasoning_summary": "Both images show the same camera icon silhouette consistent with a mirrorless camera body. Image 1 shows a clean camera body with no visible damage beyond what might be expected. Image 2 shows clear visible scratches or scuff marks on the lens/front element area (two diagonal reddish-brown marks across the center lens circle), which represent material damage not present in the pre-rental reference and beyond normal wear from typical camera use during a rental period.",
  "verdict": "material_damage"
}
```

Stdout/stderr: empty on both counts. No rotation.

### 5. `open_challenge` — renter wallet (contesting the verdict)

**Inputs:**
```
rental_id:    1
reason_code:  IMAGES_MISREAD
statement:    The scratches identified are pre-existing wear from normal
              use, not new damage from this rental period.
```

**Result:** `SUCCESS`
```json
{"challenge_id": 1, "status": "open"}
```

### 6. `resolve_challenge` — nondet consensus call (independent second jury)

This is the second, fully independent nondet round: it re-fetches both
evidence images fresh and re-derives its own judgment, rather than
reading the first round's stored output.

**Inputs:**
```
challenge_id: 1
```

**Result:** `SUCCESS`
```json
{"challenge_id": 1, "decision": "UPHOLD", "final_verdict": "material_damage"}
```

**Equivalence Principle output:**
```json
{
  "decision": "UPHOLD",
  "final_verdict": "material_damage",
  "resolution_summary": "A fresh comparison of the pre-rental and post-rental images supports the original verdict. Image 1 shows a clean circular lens/front area with no visible crossing marks. Image 2 shows two distinct diagonal reddish-brown scratch/scuff marks across that circular area that are not visible in the reference image. The challenge claim that this wear was pre-existing is not supported by the images, so the original material_damage verdict stands."
}
```

Per the contract's `UPHOLD`/`REJECT` consistency rule (see `docs/contracts.md`'s
Changelog), `final_verdict` for an `UPHOLD` decision is structurally
forced to equal the original verdict — confirmed here: `material_damage`
in, `material_damage` out.

### 7. `finalize_check` — writes the verdict permanently

**Inputs:**
```
check_id: 1
```

**Result:** `SUCCESS`
```json
{"check_id": 1, "verdict": "material_damage", "status": "finalized"}
```

### 8. `get_reputation` — confirming the role-specific ledger update

**Inputs:**
```
party_address: 0x40edE296E01e1D57b25697b07D0f1c69077843D0
```

**Result:**
```json
{
  "party": "0x40edE296E01e1D57b25697b07D0f1c69077843D0",
  "owner_condition_matches_count": 0,
  "owner_material_damage_count": 0,
  "owner_inconclusive_count": 0,
  "renter_condition_matches_count": 0,
  "renter_material_damage_count": 1,
  "renter_inconclusive_count": 0,
  "last_verdict": "material_damage",
  "last_verdict_role": "renter",
  "last_finalized_at": 1789440256
}
```

This directly confirms role-specific reputation: the `renter_*` counters
reflect the finalized check, `owner_*` counters are untouched at zero
(this address never acted as owner), and `last_verdict_role` correctly
reads `"renter"`.

---

## What this confirms

- A real, non-voided verdict can be reached by genuine multi-validator
  consensus, comparing two independently locked, content-committed
  images.
- The challenge mechanism is genuinely independent — a second nondet
  round re-fetches evidence and re-derives its own conclusion, rather
  than trusting the first round's stored result.
- The `UPHOLD`/`REJECT` verdict-consistency fix holds under live
  execution: the challenge's `final_verdict` correctly matched the
  original verdict for an `UPHOLD` decision.
- `get_reputation` is called from a live transaction chain and returns
  correctly role-partitioned data, not a shared or ambiguous counter.
- The evidence-hosting requirement (a real renderable HTML page, not a
  bare image) is real and load-bearing — this was discovered directly
  through live testing, not assumed in advance.

## What this does not yet confirm

- A `condition_matches` (no-damage) verdict has not been exercised live
  in this run — only `material_damage` was reached, since the two
  evidence images used were genuinely different. A no-damage lifecycle
  is expected to behave identically based on the code path (same
  `resolve_check` logic, different verdict token) and is covered by
  `tests/test_lifecycle_model.py`, but has not been separately
  live-verified end to end.
- An `OVERTURN` challenge decision has not been exercised live — this
  run's challenge was upheld. `OVERTURN`'s consistency logic (a
  genuinely different `final_verdict` is required, and is independently
  re-enforced in `validator_fn`) is covered by
  `tests/test_contract_static.py::test_challenge_decision_verdict_consistency_enforced`
  but not by a live transaction.
- The owner-side reputation counters (`owner_*`) have not been
  live-confirmed incrementing, since this run's owner wallet was a
  Studio-generated throwaway account used once. The renter-side
  confirmation above exercises the identical code path
  (`_record_verdict` is role-parameterized, not role-specific logic),
  but this is inference from shared code, not a second independent
  observation.
