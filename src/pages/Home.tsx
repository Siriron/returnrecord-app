import { Link } from 'react-router-dom';
import { ConditionCompare } from '../components/ConditionCompare';
import './Home.css';

export function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Rental condition, proven — not argued</p>
          <h1>
            A photo before.
            <br />
            A photo after.
            <br />
            A jury that isn't either of you.
          </h1>
          <p className="hero-lede">
            Owners lock a reference photo before handoff. Renters lock a return photo before the
            deposit conversation starts. An independent AI jury compares the two and writes the
            verdict to a permanent record — no stake, no slashing, just standing.
          </p>
          <div className="hero-actions">
            <Link to="/new" className="btn btn--primary">
              Open a rental
            </Link>
            <Link to="/how-it-works" className="btn">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="hero-visual">
        <ConditionCompare
          referenceUrl="/sample-before.jpg"
          returnUrl="/sample-after.jpg"
          referenceLabel="Locked at handoff — 9:02 AM"
          returnLabel="Locked at return — day 6, 4:41 PM"
        />
      </section>

      <section className="why">
        <h2>Why this needs a jury, not a form</h2>
        <p>
          Two photos of the same item can look completely different — different light, a different
          angle, a cluttered background — and still show identical condition. Or they can look
          almost the same and hide a real crack along the seam. Whether something counts as damage
          beyond normal wear is a judgment call, and a judgment call decided by either party alone
          is not a record anyone else can trust.
        </p>
        <p>
          Both photos are locked immutably before either side knows how the other will look, and
          before anyone knows what verdict is coming. The jury reasons only from what's in the
          images — never a training-data guess, never one party's account of what happened.
        </p>
      </section>

      <section className="steps">
        <h2>The lifecycle</h2>
        <ol className="step-list">
          <li>
            <span className="step-num">1</span>
            <div>
              <strong>Owner opens the rental</strong>
              <p>Locks a reference photo and its content commitment before handoff.</p>
            </div>
          </li>
          <li>
            <span className="step-num">2</span>
            <div>
              <strong>Renter locks the return</strong>
              <p>Submits a return photo at the end of the rental — before any dispute is raised.</p>
            </div>
          </li>
          <li>
            <span className="step-num">3</span>
            <div>
              <strong>Either party files a check</strong>
              <p>The jury renders both images and compares condition against a fixed charter.</p>
            </div>
          </li>
          <li>
            <span className="step-num">4</span>
            <div>
              <strong>The verdict escrows, then finalizes</strong>
              <p>A 48-hour window allows a challenge. After that, it's a permanent record.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
