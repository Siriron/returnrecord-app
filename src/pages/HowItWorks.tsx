import './HowItWorks.css';

export function HowItWorks() {
  return (
    <div className="container how-page">
      <h1>How it works</h1>

      <section>
        <h2>Why a smart contract can't just look at the photos itself</h2>
        <p>
          Deciding whether two photos show the same item in the same condition is a subjective,
          visual judgment — the kind of thing a deterministic contract has no way to compute.
          ReturnRecord uses GenLayer's multi-validator consensus: several independent nodes each
          render the same two images and reach their own verdict, and the write only finalizes if
          they agree. No single node's opinion decides the outcome.
        </p>
      </section>

      <section>
        <h2>The lifecycle, in full</h2>
        <ol>
          <li>
            <strong>open_rental</strong> — the owner locks a reference photo and a content
            commitment before handoff. The commitment is a hash-style string derived from the
            photo's own immutable address (IPFS or Arweave), so the photo can never be swapped
            after the fact without the commitment changing too.
          </li>
          <li>
            <strong>lock_return</strong> — the renter does the same with a return photo, at the end
            of the rental, before anyone has raised a dispute.
          </li>
          <li>
            <strong>file_condition_check</strong> — either party requests a jury review.
          </li>
          <li>
            <strong>resolve_check</strong> — the jury renders both images, compares them against a
            fixed charter (material damage vs. normal wear), and reaches one of three verdicts:
            condition matches, material damage, or inconclusive. If either image can't be rendered,
            or the two images clearly aren't the same item, the check is voided instead of forcing a
            guess.
          </li>
          <li>
            <strong>open_challenge / resolve_challenge</strong> — either party has 48 hours to
            challenge the verdict. A challenge triggers a second, fully independent jury review that
            can uphold, overturn, or reject the challenge.
          </li>
          <li>
            <strong>finalize_check</strong> — once the window closes (or a challenge resolves), the
            verdict is written permanently to both parties' condition record.
          </li>
        </ol>
      </section>

      <section>
        <h2>What's on the record, and what isn't</h2>
        <p>
          No GEN ever moves through this contract. There's no deposit, no stake, no slashing — the
          consequence is entirely reputational. A party's record shows how many rentals ended in
          each verdict, visible to anyone considering a future rental with them.
        </p>
        <p>
          ReturnRecord doesn't verify that the wallet addresses transacting on-chain are the actual
          humans who physically handled the item — that trust still lives in choosing who you rent
          to. What it verifies is that the two evidence photos are genuinely of the same item, that
          they were locked by the two parties to this specific rental, and that neither could be
          swapped after the fact.
        </p>
      </section>
    </div>
  );
}
