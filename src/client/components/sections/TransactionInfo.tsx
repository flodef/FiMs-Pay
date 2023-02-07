import React, { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './TransactionInfo.module.css';

export const TransactionInfo: FC = () => {
    const { status, isTopUp } = usePayment();
    const { label } = useConfig();
    const { amount, isPaidStatus } = usePayment();
    const date = useMemo(() => new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric"
    }).format(new Date()), []);
    const isNewStatus = useMemo(() => status === PaymentStatus.New, [status]);

    return (
        <div className={css.root}>
            <div className={css.date}>{isPaidStatus ? date : null}</div>
            <div className={css.symbol}>{!isNewStatus ? isTopUp ? <FormattedMessage id="topup" /> : label : null}</div>
            <div className={css.amount}>{!isNewStatus ? <Amount value={amount} /> : null}</div>
        </div>
    );
};
