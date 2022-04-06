import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { AppContext, AppProps as NextAppProps, default as NextApp } from 'next/app';
import { AppInitialProps } from 'next/dist/shared/lib/utils';
import { FC, useMemo } from 'react';
import { DEVNET_ENDPOINT } from '../../utils/constants';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { USDCIcon } from '../images/USDCIcon';

interface AppProps extends NextAppProps {
    host: string;
}

const App: FC<AppProps> & { getInitialProps(appContext: AppContext): Promise<AppInitialProps> } = ({
    Component,
    host,
    pageProps,
}) => {
    const baseURL = new URL(`https://${host}`);
    const baseLink = useMemo(() => new URL(`${baseURL}/api/pay`), [baseURL]);

    // If you're testing without a mobile wallet, set this to true to allow a browser wallet to be used.
    const connectWallet = true;
    const network = WalletAdapterNetwork.Devnet;
    const wallets = useMemo(
        () => (connectWallet ? [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })] : []),
        [connectWallet, network]
    );

    return (
        <ThemeProvider>
            <FullscreenProvider>
                <ConnectionProvider endpoint={DEVNET_ENDPOINT}>
                    <WalletProvider wallets={wallets} autoConnect={connectWallet}>
                        <WalletModalProvider>
                            <ConfigProvider
                                baseURL={baseURL}
                                baseLink={baseLink}
                                symbol="USDC"
                                icon={<USDCIcon />}
                                decimals={6}
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

App.getInitialProps = async (appContext) => {
    const props = await NextApp.getInitialProps(appContext);

    const { req } = appContext.ctx;
    const host = req?.headers.host || 'localhost:3001';

    return {
        ...props,
        host,
    };
};

export default App;
