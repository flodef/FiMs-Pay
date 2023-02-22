import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Keypair, Message, PublicKey, Signer, Transaction, VersionedTransaction } from '@solana/web3.js';
import EventEmitter from 'eventemitter3';
import { FiMsWalletName } from './FiMsWalletAdapter';

export interface FiMsWalletConfig {
    network?: WalletAdapterNetwork;
}

export default class FiMsWallet extends EventEmitter {
    private _network;
    private _keypair: Keypair | undefined;
    constructor(config?: FiMsWalletConfig) {
        super();
        this._network = config?.network;
    }

    get publicKey(): PublicKey | undefined {
        return this._keypair?.publicKey;
    }
    get isConnected(): boolean {
        return this._keypair !== undefined;
    }
    // get connected(): boolean;
    // get autoApprove(): boolean;
    async connect(): Promise<void> {
        const stored = localStorage.getItem(FiMsWalletName);
        if (stored) {
            const value = stored.split(',').map(Number);
            const array = Uint8Array.from(value);
            this._keypair = Keypair.fromSecretKey(array);
        } else {
            const value = Keypair.generate();
            localStorage.setItem(FiMsWalletName, value.secretKey.toString());
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
    async signMessage(data: Uint8Array, display?: 'hex' | 'utf8'): Promise<Uint8Array> {
        const message = Message.from(data);
        const transaction = Transaction.populate(message);
        this.signTransaction(transaction);
        if (!transaction.signature) throw new Error('Message failed to sign');

        return transaction.signature;
    }
    // sign(data: Uint8Array, display?: 'hex' | 'utf8'): Promise<Uint8Array>;
    // detectWallet(timeout?: number): Promise<boolean>;
    // private _handleEvent;
    // private _handleResize;
    // private _handleMessage;
    // private _removeElement;
    // private _removeDanglingElements;
    // private _injectElement;
    // private _collapseIframe;
    // private _expandIframe;
    // private _getPreferredAdapter;
    // private _setPreferredAdapter;
    // private _clearPreferredAdapter;
    // private _webConnected;
    // private _webDisconnected;
    // private _disconnected;
    // private _handleMobileMessage;
}
