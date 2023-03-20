import { parseURL } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useMemo, useState } from 'react';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './TransactionInfo.module.css';

export const TransactionInfo: FC = () => {
    const { paymentStatus, isRecipient, url } = usePayment();
    const { isPaidStatus } = usePayment();
    const [label, setLabel] = useState<string>();
    const [amount, setAmount] = useState<BigNumber>();

    useEffect(() => {
        const request = parseURL(url);

        if ('link' in request) {
            throw new Error('Link request is not supported yet.');
        } else {
            const { label, amount } = request;
            setLabel(label);
            setAmount(amount);
        }
    }, [url]);

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

    // TODO : add user name
    return (
        <div className={css.root}>
            <div className={isPaidStatus ? css.date : css.dateHidden}>{date}</div>
            <div className={!isNewStatus ? css.symbol : css.symbolHidden}>{isRecipient ? '' : label}</div>
            <div className={!isNewStatus ? css.amount : css.amountHidden}>
                <Amount value={amount} />
            </div>
        </div>
    );
};
