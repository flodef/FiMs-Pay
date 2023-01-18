import { useWallet } from "@solana/wallet-adapter-react";
import React, { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, IS_CUSTOMER_POS } from "../../utils/env";
import css from './GenerateButton.module.css';

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const { amount, status, hasSufficientBalance, generate, balance, selectWallet } = usePayment();
    const { publicKey, connecting } = useWallet();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        () => {
            const a = hasSufficientBalance
                ? publicKey
                    ? () => generate()
                    : !connecting
                        ? () => selectWallet()
                        : () => { }
                : needRefresh
                    ? () => setNeedRefresh(false)//TODO : Refresh account 
                    : () => { window.open(FAUCET, '_blank'); setNeedRefresh(true); };
            a();
        }, [generate, publicKey, selectWallet, hasSufficientBalance, connecting, needRefresh]);

    return (
        <button
            className={css.root}
            type="button"
            onClick={handleClick}
            disabled={(!IS_CUSTOMER_POS && isInvalidAmount) || (IS_CUSTOMER_POS && publicKey !== null && !connecting && hasSufficientBalance && (isInvalidAmount || (status !== PaymentStatus.New && status !== PaymentStatus.Error)))}
        >
            <FormattedMessage id={hasSufficientBalance ? publicKey ? id : connecting ? "connecting" : "connect" : needRefresh ? "reload" : "supply"} />
        </button>
    );
};
