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

export enum AirdropStatus {
    DecryptingAccount = 'decryptingAccount',
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
    airdropStatus: AirdropStatus | undefined;
    confirmationProgress: number;
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
