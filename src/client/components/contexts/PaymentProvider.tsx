import {
    encodeURL,
    fetchTransaction,
    findReference,
    FindReferenceError,
    parseURL,
    ValidateTransferError,
} from '@solana/pay';
import {
    getAccount,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    TokenAccountNotFoundError,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    clusterApiUrl,
    ConfirmedSignatureInfo,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
    TransactionConfirmationStrategy,
    TransactionSignature,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';
import {
    IS_DEV,
    IS_CUSTOMER_POS,
    DEFAULT_WALLET,
    AUTO_CONNECT,
    POS_USE_WALLET,
    FAUCET_ENCODED_KEY,
    CRYPTO_SECRET,
} from '../../utils/env';
import { exitFullscreen, isFullscreen } from '../../utils/fullscreen';
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import { WalletName } from '@solana/wallet-adapter-base';
import { isMobileDevice } from '../../utils/mobile';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { createTransfer } from '../../../server/core/createTransfer';
import { validateTransfer } from '../../../server/core/validateTransfer';
import { DEVNET_DUMMY_MINT } from '../../utils/constants';
import CryptoJS from 'crypto-js';

export class PaymentError extends Error {
    name = 'PaymentError';
}

export interface PaymentProviderProps {
    children: ReactNode;
}

export const PaymentProvider: FC<PaymentProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const {
        link,
        recipient: recipientParam,
        splToken,
        decimals,
        label,
        message,
        requiredConfirmations,
        shouldConnectWallet,
    } = useConfig();
    const { publicKey, sendTransaction, connect, disconnect, select, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const { processError } = useError();

    const [balance, setBalance] = useState<BigNumber>();
    const [amount, setAmount] = useState<BigNumber>();
    const [memo, setMemo] = useState<string>();
    const [reference, setReference] = useState<PublicKey>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [status, setStatus] = useState(PaymentStatus.New);
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const navigate = useNavigateWithQuery();
    const progress = useMemo(() => confirmations / requiredConfirmations, [confirmations, requiredConfirmations]);
    const recipient = useMemo(
        () => (IS_CUSTOMER_POS || !POS_USE_WALLET || !publicKey ? recipientParam : publicKey),
        [recipientParam, publicKey]
    );

    const sendError = useCallback(
        (error?: Error) => {
            if (error) {
                setStatus(PaymentStatus.Error);
                setReference(undefined);
            }
            processError(error);
        },
        [setStatus, processError]
    );

    const compareError = useCallback((error: Error, type: Error) => {
        return error.name === type.name;
    }, []);

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

    const hasSufficientBalance = useMemo(
        () =>
            status !== PaymentStatus.Error &&
            (!IS_CUSTOMER_POS ||
                balance === undefined ||
                balance.lt(0) ||
                (balance.gt(0) && amount !== undefined && balance.gte(amount))),
        [balance, amount, status]
    );
    const isPaidStatus = useMemo(
        () =>
            status === PaymentStatus.Finalized ||
            status === PaymentStatus.Valid ||
            status === PaymentStatus.Invalid ||
            status === PaymentStatus.Error,
        [status]
    );

    const reset = useCallback(() => {
        setStatus(PaymentStatus.New);
        setConfirmations(0);
        setBalance(undefined);
        setAmount(undefined);
        setMemo(undefined);
        setReference(undefined);
        setSignature(undefined);
        sendError(undefined);
        setTimeout(() => navigate(PaymentStatus.New, true), isPaidStatus ? 1500 : 0);
    }, [navigate, setStatus, sendError, isPaidStatus]);

    const generate = useCallback(() => {
        if (!((status === PaymentStatus.New || status === PaymentStatus.Error) && !reference)) return;

        navigate(PaymentStatus.Processing);
        setReference(Keypair.generate().publicKey);
        setTimeout(() => setStatus(PaymentStatus.Pending), 800);
        if (IS_CUSTOMER_POS && isFullscreen() && isMobileDevice()) {
            exitFullscreen();
        }
    }, [status, reference, navigate, setStatus]);

    const selectWallet = useCallback(() => {
        if (publicKey) return;
        if (DEFAULT_WALLET) {
            const defaultWallet = DEFAULT_WALLET as WalletName;
            const a = AUTO_CONNECT
                ? () => {
                      try {
                          connect().catch(() => setTimeout(() => select(defaultWallet), 100));
                      } catch {}
                  }
                : () => {};
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

    const connectWallet = useCallback(() => {
        setStatus(PaymentStatus.New);
        if (!publicKey) {
            selectWallet();
        } else {
            disconnect()
                .then(() => setBalance(undefined))
                .catch(() => {});
        }
    }, [disconnect, publicKey, selectWallet]);

    const requestAirdrop = useCallback(() => {
        // TODO : translate
        const run = async () => {
            try {
                if (!(FAUCET_ENCODED_KEY && publicKey)) return;
                if (connection.rpcEndpoint !== clusterApiUrl('devnet'))
                    throw new Error('Airdrop available only on Devnet');

                initBalance();

                const bytes = CryptoJS.AES.decrypt(FAUCET_ENCODED_KEY, CRYPTO_SECRET);
                const value = bytes.toString(CryptoJS.enc.Utf8);
                const list = value.split(',').map(Number);
                const array = Uint8Array.from(list);
                const keypair = Keypair.fromSecretKey(array);
                const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
                await connection.confirmTransaction({
                    signature,
                } as TransactionConfirmationStrategy);
                await getOrCreateAssociatedTokenAccount(connection, keypair, DEVNET_DUMMY_MINT, publicKey);
                const transaction = await createTransfer(connection, keypair.publicKey, {
                    recipient: publicKey,
                    amount: BigNumber(5.55),
                    splToken: DEVNET_DUMMY_MINT,
                });

                await sendAndConfirmTransaction(connection, transaction, [keypair], {
                    commitment: 'confirmed',
                });

                updateBalance();
            } catch (error: any) {
                sendError(error);
            }
        };
        setTimeout(run, 0);
    }, [publicKey, connection]);

    const loadBalance = useCallback(() => {
        if (!(connection && publicKey && balance === undefined)) return;

        const run = async () => {
            try {
                if (recipient.toString() === publicKey.toString()) {
                    connectWallet();
                    throw new PaymentError('sender is also recipient');
                }

                initBalance();

                let amount = 0;
                if (splToken) {
                    const senderATA = await getAssociatedTokenAddress(splToken, publicKey);
                    const senderAccount = await getAccount(connection, senderATA);
                    amount = Number(senderAccount.amount);
                } else {
                    const senderInfo = await connection.getAccountInfo(publicKey);
                    amount = senderInfo ? senderInfo.lamports : 0;
                }
                setBalance(BigNumber(amount / Math.pow(10, decimals)));
            } catch (error: any) {
                sendError(
                    compareError(error, new TokenAccountNotFoundError()) ? new PaymentError('sender not found') : error
                );
                setBalance(undefined);
            }
        };
        setTimeout(run, 0);
    }, [connection, publicKey, splToken, decimals, recipient, balance, sendError, compareError, connectWallet]);

    const initBalance = useCallback(() => {
        setStatus(PaymentStatus.New); // Remove error if any
        setBalance(BigNumber(-1)); // Set balance status to loading
    }, []);

    const updateBalance = useCallback(() => {
        setBalance(undefined);
        loadBalance();
    }, [loadBalance]);

    // If there's a connected wallet, load it's token balance
    useEffect(() => {
        if (!(status === PaymentStatus.New)) return;

        loadBalance();
    }, [status, loadBalance]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (!(IS_CUSTOMER_POS && status === PaymentStatus.Pending && connection && publicKey)) return;
        let changed = false;

        const run = async () => {
            try {
                const request = parseURL(url);
                let transaction: Transaction;

                if ('link' in request) {
                    const { link } = request;
                    transaction = await fetchTransaction(connection, publicKey, link);
                } else {
                    const { recipient, amount, splToken, reference, memo } = request;
                    if (!amount) return;

                    transaction = await createTransfer(connection, publicKey, {
                        recipient,
                        amount,
                        splToken,
                        reference,
                        memo,
                    });
                }

                if (!changed) {
                    setStatus(PaymentStatus.Creating);
                    const transactionHash = await sendTransaction(transaction, connection);
                    setStatus(PaymentStatus.Sent);
                    console.log(
                        `Transaction sent: https://solscan.io/tx/${transactionHash}${IS_DEV ? '?cluster=devnet' : ''}`
                    );
                }
            } catch (error: any) {
                // If the transaction is declined or fails, try again
                sendError(error);
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
    }, [status, shouldConnectWallet, publicKey, url, connection, sendTransaction, setStatus, sendError]);

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
                    setStatus(PaymentStatus.Confirmed);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction signature yet, try again
                if (!compareError(error, new FindReferenceError())) {
                    sendError(error);
                }
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, reference, signature, connection, navigate, setStatus, sendError, compareError]);

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
                    setStatus(PaymentStatus.Valid);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction yet, try again
                if (
                    compareError(error, new ValidateTransferError()) &&
                    (error.message === 'not found' || error.message === 'missing meta')
                ) {
                    console.warn(error);
                    timeout = setTimeout(run, 250);
                    return;
                }

                sendError(error);
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [status, signature, amount, connection, recipient, splToken, reference, setStatus, sendError, compareError]);

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
                        setStatus(PaymentStatus.Finalized);
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
    }, [status, signature, connection, requiredConfirmations, setStatus, sendError]);

    return (
        <PaymentContext.Provider
            value={{
                amount,
                setAmount,
                memo,
                setMemo,
                balance,
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
                requestAirdrop,
                updateBalance,
                selectWallet,
                connectWallet,
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
