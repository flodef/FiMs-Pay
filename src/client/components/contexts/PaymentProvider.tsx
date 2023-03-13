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
    getMint,
    getOrCreateAssociatedTokenAccount,
    TokenAccountNotFoundError,
} from '@solana/spl-token';
import { WalletName } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
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
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createTransfer } from '../../../server/core/createTransfer';
import { validateTransfer } from '../../../server/core/validateTransfer';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { AirdropStatus, PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';
import { decrypt } from '../../utils/aes';
import {
    CRYPTO_SECRET,
    DEFAULT_WALLET,
    FAUCET_ENCODED_KEY,
    FAUCET_LINK,
    IS_CUSTOMER_POS,
    IS_DEV,
    POS_USE_WALLET,
    USE_CUSTOM_CRYPTO,
} from '../../utils/env';
import { LoadKey } from '../../utils/key';

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
        currencyName,
    } = useConfig();
    const { publicKey, sendTransaction, connect, disconnect, select, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const { processError, compareErrorType } = useError();

    const [balance, setBalance] = useState<BigNumber>();
    const [amount, setAmount] = useState<BigNumber>();
    const [memo, setMemo] = useState<string>();
    const [reference, setReference] = useState<PublicKey>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [paymentStatus, setPaymentStatus] = useState(PaymentStatus.New);
    const [airdropStatus, setAirdropStatus] = useState<AirdropStatus>();
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const [needRefresh, setNeedRefresh] = useState(false);

    const navigate = useNavigateWithQuery();
    const confirmationProgress = useMemo(
        () => confirmations / requiredConfirmations,
        [confirmations, requiredConfirmations]
    );
    const recipient = useMemo(
        () => (IS_CUSTOMER_POS || !POS_USE_WALLET || !publicKey ? recipientParam : publicKey),
        [recipientParam, publicKey]
    );

    const sendError = useCallback(
        (error?: Error) => {
            if (error) {
                setPaymentStatus(PaymentStatus.Error);
                setReference(undefined);
            }
            processError(error);
        },
        [setPaymentStatus, processError]
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

    const hasSufficientBalance = useMemo(
        () =>
            paymentStatus !== PaymentStatus.Error &&
            (!IS_CUSTOMER_POS ||
                balance === undefined ||
                balance.lt(0) ||
                (balance.gt(0) && amount !== undefined && balance.gte(amount))),
        [balance, amount, paymentStatus]
    );
    const isPaidStatus = useMemo(
        () =>
            paymentStatus === PaymentStatus.Finalized ||
            paymentStatus === PaymentStatus.Valid ||
            paymentStatus === PaymentStatus.Error,
        [paymentStatus]
    );

    const reset = useCallback(() => {
        setPaymentStatus(PaymentStatus.New);
        setConfirmations(0);
        setBalance(undefined);
        setAmount(undefined);
        setMemo(undefined);
        setReference(undefined);
        setSignature(undefined);
        sendError(undefined);
        setTimeout(() => navigate(PaymentStatus.New, true), isPaidStatus ? 1500 : 0);
    }, [navigate, setPaymentStatus, sendError, isPaidStatus]);

    const generate = useCallback(() => {
        if (!((paymentStatus === PaymentStatus.New || paymentStatus === PaymentStatus.Error) && !reference)) return;

        navigate(PaymentStatus.Processing);
        setReference(Keypair.generate().publicKey);
        setTimeout(() => setPaymentStatus(PaymentStatus.Pending), 800);
    }, [paymentStatus, reference, navigate, setPaymentStatus]);

    const selectWallet = useCallback(() => {
        if (publicKey) return;
        if (DEFAULT_WALLET) {
            const defaultWallet = DEFAULT_WALLET as WalletName;
            const a = (wallet: any) => setTimeout(() => select(wallet), 100);
            if (!wallet) {
                a(defaultWallet);
            } else {
                connect().catch(() => a(defaultWallet));
            }
        } else {
            setVisible(true);
        }
    }, [connect, select, wallet, setVisible, publicKey]);

    const connectWallet = useCallback(() => {
        setPaymentStatus(PaymentStatus.New);
        if (!publicKey) {
            selectWallet();
        } else {
            disconnect()
                .then(() => setBalance(undefined))
                .catch(() => {});
        }
    }, [disconnect, publicKey, selectWallet]);

    const loadBalance = useCallback(async () => {
        if (!(connection && publicKey && balance === undefined)) return;

        try {
            if (recipient.toString() === publicKey.toString()) {
                connectWallet(); // Disconnect wallet
                throw new PaymentError('sender is also recipient');
            }

            setPaymentStatus(PaymentStatus.New); // Remove error if any
            setBalance(BigNumber(-1)); // Set balance status to loading

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
            if (compareErrorType(error, new TokenAccountNotFoundError())) {
                setBalance(BigNumber(0));
            } else {
                sendError(error);
                setBalance(undefined);
            }
        }
    }, [connection, publicKey, splToken, decimals, recipient, balance, sendError, compareErrorType, connectWallet]);

    const updateBalance = useCallback(async () => {
        setBalance(undefined);
        await loadBalance();
        setNeedRefresh(false);
    }, [loadBalance]);

    const requestAirdrop = useCallback(async () => {
        // TODO : translate
        try {
            if (!(FAUCET_ENCODED_KEY && IS_DEV && publicKey)) return;
            if (connection.rpcEndpoint !== clusterApiUrl('devnet')) throw new Error('Airdrop available only on Devnet');

            setAirdropStatus(AirdropStatus.RetrievingRecipient);
            const recipientInfo = await connection.getAccountInfo(publicKey);
            if (!recipientInfo || recipientInfo.lamports < 0.1 * LAMPORTS_PER_SOL) {
                setAirdropStatus(AirdropStatus.TransferingSOL);
                const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
                setAirdropStatus(AirdropStatus.ConfirmingSOLTransfer);
                await connection.confirmTransaction({
                    signature,
                } as TransactionConfirmationStrategy);
            }
            if (splToken) {
                setAirdropStatus(AirdropStatus.DecryptingAccount);
                const value = await decrypt(FAUCET_ENCODED_KEY, CRYPTO_SECRET, await LoadKey(-1), USE_CUSTOM_CRYPTO);
                const list = value.split(',').map(Number);
                const array = Uint8Array.from(list);
                const keypair = Keypair.fromSecretKey(array);
                setAirdropStatus(AirdropStatus.RetrievingTokenAccount);
                const mint = await getMint(connection, splToken);
                const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, splToken, publicKey);
                setAirdropStatus(AirdropStatus.TransferingToken);
                const currentAmount = Number(tokenAccount.amount / BigInt(Math.pow(10, mint.decimals)));
                const transaction = await createTransfer(connection, keypair.publicKey, {
                    recipient: publicKey,
                    amount: BigNumber((5.55 / Math.max(currentAmount, 1)).toFixed(2)),
                    splToken: splToken,
                });
                setAirdropStatus(AirdropStatus.ConfirmingTokenTransfer);
                await sendAndConfirmTransaction(connection, transaction, [keypair], {
                    commitment: 'confirmed',
                });
            }
            await updateBalance();
        } catch (error: any) {
            sendError(error);
        } finally {
            setAirdropStatus(undefined);
        }
    }, [publicKey, connection, splToken, updateBalance, sendError]);

    const supply = useCallback(async () => {
        if (!publicKey) return;
        if (!FAUCET_ENCODED_KEY || !IS_DEV) {
            await navigator.clipboard.writeText(publicKey.toString());
            window.open(FAUCET_LINK + '/?token-name=' + currencyName, '_blank');
            setNeedRefresh(true);
        } else {
            await requestAirdrop();
        }
    }, [currencyName, publicKey, requestAirdrop]);

    // If there's a connected wallet, load it's token balance
    useEffect(() => {
        if (!(paymentStatus === PaymentStatus.New)) return;

        loadBalance();
    }, [paymentStatus, loadBalance]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (!(IS_CUSTOMER_POS && paymentStatus === PaymentStatus.Pending && connection && publicKey)) return;
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
                    setPaymentStatus(PaymentStatus.Creating);
                    const transactionHash = await sendTransaction(transaction, connection);
                    setPaymentStatus(PaymentStatus.Sent);
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
    }, [paymentStatus, publicKey, url, connection, sendTransaction, setPaymentStatus, sendError]);

    // When the status is pending, poll for the transaction using the reference key
    useEffect(() => {
        if (
            !(
                ((!IS_CUSTOMER_POS && paymentStatus === PaymentStatus.Pending) ||
                    (IS_CUSTOMER_POS && paymentStatus === PaymentStatus.Sent)) &&
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
                    setPaymentStatus(PaymentStatus.Confirmed);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction signature yet, try again
                if (!compareErrorType(error, new FindReferenceError())) {
                    sendError(error);
                }
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [paymentStatus, reference, signature, connection, navigate, setPaymentStatus, sendError, compareErrorType]);

    // When the status is confirmed, validate the transaction against the provided params
    useEffect(() => {
        if (!(paymentStatus === PaymentStatus.Confirmed && signature && amount)) return;
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
                    setPaymentStatus(PaymentStatus.Valid);
                }
            } catch (error: any) {
                // If the RPC node doesn't have the transaction yet, try again
                if (
                    compareErrorType(error, new ValidateTransferError()) &&
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
    }, [
        paymentStatus,
        signature,
        amount,
        connection,
        recipient,
        splToken,
        reference,
        setPaymentStatus,
        sendError,
        compareErrorType,
    ]);

    // When the status is valid, poll for confirmations until the transaction is finalized
    useEffect(() => {
        if (!(paymentStatus === PaymentStatus.Valid && signature)) return;
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
                        setPaymentStatus(PaymentStatus.Finalized);
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
    }, [paymentStatus, signature, connection, requiredConfirmations, setPaymentStatus, sendError]);

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
                paymentStatus,
                airdropStatus,
                confirmationProgress,
                url,
                hasSufficientBalance,
                isPaidStatus,
                needRefresh,
                reset,
                generate,
                supply,
                updateBalance,
                selectWallet,
                connectWallet,
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
