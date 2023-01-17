import React, { FC } from 'react';
import { FormattedMessage } from "react-intl";
import { useConfig } from '../../hooks/useConfig';
import { usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './Summary.module.css';

export const Summary: FC = () => {
    const { amount, balance } = usePayment();

    return (
        <div className={css.root}>
            <div className={css.title}><FormattedMessage id="balance" /></div>
            {balance !== undefined
                ? balance > 0
                    ? <Amount value={balance} />
                    : <FormattedMessage id="emptyBalance" />
                : <FormattedMessage id="balanceLoading" />}
            <div className={css.total}>
                <div className={css.totalLeft}><FormattedMessage id="total" /></div>
                <div className={css.totalRight}>
                    <div className={css.amount}>
                        <Amount value={amount} />
                    </div>
                </div>
            </div>
        </div>
    );
};
