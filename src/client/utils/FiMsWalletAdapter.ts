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
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB7FBMVEUAAACAgP+VQP+YR/+bRv+aRf+dRf+qVf//AP+ZRf+YRP+ZRf+ZRf+aRf+ZRv+YRf+ZRf+ZRf+XRP+ZRv+ZRf+ZRf+YQ/+VRv+ZRf+ZRf+YQ/+ZRv+YRP+XRv+ZRf+bRv+ZRv+ZRv+ZRf+ZRf+ZRf+ZRf+ZRf+bR/+YRf+ZQv+ZRf+aRf+aRf+WSP+ZRf+aRf+aRf+ZRP+WRP+VQP8yo/81pv80pf80pf80pf8zpf80pf80pf8zmf8W8JIV8ZQU8ZUU8pUU8ZUU8JUV8ZUT8pYR85crqv80pf80pf80pf8zp/8X6IsV8ZUU8ZUU8ZUU8ZUN8pQ3pP80pf80pf8zpf8U9ZMU8pYU8ZUU8pY5qv80pf81pP8c/44U8ZUT8ZUY85I0pf80pf8zov8U8JU0pf80pf8U8ZUX9JM0pP80pf8ktv8V8ZQV8pQ0pf80pP8U8ZUzpv80pv8U8ZUU8ZU0pf81pv8U8ZUU8ZU0pf8ypf8U8ZQzpf81qv8V8ZU1pv8T8pQ1pf8zpP8U8ZUA/4Aypv80pf8zpP8V85Q1pf80pf80pf8uov8U8JY1pv80pf80pP8zmf8U8pY0pv8zpf8zpf8yo/8U8ZUP8JY4p/81pf81pv8ypf8V8ZQV8JYU75UV8ZiZRf80pf8U8ZX///82DetxAAAAoHRSTlMAAhgvMzAaAwFVs/b5ul8ly9UxN+30SB3o8Sqswiz+QoCW0uDq0JE9uCPwP8kn76tRHiIMJH7D4+zVqFgFI3zC4+7kx4UsDJf73EsLlfr9pBMc0f13GtDdJwnLZQnK3xWO9x6M+Jz3LXDyB26Gsjuw0FnO59dh3vC+R9WLGKHCUb1G1gQu9Kk+UvrJC2Y/5qMKTnvasz3gESA+TTNKVUEl65HHywAAAAFiS0dEo8fa7xoAAAAHdElNRQfnAwMTLjnY4sipAAAAAW9yTlQBz6J3mgAAAaBJREFUSMfd1OVPw0AYBvDDdcBguLu7O8NtQ4bDcGcMd3cZ7s61fyls15Vq1iZ8IDzf+ub5JZf03gPgX8XM3MKSO1bWNqy2rZ29A+SPo8SJbpxdoKlIXSl9N5nJPoTuHmTf00tAH0JvHyPwFdSH0I/o+wcIBDAQgSChfRiMgEQwCEFAKhjIEAgVDMLEgnCxIEIsiBQJooA4IIsWB2JigSgQFw9EgITEJNufbUhOMZXU33gC0tIzMrOyc3LzqMP8gsIi+XeKS0rL6PXyikoMpaqaHNbUKnAyyrp6Sr+hESOjaiKGzS04La1tZL+9A6Om0zDsUuOMdPcYQS+tj/X164cDOCt1xgMN0gE2pD/QMBsoRxAYZfSxsXEAJnCOaBCYZAJMC8AUF1AjMM0CMwDMcoE5BOZZYAGARS6whMAyC6zwgFUE1ph91ToP2EBAywSbgAdsET9imwF2eMDuHgH2D2j9Q8ANFEfkZTo+ofRPddxAeUa5rucXZP/yCnAC+TV9IW5uDffu7p4YMMCD5pG1c0/PL6868uvtnZKPz99Y6j+TLy/IQ0tMa0WlAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIzLTAzLTAzVDE5OjQ2OjU2KzAwOjAwMxcq7AAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMy0wMy0wM1QxOTo0Njo1NiswMDowMEJKklAAAAAASUVORK5CYII=';
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

        if (this._readyState !== WalletReadyState.Unsupported && this._readyState !== WalletReadyState.Installed) {
            this.restorePreviousConnection().then(() => {
                this._readyState = WalletReadyState.Installed;
                this.emit('readyStateChange', this._readyState);
            });
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

    private sleep = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };
    private async restorePreviousConnection() {
        if (this.connecting) {
            const initCount = FiMsWallet.loadingCounter;
            await this.sleep(300);
            const count = FiMsWallet.loadingCounter;
            if (count === initCount) {
                FiMsWallet.finishConnecting();
            }
        }
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
