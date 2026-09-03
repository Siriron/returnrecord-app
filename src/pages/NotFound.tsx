import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h1>Nothing here</h1>
      <p style={{ color: 'var(--ash)', marginTop: 12 }}>This page doesn't exist.</p>
      <Link to="/" className="btn btn--primary" style={{ marginTop: 24, display: 'inline-block' }}>
        Back to home
      </Link>
    </div>
  );
}
