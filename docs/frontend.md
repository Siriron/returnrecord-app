# Frontend

React + Vite, TypeScript, `react-router-dom` for client-side routing.

## Structure

- `src/config/chains.ts` — single plain constant for the contract address and StudioNet network config. No `.env`.
- `src/lib/useGenLayer.ts` — wallet connection, chain enforcement (`ensureChain`), and the read/write client wrapper around `genlayer-js`.
- `src/lib/types.ts` — TypeScript interfaces matching the contract's view method JSON shapes exactly.
- `src/lib/evidence.ts` — client-side helpers for deriving the `content:<source_id>` commitment string from an IPFS/Arweave URL, matching the contract's own `_source_id` logic.
- `src/components/` — shared UI: wallet button, verdict stamp, the before/after image comparison component, layout shell, error boundary.
- `src/pages/` — one page per route: home, open a rental, rental list, rental detail (the core lifecycle driver), how it works, 404.

## Wallet connection

Follows this project's confirmed pattern: `account` is passed to `createClient` as a plain address string, never wrapped in `createAccount()` (which expects a private key, not a wallet address). `ensureChain()` runs before every write to force StudioNet. Connection persists across reloads via a silent `eth_accounts` check on mount, and stays in sync via an `accountsChanged` listener.

## Timeout handling

Every write's `waitForTransactionReceipt` call uses `{ retries: 120, interval: 4000 }`. If it still times out, the UI surfaces a direct explorer link via a `TimeoutError` class carrying the real transaction hash — a timeout is not treated as the same UI state as a rejected transaction, since the transaction may have genuinely succeeded.

## Design

Inspection/darkroom register: warm charcoal and unbleached paper base, with two condition colors (sage for a clean verdict, clay for damage) used consistently as the verdict signal everywhere it appears — not as decorative accents. The hero treatment is a literal before/after image comparison, since that's the single most characteristic object in this product's world. See `src/index.css` for the full token set.
