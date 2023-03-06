import {
    BaseMessageSignerWalletAdapter,
    WalletConfigError,
    WalletConnectionError,
    WalletDisconnectedError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletReadyState,
    WalletSignMessageError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js';
import FiMsWallet from './FiMsWallet';

export const FiMsWalletName = 'FiMs' as WalletName<'FiMs'>;

export class FiMsWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = FiMsWalletName;
    url = 'https://fims.fi';
    icon =
        'data:image/png;base64,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';
    supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set([
        'legacy' as TransactionVersion,
        0 as TransactionVersion,
    ]);

    private static _wallet: FiMsWallet | null;
    private _connecting: boolean;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.Loadable;

    constructor() {
        super();
        this._connecting = false;
        this._publicKey = null;
        FiMsWalletAdapter._wallet = null;

        if (this._readyState !== WalletReadyState.Unsupported) {
            this._readyState = WalletReadyState.Installed;
            this.emit('readyStateChange', this._readyState);
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get connecting() {
        return this._connecting || FiMsWallet.isConnecting;
    }

    get connected() {
        return !!FiMsWalletAdapter._wallet?.isConnected;
    }

    get readyState() {
        return this._readyState;
    }

    async autoConnect(): Promise<void> {
        await this.connect();
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Loadable && this._readyState !== WalletReadyState.Installed)
                throw new WalletNotReadyError();

            let wallet: FiMsWallet;
            try {
                wallet = FiMsWalletAdapter._wallet || new FiMsWallet(this);
            } catch (error: any) {
                throw new WalletConfigError(error?.message, error);
            }

            this._connecting = true;

            if (!wallet.isConnected) {
                try {
                    await wallet.connect();
                } catch (error: any) {
                    throw new WalletConnectionError(error?.message, error);
                }
            }

            FiMsWalletAdapter._wallet = wallet;

            if (FiMsWallet.isConnecting) return;
            if (!wallet.publicKey) throw new WalletConnectionError();

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(wallet.publicKey.toBytes());
            } catch (error: any) {
                throw new WalletPublicKeyError(error?.message, error);
            }

            wallet.on('disconnect', this._disconnected);
            wallet.on('accountChanged', this._accountChanged);

            this._publicKey = publicKey;

            this.emit('connect', publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = FiMsWalletAdapter._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);
            wallet.off('accountChanged', this._accountChanged);

            FiMsWalletAdapter._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }

        this.emit('disconnect');
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const wallet = FiMsWalletAdapter._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return ((await wallet.signTransaction(transaction)) as T) || transaction;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        try {
            const wallet = FiMsWalletAdapter._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return ((await wallet.signAllTransactions(transactions)) as T[]) || transactions;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = FiMsWalletAdapter._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return await wallet.signMessage(message, 'utf8');
            } catch (error: any) {
                throw new WalletSignMessageError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    private _disconnected = () => {
        const wallet = FiMsWalletAdapter._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);

            FiMsWalletAdapter._wallet = null;
            this._publicKey = null;

            this.emit('error', new WalletDisconnectedError());
            this.emit('disconnect');
        }
    };

    private _accountChanged = (newPublicKey?: PublicKey) => {
        if (!newPublicKey) return;

        const publicKey = this._publicKey;
        if (!publicKey) return;

        try {
            newPublicKey = new PublicKey(newPublicKey.toBytes());
        } catch (error: any) {
            this.emit('error', new WalletPublicKeyError(error?.message, error));
            return;
        }

        if (publicKey.equals(newPublicKey)) return;

        this._publicKey = newPublicKey;
        this.emit('connect', newPublicKey);
    };
}
