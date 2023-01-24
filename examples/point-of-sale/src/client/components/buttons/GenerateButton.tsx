import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { Elusiv, TokenType } from "elusiv-sdk";
import React, { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { useConfig } from "../../hooks/useConfig";
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, IS_CUSTOMER_POS, POS_USE_WALLET } from "../../utils/env";
import { Theme } from "../sections/ActionMenu";
import css from './GenerateButton.module.css';

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const { amount, status, hasSufficientBalance, generate, selectWallet, supply } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(() =>
        hasSufficientBalance
            ? IS_CUSTOMER_POS
                ? id
                : connecting
                    ? "connecting"
                    : "connect"
            : needRefresh
                ? "reload"
                : "supply",
        [connecting, hasSufficientBalance, id, needRefresh]);

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        () => {
            const a = () => {
                switch (action) {
                    case id:
                        return () => generate();
                    case "connect":
                        return () => selectWallet();
                    case "reload":
                        return () => setNeedRefresh(false);//TODO : Refresh account 
                    case "supply":
                        return () => supply();
                    default:
                        return () => { };
                }
            };
            a()();
        }, [generate, selectWallet, action, id, supply]);

    return (
        <button
            className={theme === Theme.Color ? css.rootColor : theme === Theme.BlackWhite ? css.rootBW : css.root}
            type="button"
            onClick={handleClick}
            disabled={(!IS_CUSTOMER_POS && isInvalidAmount) || (IS_CUSTOMER_POS && publicKey !== null && !connecting && hasSufficientBalance && (isInvalidAmount || (status !== PaymentStatus.New && status !== PaymentStatus.Error)))}
        >
            <FormattedMessage id={action} />
        </button>
    );
};
