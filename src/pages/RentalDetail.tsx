import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGenLayer } from '../lib/useGenLayer';
import { ConditionCompare } from '../components/ConditionCompare';
import { VerdictStamp } from '../components/VerdictStamp';
import {
  commitmentFromUrl,
  formatEpoch,
  isValidEvidenceUrl,
  shortAddress,
  timeUntil,
  REASON_LABEL,
} from '../lib/evidence';
import {
  CHALLENGE_REASON_CODES,
  type Rental,
  type ConditionCheck,
  type Challenge,
  type ChallengeReasonCode,
} from '../lib/types';
import './RentalDetail.css';

export function RentalDetail() {
  const { id } = useParams<{ id: string }>();
  const { account, readContract, writeContract } = useGenLayer();
  const [rental, setRental] = useState<Rental | null>(null);
  const [check, setCheck] = useState<ConditionCheck | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [returnUrl, setReturnUrl] = useState('');
  const [challengeReason, setChallengeReason] = useState<ChallengeReasonCode>(CHALLENGE_REASON_CODES[0]);
  const [challengeStatement, setChallengeStatement] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r: Rental = await readContract('get_rental', [Number(id)]);
      setRental(r);
      if (r.check_id) {
        const c: ConditionCheck = await readContract('get_check', [Number(r.check_id)]);
        setCheck(c);
        if (c.challenge_id) {
          const ch: Challenge = await readContract('get_challenge', [Number(c.challenge_id)]);
          setChallenge(ch);
        } else {
          setChallenge(null);
        }
      } else {
        setCheck(null);
        setChallenge(null);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load this rental.');
    } finally {
      setLoading(false);
    }
  }, [id, readContract]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = account && rental && account.toLowerCase() === rental.owner.toLowerCase();
  const isRenter = account && rental && account.toLowerCase() === rental.renter.toLowerCase();
  const isParty = isOwner || isRenter;

  async function runAction(label: string, fn: () => Promise<any>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err: any) {
      setError(err?.message ?? `Could not complete: ${label}`);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="container">Loading rental…</div>;
  if (!rental) return <div className="container error-banner">{error ?? 'Rental not found.'}</div>;

  const returnCommitment = commitmentFromUrl(returnUrl);

  return (
    <div className="container detail-page">
      <div className="detail-header">
        <div>
          <p className="detail-eyebrow">Rental #{rental.rental_id}</p>
          <h1>{rental.item_title}</h1>
        </div>
        {check && <VerdictStamp verdict={check.verdict} status={check.status} />}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <ConditionCompare referenceUrl={rental.reference_url} returnUrl={rental.return_url || undefined} />

      <dl className="record" style={{ marginTop: 24 }}>
        <div className="record-row"><dt>Category</dt><dd>{rental.item_category}</dd></div>
        <div className="record-row"><dt>Owner</dt><dd className="mono">{shortAddress(rental.owner)}</dd></div>
        <div className="record-row"><dt>Renter</dt><dd className="mono">{shortAddress(rental.renter)}</dd></div>
        <div className="record-row"><dt>Reference locked</dt><dd>{formatEpoch(rental.reference_locked_at)}</dd></div>
        {rental.return_locked_at > 0 && <div className="record-row"><dt>Return locked</dt><dd>{formatEpoch(rental.return_locked_at)}</dd></div>}
        <div className="record-row"><dt>Description</dt><dd>{rental.item_description}</dd></div>
      </dl>

      {rental.status === 'OPEN' && isRenter && (
        <section className="action-block">
          <h2>Lock your return evidence</h2>
          <p className="hint">Do this once the item is back with the owner, before any dispute starts.</p>
          <div className="field"><label htmlFor="return-url">Return photo URL</label><input id="return-url" value={returnUrl} onChange={(e) => setReturnUrl(e.target.value)} placeholder="https://ipfs.io/ipfs/… or https://arweave.net/…" /></div>
          {returnCommitment && <div className="commitment-preview"><span className="hint">Commitment:</span><code className="mono">{returnCommitment}</code></div>}
          <button className="btn btn--primary" disabled={busy !== null || !isValidEvidenceUrl(returnUrl)} onClick={() => runAction('lock_return', () => writeContract('lock_return', [rental.rental_id, returnUrl.trim(), returnCommitment]))}>
            {busy === 'lock_return' ? 'Locking…' : 'Lock return evidence'}
          </button>
        </section>
      )}

      {rental.status === 'OPEN' && !isRenter && <div className="empty-state">Waiting for the renter to lock return evidence.</div>}

      {rental.status === 'RETURNED' && isParty && (
        <section className="action-block">
          <h2>File a condition check</h2>
          <p className="hint">Either party can request the jury review at this point.</p>
          <button className="btn btn--primary" disabled={busy !== null} onClick={() => runAction('file_condition_check', () => writeContract('file_condition_check', [rental.rental_id]))}>
            {busy === 'file_condition_check' ? 'Filing…' : 'File condition check'}
          </button>
        </section>
      )}

      {check && check.status === 'filed' && (
        <section className="action-block">
          <h2>Run the jury review</h2>
          <p className="hint">This renders both images and reaches independent AI consensus. It can take a few minutes.</p>
          <button className="btn btn--sage" disabled={busy !== null} onClick={() => runAction('resolve_check', () => writeContract('resolve_check', [check.check_id]))}>
            {busy === 'resolve_check' ? 'Awaiting consensus…' : 'Run jury review'}
          </button>
        </section>
      )}

      {check && check.status === 'verdict_escrowed' && (
        <section className="action-block">
          <h2>Verdict reached</h2>
          <p className="reasoning">{check.reasoning_summary}</p>
          {check.reason_codes.length > 0 && <ul className="reason-list">{check.reason_codes.map((rc) => <li key={rc}>{REASON_LABEL[rc] ?? rc}</li>)}</ul>}
          <p className="hint">Challenge window closes {formatEpoch(check.challenge_window_ends)} ({timeUntil(check.challenge_window_ends)} left).</p>
          {isParty && <div className="challenge-form">
            <h3>Disagree with this verdict?</h3>
            <div className="field"><label htmlFor="reason">Reason</label><select id="reason" value={challengeReason} onChange={(e) => setChallengeReason(e.target.value as ChallengeReasonCode)}>{CHALLENGE_REASON_CODES.map((rc) => <option key={rc} value={rc}>{rc.replaceAll('_', ' ').toLowerCase()}</option>)}</select></div>
            <div className="field"><label htmlFor="statement">Statement</label><textarea id="statement" value={challengeStatement} onChange={(e) => setChallengeStatement(e.target.value)} placeholder="Explain specifically what the jury got wrong." /></div>
            <button className="btn" disabled={busy !== null || challengeStatement.trim().length < 10} onClick={() => runAction('open_challenge', () => writeContract('open_challenge', [check.check_id, challengeReason, challengeStatement.trim()]))}>{busy === 'open_challenge' ? 'Filing challenge…' : 'File challenge'}</button>
          </div>}
          <button className="btn btn--primary" disabled={busy !== null} onClick={() => runAction('finalize_check', () => writeContract('finalize_check', [check.check_id]))}>{busy === 'finalize_check' ? 'Finalizing…' : 'Finalize (after window closes)'}</button>
        </section>
      )}

      {check && check.status === 'challenged' && challenge && (
        <section className="action-block">
          <h2>Challenge under review</h2>
          <dl className="record"><div className="record-row"><dt>Reason</dt><dd>{challenge.reason_code.replaceAll('_', ' ').toLowerCase()}</dd></div><div className="record-row"><dt>Statement</dt><dd>{challenge.statement}</dd></div></dl>
          <button className="btn btn--sage" disabled={busy !== null} onClick={() => runAction('resolve_challenge', () => writeContract('resolve_challenge', [challenge.challenge_id]))}>{busy === 'resolve_challenge' ? 'Re-adjudicating…' : 'Resolve challenge'}</button>
        </section>
      )}

      {check && check.status === 'finalized' && <div className="empty-state">This condition check is finalized. The verdict is now part of both parties' permanent record.</div>}
      {check && check.status === 'voided' && <div className="empty-state"><p>{check.reasoning_summary}</p></div>}
    </div>
  );
}
