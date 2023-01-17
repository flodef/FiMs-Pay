import { useWallet } from "@solana/wallet-adapter-react";
import React, { FC } from 'react';
import { FormattedMessage } from "react-intl";
import { usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './Summary.module.css';

export const Summary: FC = () => {
    const { amount, balance } = usePayment();
    const { publicKey } = useWallet();

    return (
        <div className={css.root}>
            <div className={css.title}>
                <FormattedMessage id="balance" />
            </div>
            <div className={css.balance}>
                {publicKey
                    ? balance !== undefined
                        ? balance > 0
                            ? <Amount value={balance} />
                            : <FormattedMessage id="emptyBalance" />
                        : <FormattedMessage id="balanceLoading" />
                    : <FormattedMessage id="walletNotConnected" />
                }
            </div>
            <div className={css.total}>
                <div className={css.totalLeft}>
                    <FormattedMessage id="total" />
                </div>
                <div className={css.totalRight}>
                    <div className={css.amount}>
                        <Amount value={amount} />
                    </div>
                </div>
            </div>
        </div >
    );
};
