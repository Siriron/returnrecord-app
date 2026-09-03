import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGenLayer } from '../lib/useGenLayer';
import type { Rental } from '../lib/types';
import { shortAddress } from '../lib/evidence';
import './RentalList.css';

export function RentalList() {
  const { readContract } = useGenLayer();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { next_rental_id: nextId } = await readContract('get_next_rental_id');
        const ids = Array.from({ length: Math.max(0, nextId - 1) }, (_, i) => i + 1).reverse();
        const results = await Promise.all(
          ids.map((id) => readContract('get_rental', [id]).catch(() => null))
        );
        setRentals(results.filter((r): r is Rental => r !== null));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [readContract]);

  if (loading) return <div className="container">Loading rentals…</div>;

  return (
    <div className="container">
      <div className="list-header">
        <h1>Rentals</h1>
        <Link to="/new" className="btn btn--primary">
          Open a rental
        </Link>
      </div>

      {rentals.length === 0 ? (
        <div className="empty-state">No rentals yet. Open the first one.</div>
      ) : (
        <div className="rental-grid">
          {rentals.map((r) => (
            <Link to={`/rentals/${r.rental_id}`} className="rental-tile" key={r.rental_id}>
              <span className="rental-tile-num">#{r.rental_id}</span>
              <strong>{r.item_title}</strong>
              <span className="rental-tile-meta">{r.item_category}</span>
              <span className="rental-tile-meta mono">{shortAddress(r.owner)} → {shortAddress(r.renter)}</span>
              <span className={`rental-tile-status status-${r.status.toLowerCase()}`}>{r.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
