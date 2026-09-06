import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGenLayer } from '../lib/useGenLayer';
import type { Reputation } from '../lib/types';
import { formatEpoch, shortAddress, VERDICT_LABEL } from '../lib/evidence';
import './Reputation.css';

export function ReputationPage() {
  const { readContract } = useGenLayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [address, setAddress] = useState(searchParams.get('address') ?? '');
  const [rep, setRep] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function lookup(addr: string) {
    if (!addr.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const r: Reputation = await readContract('get_reputation', [addr.trim()]);
      setRep(r);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load this record.');
      setRep(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams(address.trim() ? { address: address.trim() } : {});
    lookup(address);
  }

  const ownerTotal = rep
    ? rep.owner_condition_matches_count + rep.owner_material_damage_count + rep.owner_inconclusive_count
    : 0;
  const renterTotal = rep
    ? rep.renter_condition_matches_count + rep.renter_material_damage_count + rep.renter_inconclusive_count
    : 0;

  return (
    <div className="container rep-page">
      <h1>Condition record</h1>
      <p className="form-intro">
        Every finalized condition check is written permanently against both parties — tracked
        separately for each role, since being a careful renter and being a fair owner are two
        different questions.
      </p>

      <form onSubmit={handleSubmit} className="rep-search">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x… wallet address"
        />
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {searched && !loading && !error && rep && (
        <div className="rep-results">
          <p className="rep-address mono">{shortAddress(rep.party || address)}</p>

          <div className="rep-columns">
            <div className="rep-col">
              <h2>As owner</h2>
              {ownerTotal === 0 ? (
                <p className="hint">No finalized checks as an owner yet.</p>
              ) : (
                <dl className="record">
                  <div className="record-row">
                    <dt>Condition matches</dt>
                    <dd>{rep.owner_condition_matches_count}</dd>
                  </div>
                  <div className="record-row">
                    <dt>Material damage</dt>
                    <dd>{rep.owner_material_damage_count}</dd>
                  </div>
                  <div className="record-row">
                    <dt>Inconclusive</dt>
                    <dd>{rep.owner_inconclusive_count}</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="rep-col">
              <h2>As renter</h2>
              {renterTotal === 0 ? (
                <p className="hint">No finalized checks as a renter yet.</p>
              ) : (
                <dl className="record">
                  <div className="record-row">
                    <dt>Condition matches</dt>
                    <dd>{rep.renter_condition_matches_count}</dd>
                  </div>
                  <div className="record-row">
                    <dt>Material damage</dt>
                    <dd>{rep.renter_material_damage_count}</dd>
                  </div>
                  <div className="record-row">
                    <dt>Inconclusive</dt>
                    <dd>{rep.renter_inconclusive_count}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {rep.last_verdict && (
            <p className="hint" style={{ marginTop: 16 }}>
              Last verdict: {VERDICT_LABEL[rep.last_verdict]} (as {rep.last_verdict_role}) on{' '}
              {formatEpoch(rep.last_finalized_at)}
            </p>
          )}
        </div>
      )}

      {searched && !loading && !error && !rep && (
        <div className="empty-state">No record found for that address.</div>
      )}
    </div>
  );
}
