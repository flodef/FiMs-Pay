import { PublicKey } from '@solana/web3.js';
import { createContext, ReactElement, useContext } from 'react';
import { Theme } from "../components/sections/ActionMenu";
import { Confirmations, Digits } from '../types';
import { Multiplier } from "../utils/multiplier";

export interface ConfigContextState {
    link: URL | undefined;
    recipient: PublicKey;
    label: string;
    message?: string;
    splToken: PublicKey | undefined;
    symbol: string;
    icon: ReactElement;
    decimals: Digits;
    minDecimals: Digits;
    maxDecimals: Digits;
    maxValue: number;
    multiplier?: Multiplier;
    currency: string;
    requiredConfirmations: Confirmations;
    id?: number;
    shouldConnectWallet: boolean;
    theme: string;
    setTheme: (theme: string) => void;
    reset: () => void;
}

export const ConfigContext = createContext<ConfigContextState>({} as ConfigContextState);

export function useConfig(): ConfigContextState {
    return useContext(ConfigContext);
}
