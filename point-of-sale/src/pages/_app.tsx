import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { AppProps } from 'next/app';
import { FC, useMemo } from 'react';
import { ConfigProvider } from '../client/components/contexts/ConfigProvider';
import { FullscreenProvider } from '../client/components/contexts/FullscreenProvider';
import { PaymentProvider } from '../client/components/contexts/PaymentProvider';
import { ThemeProvider } from '../client/components/contexts/ThemeProvider';
import { TransactionsProvider } from '../client/components/contexts/TransactionsProvider';
import { USDCIcon } from '../client/components/images/USDCIcon';
import '../client/styles/index.css';
import { DEVNET_DUMMY_MINT, DEVNET_ENDPOINT } from '../client/utils/constants';

const App: FC<AppProps> = ({ Component, pageProps }) => {
    // If you're testing without a mobile wallet, set this to true to allow a browser wallet to be used
    const connectWallet = true;
    const wallets = useMemo(() => (connectWallet ? [new PhantomWalletAdapter()] : []), [connectWallet]);

    const recipient = useMemo(() => new PublicKey('2YVnh1hTwxS4V6ZZ8ybuY5rZsKDbhWAfD6L6JfdGsZ9y'), []);
    const link = useMemo(() => new URL('https://localhost:3001/api'), []);

    return (
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
    );
};

export default App;
