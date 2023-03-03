import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Keypair, Message, PublicKey, Signer, Transaction, VersionedTransaction } from '@solana/web3.js';
import EventEmitter from 'eventemitter3';
import { FiMsWalletName } from './FiMsWalletAdapter';
import CryptoJS from 'crypto-js';
import { CRYPTO_SECRET, USE_CUSTOM_CRYPTO } from './env';
import { decrypt, encrypt } from './aes';

export interface FiMsWalletConfig {
    network?: WalletAdapterNetwork;
}

export default class FiMsWallet extends EventEmitter {
    private _keypair: Keypair | undefined;
    constructor() {
        super();
    }

    get publicKey(): PublicKey | undefined {
        return this._keypair?.publicKey;
    }
    get isConnected(): boolean {
        return this._keypair !== undefined;
    }
    async connect(): Promise<void> {
        const stored = localStorage.getItem(FiMsWalletName);
        if (stored) {
            const value = USE_CUSTOM_CRYPTO
                ? await decrypt(stored, CRYPTO_SECRET)
                : CryptoJS.AES.decrypt(stored, CRYPTO_SECRET).toString(CryptoJS.enc.Utf8);
            const list = value.split(',').map(Number);
            const array = Uint8Array.from(list);
            this._keypair = Keypair.fromSecretKey(array);
        } else {
            const value = Keypair.generate();
            const cipher = USE_CUSTOM_CRYPTO
                ? await encrypt(value.secretKey.toString(), CRYPTO_SECRET)
                : CryptoJS.AES.encrypt(value.secretKey.toString(), CRYPTO_SECRET).toString();
            localStorage.setItem(FiMsWalletName, cipher);
            this._keypair = value;
        }
    }
    async disconnect(): Promise<void> {
        this._keypair = undefined;
    }
    async signTransaction(
        transaction: Transaction | VersionedTransaction
    ): Promise<Transaction | VersionedTransaction> {
        const publicKey = this._keypair?.publicKey;
        const secretKey = this._keypair?.secretKey;
        const signer = { publicKey, secretKey } as Signer;
        transaction.sign(signer as Signer & Signer[]);

        return transaction;
    }
    async signAllTransactions(
        transactions: (Transaction | VersionedTransaction)[]
    ): Promise<(Transaction | VersionedTransaction)[]> {
        transactions.forEach(this.signTransaction);

        return transactions;
    }
    // TODO : translate
    async signMessage(data: Uint8Array, display?: 'hex' | 'utf8'): Promise<Uint8Array> {
        const message = Message.from(data);
        const transaction = Transaction.populate(message);
        this.signTransaction(transaction);
        if (!transaction.signature) throw new Error('Message failed to sign');

        return transaction.signature;
    }
}
