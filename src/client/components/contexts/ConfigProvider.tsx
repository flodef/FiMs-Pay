import { useLocalStorage } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC, ReactElement, ReactNode, useCallback } from 'react';
import { ConfigContext, Theme } from '../../hooks/useConfig';
import { Confirmations, Digits } from '../../types';
import { DEFAULT_THEME } from '../../utils/env';
import { Multiplier } from '../../utils/multiplier';

export interface ConfigProviderProps {
    children: ReactNode;
    link?: URL;
    recipient: PublicKey;
    label: string;
    message?: string;
    splToken?: PublicKey;
    icon: ReactElement;
    decimals: Digits;
    minDecimals: Digits;
    maxDecimals: Digits;
    maxValue: number;
    multiplier?: Multiplier;
    currencyName: string;
    requiredConfirmations?: Confirmations;
    id?: number;
    reset: () => void;
}

export const ConfigProvider: FC<ConfigProviderProps> = ({
    children,
    link,
    recipient,
    label,
    message,
    splToken,
    icon,
    decimals,
    minDecimals = 0,
    maxDecimals = 2,
    maxValue,
    multiplier,
    currencyName,
    requiredConfirmations = 1,
    id,
    reset,
}) => {
    const [theme, setTheme] = useLocalStorage('Theme', DEFAULT_THEME);
    const changeTheme = useCallback(() => {
        const themeList = Object.values(Theme);
        const currentThemeIndex = themeList.indexOf(theme as Theme);
        setTheme(themeList[(currentThemeIndex + 1) % themeList.length]);
    }, [theme, setTheme]);

    return (
        <ConfigContext.Provider
            value={{
                link,
                recipient,
                label,
                message,
                splToken,
                icon,
                decimals,
                minDecimals,
                maxDecimals,
                maxValue,
                multiplier,
                currencyName,
                requiredConfirmations,
                id,
                theme,
                changeTheme,
                reset,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
