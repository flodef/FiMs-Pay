import interpolate from 'color-interpolate';
import React, { FC, useMemo } from 'react';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import css from './Progress.module.css';

export const Progress: FC = () => {
    const { status, progress } = usePayment();

    const [value, text] = useMemo(() => {
        switch (status) {
            case PaymentStatus.Pending:
                return [1 / 6, 'createTransaction'];
            case PaymentStatus.Creating:
                return [2 / 6, 'approveTransaction'];
            case PaymentStatus.Sent:
                return [3 / 6, 'sendTransaction'];
            case PaymentStatus.Confirmed:
                return [4 / 6, 'verifyTransaction'];
            case PaymentStatus.Valid:
                return [5 / 6 + Math.max(progress, 1), status];
            case PaymentStatus.Finalized:
                return [1, PaymentStatus.Valid];
            case PaymentStatus.Invalid:
            case PaymentStatus.Error:
                return [1, status];
            default:
                return [0, undefined];
        }
    }, [status, progress]);

    const interpolated = useMemo(() => interpolate(['#8752f3', '#5497d5', '#43b4ca', '#28e0b9', '#19fb9b']), []);
    const styles = useMemo(
        () =>
            buildStyles({
                pathTransitionDuration: value !== 0 ? 3 : 1.5,
                pathColor:
                    status !== PaymentStatus.Invalid && status !== PaymentStatus.Error
                        ? interpolated(value)
                        : '#FF0000',
                trailColor: 'rgba(0,0,0,.1)',
            }),
        [interpolated, value, status]
    );

    return (
        <div className={css.root}>
            <CircularProgressbar maxValue={1} value={value} styles={styles} />
            <div className={css.text}>
                {text ? (
                    <FormattedMessage id={text} />
                ) : value !== 0 ? (
                    <FormattedNumber value={value} style="percent" />
                ) : null}
            </div>
        </div>
    );
};
