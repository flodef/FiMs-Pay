import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Elusiv, TokenType } from "elusiv-sdk";
import React, { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { useConfig } from "../../hooks/useConfig";
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { PRIV_KEY } from "../../utils/constants";
import { FAUCET, IS_CUSTOMER_POS, POS_USE_WALLET } from "../../utils/env";
import { Theme } from "../sections/ActionMenu";
import css from './GenerateButton.module.css';

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const { amount, status, hasSufficientBalance, balance, updateBalance, generate, selectWallet, supply } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(() =>
        hasSufficientBalance
            ? IS_CUSTOMER_POS && (publicKey || PRIV_KEY)
                ? id
                : connecting
                    ? "connecting"
                    : "connect"
            : needRefresh || (balance !== undefined && balance < BigNumber(0))
                ? "reload"
                : "supply",
        [connecting, hasSufficientBalance, balance, id, needRefresh, publicKey]);

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        () => {
            const a = () => {
                switch (action) {
                    case id:
                        return () => generate();
                    case "connect":
                        return () => selectWallet();
                    case "reload":
                        return () => {updateBalance(); setNeedRefresh(false)} ;
                    case "supply":
                        return () => supply();
                    default:
                        return () => { };
                }
            };
            a()();
        }, [generate, selectWallet, action, id, supply, updateBalance]);

    return (
        <button
            className={theme === Theme.Color ? css.rootColor : theme === Theme.BlackWhite ? css.rootBW : css.root}
            type="button"
            onClick={handleClick}
            disabled={(!IS_CUSTOMER_POS && isInvalidAmount) || (IS_CUSTOMER_POS && (publicKey !== null || PRIV_KEY !== null) && !connecting && hasSufficientBalance && (isInvalidAmount || (status !== PaymentStatus.New && status !== PaymentStatus.Error)))}
        >
            <FormattedMessage id={action} />
        </button>
    );
};
