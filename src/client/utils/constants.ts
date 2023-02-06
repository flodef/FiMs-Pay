import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { SOLIcon } from '../components/images/SOLIcon';
import { USDCIcon } from '../components/images/USDCIcon';
import { USDTIcon } from '../components/images/USDTIcon';
import { EURIcon } from '../components/images/EURIcon';
import { agEURIcon } from '../components/images/agEURIcon';
import { BONKIcon } from '../components/images/BONKIcon';
import { Digits } from '../types';
import { Multiplier } from "./multiplier";
import BigNumber from 'bignumber.js';

export const MAX_CONFIRMATIONS = 32;
export const NON_BREAKING_SPACE = '\u00a0';
export const ZERO = new BigNumber(0);
export const SOLANA_PAY = 'Solana Pay';

export const DEVNET_ENDPOINT = clusterApiUrl('devnet');
export const MAINNET_ENDPOINT = process.env.NEXT_PUBLIC_CLUSTER_ENDPOINT || 'https://solana-mainnet.rpc.extrnode.com';

/**
 * ONLY FOR SAMPLES NEVER EVER STORE YOUR/ANYONE'S PRIVATE KEY IN PLAIN TEXT
 * TODO: Insert your private key here
 */
export const PRIV_KEY = process.env.NEXT_PUBLIC_PRIV_KEY 
    ? Uint8Array.from(process.env.NEXT_PUBLIC_PRIV_KEY.replaceAll(' ','').replaceAll('[','').replaceAll(']','').split(',').map(x=> Number(x)))
    : undefined;

// Mint DUMMY tokens on devnet @ https://spl-token-faucet.com
const DEVNET_DUMMY_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

const MAINNET_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const MAINNET_USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const MAINNET_EUR_MINT = new PublicKey('Pnsjp9dbenPeFZWqqPHDygzkCZ4Gr37G8mgdRK2KjQp');
const MAINNET_AGEUR_MINT = new PublicKey('CbNYA9n3927uXUukee2Hf4tm3xxkffJPPZvGazc2EAH1');
const MAINNET_BONK_MINT = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');

// Format
// CURRENCY: [Mint address, icon tsx file, token decimals, min decimal, symbol, multiplier]
interface currencyType {
    [key: string]:
    {
        splToken: PublicKey | undefined,
        icon: React.FC<React.SVGProps<SVGSVGElement>>,
        decimals: Digits,
        minDecimals: Digits,
        symbol: string,
        multiplier?: Multiplier;
    };
}
export const CURRENCY_LIST: currencyType = process.env.NEXT_PUBLIC_IS_DEV === 'true'
    ? {
        SOL: { splToken: undefined, icon: SOLIcon, decimals: 9, minDecimals: 1, symbol: '◎' },
        USDC_Dev: { splToken: DEVNET_DUMMY_MINT, icon: USDCIcon, decimals: 6, minDecimals: 2, symbol: 'USD' },
    }
    : {
        SOL: { splToken: undefined, icon: SOLIcon, decimals: 9, minDecimals: 1, symbol: '◎' },
        EUR: { splToken: MAINNET_EUR_MINT, icon: EURIcon, decimals: 9, minDecimals: 2, symbol: 'EUR' },
        agEUR: { splToken: MAINNET_AGEUR_MINT, icon: agEURIcon, decimals: 8, minDecimals: 2, symbol: 'EUR' },
        USDC: { splToken: MAINNET_USDC_MINT, icon: USDCIcon, decimals: 6, minDecimals: 2, symbol: 'USD' },
        USDT: { splToken: MAINNET_USDT_MINT, icon: USDTIcon, decimals: 6, minDecimals: 2, symbol: 'USD' },
        BONK: { splToken: MAINNET_BONK_MINT, icon: BONKIcon, decimals: 5, minDecimals: 2, symbol: 'BONK', multiplier: Multiplier.M }
    };
