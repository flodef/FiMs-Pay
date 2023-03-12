import { PublicKey } from '@solana/web3.js';
import { createContext, ReactElement, useContext } from 'react';
import { Confirmations, Digits } from '../types';
import { Multiplier } from '../utils/multiplier';

export enum Theme {
    Classic = 'classic',
    Color = 'color',
    BlackWhite = 'blackWhite',
}

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
    currencyName: string;
    requiredConfirmations: Confirmations;
    id?: number;
    theme: string;
    changeTheme: () => void;
    reset: () => void;
}

export const ConfigContext = createContext<ConfigContextState>({} as ConfigContextState);

export function useConfig(): ConfigContextState {
    return useContext(ConfigContext);
}
