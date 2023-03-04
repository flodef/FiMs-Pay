import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Keypair, Message, PublicKey, Signer, Transaction, VersionedTransaction } from '@solana/web3.js';
import EventEmitter from 'eventemitter3';
import { FiMsWalletName } from './FiMsWalletAdapter';
import { CRYPTO_SECRET, USE_CUSTOM_CRYPTO } from './env';
import { decrypt, encrypt } from './aes';
import { LoadKey } from './key';

export interface FiMsWalletConfig {
    network?: WalletAdapterNetwork;
}

export default class FiMsWallet extends EventEmitter {
    private _keypair: Keypair | undefined;
    constructor() {
        super();
    }
    // <div class="solflare-wallet-adapter-iframe">
    //       <iframe src="https://connect.solflare.com/?cluster=devnet&amp;origin=http%3A%2F%2Flocalhost%3A3000&amp;version=1" style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;" allowtransparency="true">
    //       <html>
    //          <head>
    //              <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&amp;display=swap" rel="stylesheet"><title>Solflare</title><style>* {
    //     box-sizing: border-box;
    //     font-family: "Poppins", sans-serif;
    // }

    // body {
    //     padding: 0;
    //     margin: 0;
    //     color: #FFFFFF;
    //     backdrop-filter: blur(20px);
    // }

    // .container {
    //     width: 100vw;
    //     height: 100vh;
    //     display: flex;
    //     align-items: center;
    //     justify-content: center;
    //     background: rgba(0, 0, 0, 0.5);
    // }

    // .popup {
    //     position: relative;
    //     width: calc(100% - 80px);
    //     max-width: 490px;
    //     padding: 36px;
    //     border-radius: 10px;
    //     display: flex;
    //     align-items: center;
    //     flex-direction: column;
    //     background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%), #17171D;
    // }

    // .header {
    //     display: flex;
    //     align-items: center;
    //     justify-content: center;
    //     margin-bottom:  24px;
    // }

    // .divider {
    //     width: 100%;
    //     height: 0;
    //     border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    // }

    // .title {
    //     font-weight: 600;
    //     font-size: 20px;
    //     line-height: 28px;
    //     text-align: center;
    //     margin-bottom: 16px;
    // }

    // .btn-wrapper {
    //     display: flex;
    //     align-items: center;
    //     justify-content: center;
    //     flex-wrap: wrap;
    // }

    // .btn {
    //     display: block;
    //     border: 0;
    //     padding: 8px;
    //     margin: 12px 12px;
    //     border-radius: 8px;
    //     font-weight: 600;
    //     font-style: normal;
    //     font-size: 14px;
    //     line-height: 21px;
    //     text-align: center;
    //     text-transform: uppercase;
    //     text-decoration: none;
    //     cursor: pointer;
    //     background: transparent;
    //     width: 130px;
    // }

    // .btn-contained {
    //     background: #FC7227;
    //     color: #000000;
    // }

    // .btn-outlined {
    //     box-shadow: inset #FC7227 0 0 0 2px;
    //     color: #FFFFFF;
    // }

    // .btn-text {
    //     color: #FFFFFF;
    // }

    // .connect-mobile {
    //     display: none;
    // }
    // </style></head><body><div id="root"><div class="container"><div class="popup" style="display: block;"><div class="header"></div><div class="title">How do you want to connect to Solflare?</div><div class="divider"></div><div class="btn-wrapper"><button class="btn btn-contained connect-extension">Extension</button> <button class="btn btn-contained connect-mobile">Mobile</button> <button class="btn btn-outlined connect-web">Web wallet</button></div><div class="divider"></div><div class="btn-wrapper"><button class="btn btn-text close-popup">Close</button></div></div></div></div><script src="/main.65d411ad.js"></script></body></html></iframe>
    //     </div>
    private buildPage() {
        localStorage.removeItem('FiMsReady');

        // <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'https://www.w3schools.com/w3css/4/w3.css');
        window.document.head.appendChild(link);

        // <div id="id01" class="w3-modal" style="display:block">
        const div = document.createElement('div');
        div.setAttribute('id', 'id01');
        // div.setAttribute('class', 'w3-modal');
        // div.setAttribute('style', 'display:block');
        window.document.body.appendChild(div);

        // <iframe src="https://connect.solflare.com/?cluster=devnet&amp;origin=http%3A%2F%2Flocalhost%3A3000&amp;version=1" style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;" allowtransparency="true">
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', 'https://pay.fims.fi');
        iframe.setAttribute(
            'style',
            'position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 0; color-scheme: auto;'
        );
        iframe.setAttribute('allowtransparency', 'true');
        div.appendChild(iframe);

        // <div class="w3-center"><br>
        // const diva = document.createElement('div');
        // diva.setAttribute('class', 'w3-center');
        // div.appendChild(diva);

        // <span onclick="document.getElementById('id01').style.display='none'" class="w3-button w3-xlarge w3-hover-red w3-display-topright" title="Close Modal">&times;</span>
        const span = document.createElement('span');
        span.setAttribute(
            'onclick',
            `document.getElementById('id01').style.display='none';sessionStorage.setItem('FiMsReady', 'true');`
        );
        span.setAttribute('class', 'w3-button w3-xlarge w3-hover-white w3-display-topright');
        const x = document.createTextNode('×');
        span.appendChild(x);
        div.appendChild(span);

        this.cleanPage([link], [div]);
    }
    private cleanPage(headElements: HTMLElement[], bodyElements: HTMLElement[]) {
        if (sessionStorage.getItem('FiMsReady')) {
            for (let i = headElements.length - 1; i >= 0; --i) {
                window.document.head.removeChild(headElements[i]);
            }
            for (let i = bodyElements.length - 1; i >= 0; --i) {
                window.document.body.removeChild(bodyElements[i]);
            }
            sessionStorage.removeItem('FiMsReady');
        } else {
            setTimeout(() => this.cleanPage(headElements, bodyElements), 1000);
        }
    }

    get publicKey(): PublicKey | undefined {
        return this._keypair?.publicKey;
    }
    get isConnected(): boolean {
        return this._keypair !== undefined;
    }
    async connect(): Promise<void> {
        const timeLabel = 'Time';
        const stored = localStorage.getItem(FiMsWalletName);
        if (stored) {
            const time = localStorage.getItem(timeLabel);
            const key = await LoadKey(Number(time));
            const value = await decrypt(stored, CRYPTO_SECRET, key, USE_CUSTOM_CRYPTO);
            const list = value.split(',').map(Number);
            const array = Uint8Array.from(list);
            this._keypair = Keypair.fromSecretKey(array);
        } else {
            // this.buildPage();
            const key = await LoadKey();
            const value = Keypair.generate();
            const cipher = await encrypt(value.secretKey.toString(), CRYPTO_SECRET, key, USE_CUSTOM_CRYPTO);
            localStorage.setItem(FiMsWalletName, cipher);
            localStorage.setItem(timeLabel, Date.now().toString());
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
