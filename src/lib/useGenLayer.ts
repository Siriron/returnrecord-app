import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import { CONTRACT_ADDRESS, STUDIONET_CONFIG, RECEIPT_CONFIG, EXPLORER_TX_URL } from '../config/chains';

// Confirmed live bug (project knowledge section 7): a timeout is not the
// same UI state as a rejected transaction. This carries the tx hash as a
// real property so the UI can offer a direct explorer link rather than a
// bare error.
export class TimeoutError extends Error {
  txHash: string;
  isTimeout = true;
  constructor(hash: string) {
    super(
      `Consensus is taking longer than expected. Your transaction was submitted — check its status directly: ${EXPLORER_TX_URL(hash)}`
    );
    this.txHash = hash;
  }
}

async function ensureChain() {
  const eth = (window as any).ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CONFIG.chainId }],
    });
  } catch (err: any) {
    if (err && err.code === 4902) {
      await eth.request({ method: 'wallet_addEthereumChain', params: [STUDIONET_CONFIG] });
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CONFIG.chainId }],
      });
    } else if (err && err.code === -32002) {
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      throw err;
    }
  }
}

export function useGenLayer() {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const readClientRef = useRef<any>(null);

  const getReadClient = useCallback(() => {
    if (!readClientRef.current) {
      readClientRef.current = createClient({ chain: studionet });
    }
    return readClientRef.current;
  }, []);

  // Silently check for an already-authorized wallet on mount, and stay in
  // sync if the person switches accounts — never eth_requestAccounts here,
  // which would prompt unexpectedly on every page load.
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts[0]) setAccount(accounts[0]);
      })
      .catch(() => {});
    const handleAccountsChanged = (accounts: string[]) => setAccount(accounts[0] || null);
    if (eth.on) eth.on('accountsChanged', handleAccountsChanged);
    return () => {
      if (eth.removeListener) eth.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error('No wallet found. Install a browser wallet extension to continue.');
    }
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      await ensureChain();
      setAccount(accounts[0] || null);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAccount(null), []);

  const getWriteClient = useCallback(async () => {
    if (!account) throw new Error('Wallet not connected');
    await ensureChain();
    const eth = (window as any).ethereum;
    const client = createClient({
      chain: studionet,
      account: account as `0x${string}`,
      provider: eth,
    });
    if (typeof (client as any).connect === 'function') {
      try {
        await (client as any).connect('studionet');
      } catch {
        // Defensive only — not every SDK version exposes this method.
      }
    }
    return client;
  }, [account]);

  const readContract = useCallback(
    async (functionName: string, args: any[] = []) => {
      const client = getReadClient();
      const raw = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName,
        args,
      });
      return JSON.parse(raw as string);
    },
    [getReadClient]
  );

  const writeContract = useCallback(
    async (functionName: string, args: any[] = [], value: bigint = BigInt(0)) => {
      const client = await getWriteClient();
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName,
        args,
        value,
      });

      try {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          status: TransactionStatus.ACCEPTED,
          ...RECEIPT_CONFIG,
        });
        return { hash, receipt };
      } catch {
        throw new TimeoutError(hash);
      }
    },
    [getWriteClient]
  );

  return { account, connecting, connect, disconnect, readContract, writeContract };
}
