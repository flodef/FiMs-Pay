import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { FC, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { Theme, useConfig } from "../../hooks/useConfig";
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { TOPUP_COST, ZERO } from "../../utils/constants";
import { FAUCET, IS_CUSTOMER_POS, IS_DEV, PRIVATE_PAYMENT } from "../../utils/env";
import { AlertDialogPopup, AlertType } from "../sections/AlertDialogPopup";
import css from './GenerateButton.module.css';

enum state {
    Connecting = "connecting",
    Connect = "connect",
    Reload = "reload",
    Supply = "supply",
    Topup = "topup",
}

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const { amount, status, hasSufficientBalance, balance, publicBalance, updateBalance, generate, selectWallet, topup } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme, recipient } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);
    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(() =>
        hasSufficientBalance
            ? IS_CUSTOMER_POS && publicKey
                ? id
                : connecting
                    ? state.Connecting
                    : state.Connect
            : needRefresh || (balance !== undefined && balance.lt(ZERO))
                ? state.Reload
                : PRIVATE_PAYMENT && balance !== undefined && amount !== undefined 
                && publicBalance.minus(TOPUP_COST).div(LAMPORTS_PER_SOL).plus(balance).gte(amount)
                    ? state.Topup
                    : state.Supply
        , [connecting, hasSufficientBalance, id, needRefresh, publicKey, balance, publicBalance, amount]);

    const alert = useMemo(() =>
        action === state.Topup && PRIVATE_PAYMENT
            ? {
                title: 'Your private wallet balance is empty!',
                description: [`You need to top it up with some SOL:`,
                    `It's an automatic process but BE AWARE THAT MOST OF YOUR SOL (${publicBalance.minus(TOPUP_COST).div(LAMPORTS_PER_SOL).toNumber()}) will be transfered to this private wallet!`,
                    `To keep some SOL in your public wallet, transfer them first to another account before toping up.`,
                    `For privacy reason, it's recommended that you topup a different amount to your private wallet than the what you are going to pay!`],
                type: AlertType.Alert
            }
            : action === state.Supply && IS_DEV
                ? {
                    title: 'Your public wallet balance is empty!',
                    description: [`A new tab will open on a Solana Faucet where you can get some SOL:`,
                        `1. Copy your wallet address: ${publicKey}`,
                        `2. Paste it in the faucet recipient text box`,
                        `3. Airdrop some SOL to your wallet on the DEVNET network`],
                    type: AlertType.Message
                }
                : undefined
        , [publicBalance, action, publicKey]);

    const handleClick = useCallback(
        () => {
            const a = () => {
                switch (action) {
                    case id:
                        return () => generate();
                    case state.Connect:
                        return () => selectWallet();
                    case state.Reload:
                        return () => { updateBalance(); setNeedRefresh(false); };
                    case state.Supply:
                        return () => { window.open(FAUCET, '_blank'); setNeedRefresh(true); }
                    case state.Topup:
                        return () => topup();
                    default:
                        return () => { };
                }
            };
            a()();
        }, [generate, selectWallet, action, id, topup, updateBalance]);

    const button = useMemo(() =>
        <button
            className={theme === Theme.Color ? css.rootColor : theme === Theme.BlackWhite ? css.rootBW : css.root}
            type="button"
            onClick={!alert ? handleClick : undefined}
            disabled={(!IS_CUSTOMER_POS && isInvalidAmount) || (IS_CUSTOMER_POS && publicKey !== null && !connecting && hasSufficientBalance && (isInvalidAmount || (status !== PaymentStatus.New && status !== PaymentStatus.Error)))}
        >
            <FormattedMessage id={action} />
        </button>
        , [action, connecting, handleClick, hasSufficientBalance, isInvalidAmount, publicKey, status, theme, alert]);

    return <AlertDialogPopup button={button} onClick={handleClick} alert={alert} />;
};
