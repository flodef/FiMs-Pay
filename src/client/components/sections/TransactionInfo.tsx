import React, { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './TransactionInfo.module.css';

export const TransactionInfo: FC = () => {
    const { paymentStatus } = usePayment();
    const { label } = useConfig();
    const { amount, isPaidStatus } = usePayment();
    const date = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
            }).format(new Date()),
        []
    );
    const isNewStatus = useMemo(() => paymentStatus === PaymentStatus.New, [paymentStatus]);

    return (
        <div className={css.root}>
            <div className={isPaidStatus ? css.date : css.dateHidden}>{date}</div>
            <div className={!isNewStatus ? css.symbol : css.symbolHidden}>{label}</div>
            <div className={!isNewStatus ? css.amount : css.amountHidden}>
                <Amount value={amount} />
            </div>
        </div>
    );
};
