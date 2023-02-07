import {
    encodeURL,
    fetchTransaction,
    findReference,
    FindReferenceError,
    parseURL,
    TransferRequestURL,
    ValidateTransferError,
} from '@solana/pay';
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ConfirmedSignatureInfo, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';
import { IS_DEV, IS_CUSTOMER_POS, DEFAULT_WALLET, AUTO_CONNECT, POS_USE_WALLET, USER_PASSWORD, FAUCET } from '../../utils/env';
import { exitFullscreen, isFullscreen } from "../../utils/fullscreen";
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import { WalletName } from "@solana/wallet-adapter-base";
import { isMobileDevice } from "../../utils/mobile";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ZERO } from "../../utils/constants";
import { Elusiv } from "elusiv-sdk";
import { validateTransfer } from '../../../server/core/validateTransfer';


export interface PaymentProviderProps {
    children: ReactNode;
}

export const PaymentProvider: FC<PaymentProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const { link, recipient: recipientParam, splToken, decimals, label, message, requiredConfirmations, shouldConnectWallet } = useConfig();
    const { publicKey, sendTransaction, connect, disconnect, select, signMessage, signTransaction, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const { processError } = useError();

    const [balance, setBalance] = useState<BigNumber>();
    const [publicBalance, setPublicBalance] = useState(ZERO);
    const [amount, setAmount] = useState<BigNumber>();
    const [memo, setMemo] = useState<string>();
    const [reference, setReference] = useState<PublicKey>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [status, setStatus] = useState(PaymentStatus.New);
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const navigate = useNavigateWithQuery();
    const progress = useMemo(() => confirmations / requiredConfirmations, [confirmations, requiredConfirmations]);
    const recipient = useMemo(() => IS_CUSTOMER_POS || !POS_USE_WALLET || !publicKey ? recipientParam : publicKey, [recipientParam, publicKey]);

    const elusiv = useRef<Elusiv>();

    const changeStatus = useCallback((status: PaymentStatus) => {
        console.log(status);
        setStatus(status);
    }, []);

    const sendError = useCallback(
        (error?: object) => {
            if (error) {
                changeStatus(PaymentStatus.Error);
                setReference(undefined);
            }
            processError(error);
        },
        [changeStatus, processError]
    );

    const url = useMemo(() => {
        if (link) {
            const url = new URL(String(link));

            url.searchParams.append('recipient', recipient.toBase58());

            if (amount) {
                url.searchParams.append('amount', amount.toFixed(amount.decimalPlaces() ?? 0));
            }

            if (splToken) {
                url.searchParams.append('spl-token', splToken.toBase58());
            }

            if (reference) {
                url.searchParams.append('reference', reference.toBase58());
            }

            if (memo) {
                url.searchParams.append('memo', memo);
            }

            if (label) {
                url.searchParams.append('label', label);
            }

            if (message) {
                url.searchParams.append('message', message);
            }

            return encodeURL({ link: url });
        } else {
            return encodeURL({
                recipient,
                amount,
                splToken,
                reference,
                label,
                message,
                memo,
            });
        }
    }, [link, recipient, amount, splToken, reference, label, message, memo]);

    const hasSufficientBalance = useMemo(() =>
        !IS_CUSTOMER_POS
        || balance === undefined
        || (balance.gt(ZERO)
            && amount !== undefined
            && balance.gte(amount)),
        [balance, amount]);
    const isPaidStatus = useMemo(() =>
        status === PaymentStatus.Finalized
        || status === PaymentStatus.Valid
        || status === PaymentStatus.Invalid
        || status === PaymentStatus.Confirmed
        || status === PaymentStatus.Error,
        [status]);

    const reset = useCallback(() => {
        changeStatus(PaymentStatus.New);
        setConfirmations(0);
        setAmount(undefined);
        setMemo(undefined);
        setReference(undefined);
        setSignature(undefined);
        sendError(undefined);
        setTimeout(
            () => navigate(PaymentStatus.New, true),
            isPaidStatus ? 1500 : 0
        );
    }, [navigate, changeStatus, sendError, isPaidStatus]);

    const generate = useCallback(() => {
        if ((status === PaymentStatus.New || status === PaymentStatus.Error) && !reference) {
            setReference(Keypair.generate().publicKey);
            changeStatus(PaymentStatus.Pending);
            navigate(PaymentStatus.Pending);
            if (IS_CUSTOMER_POS && isFullscreen()) {
                exitFullscreen();
            }
        }
    }, [status, reference, navigate, changeStatus]);

    const selectWallet = useCallback(async () => {
        if (publicKey) return;
        if (DEFAULT_WALLET) {
            const defaultWallet = DEFAULT_WALLET as WalletName;
            const a = AUTO_CONNECT
                ? () => {
                    try {
                        connect().catch(() =>
                            setTimeout(() => select(defaultWallet), 100)
                        );
                    } catch { }
                }
                : () => { };
            if (!wallet) {
                const walletName = isMobileDevice() ? SolanaMobileWalletAdapterWalletName : defaultWallet;

                setTimeout(() => {
                    select(walletName);
                    a();
                }, 100);
            } else {
                a();
            }
        } else {
            setVisible(true);
        }
    }, [connect, select, wallet, setVisible, publicKey]);

    const connectWallet = useCallback(async () => {
        if (!publicKey) {
            selectWallet();
        } else {
            disconnect().catch(() => { });
        }
    }, [
        disconnect, publicKey, selectWallet
    ]);

    // Helper function to generate params used by all samples, namely a web3js connection, the keypair of the user, and the elusiv instance 
    // export async function getParams(): Promise<{ elusiv: Elusiv, keyPair: Keypair, conn: Connection; }> {
    const getElusiv = useCallback(async () => {
        if (!(signMessage && publicKey)) throw new Error('Elusiv instance should be called only when wallet is initialized!');

        if (!elusiv.current) {
            const seed = Elusiv.hashPw(USER_PASSWORD);
            const signedSeed = await signMessage(new TextEncoder().encode(seed));
            elusiv.current = await Elusiv.getElusivInstance(signedSeed, publicKey, connection);
        }

        return elusiv.current;
    }, [connection, publicKey, signMessage]);

    const updatePublicBalance = useCallback(() => {
        if (!(connection && publicKey)) { setBalance(undefined); return; }
        let changed = false;

        const run = async () => {
            try {
                let amount = 0;
                if (splToken) {
                    const senderATA = await getAssociatedTokenAddress(splToken, publicKey);
                    const senderAccount = await getAccount(connection, senderATA);
                    amount = Number(senderAccount.amount);
                } else {
                    const senderInfo = await connection.getAccountInfo(publicKey);
                    amount = senderInfo ? senderInfo.lamports : 0;
                }
                setPublicBalance(BigNumber(amount));
            } catch (error: any) {
                setPublicBalance(BigNumber(-1));
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [connection, publicKey, splToken]);

    const updateBalance = useCallback(async () => {
        if (!(connection && publicKey)) { setBalance(undefined); return; }
        let changed = false;

        setBalance(undefined);  // Set the balance as 'loading balance'
        const run = async () => {
            try {
                const elusiv = await getElusiv();

                const amountLamports = await elusiv.getLatestPrivateBalance('LAMPORTS');
                const amount = parseInt(amountLamports.toString()) / LAMPORTS_PER_SOL;
                setBalance(BigNumber(amount));

                updatePublicBalance();
            } catch (error: any) {
                setBalance(BigNumber(-1));    // Set the balance as 'balance loading error'
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [getElusiv, connection, publicKey, updatePublicBalance]);


    const topup = useCallback(async () => {
        if (!(signTransaction)) { return; }

        setBalance(undefined);  // Set the balance as 'loading balance'

        const topup = publicBalance.toNumber() - 120000 - 1000000; // Topup all the available balance - max transaction fees - account rent
        if (topup > 0) {
            const token = 'LAMPORTS';               // TODO with UI

            console.log('Requesting topup of ' + topup / LAMPORTS_PER_SOL + token);
            const elusiv = await getElusiv();
            const topupTx = await elusiv.buildTopUpTx(topup, token);
            await signTransaction(topupTx.tx);

            console.log('Sending topup Tx ...');
            const res = await elusiv.sendElusivTx(topupTx);

            console.log(
                `Topup initiated: https://solscan.io/tx/${res.sig.signature}${{ IS_DEV } ? '?cluster=devnet' : ''}`
            );

            // Wait for the topup to be confirmed (have your UI do something else here, this takes a little)
            await res.isConfirmed;
            console.log('Topup complete!');

            updateBalance();
        }
    }, [getElusiv, publicBalance, signTransaction, updateBalance]);

    // If there's a connected wallet, load it's token balance
    useEffect(() => {
        if (!(status === PaymentStatus.New && recipient)) return;
        selectWallet().then(updateBalance);
    }, [status, recipient, selectWallet, updateBalance]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (!(IS_CUSTOMER_POS && status === PaymentStatus.Pending && connection && publicKey)) return;
        let changed = false;

        const run = async () => {
            try {
                const request = parseURL(url);

                const { recipient, amount, splToken, reference, memo } = request as TransferRequestURL;
                if (!amount || !balance) return;

                const amountLamports = amount.multipliedBy(LAMPORTS_PER_SOL);
                const elusiv = await getElusiv();
                const transaction = await elusiv.buildSendTx(amountLamports.toNumber(), recipient, 'LAMPORTS', reference ? reference[0] : undefined);
                const fee = transaction.getTotalFee().txFee / LAMPORTS_PER_SOL;
                if (balance.minus(fee).lt(amount)) throw new Error('Insufficient private balance'); // TODO translate

                if (!changed) {
                    changeStatus(PaymentStatus.Creating);
                    const res = await elusiv.sendElusivTx(transaction);
                    changeStatus(PaymentStatus.Sent);
                    console.log(
                        `Transaction sent: https://solscan.io/tx/${res.sig.signature}${{ IS_DEV } ? '?cluster=devnet' : ''}`
                    );
                }
            } catch (error) {
                // If the transaction is declined or fails, try again
                sendError(error as object);
                if (!IS_CUSTOMER_POS) {
                    timeout = setTimeout(run, 5000);
                }
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [status, shouldConnectWallet, publicKey, url, connection, sendTransaction, changeStatus, sendError, balance, getElusiv]);

    // When the status is pending, poll for the transaction using the reference key
    useEffect(() => {
        if (
            !(
                ((!IS_CUSTOMER_POS && status === PaymentStatus.Pending) ||
                    (IS_CUSTOMER_POS && status === PaymentStatus.Sent)) &&
                reference &&
                !signature
            )
        )
            return;
        let changed = false;

        const interval = setInterval(async () => {
            let signature: ConfirmedSignatureInfo;
            try {
                signature = await findReference(connection, reference);

                if (!changed) {
                    clearInterval(interval);
                    setSignature(signature.signature);
                    changeStatus(PaymentStatus.Confirmed);
                    navigate(PaymentStatus.Confirmed, true);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction signature yet, try again
                if (!(error instanceof FindReferenceError)) {
                    sendError(error);
                }
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, reference, signature, connection, navigate, changeStatus, sendError]);

    // When the status is confirmed, validate the transaction against the provided params
    useEffect(() => {
        if (!(status === PaymentStatus.Confirmed && signature && amount)) return;
        let changed = false;

        const run = async () => {
            try {
                await validateTransfer(
                    connection,
                    signature,
                    { recipient, amount, splToken, reference },
                    { maxSupportedTransactionVersion: 0 }
                );
                if (!changed) {
                    changeStatus(PaymentStatus.Valid);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction yet, try again
                if (
                    error instanceof ValidateTransferError &&
                    (error.message === 'not found' || error.message === 'missing meta')
                ) {
                    console.warn(error);
                    timeout = setTimeout(run, 250);
                    return;
                }

                sendError(error);
                changeStatus(PaymentStatus.Invalid);
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [status, signature, amount, connection, recipient, splToken, reference, changeStatus, sendError]);

    // When the status is valid, poll for confirmations until the transaction is finalized
    useEffect(() => {
        if (!(status === PaymentStatus.Valid && signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            try {
                const response = await connection.getSignatureStatus(signature);
                const status = response.value;
                if (!status) return;
                if (status.err) throw status.err;

                if (!changed) {
                    const confirmations = (status.confirmations || 0) as Confirmations;
                    setConfirmations(confirmations);

                    if (confirmations >= requiredConfirmations || status.confirmationStatus === 'finalized') {
                        clearInterval(interval);
                        changeStatus(PaymentStatus.Finalized);
                    }
                }
            } catch (error: any) {
                sendError(error);
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, signature, connection, requiredConfirmations, changeStatus, sendError]);

    return (
        <PaymentContext.Provider
            value={{
                amount,
                setAmount,
                memo,
                setMemo,
                balance,
                publicBalance,
                reference,
                signature,
                status,
                confirmations,
                progress,
                url,
                hasSufficientBalance,
                isPaidStatus,
                reset,
                generate,
                topup,
                updateBalance,
                selectWallet,
                connectWallet,
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
