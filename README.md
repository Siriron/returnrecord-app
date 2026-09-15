<div align="center">

<img src="./public/favicon.svg" width="88" alt="ReturnRecord logo" />

# ReturnRecord

### A photo before. A photo after. A jury that isn't either of you.

<br />

![Status](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)
![Networks](https://img.shields.io/badge/networks-StudioNet-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20GenVM-B5502E?style=flat-square)

<br />

**[Live App](https://returnrecord.vercel.app)** &nbsp;·&nbsp; **[Documentation](./docs/architecture.md)** &nbsp;·&nbsp; **[Smart Contract](./contracts/ReturnRecord.py)**

</div>

<br />

---

## What this is

An owner locks a content-committed reference photo before handing over a rental item. A renter locks their own return photo before any dispute exists. Either party can then file a condition check, and an independent AI jury — several GenLayer validators, not one — visually compares the two images and reaches consensus on the item's condition. The verdict is written to a permanent, public record for both parties, tracked separately by role — an owner's record and a renter's record are two different questions, even for the same address. No stake, no deposit, no GEN ever moves — the consequence is standing, not money. Any address's record is viewable at `/reputation` in the live app.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | Reputation-based rental condition verification via visual AI jury |
| **Consensus need** | A renter benefits from a false "no damage" verdict; an owner benefits from a false "material damage" verdict — genuine adversarial incentive on both sides |
| **Evidence source** | Two independently locked, content-committed images (owner's pre-rental reference, renter's post-rental return) — never a unilateral claim |
| **Networks** | StudioNet |

</div>

<br />

---

## How it works

1. **Owner opens the rental** — locks a reference photo and a content commitment before handoff.
2. **Renter locks the return** — submits a return photo at the end of the rental, before any dispute is raised.
3. **Either party files a condition check** — the jury renders both images and compares them against a fixed charter distinguishing material damage from normal wear.
4. **The verdict escrows for 48 hours** — either party can challenge, triggering a second, fully independent jury re-review.
5. **The verdict finalizes** — it becomes a permanent entry on both parties' condition record.

<br />

<details>
<summary><b>The three-way verdict, and why a fourth VOIDED state exists</b></summary>
<br />

The jury reaches one of three verdicts: `condition_matches`, `material_damage`, or `inconclusive`. Inconclusive exists because normal wear versus renter-caused damage is often a genuine judgment call — forcing a binary here would mean guessing on ambiguous evidence.

A check can also come back `voided` — decided by the same multi-validator consensus as any real verdict, never assumed from a single failed fetch. This happens if either image fails to render, or if the jury determines the two images aren't plausibly of the same item at all.

</details>

<br />

---

## Deployed contract

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0x7e7544B55d0d905286C2eb7E6389Acd6522aCE4A` | [View](https://explorer-studio.genlayer.com/address/0x7e7544B55d0d905286C2eb7E6389Acd6522aCE4A) |

</div>

<br />

---

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Full deployment instructions: [`docs/deployment.md`](./docs/deployment.md)

<br />

---

## Project structure

```
contracts/ReturnRecord.py         The GenVM contract
src/                               React + Vite app
docs/                              architecture.md, deployment.md, frontend.md, contracts.md,
                                    live-verification.md (full lifecycle proof, Sep 14 2026)
docs/assets/evidence-samples/      The exact HTML-wrapped evidence files used in live testing
tests/                             test_contract_static.py, test_lifecycle_model.py
LICENSE                            MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/static_audit_%2B_reproducible_tests-passed_26%2F26-brightgreen?style=flat-square)
![Tested](https://img.shields.io/badge/live_full_lifecycle-confirmed_end_to_end-brightgreen?style=flat-square)

</div>

The contract passes this project's full ten-item nondet safety audit and has a reproducible test suite — `tests/test_contract_static.py` (14/14 passing) and `tests/test_lifecycle_model.py` (12/12 passing), covering `lock_return`, condition check filing/resolution, challenges (upheld/overturned/rejected), voided outcomes, and finalization as source-level and pure-Python model checks.

**Confirmed live (Sep 14 2026):** the full dispute-and-reputation lifecycle has been run end to end against the deployed StudioNet contract, using two independently controlled wallets in the owner and renter roles — `open_rental` → `lock_return` → `file_condition_check` → `resolve_check` (a real, non-voided `material_damage` verdict) → `open_challenge` → `resolve_challenge` (an independent second jury round, `UPHOLD`) → `finalize_check` → `get_reputation` (confirming the role-specific `renter_material_damage_count` incremented and `owner_*` counters untouched). Full transaction-by-transaction detail, including exact evidence URLs and raw return values, is in [`docs/live-verification.md`](./docs/live-verification.md). This is a real completed dispute path, not just a happy-path write — a steward reviewing the prior submission specifically asked for this proof, and this README does not claim anything beyond what that log actually shows.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
