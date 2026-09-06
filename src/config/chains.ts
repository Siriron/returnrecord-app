// Single plain constant for the deployed contract address — no .env,
// no Vercel environment variable, no indirection. Changing the deployed
// address means editing this one line. See project knowledge section 7
// for why this pattern is the confirmed standing choice.

export const CONTRACT_ADDRESS = '0x06544f617B49BcA2b3b131198aB0734879Fb9c5e';

export const STUDIONET_CONFIG = {
  chainId: '0xF22F', // 61999
  chainName: 'GenLayer StudioNet',
  rpcUrls: ['https://studio.genlayer.com/api'],
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
};

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `https://explorer-studio.genlayer.com/address/${address}`;

export const EXPLORER_TX_URL = (hash: string) =>
  `https://explorer-studio.genlayer.com/tx/${hash}`;

export const RECEIPT_CONFIG = { retries: 120, interval: 4000 };
