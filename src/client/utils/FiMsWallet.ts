import { Adapter } from '@solana/wallet-adapter-base';
import { Keypair, Message, PublicKey, Signer, Transaction, VersionedTransaction } from '@solana/web3.js';
import EventEmitter from 'eventemitter3';
import { decrypt, encrypt } from './aes';
import { getBaseURL } from './createURLWithQuery';
import { CRYPTO_SECRET, USE_CUSTOM_CRYPTO } from './env';
import { FiMsWalletName } from './FiMsWalletAdapter';
import { LoadKey } from './key';

export default class FiMsWallet extends EventEmitter {
    private static _stateLabel = 'FiMsReady';
    private static _frameId = 'FiMsWalletIFrame';
    private static _timeLabel = 'Time';
    private static _counter = 0;
    private _keypair: Keypair | undefined;
    private _adapter: Adapter;
    constructor(adapter: Adapter) {
        super();
        this._adapter = adapter;
    }

    private _buildPage() {
        FiMsWallet.incrementLoadingCounter();

        const div = document.createElement('div');
        div.setAttribute('id', FiMsWallet._frameId);
        window.document.body.appendChild(div);

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', getBaseURL() + '/wallet');
        iframe.setAttribute(
            'style',
            'position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;'
        );
        iframe.setAttribute('allowtransparency', 'true');
        div.appendChild(iframe);

        this._cleanPage(div);
    }
    private _cleanPage(element: HTMLElement) {
        if (sessionStorage.getItem(FiMsWallet._stateLabel) === null) {
            window.document.body.removeChild(element);
            this._adapter.connect();
        } else {
            FiMsWallet.incrementLoadingCounter();
            setTimeout(() => this._cleanPage(element), 100);
        }
    }
    static get loadingCounter() {
        return Number(sessionStorage.getItem(FiMsWallet._stateLabel));
    }
    private static incrementLoadingCounter() {
        sessionStorage.setItem(FiMsWallet._stateLabel, (++FiMsWallet._counter).toString());
    }
    private async decryptPrivateKey(stored: string, time: number) {
        const key = await LoadKey(Number(time));
        return await decrypt(stored, CRYPTO_SECRET, key, USE_CUSTOM_CRYPTO);
    }

    get publicKey(): PublicKey | undefined {
        return this._keypair?.publicKey;
    }
    get isConnected(): boolean {
        return this._keypair !== undefined;
    }
    static get isConnecting() {
        return sessionStorage.getItem(FiMsWallet._stateLabel) !== null;
    }
    static finishConnecting() {
        sessionStorage.removeItem(FiMsWallet._stateLabel);
    }
    static set privateKey({ key, time }) {
        if (key) {
            localStorage.setItem(FiMsWalletName, key);
            localStorage.setItem(FiMsWallet._timeLabel, time.toString());
        }
    }
    static get privateKey(): { key: string | null; time: number } {
        return { key: localStorage.getItem(FiMsWalletName), time: Number(localStorage.getItem(FiMsWallet._timeLabel)) };
    }

    async connect(): Promise<void> {
        const { key, time } = FiMsWallet.privateKey;
        if (key && time) {
            FiMsWallet.finishConnecting();
            let value = '';
            try {
                value = await this.decryptPrivateKey(key, time);
            } catch {
                value = await this.decryptPrivateKey(key, time + 1000 * 3600 * 24); // Try the next day because of time zone offset
            } finally {
                const list = value.split(',').map(Number);
                const array = Uint8Array.from(list);
                this._keypair = Keypair.fromSecretKey(array);
            }
        } else if (!FiMsWallet.isConnecting) {
            this._buildPage();
            if (!key) {
                const key = await LoadKey();
                const value = Keypair.generate();
                const cipher = await encrypt(value.secretKey.toString(), CRYPTO_SECRET, key, USE_CUSTOM_CRYPTO);
                FiMsWallet.privateKey = { key: cipher, time: 0 };
            }
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
