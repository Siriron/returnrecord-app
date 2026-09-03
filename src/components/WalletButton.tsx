import { useGenLayer } from '../lib/useGenLayer';
import { shortAddress } from '../lib/evidence';

export function WalletButton() {
  const { account, connecting, connect, disconnect } = useGenLayer();

  if (account) {
    return (
      <button className="btn" onClick={disconnect} title={account}>
        {shortAddress(account)}
      </button>
    );
  }

  return (
    <button className="btn btn--primary" onClick={() => connect()} disabled={connecting}>
      {connecting ? 'Connecting…' : 'Connect wallet'}
    </button>
  );
}
