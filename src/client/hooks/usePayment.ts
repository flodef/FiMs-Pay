import { PublicKey, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { createContext, useContext, useMemo } from 'react';
import { Confirmations } from '../types';

export enum PaymentStatus {
    New = 'new',
    Pending = 'pending',
    Creating = 'creating',
    Sent = 'sent',
    Processing = 'processing',
    Confirmed = 'confirmed',
    Valid = 'valid',
    Finalized = 'finalized',
    Error = 'error',
}
// ('retrieving recipient info');
// ('transferring SOL');
// ('confirming SOL transfer');
// ('retrieving token account');
// ('transferring token');
// ('confirming token transfer');
export enum AirdropStatus {
    RetrievingRecipient = 'retrievingRecipient',
    TransferingSOL = 'transferingSOL',
    ConfirmingSOLTransfer = 'confirmingSOLTransfer',
    RetrievingTokenAccount = 'retrievingTokenAccount',
    TransferingToken = 'transferingToken',
    ConfirmingTokenTransfer = 'confirmingTokenTransfer',
}

export interface PaymentContextState {
    amount: BigNumber | undefined;
    setAmount(amount: BigNumber | undefined): void;
    memo: string | undefined;
    setMemo(memo: string | undefined): void;
    balance?: BigNumber;
    reference: PublicKey | undefined;
    signature: TransactionSignature | undefined;
    paymentStatus: PaymentStatus;
    confirmations: Confirmations;
    progress: number;
    url: URL;
    hasSufficientBalance: boolean;
    isPaidStatus: boolean;
    reset(): void;
    generate(): void;
    requestAirdrop(): void;
    updateBalance(): void;
    selectWallet(): void;
    connectWallet(): void;
}

export const PaymentContext = createContext<PaymentContextState>({} as PaymentContextState);

export function usePayment(): PaymentContextState {
    return useContext(PaymentContext);
}
