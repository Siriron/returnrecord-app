# Deployment

## Contract

Deployed directly via [GenLayer Studio](https://studio.genlayer.com/contracts) from `contracts/ReturnRecord.py`.

**StudioNet:** `0x1B2C516eD354EfA26EF6ad2A0258755E926a740F`
[View on Explorer](https://explorer-studio.genlayer.com/address/0x1B2C516eD354EfA26EF6ad2A0258755E926a740F)

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
- **Not yet confirmed:** a live, end-to-end lifecycle run against the deployed contract. `open_rental` → `lock_return` → `file_condition_check` → `resolve_check` → (optionally `open_challenge` → `resolve_challenge`) → `finalize_check` has not yet been exercised live via Studio's Run and Debug panel or the deployed frontend. Local tests are not presented as proof of a live deployment.

Recommended next step before treating this as fully proven: run the complete lifecycle once in Studio's Run and Debug panel (fastest, no frontend round-trip needed), confirm clean stderr and a correctly populated `reputation` entry for both parties, then repeat against the live frontend.
