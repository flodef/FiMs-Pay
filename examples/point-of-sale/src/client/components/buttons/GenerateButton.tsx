import { useWallet } from "@solana/wallet-adapter-react";
import React, { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { useConfig } from "../../hooks/useConfig";
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, IS_CUSTOMER_POS, IS_DEV, POS_USE_WALLET } from "../../utils/env";
import { Theme } from "../sections/ActionMenu";
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
    const { amount, status, hasSufficientBalance, generate, updateBalance, selectWallet } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(() =>
        hasSufficientBalance
            ? publicKey || !(POS_USE_WALLET || IS_CUSTOMER_POS)
                ? id
                : connecting
                    ? state.Connecting
                    : state.Connect
            : needRefresh
                ? state.Reload
                : state.Supply,
        [connecting, hasSufficientBalance, id, needRefresh, publicKey]);

    const alert = useMemo(() =>
        action === state.Supply && IS_DEV
            ? {
                title: 'Your public wallet balance is empty!',
                description: [`A new tab will open on a Solana Faucet where you can get some SOL/USDC:`,
                    `1. Copy your wallet address: ${publicKey}`,
                    `2. Paste it in the faucet recipient text box`,
                    `3. Airdrop some SOL to your wallet on the DEVNET network`],
                type: AlertType.Message
            }
            : undefined
        , [action, publicKey]);

    const handleClick = useCallback(
        () => {
            const a = () => {
                switch (action) {
                    case id:
                        return () => generate();
                    case "connect":
                        return () => selectWallet();
                    case "reload":
                        return () => { updateBalance(); setNeedRefresh(false); };
                    case "supply":
                        return () => { window.open(FAUCET, '_blank'); setNeedRefresh(true); };
                    default:
                        return () => { };
                }
            };
            a()();
        }, [generate, selectWallet, action, id, updateBalance]);

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
