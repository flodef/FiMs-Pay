import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

// GenesysGo's devnet endpoint doesn't retain historical transactions
export const DEVNET_ENDPOINT = clusterApiUrl('devnet');

export const MAINNET_ENDPOINT = 'https://solanapay.genesysgo.net';

// Mint DUMMY tokens on devnet @ https://spl-token-faucet.com
export const DEVNET_DUMMY_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

export const MAINNET_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export const RECIPIENT = new PublicKey('2YVnh1hTwxS4V6ZZ8ybuY5rZsKDbhWAfD6L6JfdGsZ9y');

export const LINK = new URL('https://localhost:3001/api');

export const LABEL = 'Atlas Cafe';

export const SPL_TOKEN = DEVNET_DUMMY_MINT;
