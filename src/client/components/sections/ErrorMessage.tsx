import { TokenAccountNotFoundError, TokenInvalidAccountError } from '@solana/spl-token';
import {
    WalletNotConnectedError,
    WalletSendTransactionError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { CreateTransferError } from '../../../server/core/createTransfer';
import { ValidateTransferError } from '../../../server/core/validateTransfer';
import { useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { PaymentError } from '../contexts/PaymentProvider';
import css from './ErrorMessage.module.css';

export const ErrorMessage: FC = () => {
    const { paymentStatus } = usePayment();
    const { error } = useError();
    const { currencyName } = useConfig();

    const unknownError = 'UnknownError';
    const id = useMemo(() => {
        if (paymentStatus === PaymentStatus.Error && error) {
            switch (error.name) {
                case new WalletSignTransactionError().name:
                case new WalletSendTransactionError().name:
                case new TokenAccountNotFoundError().name:
                case new WalletNotConnectedError().name:
                    return error.name;
                case new CreateTransferError().name:
                case new ValidateTransferError().name:
                case new TokenInvalidAccountError().name:
                case new PaymentError().name:
                case new TypeError().name:
                    return error.message;
                case new Error().name:
                    const e = error
                        .toString()
                        .split(': ')
                        .map((x) => x.trim());
                    return e[1] === '429'
                        ? 'NetworkBusyError'
                        : e[2] === TypeError.name
                        ? e[3]
                        : e[3] === '401'
                        ? 'RPCError'
                        : e[2] === 'Internal error' || e[2] === 'Blockhash not found'
                        ? 'InternalError'
                        : unknownError;
                default:
                    return unknownError;
            }
        } else {
            return null;
        }
    }, [error, paymentStatus]);

    return id ? (
        <div className={css.error}>
            <FormattedMessage id={id} values={{ error: error?.message, currency: currencyName }} />
        </div>
    ) : null;
};
