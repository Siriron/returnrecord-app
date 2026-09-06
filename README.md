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
| StudioNet | `0x06544f617B49BcA2b3b131198aB0734879Fb9c5e` | [View](https://explorer-studio.genlayer.com/address/0x06544f617B49BcA2b3b131198aB0734879Fb9c5e) |

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
contracts/ReturnRecord.py    The GenVM contract
src/                          React + Vite app
docs/                         architecture.md, deployment.md, frontend.md, contracts.md
LICENSE                       MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/static_audit_%2B_reproducible_tests-passed_26%2F26-brightgreen?style=flat-square)
![Untested](https://img.shields.io/badge/live_dispute%2Freputation_lifecycle-not_yet_run-yellow?style=flat-square)

</div>

The contract passes this project's full ten-item nondet safety audit and now has a reproducible test suite — `tests/test_contract_static.py` (14/14 passing, source-level safety and regression checks) and `tests/test_lifecycle_model.py` (12/12 passing, a pure-Python state-machine model covering lock_return, condition checks, challenges — upheld/overturned/rejected — voided outcomes, and finalization). Both were actually run and confirmed passing, not merely written.

What has **not** yet been exercised is a live, end-to-end lifecycle run against the deployed contract. Only `open_rental` has been called live so far. **A single successful write is not evidence the dispute/reputation system works** — `lock_return` through `finalize_check`, including a full challenge round using the renter account, still needs to be run live via Studio's Run and Debug panel or the app itself before this is fully proven. This gap was specifically flagged by a steward reviewing the first submission, and this README does not round the one confirmed `open_rental` transaction up into a broader claim.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
