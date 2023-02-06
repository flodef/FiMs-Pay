import { PublicKey, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { createContext, useContext, useMemo } from 'react';
import { Confirmations } from '../types';

export enum PaymentStatus {
    New = 'new',
    Pending = 'pending',
    Creating = 'creating',
    Sent = 'sent',
    Processed = "processed",
    Confirmed = 'confirmed',
    Valid = 'valid',
    Invalid = 'invalid',
    Finalized = 'finalized',
    Error = 'error',
}

export interface PaymentContextState {
    amount: BigNumber | undefined;
    setAmount(amount: BigNumber | undefined): void;
    memo: string | undefined;
    setMemo(memo: string | undefined): void;
    balance?: BigNumber;
    publicBalance: BigNumber;
    reference: PublicKey | undefined;
    signature: TransactionSignature | undefined;
    status: PaymentStatus;
    confirmations: Confirmations;
    progress: number;
    url: URL;
    hasSufficientBalance: boolean;
    isPaidStatus: boolean;
    reset(): void;
    generate(): void;
    topup(): void;
    updateBalance(): void;
    selectWallet(): void;
    connectWallet(): void;
}

export const PaymentContext = createContext<PaymentContextState>({} as PaymentContextState);

export function usePayment(): PaymentContextState {
    return useContext(PaymentContext);
}