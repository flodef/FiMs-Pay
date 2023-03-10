import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    LAMPORTS_PER_SOL,
    ParsedTransactionWithMeta,
    PublicKey,
    RpcResponseAndContext,
    SignatureStatus,
    TransactionSignature,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { PaymentStatus } from '../../hooks/usePayment';
import { Transaction, TransactionsContext } from '../../hooks/useTransactions';
import { Confirmations } from '../../types';
import { arraysEqual } from '../../utils/arraysEqual';
import { MAX_CONFIRMATIONS } from '../../utils/constants';
import { IS_CUSTOMER_POS } from '../../utils/env';

export interface TransactionsProviderProps {
    children: ReactNode;
    pollInterval?: number;
}

export const TransactionsProvider: FC<TransactionsProviderProps> = ({ children, pollInterval }) => {
    pollInterval ||= 10000;

    const { processError } = useError();

    const { connection } = useConnection();
    const { recipient, splToken } = useConfig();
    const { publicKey } = useWallet();
    const [associatedToken, setAssociatedToken] = useState<PublicKey>();
    const [signatures, setSignatures] = useState<TransactionSignature[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [owner, setOwner] = useState<PublicKey>();

    // Get the ATA for the recipient and token
    useEffect(() => {
        const owner = IS_CUSTOMER_POS ? publicKey : recipient;
        if (!splToken || !owner) return;

        setOwner(IS_CUSTOMER_POS ? owner : recipient);

        let changed = false;

        (async () => {
            const associatedToken = await getAssociatedTokenAddress(splToken, owner);
            if (changed) return;

            setAssociatedToken(associatedToken);
        })();

        return () => {
            changed = true;
            setAssociatedToken(undefined);
        };
    }, [splToken, recipient, publicKey]);

    // Poll for signatures referencing the associated token account
    useEffect(() => {
        if (!owner) return;
        let changed = false;

        const run = async () => {
            try {
                setLoading(true);

                const confirmedSignatureInfos = await connection.getSignaturesForAddress(
                    associatedToken || owner,
                    { limit: 1000 },
                    PaymentStatus.Confirmed
                );
                if (changed) return;

                setSignatures((prevSignatures) => {
                    const nextSignatures = confirmedSignatureInfos.map(({ signature }) => signature);
                    return arraysEqual(prevSignatures, nextSignatures) ? prevSignatures : nextSignatures;
                });
            } catch (error: any) {
                processError(error);
            } finally {
                setLoading(false);
            }
        };

        const interval = setInterval(run, 5000);
        void run();

        return () => {
            changed = true;
            clearInterval(interval);
            setSignatures([]);
        };
    }, [connection, associatedToken, owner, processError]);

    // When the signatures change, poll and update the transactions
    useEffect(() => {
        if (!signatures.length || !owner) return;
        let changed = false;

        const run = async () => {
            let parsedTransactions: (ParsedTransactionWithMeta | null)[],
                signatureStatuses: RpcResponseAndContext<(SignatureStatus | null)[]>;
            try {
                setLoading(true);

                [parsedTransactions, signatureStatuses] = await Promise.all([
                    connection.getParsedTransactions(signatures, { maxSupportedTransactionVersion: 0 }),
                    connection.getSignatureStatuses(signatures, { searchTransactionHistory: true }),
                ]);
            } catch (error) {
                if (changed) return;
                processError(error as object);
                return;
            } finally {
                setLoading(false);
            }
            if (changed) return;

            setTransactions(
                signatures
                    .map((signature, signatureIndex): Transaction | undefined => {
                        const parsedTransaction = parsedTransactions[signatureIndex];
                        const signatureStatus = signatureStatuses.value[signatureIndex];
                        if (!parsedTransaction?.meta || !signatureStatus) return;

                        const timestamp = parsedTransaction.blockTime;
                        const error = parsedTransaction.meta.err;
                        const status = signatureStatus.confirmationStatus;
                        if (!timestamp || !status) return;

                        if (parsedTransaction.transaction.message.instructions.length !== 1) return;
                        const instruction = parsedTransaction.transaction.message.instructions[0];
                        if (!('program' in instruction)) return;
                        const program = instruction.program;
                        const type = instruction.parsed?.type;
                        const info = instruction.parsed.info;
                        const accountKeys = parsedTransaction.transaction.message.accountKeys;

                        let preAmount: BigNumber, postAmount: BigNumber;
                        if (!associatedToken) {
                            // Include only SystemProgram.transfer instructions
                            if (!(program === 'system' && type === 'transfer')) return;

                            if (!IS_CUSTOMER_POS) {
                                // Include only transfers to the recipient
                                if (info?.destination !== owner.toBase58()) return;

                                // Exclude self-transfers
                                if (info.source === owner.toBase58()) return;
                            }

                            const accountIndex = accountKeys.findIndex(({ pubkey }) => pubkey.equals(owner));
                            if (accountIndex === -1) return;

                            const preBalance = parsedTransaction.meta.preBalances[accountIndex];
                            const postBalance = parsedTransaction.meta.postBalances[accountIndex];

                            preAmount = new BigNumber(preBalance).div(LAMPORTS_PER_SOL);
                            postAmount = new BigNumber(postBalance).div(LAMPORTS_PER_SOL);
                        } else {
                            // Include only TokenProgram.transfer / TokenProgram.transferChecked instructions
                            if (!(program === 'spl-token' && (type === 'transfer' || type === 'transferChecked')))
                                return;

                            if (!IS_CUSTOMER_POS) {
                                // Include only transfers to the recipient ATA
                                if (info?.destination !== associatedToken.toBase58()) return;

                                // Exclude self-transfers
                                if (info.source === associatedToken.toBase58()) return;
                            }

                            const accountIndex = accountKeys.findIndex(({ pubkey }) => pubkey.equals(associatedToken));
                            if (accountIndex === -1) return;

                            const preBalance = parsedTransaction.meta.preTokenBalances?.find(
                                (x) => x.accountIndex === accountIndex
                            );
                            if (!preBalance?.uiTokenAmount.uiAmountString) return;

                            const postBalance = parsedTransaction.meta.postTokenBalances?.find(
                                (x) => x.accountIndex === accountIndex
                            );
                            if (!postBalance?.uiTokenAmount.uiAmountString) return;

                            preAmount = new BigNumber(preBalance.uiTokenAmount.uiAmountString);
                            postAmount = new BigNumber(postBalance.uiTokenAmount.uiAmountString);
                        }

                        // Exclude negative amounts
                        if (!IS_CUSTOMER_POS && postAmount.lt(preAmount)) return;

                        const source =
                            parsedTransaction.meta.preTokenBalances?.at(0)?.owner || accountKeys[0].pubkey.toString();
                        const destination =
                            parsedTransaction.meta.preTokenBalances?.at(1)?.owner || accountKeys[1].pubkey.toString();
                        const mint = info.mint;
                        const amount = postAmount.minus(preAmount).toString();
                        const confirmations =
                            status === 'finalized'
                                ? MAX_CONFIRMATIONS
                                : ((signatureStatus.confirmations || 0) as Confirmations);

                        return {
                            signature,
                            source,
                            destination,
                            mint,
                            amount,
                            timestamp,
                            error,
                            status,
                            confirmations,
                        };
                    })
                    .filter((transaction): transaction is Transaction => !!transaction)
            );
        };

        const interval = setInterval(run, pollInterval);
        void run();

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [signatures, connection, associatedToken, owner, pollInterval, processError]);

    return <TransactionsContext.Provider value={{ transactions, loading }}>{children}</TransactionsContext.Provider>;
};
