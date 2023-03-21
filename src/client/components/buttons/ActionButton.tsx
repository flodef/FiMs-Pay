import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo } from 'react';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { StandardButton } from './StandardButton';

enum State {
    Connecting = 'connecting',
    Connect = 'connect',
    Reload = 'reload',
    Supply = 'supply',
}

export interface ActionButtonProps {
    id: string;
}

export const ActionButton: FC<ActionButtonProps> = ({ id }) => {
    const {
        amount,
        balance,
        paymentStatus,
        hasSufficientBalance,
        needRefresh,
        isRecipient,
        process,
        supply,
        updateBalance,
        connectWallet,
    } = usePayment();
    const { publicKey, connecting, autoConnect } = useWallet();
    const { error } = useError();

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(
        () =>
            !publicKey
                ? connecting || autoConnect
                    ? State.Connecting
                    : State.Connect
                : needRefresh || (error && error.message.toLowerCase().includes('failed to fetch'))
                ? State.Reload
                : (balance?.gt(0) &&
                      amount !== undefined &&
                      balance.gte(amount) &&
                      paymentStatus !== PaymentStatus.Error) ||
                  isRecipient
                ? id
                : !hasSufficientBalance
                ? State.Supply
                : undefined,
        [
            connecting,
            balance,
            amount,
            id,
            error,
            needRefresh,
            publicKey,
            autoConnect,
            paymentStatus,
            hasSufficientBalance,
            isRecipient,
        ]
    );

    const handleClick = useCallback(() => {
        const a = () => {
            switch (action) {
                case id:
                    return () => process();
                case 'connect':
                    return () => connectWallet();
                case 'reload':
                    return () => updateBalance();
                case 'supply':
                    return () => supply();
                default:
                    return () => {};
            }
        };
        a()();
    }, [id, action, process, connectWallet, updateBalance, supply]);

    return (
        <StandardButton
            messageId={action}
            onClick={handleClick}
            hasTheme={action !== State.Connecting}
            style={{ cursor: action === State.Connecting ? 'default' : 'pointer' }}
            disabled={
                action === null ||
                (publicKey !== null &&
                    !connecting &&
                    ((isRecipient && isInvalidAmount) ||
                        (!isRecipient &&
                            hasSufficientBalance &&
                            (isInvalidAmount || paymentStatus !== PaymentStatus.New))))
            }
        />
    );
};
