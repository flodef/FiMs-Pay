import React, { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import css from './Error.module.css';

export const Error: FC = () => {
    const { status } = usePayment();
    const { errorMessage } = useError();
    const { currencyName } = useConfig();

    const id = useMemo(() => {
        if (status === PaymentStatus.Error && errorMessage) {
            const e = errorMessage.split(': ').slice(-2);
            switch (e[0]) {
                case 'WalletSignTransactionError':
                case 'WalletSendTransactionError':
                case 'TokenAccountNotFoundError':
                    return e[0];
                case 'CreateTransferError':
                case 'ValidateTransferError':
                case 'PaymentError':
                case 'TypeError':
                    return e[1];
                case 'Error':
                    return e[1].trim() === '429' ? 'NetworkBusyError' : 'UnknownError';
                default:
                    return 'UnknownError';
            }
        } else {
            return null;
        }
    }, [errorMessage, status]);

    return id ? (
        <div className={css.error}>
            <FormattedMessage id={id} values={{ error: errorMessage, currency: currencyName }} />
        </div>
    ) : null;
};
