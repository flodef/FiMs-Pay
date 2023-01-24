import { PublicKey } from '@solana/web3.js';
import React, { FC, ReactElement, ReactNode, useState } from 'react';
import { ConfigContext } from '../../hooks/useConfig';
import { Confirmations, Digits } from '../../types';
import { DEFAULT_THEME } from "../../utils/env";
import { Multiplier } from "../../utils/multiplier";
import { Theme } from "../sections/ActionMenu";

export interface ConfigProviderProps {
    children: ReactNode;
    link?: URL;
    recipient: PublicKey;
    label: string;
    message?: string;
    splToken?: PublicKey;
    symbol: string;
    icon: ReactElement;
    decimals: Digits;
    minDecimals: Digits;
    maxDecimals: Digits;
    maxValue: number;
    multiplier?: Multiplier;
    currency: string;
    requiredConfirmations?: Confirmations;
    id?: number;
    shouldConnectWallet?: boolean;
    theme: string;
    reset?: () => void;
}

export const ConfigProvider: FC<ConfigProviderProps> = ({
    children,
    link,
    recipient,
    label,
    message,
    splToken,
    icon,
    symbol,
    decimals,
    minDecimals = 0,
    maxDecimals = 2,
    maxValue,
    multiplier,
    currency,
    requiredConfirmations = 1,
    id,
    shouldConnectWallet = false,
    reset,
}) => {
    const [theme, setTheme] = useState(DEFAULT_THEME);

    return (
        <ConfigContext.Provider
            value={{
                link,
                recipient,
                label,
                message,
                splToken,
                symbol,
                icon,
                decimals,
                minDecimals,
                maxDecimals,
                maxValue,
                multiplier,
                currency,
                requiredConfirmations,
                id,
                shouldConnectWallet,
                theme,
                setTheme,
                reset
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
