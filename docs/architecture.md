# Architecture

## Overview

ReturnRecord is a GenVM Intelligent Contract that judges rental item condition disputes by visually comparing two independently-locked, content-committed images against a fixed charter, using multi-validator AI consensus rather than a single deterministic rule or a single LLM call.

## Components

- **Contract** (`contracts/ReturnRecord.py`) — the on-chain lifecycle: rental opening, return locking, condition check filing, nondet jury resolution, challenge, and finalization into a permanent reputation ledger.
- **Frontend** (`src/`) — a React + Vite app that drives the full lifecycle: connect wallet, open a rental, lock a return, file and resolve a condition check, challenge a verdict, and finalize it.

## Data flow

1. Owner calls `open_rental` with a renter address, item details, and a content-committed reference image URL. This is a plain deterministic write — no LLM call yet.
2. Renter calls `lock_return` with their own content-committed return image URL, once the rental period ends.
3. Either party calls `file_condition_check`, opening a check in `filed` status.
4. Either party calls `resolve_check`. This is the contract's only nondet write at this stage: it copies the rental record into memory, defines `leader_fn`/`validator_fn` as nested functions with zero `self` references, renders both images via `gl.nondet.web.render(mode="screenshot")`, and asks an LLM jury to compare them. `run_nondet_unsafe` requires independent validators to reach the *same* verdict token before the write commits.
5. The verdict escrows for a 48-hour challenge window. Either party may call `open_challenge`, which — if filed in time — triggers `resolve_challenge`: a second, fully independent nondet round that re-renders both images fresh and can uphold, overturn, or reject the original verdict.
6. Once the window closes (or a challenge resolves), anyone can call `finalize_check`, which writes the verdict permanently into both parties' `reputation` ledger entries.

## Why multi-validator consensus is structurally necessary here

Whether two photos show acceptable wear-and-tear or material damage is a subjective visual judgment that no deterministic function can compute, and it's exactly the kind of judgment where a single party's account (or a single LLM's opinion) can't be trusted as an oracle. GenLayer's `run_nondet_unsafe` requires independent validator nodes to reach the same closed-token verdict from their own independent render-and-compare pass before the transaction finalizes — this is the actual trust mechanism, not a formality wrapping a call to an API.

## Evidence binding

Both the reference and return images are submitted as `ipfs.io/ipfs/...` or `arweave.net/...` URLs, and each submission requires a matching `content:<source_id>` commitment string derived from that same URL. This closes the gap where a party could submit a URL now and swap the underlying content behind it later — the commitment is checked structurally against the URL at submission time, and the URL itself is immutable once locked.
