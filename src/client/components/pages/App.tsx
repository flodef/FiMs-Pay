import { useMediaQuery } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
import { useNavigate } from '../../hooks/useNavigate';
import { Digits } from '../../types';
import { CURRENCY_LIST, DEVNET_ENDPOINT, MAINNET_ENDPOINT } from '../../utils/constants';
import { createURLWithParams } from '../../utils/createURLWithQuery';
import { CURRENCY, DEFAULT_LANGUAGE, IS_DEV, MAX_VALUE, USE_HTTP, USE_LINK, USE_WEB_WALLET } from '../../utils/env';
import { FiMsWalletAdapter } from '../../utils/FiMsWalletAdapter';
import { LoadMerchantData } from '../../utils/merchant';
import { isMobileDevice } from '../../utils/mobile';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { ErrorProvider } from '../contexts/ErrorProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { MessageProvider } from '../contexts/MessageProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { Header } from '../sections/Header';
import { MerchantInfo } from '../sections/Merchant';
import css from './App.module.css';

const inter = Inter({
    subsets: ['latin'],
});
const className = process.env.NEXT_PUBLIC_VERCEL_ENV ? inter.className : css.mainLocal;

declare module '@mui/material/styles' {
    interface Palette {
        tertiary: Palette['primary'];
    }

    // allow configuration using `createTheme`
    interface PaletteOptions {
        tertiary?: PaletteOptions['primary'];
    }
}

// Update the Button's color prop options
declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        neutral: true;
    }
}

export const fetchDataError =
    'Have you try running with HTTPS (USE_HTTP=false) and not using local proxy (see Environment settings, .env.local)?';
export const googleAuthenticatorError =
    'Have you try running with GOOGLE_SPREADSHEET_ID / GOOGLE_API_KEY with default value (see Environment settings, .env.local)?';

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
    const [recipient, setRecipient] = useState<PublicKey>();
    const [currency, setCurrency] = useState('');
    const [maxValue, setMaxValue] = useState(0);
    const [location, setLocation] = useState('');
    const [id, setId] = useState(0);

    const setInfo = useCallback((merchant: MerchantInfo) => {
        setRecipient(merchant.address ? new PublicKey(merchant.address) : undefined);
        setLabel(merchant.company);
        setCurrency(merchant.currency || CURRENCY);
        setMaxValue(Number(merchant.maxValue) || MAX_VALUE);
        setLocation(merchant.location);
    }, []);

    const navigate = useNavigate();
    const merchantInfoList = useRef<MerchantInfo[]>();
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
        if (recipientParam) {
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

    useEffect(() => {
        if (navigator) {
            const newLang = navigator.language;
            if (!isLangInit.current) {
                isLangInit.current = true;
                fetch(`${baseURL}/api/fetchMessages?locale=${newLang}`)
                    .catch((error) => {
                        throw new Error(error + '\n' + fetchDataError);
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
    const { splToken, icon, decimals, minDecimals, multiplier } = CURRENCY_LIST[currencyName];

    const [maxDecimals, setMaxDecimals] = useState<Digits>(2);
    useEffect(() => {
        if (messages.about) {
            const basePattern = '{value}';
            const text = Number(1).toLocaleString(language, { style: 'currency', currency: 'EUR' });
            const onlyDecimal = text.replaceAll('1', '');
            const empty = onlyDecimal.replaceAll('0', '');
            const isCurrencyFirst = text[0] !== '1';
            const currencySpace = empty.length > 2 ? ' ' : '';

            setMaxDecimals((onlyDecimal.length - empty.length) as Digits);

            const displayCurrency = '<span>{currency}</span>';

            messages.currencyPattern = isCurrencyFirst
                ? displayCurrency + currencySpace + basePattern
                : basePattern + currencySpace + displayCurrency;
        }
    }, [currency, language, messages]);

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const mode = prefersDarkMode ? 'dark' : 'light';

    useEffect(() => {
        document.documentElement.classList.add(mode);
        document.documentElement.style.visibility = 'visible';
        return () => document.documentElement.classList.remove(mode);
    }, [mode]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: mode,
                    primary: {
                        main: '#34a5ff',
                    },
                    secondary: {
                        main: '#14f195',
                    },
                    tertiary: {
                        main: '#9945ff',
                    },
                    // Used by `getContrastText()` to maximize the contrast between
                    // the background and the text.
                    contrastThreshold: 3,
                    // Used by the functions below to shift a color's luminance by approximately
                    // two indexes within its tonal palette.
                    // E.g., shift from Red 500 to Red 300 or Red 700.
                    tonalOffset: 0.2,
                },
            }),
        [mode]
    );

    return messages.about ? (
        <main className={className}>
            <IntlProvider locale={language} messages={messages} defaultLocale={DEFAULT_LANGUAGE}>
                <ThemeProvider theme={theme}>
                    <ErrorProvider>
                        <MessageProvider>
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
                        </MessageProvider>
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
