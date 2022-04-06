import { encodeURL, fetchTransaction, parseURL, TransactionRequestURL } from '@solana/pay';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';

export interface PaymentProviderProps {
    children: ReactNode;
}

export const PaymentProvider: FC<PaymentProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const { baseLink, requiredConfirmations, connectWallet } = useConfig();
    const { publicKey, sendTransaction } = useWallet();

    const [amount, setAmount] = useState<BigNumber>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [status, setStatus] = useState(PaymentStatus.New);
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const router = useRouter();
    const progress = useMemo(() => confirmations / requiredConfirmations, [confirmations, requiredConfirmations]);

    const url = useMemo(() => {
        if (!amount) return;

        const link = new URL(`${String(baseLink).replace(/\/$/, '')}/${amount.toFixed(amount.decimalPlaces())}`);
        return encodeURL({ link });
    }, [baseLink, amount]);

    const reset = useCallback(() => {
        setAmount(undefined);
        setSignature(undefined);
        setStatus(PaymentStatus.New);
        setConfirmations(0);
        router.replace('/new');
    }, [router]);

    const generate = useCallback(() => {
        if (status === PaymentStatus.New) {
            //  FIXME: generate a unique ID / encrypted data from server
            setStatus(PaymentStatus.Pending);
            router.push('/pending');
        }
    }, [status, router]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (status === PaymentStatus.Pending && url && connectWallet && publicKey) {
            let changed = false;

            const run = async () => {
                try {
                    const request = parseURL(url) as TransactionRequestURL;
                    const transaction = await fetchTransaction(connection, publicKey, request.link);

                    if (!changed) {
                        // FIXME: probably only works with wallets that can partial sign
                        await sendTransaction(transaction, connection);
                    }
                } catch (error) {
                    // If the transaction is declined or fails, try again
                    console.error(error);
                    timeout = setTimeout(run, 5000);
                }
            };
            let timeout = setTimeout(run, 0);

            return () => {
                changed = true;
                clearTimeout(timeout);
            };
        }
    }, [status, connectWallet, publicKey, url, connection, sendTransaction]);

    // When the status is pending, listen for the transaction signature
    useEffect(() => {
        if (!(status === PaymentStatus.Pending && !signature)) return;

        // FIXME: setup websocket listener for signature and discount
        // FIXME: call setSignature, setStatus(waiting), and router.push(/waiting)

        return () => {
            // FIXME: teardown listener
        };
    }, [status, signature, router]);

    // When the status is valid, poll for confirmations until the transaction is finalized
    useEffect(() => {
        if (!((status === PaymentStatus.Waiting || status === PaymentStatus.Confirmed) && signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            try {
                const response = await connection.getSignatureStatus(signature);
                const signatureStatus = response.value;
                if (!signatureStatus) return;
                if (signatureStatus.err) throw signatureStatus.err;

                if (!changed) {
                    const confirmations = (signatureStatus.confirmations || 0) as Confirmations;
                    setConfirmations(confirmations);

                    if (confirmations) {
                        if (status === PaymentStatus.Waiting) {
                            setStatus(PaymentStatus.Confirmed);
                            router.replace('/confirmed');
                        }

                        if (confirmations >= requiredConfirmations || signatureStatus.confirmationStatus === 'finalized') {
                            clearInterval(interval);
                            setStatus(PaymentStatus.Finalized);
                        }
                    }
                }
            } catch (error: any) {
                console.log(error);
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, signature, connection, router, requiredConfirmations]);

    return (
        <PaymentContext.Provider
            value={{
                amount,
                setAmount,
                signature,
                status,
                confirmations,
                progress,
                url,
                reset,
                generate,
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
