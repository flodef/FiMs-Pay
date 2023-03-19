import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import css from './Summary.module.css';

export const Summary: FC = () => {
    const { amount, balance, paymentStatus } = usePayment();
    const { publicKey } = useWallet();

    return (
        <div className={css.root}>
            <div>
                <div className={css.title}>
                    <FormattedMessage id="yourBalance" />
                </div>
                <div className={css.balance}>
                    {publicKey ? (
                        balance !== undefined ? (
                            balance.gt(0) ? (
                                <Amount value={balance} />
                            ) : balance.eq(0) ? (
                                <FormattedMessage id="emptyBalance" />
                            ) : (
                                <FormattedMessage id="balanceLoading" />
                            )
                        ) : paymentStatus === PaymentStatus.Error ? (
                            <FormattedMessage id="balanceLoadingError" />
                        ) : null
                    ) : (
                        <FormattedMessage id="WalletNotConnectedError" />
                    )}
                </div>
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
        </div>
    );
};
