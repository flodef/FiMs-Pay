import { Keypair, PublicKey } from '@solana/web3.js';
import base58 from 'bs58';

if (!process.env.CLUSTER_ENDPOINT) throw new Error('missing CLUSTER_ENDPOINT environment variable');
if (!process.env.SECRET_KEY) throw new Error('missing SECRET_KEY environment variable');
if (!process.env.RECIPIENT) throw new Error('missing RECIPIENT environment variable');
if (!process.env.SPL_TOKEN) throw new Error('missing SPL_TOKEN environment variable');
if (!process.env.NFT_MINT) throw new Error('missing NFT_MINT environment variable');

export const CLUSTER_ENDPOINT = process.env.CLUSTER_ENDPOINT;
export const SECRET_KEYPAIR = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY));
export const FEE_PAYER = SECRET_KEYPAIR.publicKey;
export const RECIPIENT = new PublicKey(process.env.RECIPIENT);
export const SPL_TOKEN = new PublicKey(process.env.SPL_TOKEN);
export const NFT_MINT = new PublicKey(process.env.NFT_MINT);
export const RATE_LIMIT = Number(process.env.RATE_LIMIT) || undefined;
export const RATE_LIMIT_INTERVAL = Number(process.env.RATE_LIMIT_INTERVAL) || undefined;
