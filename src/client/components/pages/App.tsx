import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { GlowWalletAdapter, PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';
import { AppContext, AppProps as NextAppProps, default as NextApp } from 'next/app';
import { AppInitialProps } from 'next/dist/shared/lib/utils';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { Digits } from '../../types';
import { CURRENCY_LIST, DEVNET_ENDPOINT, MAINNET_ENDPOINT } from '../../utils/constants';
import { createURLWithParams } from '../../utils/createURLWithQuery';
import {
    APP_TITLE,
    CURRENCY,
    DEFAULT_LANGUAGE,
    DEFAULT_WALLET,
    IS_CUSTOMER_POS,
    IS_DEV,
    MAX_VALUE,
    POS_USE_WALLET,
    SHOW_SYMBOL,
    USE_HTTP,
    USE_LINK,
    USE_WEB_WALLET,
} from '../../utils/env';
import { FiMsWalletAdapter } from '../../utils/FiMsWalletAdapter';
import { LoadMerchantData } from '../../utils/merchant';
import { isMobileDevice } from '../../utils/mobile';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { ErrorProvider } from '../contexts/ErrorProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { Header } from '../sections/Header';
import { MerchantInfo } from '../sections/Merchant';
import css from './App.module.css';

const inter = Inter({
    subsets: ['latin'],
});
const className = process.env.NEXT_PUBLIC_VERCEL_ENV ? inter.className : css.mainLocal;

interface AppProps extends NextAppProps {
    host: string;
    query: {
        id?: number;
        recipient?: string;
        label?: string;
        message?: string;
        currency?: string;
        maxValue?: number;
        location?: string;
    };
}

const App: FC<AppProps> & { getInitialProps(appContext: AppContext): Promise<AppInitialProps> } = ({
    Component,
    host,
    query,
    pageProps,
}) => {
    const baseURL = (USE_HTTP ? 'http' : 'https') + `://${host}`;

    // If you're testing without a mobile wallet, set USE_WEB_WALLET environment setting to true to allow a browser wallet to be used.
    const shouldConnectWallet = !isMobileDevice() || USE_WEB_WALLET;
    const network = IS_DEV ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;

    const wallets = useMemo(
        () =>
            shouldConnectWallet
                ? [
                      new FiMsWalletAdapter(),
                      new SolflareWalletAdapter({ network }),
                      new GlowWalletAdapter({ network }),
                      new PhantomWalletAdapter(),
                  ]
                : [],
        [shouldConnectWallet, network]
    );

    // Set USE_LINK environment setting to use transaction requests instead of transfer requests.
    const link = useMemo(() => (USE_LINK ? new URL(`${baseURL}/api/`) : undefined), [baseURL]);

    const [label, setLabel] = useState('');
    const [recipient, setRecipient] = useState(new PublicKey(0));
    const [currency, setCurrency] = useState('');
    const [maxValue, setMaxValue] = useState(0);
    const [location, setLocation] = useState('');
    const [id, setId] = useState(0);

    const setInfo = useCallback((merchant: MerchantInfo) => {
        setRecipient(new PublicKey(merchant.address || 0));
        setLabel(merchant.company || APP_TITLE);
        setCurrency(merchant.currency || CURRENCY);
        setMaxValue(Number(merchant.maxValue) || MAX_VALUE);
        setLocation(merchant.location);
    }, []);

    const navigate = useNavigateWithQuery();
    const merchantInfoList = useRef<MerchantInfo[]>();
    const [merchants, setMerchants] = useState<{ [key: string]: MerchantInfo[] }>();
    const {
        id: idParam,
        message,
        recipient: recipientParam,
        label: labelParam,
        currency: currencyParam,
        maxValue: maxValueParam,
        location: locationParam,
    } = query;
    useEffect(() => {
        if (recipientParam || !(IS_CUSTOMER_POS || !POS_USE_WALLET)) {
            setInfo({
                address: recipientParam,
                company: labelParam,
                currency: currencyParam,
                maxValue: maxValueParam,
                location: locationParam,
            } as MerchantInfo);
        } else {
            const a = (data: MerchantInfo[]) => {
                merchantInfoList.current = data;
                if (idParam) {
                    const merchant = data.find((merchant) => merchant.index === Number(idParam));
                    if (merchant) {
                        setInfo(merchant);
                    }
                }
            };

            if (merchantInfoList.current && merchantInfoList.current.length > 0) {
                a(merchantInfoList.current);
            } else if (!merchantInfoList.current) {
                merchantInfoList.current = [];

                LoadMerchantData().then(a);
            }
        }
    }, [
        baseURL,
        id,
        idParam,
        query,
        labelParam,
        currencyParam,
        maxValueParam,
        recipientParam,
        locationParam,
        setInfo,
        navigate,
    ]);

    const router = useRouter();
    const reset = useCallback(() => {
        const urlParams = new URLSearchParams();
        if (idParam) {
            urlParams.append('id', idParam.toString());
        }
        const url = createURLWithParams('merchants', urlParams);
        router.push(url);
    }, [router, idParam]);

    const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
    const [messages, setMessages] = useState<Record<string, string>>({});
    const isLangInit = useRef(false);

    // TODO : translate error
    useEffect(() => {
        if (navigator) {
            const newLang = navigator.language;
            if (!isLangInit.current) {
                isLangInit.current = true;
                fetch(`${baseURL}/api/fetchMessages?locale=${newLang}`)
                    .catch((error) => {
                        throw new Error(
                            error +
                                '\nHave you try running with HTTPS (USE_HTTP=false) and not using local proxy (see Environment settings, .env.local)?'
                        );
                    })
                    .then((response) => response.json())
                    .then((data) => {
                        setMessages(data);
                        setLanguage(newLang);
                    });
            }
        }
    }, [baseURL]);

    const endpoint = IS_DEV ? DEVNET_ENDPOINT : MAINNET_ENDPOINT;
    const keys = Object.keys(CURRENCY_LIST);
    const currencyName = keys.includes(currency) ? currency : keys.includes(CURRENCY) ? CURRENCY : 'SOL';
    const { splToken: splToken, icon, decimals, minDecimals, symbol, multiplier } = CURRENCY_LIST[currencyName];

    const [maxDecimals, setMaxDecimals] = useState<Digits>(2);
    useEffect(() => {
        if (messages.about) {
            const basePattern = '{value}';
            const text = Number(1).toLocaleString(language, { style: 'currency', currency: 'EUR' });
            const onlyDecimal = text.replaceAll('1', '');
            const empty = onlyDecimal.replaceAll('0', '');
            const isCurrencyFirst = text[0] !== '1';
            const currencySpace = empty.length > 2 ? ' ' : '';
            const decimal = !isCurrencyFirst ? empty[0] : empty[empty.length - 1];
            setMaxDecimals((onlyDecimal.length - empty.length) as Digits);

            let displayCurrency;
            if (SHOW_SYMBOL) {
                try {
                    displayCurrency = Number(0)
                        .toLocaleString(language, { style: 'currency', currency: symbol })
                        .replaceAll('0', '')
                        .replaceAll(decimal, '')
                        .trim();
                } catch {
                    displayCurrency = symbol;
                }
            } else {
                displayCurrency = currency;
            }
            displayCurrency = '<span>' + displayCurrency + '</span>';

            messages.currencyPattern = isCurrencyFirst
                ? displayCurrency + currencySpace + basePattern
                : basePattern + currencySpace + displayCurrency;
        }
    }, [currency, symbol, language, messages]);

    return messages.about ? (
        <main className={className}>
            <IntlProvider locale={language} messages={messages} defaultLocale={DEFAULT_LANGUAGE}>
                <ThemeProvider>
                    <ErrorProvider>
                        <FullscreenProvider>
                            <ConnectionProvider endpoint={endpoint}>
                                <WalletProvider wallets={wallets} autoConnect={shouldConnectWallet}>
                                    <WalletModalProvider>
                                        <ConfigProvider
                                            link={link}
                                            recipient={recipient}
                                            label={label}
                                            message={message}
                                            splToken={splToken}
                                            symbol={symbol}
                                            icon={React.createElement(icon)}
                                            decimals={decimals}
                                            minDecimals={minDecimals}
                                            maxDecimals={maxDecimals}
                                            maxValue={maxValue}
                                            multiplier={multiplier}
                                            currencyName={currencyName}
                                            id={id}
                                            reset={reset}
                                        >
                                            <TransactionsProvider>
                                                <PaymentProvider>
                                                    <Header label={label} />
                                                    <Component {...pageProps} />
                                                </PaymentProvider>
                                            </TransactionsProvider>
                                        </ConfigProvider>
                                    </WalletModalProvider>
                                </WalletProvider>
                            </ConnectionProvider>
                        </FullscreenProvider>
                    </ErrorProvider>
                </ThemeProvider>
            </IntlProvider>
        </main>
    ) : null;
};

App.getInitialProps = async (appContext) => {
    const props = await NextApp.getInitialProps(appContext);

    const { query, req } = appContext.ctx;
    const id = query.id || undefined;
    const recipient = query.recipient || undefined;
    const label = query.label || undefined;
    const message = query.message || undefined;
    const currency = query.currency || undefined;
    const maxValue = query.maxValue || undefined;
    const location = query.location || undefined;
    const host = req?.headers.host || 'localhost:' + (USE_HTTP ? '3000' : '3001');

    return {
        ...props,
        query: { id, recipient, label, message, currency, maxValue, location },
        host,
    };
};

export default App;
