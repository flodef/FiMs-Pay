import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo } from 'react';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { AlertDialogPopup } from '../sections/AlertDialogPopup';
import { StandardButton } from './StandardButton';

enum State {
    Connecting = 'connecting',
    Connect = 'connect',
    Reload = 'reload',
    Supply = 'supply',
}

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const {
        amount,
        balance,
        paymentStatus,
        hasSufficientBalance,
        needRefresh,
        isRecipient,
        generate,
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
                : null,
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

    // TODO Translate
    const alert = useMemo(
        () => undefined,
        []
        // action === State.Supply && IS_DEV
        //     ? {
        //           title: balanceIsEmpty,
        //           description: [
        //               `A new tab will open on a Solana Faucet where you can get some free SOL (for paying transaction fee) and some ${currencyName}:`,
        //               `1. Paste your wallet address in the faucet recipient text box OR select a wallet`,
        //               `2. Airdrop some SOL to your Solana wallet on the DEVNET network`,
        //               `3. Airdrop some ${currencyName} (if possible)`,
        //           ],
        //           type: AlertType.Message,
        //       }
        //     : undefined,
        // [action, currencyName, balanceIsEmpty]hasSufficientBalance
    );

    const handleClick = useCallback(() => {
        const a = () => {
            switch (action) {
                case id:
                    return () => generate();
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
    }, [id, action, generate, connectWallet, updateBalance, supply]);

    const button = useMemo(
        () =>
            action && (
                <StandardButton
                    messageId={action}
                    onClick={!alert ? handleClick : undefined}
                    hasTheme={action !== State.Connecting}
                    style={{ cursor: action === State.Connecting ? 'default' : 'pointer' }}
                    disabled={
                        publicKey !== null &&
                        !connecting &&
                        ((isRecipient && isInvalidAmount) ||
                            (!isRecipient &&
                                hasSufficientBalance &&
                                (isInvalidAmount || paymentStatus !== PaymentStatus.New)))
                    }
                />
            ),
        [
            action,
            connecting,
            handleClick,
            hasSufficientBalance,
            isInvalidAmount,
            publicKey,
            paymentStatus,
            alert,
            isRecipient,
        ]
    );

    return <AlertDialogPopup button={button} onClick={handleClick} alert={alert} />;
};
