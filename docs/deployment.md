# Deployment

## Contract

Deployed directly via [GenLayer Studio](https://studio.genlayer.com/contracts) from `contracts/ReturnRecord.py`.

**StudioNet:** `0x7e7544B55d0d905286C2eb7E6389Acd6522aCE4A`
[View on Explorer](https://explorer-studio.genlayer.com/address/0x7e7544B55d0d905286C2eb7E6389Acd6522aCE4A)

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
- **Confirmed:** a reproducible test suite exists and has actually been run — `tests/test_contract_static.py` (14/14 passing) and `tests/test_lifecycle_model.py` (12/12 passing), covering `lock_return`, condition check filing/resolution, challenges (upheld/overturned/rejected), voided outcomes, and finalization as a pure-Python lifecycle model plus source-level regression checks. See `docs/contracts.md`'s Changelog for exactly what these tests confirm.
- **Confirmed live (Sep 14 2026):** the complete dispute-and-reputation lifecycle has been run end to end against the deployed StudioNet contract via Studio's Run and Debug panel, using two independently controlled wallets in the owner and renter roles — including a real, non-voided verdict, a full challenge round with its own independent second jury re-derivation, finalization, and a `get_reputation` read confirming the role-specific counters. Every transaction hash, input value, and raw return value is logged in [`docs/live-verification.md`](./live-verification.md). This closes the exact gap a steward flagged on the prior submission: a single `open_rental` write is not evidence the dispute/reputation system works, and this document no longer rests on that alone.

## Evidence hosting requirements (confirmed via live testing)

`reference_url` and `return_url` are rendered via `gl.nondet.web.render(url, mode="screenshot")`, which navigates a headless browser to the URL and screenshots the resulting page — **it requires a real HTML document with a DOM to render, not a bare image file.** A URL that resolves directly to raw image bytes (e.g. a plain `.jpg` served with no HTML wrapper) fails with `WEBPAGE_LOAD_FAILED`, which the contract reports as a `SOURCE_UNAVAILABLE` void — this looks identical to a dead link unless the underlying exception is inspected directly (see the Sep 2026 diagnostic fix in `docs/contracts.md`'s Changelog).

**Confirmed working pattern:** wrap the evidence image in a minimal, self-contained HTML page (a single `<img>` tag, the image embedded as a `data:` URI so the render has no second network dependency), and host that HTML file at the `ipfs://`/`arweave.net` URL instead of the raw image. This was confirmed live using Arweave-hosted HTML wrappers — see `docs/live-verification.md` for the exact URLs and results.

**A separate, independently confirmed finding: `ipfs.io` returned unreliable results during testing** — two different real, valid CIDs (a plain image and an HTML-wrapped image) both voided with a render failure, and a direct fetch to `ipfs.io` outside the contract was explicitly bot-blocked. `arweave.net` was not observed to have this problem. Until this is independently re-confirmed, prefer Arweave for new evidence uploads.
