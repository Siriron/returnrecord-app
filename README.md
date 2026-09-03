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

An owner locks a content-committed reference photo before handing over a rental item. A renter locks their own return photo before any dispute exists. Either party can then file a condition check, and an independent AI jury — several GenLayer validators, not one — visually compares the two images and reaches consensus on the item's condition. The verdict is written to a permanent, public record for both parties. No stake, no deposit, no GEN ever moves — the consequence is standing, not money.

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
| StudioNet | `0x1B2C516eD354EfA26EF6ad2A0258755E926a740F` | [View](https://explorer-studio.genlayer.com/address/0x1B2C516eD354EfA26EF6ad2A0258755E926a740F) |

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

![Tested](https://img.shields.io/badge/full_lifecycle_static_audit-passed-brightgreen?style=flat-square)
![Untested](https://img.shields.io/badge/live_multi_validator_consensus-not_yet_run-yellow?style=flat-square)

</div>

The contract has passed this project's full ten-item nondet safety audit (positional `run_nondet_unsafe` calls, zero `self.` references in either nested closure, no `.send()`/`float()`/`DynArray`-on-nested-dataclass, address-key normalization confirmed identical at every write and read site) and is deployed live on StudioNet at the address above. What has **not** yet been exercised is a full live lifecycle against the deployed contract — `open_rental` through `finalize_check`, including the challenge path — via Studio's Run and Debug panel or the live app. This is a known, named gap, not an oversight: the contract is static-audit-clean and deployed, but "deployed" and "live-consensus-verified end to end" are different claims, and this README does not round one up to the other.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
