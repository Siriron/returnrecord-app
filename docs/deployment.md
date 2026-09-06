# Deployment

## Contract

Deployed directly via [GenLayer Studio](https://studio.genlayer.com/contracts) from `contracts/ReturnRecord.py`.

**StudioNet:** `0x06544f617B49BcA2b3b131198aB0734879Fb9c5e`
[View on Explorer](https://explorer-studio.genlayer.com/address/0x06544f617B49BcA2b3b131198aB0734879Fb9c5e)

To redeploy: paste the contract source into Studio's contract editor, deploy, and update the single `CONTRACT_ADDRESS` constant in `src/config/chains.ts` — this is the only place the address is referenced anywhere in the app.

## Frontend

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
```

Deploy the built output to Vercel or any static host. `vercel.json` includes the required SPA rewrite so client-side routes resolve correctly.

## Testing status

- **Confirmed:** the contract passes this project's full static nondet-safety audit — positional `run_nondet_unsafe` calls, zero `self` references inside either nested closure (verified via an indentation-scope-aware script, not a plain grep), no `.send()`/`float()`/`DynArray`-on-nested-dataclass, address-key normalization identical at every write and read site for the `reputation` `TreeMap`.
- **Confirmed (Sep 2026):** a reproducible test suite exists and has actually been run — `tests/test_contract_static.py` (14/14 passing) and `tests/test_lifecycle_model.py` (12/12 passing), covering `lock_return`, condition check filing/resolution, challenges (upheld/overturned/rejected), voided outcomes, and finalization as a pure-Python lifecycle model plus source-level regression checks. See `docs/contracts.md`'s Changelog for exactly what these tests confirm.
- **Not yet confirmed:** a live, end-to-end lifecycle run against the deployed contract. Only `open_rental` has been exercised live so far — `lock_return` through `finalize_check`, including a challenge, has not yet been run against the deployed StudioNet contract via Studio's Run and Debug panel or the live frontend. **A single write succeeding is not evidence the dispute/reputation system works end to end** — this is a steward-identified gap, not just an internal one, and this document does not treat the one live `open_rental` transaction as proof of anything beyond that one write.

Recommended next step before treating this as fully proven: run the complete lifecycle at least twice in Studio's Run and Debug panel — once with no dispute (straight to `finalize_check`), once using the renter account through a full `open_challenge` → `resolve_challenge` round — confirming clean stderr and a correctly populated, role-specific `reputation` entry for both parties after each. Then repeat against the live frontend, including a check of the new `/reputation` page.
