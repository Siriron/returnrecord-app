import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenLayer } from '../lib/useGenLayer';
import { commitmentFromUrl, isValidEvidenceUrl } from '../lib/evidence';
import './Forms.css';

export function OpenRental() {
  const { account, writeContract } = useGenLayer();
  const navigate = useNavigate();
  const [renter, setRenter] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PERSONAL_ITEM');
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commitment = commitmentFromUrl(referenceUrl);
  const urlLooksValid = referenceUrl === '' || isValidEvidenceUrl(referenceUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!account) {
      setError('Connect a wallet before opening a rental.');
      return;
    }
    if (!isValidEvidenceUrl(referenceUrl)) {
      setError('Reference evidence must be an ipfs.io/ipfs/... or arweave.net/... link.');
      return;
    }
    setSubmitting(true);
    try {
      const { hash } = await writeContract('open_rental', [
        renter.trim(),
        title.trim(),
        category,
        description.trim(),
        referenceUrl.trim(),
        commitment,
      ]);
      navigate('/rentals', { state: { justOpenedTx: hash } });
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong opening the rental.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container form-page">
      <h1>Open a rental</h1>
      <p className="form-intro">
        This locks your reference photo on-chain before the item ever leaves your hands. Once
        locked, it can't be swapped out later.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="renter">Renter's wallet address</label>
          <input
            id="renter"
            value={renter}
            onChange={(e) => setRenter(e.target.value)}
            placeholder="0x…"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="title">Item title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Canon R5 with 24-70mm lens"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="EQUIPMENT">Equipment</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="PERSONAL_ITEM">Personal item</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="description">Condition description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Note anything a jury should already know — existing scuffs, serial numbers, unique markings."
            required
          />
          <span className="hint">20–800 characters.</span>
        </div>

        <div className="field">
          <label htmlFor="reference">Reference photo URL</label>
          <input
            id="reference"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="https://ipfs.io/ipfs/… or https://arweave.net/…"
            required
          />
          <span className="hint">
            Only immutable IPFS or Arweave links are accepted — this is what makes the evidence
            tamper-proof.
          </span>
          {referenceUrl && !urlLooksValid && (
            <span className="hint hint--error">That doesn't look like a valid IPFS or Arweave link.</span>
          )}
        </div>

        {commitment && (
          <div className="commitment-preview">
            <span className="hint">The contract will store this commitment:</span>
            <code className="mono">{commitment}</code>
          </div>
        )}

        <button type="submit" className="btn btn--primary" disabled={submitting || !account}>
          {submitting ? 'Locking reference…' : 'Open rental'}
        </button>
        {!account && <span className="hint">Connect a wallet to continue.</span>}
      </form>
    </div>
  );
}
