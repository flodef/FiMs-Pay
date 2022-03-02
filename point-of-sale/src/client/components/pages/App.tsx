import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC, useMemo } from 'react';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { USDCIcon } from '../images/USDCIcon';
import { DEVNET_DUMMY_MINT, DEVNET_ENDPOINT } from '../../utils/constants';

export const App: FC<AppProps> = ({ Component, pageProps }) => {
    // If you're testing without a mobile wallet, set this to true to allow a browser wallet to be used
    const connectWallet = true;
    const wallets = useMemo(() => (connectWallet ? [new PhantomWalletAdapter()] : []), [connectWallet]);

    const recipient = useMemo(() => new PublicKey('2YVnh1hTwxS4V6ZZ8ybuY5rZsKDbhWAfD6L6JfdGsZ9y'), []);
    const link = useMemo(() => new URL('https://localhost:3001/api'), []);

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
                <title>Solana Pay</title>
            </Head>
            <ThemeProvider>
                <FullscreenProvider>
                    <ConnectionProvider endpoint={DEVNET_ENDPOINT}>
                        <WalletProvider wallets={wallets} autoConnect={connectWallet}>
                            <WalletModalProvider>
                                <ConfigProvider
                                    link={link}
                                    recipient={recipient}
                                    label="Atlas Cafe"
                                    splToken={DEVNET_DUMMY_MINT}
                                    symbol="USDC"
                                    icon={<USDCIcon />}
                                    decimals={9}
                                    minDecimals={2}
                                    connectWallet={connectWallet}
                                >
                                    <TransactionsProvider>
                                        <PaymentProvider>
                                            <Component {...pageProps} />
                                        </PaymentProvider>
                                    </TransactionsProvider>
                                </ConfigProvider>
                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>
                </FullscreenProvider>
            </ThemeProvider>
        </>
    );
};
