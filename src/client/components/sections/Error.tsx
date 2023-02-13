import { TokenAccountNotFoundError } from '@solana/spl-token';
import { WalletSendTransactionError, WalletSignTransactionError } from '@solana/wallet-adapter-base';
import React, { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { CreateTransferError } from '../../../server/core/createTransfer';
import { ValidateTransferError } from '../../../server/core/validateTransfer';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { PaymentError } from '../contexts/PaymentProvider';
import css from './Error.module.css';

export const Error: FC = () => {
    const { status } = usePayment();
    const { errorMessage } = useError();
    const { currencyName } = useConfig();

    const id = useMemo(() => {
        if (status === PaymentStatus.Error && errorMessage) {
            const e = errorMessage.split(': ').slice(-2);
            switch (e[0]) {
                case WalletSignTransactionError.name:
                case WalletSendTransactionError.name:
                case TokenAccountNotFoundError.name:
                    return e[0];
                case CreateTransferError.name:
                case ValidateTransferError.name:
                case PaymentError.name:
                case TypeError.name:
                case 'TransactionSimulationFailed': //TODO : transaction waited too long
                    return e[1];
                case Error.name:
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
