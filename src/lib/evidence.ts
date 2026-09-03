// Extracts the source id the contract itself derives from an ipfs.io/
// arweave.net URL, so the frontend can show the exact commitment string
// the contract expects before the person submits it — matches
// ReturnRecord.py's _source_id exactly, never re-derived differently.
export function sourceIdFromUrl(url: string): string {
  const lowered = url.trim().toLowerCase();
  const ipfsPrefix = 'https://ipfs.io/ipfs/';
  const arPrefix = 'https://arweave.net/';
  if (lowered.startsWith(ipfsPrefix)) {
    return lowered.slice(ipfsPrefix.length).split('/')[0];
  }
  if (lowered.startsWith(arPrefix)) {
    return lowered.slice(arPrefix.length).split('/')[0];
  }
  return '';
}

export function commitmentFromUrl(url: string): string {
  const id = sourceIdFromUrl(url);
  return id ? `content:${id}` : '';
}

export function isValidEvidenceUrl(url: string): boolean {
  const id = sourceIdFromUrl(url);
  return url.length <= 500 && id.length >= 32 && !id.includes('example') && !id.includes('replace');
}

export function formatEpoch(seconds: number): string {
  if (!seconds) return '—';
  const d = new Date(seconds * 1000);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeUntil(seconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = seconds - now;
  if (diff <= 0) return 'now';
  const hours = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export const VERDICT_LABEL: Record<string, string> = {
  condition_matches: 'Condition matches',
  material_damage: 'Material damage',
  inconclusive: 'Inconclusive',
  '': 'Pending',
};

export const REASON_LABEL: Record<string, string> = {
  CLEAR_MATCH_NO_NEW_WEAR: 'No new wear found',
  CLEAR_MATERIAL_DAMAGE: 'Material damage found',
  AMBIGUOUS_WEAR_LEVEL: 'Wear level was ambiguous',
  IMAGE_QUALITY_INSUFFICIENT: 'Image quality was insufficient',
  ITEM_IDENTITY_UNCERTAIN: 'Item identity was uncertain',
};
